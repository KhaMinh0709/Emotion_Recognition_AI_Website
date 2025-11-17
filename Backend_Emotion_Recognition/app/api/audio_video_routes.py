from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from app.services.audio_video_service import AudioVideoService
from app.schemas.audio_video_schema import AudioVideoResponse
from typing import Dict, Any
from pathlib import Path
import uuid

from app.core.config import settings
from app.utils.video_utils import convert_flv_to_mp4, is_ffmpeg_available

router = APIRouter()

# Lazy load service
audio_video_service = None


def get_audio_video_service() -> AudioVideoService:
    """Lazy initialization của AudioVideoService"""
    global audio_video_service
    if audio_video_service is None:
        audio_video_service = AudioVideoService()
    return audio_video_service


@router.post("/predict", response_model=AudioVideoResponse)
async def predict_audio_video(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Predict emotion từ video file (audio + visual fusion)
    
    Endpoint này sẽ:
    1. Extract tất cả frames từ video
    2. Sample 16 frames uniformly và detect faces
    3. Extract audio track từ video
    4. Convert mel-spectrogram từ audio
    5. Pass qua fusion model để predict emotion
    
    Parameters:
    - file: Video file (MP4, WebM, FLV, etc.)
    
    Returns:
    - emotion: Predicted emotion (ANG, DIS, FEA, HAP, NEU, SAD)
    - confidence: Confidence score (0..1)
    - all_emotions: Probability scores cho tất cả cảm xúc
    """
    svc = get_audio_video_service()
    result = await svc.predict(file)
    return JSONResponse(content=result)


@router.post("/convert")
async def convert_video_to_mp4(file: UploadFile = File(...)) -> Dict[str, str]:
    """Convert an uploaded FLV (or other) video to MP4 for frontend display.

    - Saves the original upload to `settings.UPLOAD_DIR` with a unique name.
    - Converts to MP4 using ffmpeg and saves next to the original file.
    - Returns the public URL path to the MP4 (mounted under `/static`).

    Note: This endpoint keeps the original file (so model can still use FLV if desired).
    """
    # Ensure ffmpeg exists
    if not is_ffmpeg_available():
        raise HTTPException(status_code=500, detail="FFmpeg is not available on the server PATH")

    uploads_dir: Path = settings.UPLOAD_DIR
    uploads_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique base name
    unique = uuid.uuid4().hex
    orig_suffix = Path(file.filename).suffix or ".flv"
    orig_name = f"{unique}{orig_suffix}"
    orig_path = uploads_dir / orig_name

    # Save original
    try:
        contents = await file.read()
        with open(orig_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    # Build output mp4 path
    out_name = f"{unique}.mp4"
    out_path = uploads_dir / out_name

    # Convert using ffmpeg
    try:
        convert_flv_to_mp4(str(orig_path), str(out_path))
    except Exception as e:
        # keep original for inspection
        raise HTTPException(status_code=500, detail=f"Conversion failed: {e}")

    # Return URL relative to static mount
    mp4_url = f"/static/uploads/{out_name}"
    orig_url = f"/static/uploads/{orig_name}"

    return JSONResponse(content={"mp4_url": mp4_url, "original_url": orig_url})


@router.get("/health")
async def health() -> Dict[str, str]:
    """Health check endpoint cho audio-video service"""
    return {"status": "ok", "service": "audio-video-fusion"}
