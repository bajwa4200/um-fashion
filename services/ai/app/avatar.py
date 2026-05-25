"""MediaPipe-based avatar generation from full-body photo."""

import io
import json
import uuid
from typing import Literal

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image

import boto3
from botocore.client import Config

from app.config import settings

mp_pose = mp.solutions.pose
mp_selfie = mp.solutions.selfie_segmentation


def _get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def _ensure_bucket():
    client = _get_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except Exception:
        try:
            client.create_bucket(Bucket=settings.s3_bucket)
        except Exception:
            pass


def _detect_gender_proportions(landmarks, image_width: int, image_height: int) -> str:
    """Estimate gender hint from body proportions."""
    ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    lh = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    rh = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]

    shoulder_width = abs(rs.x - ls.x) * image_width
    hip_width = abs(rh.x - lh.x) * image_width

    if shoulder_width == 0:
        return "neutral"

    ratio = hip_width / shoulder_width
    if ratio > 1.05:
        return "female"
    elif ratio < 0.95:
        return "male"
    return "neutral"


def _build_rig_data(
    landmarks,
    image_width: int,
    image_height: int,
    gender: str,
) -> dict:
    def lm_to_point(idx):
        lm = landmarks[idx]
        return {"x": round(lm.x * image_width, 2), "y": round(lm.y * image_height, 2)}

    ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value]
    rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
    lh = landmarks[mp_pose.PoseLandmark.LEFT_HIP.value]
    rh = landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value]
    nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
    la = landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value]
    ra = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]

    shoulder_width = abs(rs.x - ls.x) * image_width
    body_height = abs(la.y - nose.y) * image_height
    hip_width = abs(rh.x - lh.x) * image_width

    center_x = (ls.x + rs.x) / 2 * image_width
    hip_y = (lh.y + rh.y) / 2 * image_height
    shoulder_y = (ls.y + rs.y) / 2 * image_height
    ankle_y = (la.y + ra.y) / 2 * image_height
    head_y = nose.y * image_height

    rig = {
        "gender": gender,
        "bodyScale": round(shoulder_width / 200, 3),
        "bodyHeight": round(body_height, 2),
        "shoulderWidth": round(shoulder_width, 2),
        "landmarks": {
            "nose": lm_to_point(mp_pose.PoseLandmark.NOSE.value),
            "leftShoulder": lm_to_point(mp_pose.PoseLandmark.LEFT_SHOULDER.value),
            "rightShoulder": lm_to_point(mp_pose.PoseLandmark.RIGHT_SHOULDER.value),
            "leftHip": lm_to_point(mp_pose.PoseLandmark.LEFT_HIP.value),
            "rightHip": lm_to_point(mp_pose.PoseLandmark.RIGHT_HIP.value),
            "leftAnkle": lm_to_point(mp_pose.PoseLandmark.LEFT_ANKLE.value),
            "rightAnkle": lm_to_point(mp_pose.PoseLandmark.RIGHT_ANKLE.value),
            "leftWrist": lm_to_point(mp_pose.PoseLandmark.LEFT_WRIST.value),
            "rightWrist": lm_to_point(mp_pose.PoseLandmark.RIGHT_WRIST.value),
        },
        "anchorPoints": {
            "pants": {"x": round(center_x, 2), "y": round(hip_y, 2)},
            "shirt": {"x": round(center_x, 2), "y": round(shoulder_y + 40, 2)},
            "jacket": {"x": round(center_x, 2), "y": round(shoulder_y, 2)},
            "footwear": {"x": round(center_x, 2), "y": round(ankle_y, 2)},
            "hat": {"x": round(center_x, 2), "y": round(head_y - 30, 2)},
            "accessories": {"x": round(center_x + shoulder_width * 0.4, 2), "y": round(hip_y, 2)},
            "watches": {"x": round(lm_to_point(mp_pose.PoseLandmark.LEFT_WRIST.value)["x"], 2),
                        "y": round(lm_to_point(mp_pose.PoseLandmark.LEFT_WRIST.value)["y"], 2)},
        },
    }
    return rig


def _render_avatar_base(
    image: np.ndarray,
    segmentation_mask: np.ndarray,
    rig_data: dict,
    gender: str,
) -> bytes:
    """Render stylized underwear avatar overlay on segmented body."""
    h, w = image.shape[:2]
    canvas = np.zeros((h, w, 4), dtype=np.uint8)

    mask = (segmentation_mask > 0.5).astype(np.uint8) * 255
    body_color = (139, 90, 180, 200) if gender == "female" else (90, 130, 200, 200)
    skin_color = (210, 180, 160, 220)

    colored_body = np.zeros((h, w, 4), dtype=np.uint8)
    colored_body[mask > 0] = skin_color

    # Underwear overlay region (torso + hips)
    anchors = rig_data["anchorPoints"]
    shirt_y = int(anchors["shirt"]["y"])
    pants_y = int(anchors["pants"]["y"])
    foot_y = int(anchors["footwear"]["y"])
    center_x = int(anchors["shirt"]["x"])
    half_w = int(rig_data["shoulderWidth"] / 2)

    underwear_top = max(0, shirt_y - 20)
    underwear_bottom = min(h, pants_y + 60)
    left = max(0, center_x - half_w)
    right = min(w, center_x + half_w)

    colored_body[underwear_top:underwear_bottom, left:right] = body_color

    result = cv2.addWeighted(
        cv2.cvtColor(image, cv2.COLOR_BGR2BGRA), 0.3,
        colored_body, 0.7, 0,
    )

    _, buffer = cv2.imencode(".png", result)
    return buffer.tobytes()


def _default_rig(gender: Literal["male", "female", "neutral"] = "neutral") -> dict:
    return {
        "gender": gender,
        "bodyScale": 1.0,
        "bodyHeight": 600,
        "shoulderWidth": 200,
        "landmarks": {},
        "anchorPoints": {
            "pants": {"x": 200, "y": 350},
            "shirt": {"x": 200, "y": 220},
            "jacket": {"x": 200, "y": 180},
            "footwear": {"x": 200, "y": 520},
            "hat": {"x": 200, "y": 80},
            "accessories": {"x": 280, "y": 350},
            "watches": {"x": 120, "y": 380},
        },
    }


async def generate_avatar(image_bytes: bytes, gender_hint: str | None = None) -> dict:
    """Process full-body photo and return avatar rig + base image URL."""
    _ensure_bucket()

    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        gender = gender_hint or "neutral"
        rig = _default_rig(gender)  # type: ignore
        return {
            "rigData": rig,
            "baseImageUrl": None,
            "gender": gender,
            "success": False,
            "message": "Could not decode image. Using default avatar.",
        }

    h, w = image.shape[:2]
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    with mp_pose.Pose(static_image_mode=True, model_complexity=2) as pose:
        results = pose.process(rgb)

    with mp_selfie.SelfieSegmentation(model_selection=1) as selfie:
        seg_results = selfie.process(rgb)
        seg_mask = seg_results.segmentation_mask

    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        gender = gender_hint or _detect_gender_proportions(landmarks, w, h)
        rig = _build_rig_data(landmarks, w, h, gender)
        avatar_png = _render_avatar_base(image, seg_mask, rig, gender)
    else:
        gender = gender_hint or "neutral"
        rig = _default_rig(gender)  # type: ignore
        avatar_png = image_bytes

    file_key = f"avatars/{uuid.uuid4().hex}.png"
    try:
        s3 = _get_s3_client()
        s3.put_object(
            Bucket=settings.s3_bucket,
            Key=file_key,
            Body=avatar_png,
            ContentType="image/png",
        )
        url = f"{settings.s3_public_url}/{file_key}"
    except Exception:
        url = None

    return {
        "rigData": rig,
        "baseImageUrl": url,
        "gender": gender,
        "success": True,
        "message": "Avatar generated successfully",
    }
