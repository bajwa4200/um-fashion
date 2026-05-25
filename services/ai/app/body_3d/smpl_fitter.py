"""SMPL-X body fitting from single photo (with parametric fallback)."""

from pathlib import Path
import threading
import numpy as np

import cv2
import mediapipe as mp

from app.config import settings
from app.body_3d.texture import project_photo_colors, resize_image_max_height
from app.body_3d.photo_mesh import build_photo_realistic_mesh

mp_pose = mp.solutions.pose
mp_selfie = mp.solutions.selfie_segmentation

MODELS_DIR = Path(__file__).resolve().parents[2] / "models" / "smplx"

_SMPLX_CACHE: dict[str, object] = {}
_POSE_DETECTOR: mp_pose.Pose | None = None
_POSE_LOCK = threading.Lock()


def smplx_models_available() -> bool:
    return (MODELS_DIR / "SMPLX_NEUTRAL.npz").exists() or (MODELS_DIR / "SMPLX_MALE.npz").exists()


def preload_smplx_models() -> dict[str, bool]:
    """Load SMPL-X models once at startup. Returns {gender: loaded}."""
    results: dict[str, bool] = {}
    for gender in ("male", "female", "neutral"):
        try:
            model = _load_smplx_model(gender)
            results[gender] = model is not None
        except Exception:
            results[gender] = False
    return results


def _load_smplx_model(gender: str):
    if gender in _SMPLX_CACHE:
        return _SMPLX_CACHE[gender]

    try:
        import smplx
    except ImportError:
        return None

    model_files = {
        "male": MODELS_DIR / "SMPLX_MALE.npz",
        "female": MODELS_DIR / "SMPLX_FEMALE.npz",
        "neutral": MODELS_DIR / "SMPLX_NEUTRAL.npz",
    }
    path = model_files.get(gender) or model_files["neutral"]
    if not path.exists():
        path = MODELS_DIR / "SMPLX_NEUTRAL.npz"
    if not path.exists():
        return None

    g = gender if gender in ("male", "female") else "neutral"
    model = smplx.create(
        str(MODELS_DIR),
        model_type="smplx",
        gender=g,
        use_pca=False,
        num_betas=10,
        ext="npz",
    )
    _SMPLX_CACHE[gender] = model
    return model


def _get_pose_detector() -> mp_pose.Pose:
    global _POSE_DETECTOR
    with _POSE_LOCK:
        if _POSE_DETECTOR is None:
            _POSE_DETECTOR = mp_pose.Pose(static_image_mode=True, model_complexity=1)
        return _POSE_DETECTOR


def _detect_gender(landmarks, w: int, h: int) -> str:
    ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    lh = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    rh = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    sw = abs(rs.x - ls.x) * w
    hw = abs(rh.x - lh.x) * w
    if sw == 0:
        return "neutral"
    ratio = hw / sw
    if ratio > 1.05:
        return "female"
    if ratio < 0.95:
        return "male"
    return "neutral"


def _landmarks_to_rig(landmarks, w: int, h: int, gender: str) -> dict:
    def pt(idx):
        lm = landmarks[idx]
        return {"x": lm.x * w, "y": lm.y * h, "z": getattr(lm, "z", 0)}

    return {
        "gender": gender,
        "nose": pt(mp_pose.PoseLandmark.NOSE.value),
        "leftShoulder": pt(mp_pose.PoseLandmark.LEFT_SHOULDER.value),
        "rightShoulder": pt(mp_pose.PoseLandmark.RIGHT_SHOULDER.value),
        "leftHip": pt(mp_pose.PoseLandmark.LEFT_HIP.value),
        "rightHip": pt(mp_pose.PoseLandmark.RIGHT_HIP.value),
        "leftAnkle": pt(mp_pose.PoseLandmark.LEFT_ANKLE.value),
        "rightAnkle": pt(mp_pose.PoseLandmark.RIGHT_ANKLE.value),
        "leftWrist": pt(mp_pose.PoseLandmark.LEFT_WRIST.value),
        "rightWrist": pt(mp_pose.PoseLandmark.RIGHT_WRIST.value),
    }


def _estimate_betas_from_rig(rig: dict, gender: str) -> list[float]:
    ls, rs = rig["leftShoulder"], rig["rightShoulder"]
    lh, rh = rig["leftHip"], rig["rightHip"]
    la, ra = rig["leftAnkle"], rig["rightAnkle"]

    shoulder_w = abs(rs["x"] - ls["x"])
    hip_w = abs(rh["x"] - lh["x"])
    height = abs((la["y"] + ra["y"]) / 2 - rig["nose"]["y"])

    if shoulder_w == 0:
        shoulder_w = 1

    betas = [0.0] * 10
    betas[0] = np.clip((height / 600 - 1) * 2, -2, 2)
    betas[1] = np.clip((shoulder_w / 200 - 1) * 2, -2, 2)
    betas[2] = np.clip((hip_w / shoulder_w - 1) * 2, -2, 2)
    if gender == "female":
        betas[2] += 0.5
    elif gender == "male":
        betas[2] -= 0.3
    return betas


def _try_smplx_mesh(betas: list[float], gender: str) -> tuple[np.ndarray, np.ndarray] | None:
    try:
        import torch
    except ImportError:
        return None

    model = _load_smplx_model(gender)
    if model is None:
        return None

    try:
        betas_t = torch.tensor([betas], dtype=torch.float32)
        body_pose = torch.zeros(1, 63)
        global_orient = torch.zeros(1, 3)
        output = model(betas=betas_t, body_pose=body_pose, global_orient=global_orient)
        verts = output.vertices.detach().cpu().numpy()[0]
        faces = model.faces
        return verts, faces
    except Exception:
        return None


def _parametric_body_mesh(rig: dict, gender: str) -> tuple[np.ndarray, np.ndarray]:
    """Build humanoid mesh from pose landmarks when SMPL-X files unavailable."""
    import trimesh

    ls, rs = rig["leftShoulder"], rig["rightShoulder"]
    lh, rh = rig["leftHip"], rig["rightHip"]
    la, ra = rig["leftAnkle"], rig["rightAnkle"]
    nose = rig["nose"]

    cx = (ls["x"] + rs["x"]) / 2
    shoulder_y = (ls["y"] + rs["y"]) / 2
    hip_y = (lh["y"] + rh["y"]) / 2
    ankle_y = (la["y"] + ra["y"]) / 2
    head_y = nose["y"]

    sw = max(abs(rs["x"] - ls["x"]), 40)
    skin = [210, 170, 140, 255] if gender == "female" else [195, 155, 125, 255]
    underwear = [139, 90, 180, 255] if gender == "female" else [60, 100, 180, 255]

    parts = []

    head = trimesh.creation.uv_sphere(radius=sw * 0.35, count=[16, 16])
    head.apply_translation([cx, head_y - sw * 0.2, 0])
    head.visual.vertex_colors = skin
    parts.append(head)

    torso_h = max(hip_y - shoulder_y, 50)
    torso = trimesh.creation.box(extents=[sw * 0.85, torso_h, sw * 0.4])
    torso.apply_translation([cx, shoulder_y + torso_h / 2, 0])
    torso.visual.vertex_colors = skin
    parts.append(torso)

    u_top = trimesh.creation.box(extents=[sw * 0.7, torso_h * 0.35, sw * 0.42])
    u_top.apply_translation([cx, shoulder_y + torso_h * 0.25, 0])
    u_top.visual.vertex_colors = underwear
    parts.append(u_top)

    leg_top = hip_y
    u_bot = trimesh.creation.box(extents=[sw * 0.65, sw * 0.35, sw * 0.4])
    u_bot.apply_translation([cx, leg_top + sw * 0.15, 0])
    u_bot.visual.vertex_colors = underwear
    parts.append(u_bot)

    leg_h = max(ankle_y - hip_y, 60)
    for lx in [cx - sw * 0.2, cx + sw * 0.2]:
        leg = trimesh.creation.cylinder(radius=sw * 0.12, height=leg_h, sections=12)
        leg.apply_translation([lx, hip_y + leg_h / 2, 0])
        leg.visual.vertex_colors = skin
        parts.append(leg)

    arm_h = max(hip_y - shoulder_y, 40) * 0.9
    for wx, sx in [(rig["leftWrist"]["x"], ls["x"]), (rig["rightWrist"]["x"], rs["x"])]:
        arm = trimesh.creation.cylinder(radius=sw * 0.08, height=arm_h, sections=10)
        arm.apply_translation([(sx + wx) / 2, shoulder_y + arm_h / 2, 0])
        arm.visual.vertex_colors = skin
        parts.append(arm)

    combined = trimesh.util.concatenate(parts)
    return combined.vertices, combined.faces


def _normalize_mesh(vertices: np.ndarray, faces: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    import trimesh

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    mesh.apply_translation(-mesh.centroid)
    scale = 1.8 / max(mesh.extents)
    mesh.apply_scale(scale)
    return mesh.vertices, mesh.faces


def fit_body_from_image(image_bgr: np.ndarray) -> dict:
    image_bgr = resize_image_max_height(image_bgr, 720)
    h, w = image_bgr.shape[:2]
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

    pose = _get_pose_detector()
    results = pose.process(rgb)

    with mp_selfie.SelfieSegmentation(model_selection=1) as selfie:
        seg_results = selfie.process(rgb)
        seg_mask = seg_results.segmentation_mask

    if not results.pose_landmarks:
        raise ValueError("No full body detected. Use a front-facing full-body photo.")

    landmarks = results.pose_landmarks.landmark
    gender = _detect_gender(landmarks, w, h)
    rig = _landmarks_to_rig(landmarks, w, h, gender)
    betas = _estimate_betas_from_rig(rig, gender)

    smpl_result = _try_smplx_mesh(betas, gender) if settings.avatar_use_smplx else None
    used_smpl = smpl_result is not None
    mesh_mode = "photo_texture"

    if smpl_result:
        vertices, faces = smpl_result
        colors = project_photo_colors(vertices, image_bgr, rig, seg_mask)
        vertices, faces = _normalize_mesh(vertices, faces)
        return {
            "vertices": vertices,
            "faces": faces,
            "vertex_colors": colors,
            "gender": gender,
            "rigData": rig,
            "smplParams": {"betas": betas, "usedSmplx": True, "meshMode": "smplx"},
            "texture_image": None,
            "uvs": None,
        }

    # Default: photo-textured relief mesh (looks like the actual photo)
    verts, faces, uvs, tex_img = build_photo_realistic_mesh(image_bgr, rig, seg_mask)

    return {
        "vertices": verts,
        "faces": faces,
        "vertex_colors": None,
        "gender": gender,
        "rigData": rig,
        "smplParams": {"betas": betas, "usedSmplx": False, "meshMode": mesh_mode},
        "texture_image": tex_img,
        "uvs": uvs,
    }
