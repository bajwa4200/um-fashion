# SMPL-X Model Files (optional — enables higher-quality 3D bodies)

Download from https://smpl-x.is.tue.mpg.de/ (free academic registration):

Place these files in this directory:

- `SMPLX_NEUTRAL.npz`
- `SMPLX_MALE.npz`
- `SMPLX_FEMALE.npz`

If files are missing, the pipeline uses a **parametric humanoid mesh** built from MediaPipe pose landmarks (still exports a rotatable GLB).

## Install Python deps

```powershell
pip install torch smplx trimesh pygltflib
```
