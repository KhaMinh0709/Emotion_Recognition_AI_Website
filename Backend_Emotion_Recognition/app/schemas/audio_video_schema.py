from pydantic import BaseModel
from typing import Dict


class AudioVideoResponse(BaseModel):
    """Response model for audio-video emotion prediction"""
    emotion: str
    confidence: float
    all_emotions: Dict[str, float]


class AudioVideoUploadResponse(BaseModel):
    """Response model for audio-video upload"""
    message: str
    file_path: str
