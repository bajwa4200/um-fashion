"""MediaPipe pose + segmentation for rig anchors."""

import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
mp_selfie = mp.solutions.selfie_segmentation


def segment_person(image_bgr: np.ndarray) -> np.ndarray:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    with mp_selfie.SelfieSegmentation(model_selection=1) as seg:
        result = seg.process(rgb)
        mask = result.segmentation_mask
        return (mask > 0.5).astype(np.float32)


def build_rig_from_image(image_bgr: np.ndarray, gender_hint: str | None = None) -> dict:
    h, w = image_bgr.shape[:2]
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    gender = gender_hint or "neutral"

    with mp_pose.Pose(static_image_mode=True, model_complexity=2) as pose:
        result = pose.process(rgb)
        if not result.pose_landmarks:
            raise ValueError("No person detected. Use a full-body front photo in A-pose.")

        lm = result.pose_landmarks.landmark
        landmarks = {}
        for i, p in enumerate(lm):
            landmarks[str(i)] = {"x": p.x * w, "y": p.y * h}

        def pt(idx: int) -> tuple[float, float]:
            p = lm[idx]
            return p.x * w, p.y * h

        ls = pt(mp_pose.PoseLandmark.LEFT_SHOULDER)
        rs = pt(mp_pose.PoseLandmark.RIGHT_SHOULDER)
        lh = pt(mp_pose.PoseLandmark.LEFT_HIP)
        rh = pt(mp_pose.PoseLandmark.RIGHT_HIP)
        la = pt(mp_pose.PoseLandmark.LEFT_ANKLE)
        ra = pt(mp_pose.PoseLandmark.RIGHT_ANKLE)
        nose = pt(mp_pose.PoseLandmark.NOSE)

        shoulder_w = abs(rs[0] - ls[0])
        body_h = max(la[1], ra[1]) - nose[1]
        mid_x = (ls[0] + rs[0]) / 2
        mid_hip_y = (lh[1] + rh[1]) / 2

        anchor_points = {
            "pants": {"x": mid_x / w, "y": mid_hip_y / h},
            "shirt": {"x": mid_x / w, "y": (ls[1] + lh[1]) / 2 / h},
            "jacket": {"x": mid_x / w, "y": ls[1] / h * 0.95},
            "footwear": {"x": mid_x / w, "y": max(la[1], ra[1]) / h},
            "hat": {"x": mid_x / w, "y": nose[1] / h * 0.85},
            "accessories": {"x": rs[0] / w, "y": (ls[1] + lh[1]) / 2 / h},
            "watches": {"x": ls[0] / w, "y": (ls[1] + lh[1]) / 2 / h},
        }

        if ls[0] > rs[0]:
            gender = gender_hint or "female"
        else:
            gender = gender_hint or "male"

        return {
            "gender": gender,
            "bodyScale": float(shoulder_w / w),
            "bodyHeight": float(body_h / h),
            "shoulderWidth": float(shoulder_w),
            "landmarks": landmarks,
            "anchorPoints": anchor_points,
        }
