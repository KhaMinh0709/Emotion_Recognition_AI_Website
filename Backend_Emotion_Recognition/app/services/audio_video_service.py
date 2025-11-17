import torch
import cv2
import numpy as np
import torchaudio
import torchaudio.transforms as T
import subprocess
import tempfile
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException
from facenet_pytorch import MTCNN  

from app.models.audio_video_model import AudioVideoModel
from app.core.logger import setup_logger

logger = setup_logger(__name__)

# Audio config theo notebook
AUDIO_CONFIG = {
    "sample_rate": 16000,
    "n_mels": 80,
    "n_fft": 1024,
    "hop_length": int(16000 * 10 / 1000),  # 10ms
    "win_length": int(16000 * 25 / 1000),  # 25ms
}

# Video config theo notebook
VIDEO_CONFIG = {
    "num_frames": 16,  # T=16 frames per video
    "frame_size": 224,  # 224x224
}

TARGET_MEL_T = 320  # ~3.2s @ 10ms hop


class AudioVideoService:
    """Service để preprocess video+audio và inference"""

    def __init__(self):
        self.model = AudioVideoModel()
        self.device = self.model.device

        self.mtcnn = MTCNN(
            image_size=VIDEO_CONFIG["frame_size"],
            margin=20,
            device=self.device,
            post_process=True,
            selection_method="probability",
        )

        # Mel-spectrogram transform (y như notebook)
        self.mel_spec = T.MelSpectrogram(
            sample_rate=AUDIO_CONFIG["sample_rate"],
            n_fft=AUDIO_CONFIG["n_fft"],
            hop_length=AUDIO_CONFIG["hop_length"],
            win_length=AUDIO_CONFIG["win_length"],
            n_mels=AUDIO_CONFIG["n_mels"],
            power=2.0,
        )
        self.amp_to_db = T.AmplitudeToDB(stype="power")

    async def predict(self, video_file: UploadFile):
        """
        Main prediction endpoint
        """
        try:
            # 1. Save file tạm thời
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp_video:
                content = await video_file.read()
                tmp_video.write(content)
                tmp_video_path = tmp_video.name

            logger.info(f"Processing video: {video_file.filename}")

            # 2. Preprocess video -> faces
            try:
                video_tensor = await self._preprocess_video(tmp_video_path)
            except Exception as e:
                logger.error(f"Video preprocessing failed: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Video preprocessing failed: {str(e)}",
                )

            # 3. Preprocess audio từ video file
            try:
                audio_tensor = await self._preprocess_audio_from_video(tmp_video_path)
            except Exception as e:
                logger.error(f"Audio preprocessing failed: {e}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Audio preprocessing failed: {str(e)}",
                )

            # 4. Inference
            result = self.model.predict(video_tensor, audio_tensor)

            # Cleanup
            try:
                os.remove(tmp_video_path)
            except Exception:
                pass

            return result

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise HTTPException(
                status_code=500, detail=f"Prediction error: {str(e)}"
            )

    async def _preprocess_video(self, video_path: str) -> torch.Tensor:
        """
        Video preprocessing: read frames -> detect faces -> crop -> normalize
        PIPELINE GIỐNG NHẤT CÓ THỂ VỚI NOTEBOOK (MTCNN)
        Returns:
            [1, 16, 3, 224, 224] tensor
        """
        logger.info("Preprocessing video...")

        # 1. Read all frames
        frames = self._read_all_frames(video_path)
        if len(frames) == 0:
            raise ValueError("[ERROR] No frames extracted from video")

        logger.info(f"[VIDEO] Extracted {len(frames)} frames from video")

        # 2. Uniform sampling: chọn 16 frames đều từ video
        frames = self._uniform_sample(
        frames, T=VIDEO_CONFIG["num_frames"], jitter=True)
        logger.info(f"[VIDEO] Sampled {len(frames)} uniform frames")

        # 3. Face detection & crop bằng MTCNN (giống hàm crop_faces_tensor)
        face_tensors = []
        num_faces_detected = 0

        for i, frame in enumerate(frames):
            # frame: RGB [H,W,3] uint8
            try:
                with torch.no_grad():
                    face = self.mtcnn(frame)  # [3,224,224] hoặc None
            except Exception as e:
                logger.debug(f"MTCNN error on frame {i}: {e}")
                face = None

            if face is None:
                # fallback giống notebook: resize full frame, scale 0-1
                resized = cv2.resize(
                    frame,
                    (VIDEO_CONFIG["frame_size"], VIDEO_CONFIG["frame_size"]),
                )
                t = (
                    torch.from_numpy(resized.transpose(2, 0, 1))
                    .float()
                    / 255.0
                )  # [3,224,224]
                logger.debug(f"[VIDEO] No face detected on frame {i}, using full frame")
            else:
                num_faces_detected += 1
                # MTCNN trả về tensor [3,224,224], đã chuẩn hoá
                t = face.float()

            face_tensors.append(t.unsqueeze(0))  # [1,3,224,224]

        logger.info(
            f"[VIDEO] Face detection: {num_faces_detected}/{len(frames)} frames with faces"
        )

        # 4. Stack thành [T,3,224,224] giống file .pt ở Colab
        faces_tensor = torch.cat(face_tensors, dim=0)  # [T,3,224,224]
        # 5. Add batch dimension: [1,T,3,224,224]
        faces_tensor = faces_tensor.unsqueeze(0)

        logger.info(
            f"[VIDEO] SUCCESS: tensor shape={faces_tensor.shape} (dtype={faces_tensor.dtype})"
        )
        return faces_tensor

    def _read_all_frames(self, video_path: str) -> list:
        """Đọc tất cả frames từ video"""
        cap = cv2.VideoCapture(video_path)
        frames = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            # BGR -> RGB
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)

        cap.release()
        return frames

    def _uniform_sample(self, frames: list, T: int = 16, jitter: bool = False) -> list:
        """
        Sample T frames uniformly từ video
        """
        if len(frames) == 0:
            return []

        if len(frames) >= T:
            idx = np.linspace(0, len(frames) - 1, num=T, dtype=int)
            if jitter and len(frames) > 2:
                idx = np.clip(
                    idx + np.random.randint(-1, 2, size=T),
                    0,
                    len(frames) - 1,
                )
        else:
            idx = np.round(
                np.linspace(0, len(frames) - 1, num=T)
            ).astype(int)

        return [frames[i] for i in idx]

    async def _preprocess_audio_from_video(self, video_path: str) -> torch.Tensor:
        """
        Extract audio từ video file -> WAV 16kHz -> Mel-spectrogram
        EXACT match với notebook pipeline
        Returns:
            [1, 1, 80, 320] tensor
        """
        logger.info("Preprocessing audio from video...")

        # Extract audio từ video thành WAV 16kHz
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_wav:
            wav_path = tmp_wav.name

        try:
            # FFmpeg: extract audio at 16kHz mono (EXACT như notebook)
            cmd = [
                "ffmpeg",
                "-y",
                "-v",
                "error",
                "-i",
                video_path,
                "-ac",
                "1",  # mono
                "-ar",
                str(AUDIO_CONFIG["sample_rate"]),  # 16kHz
                wav_path,
            ]

            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                raise RuntimeError(f"FFmpeg error: {result.stderr}")

            logger.info(f"Audio extracted to: {wav_path}")

            # ==== EXACT notebook pipeline ====
            waveform, sr = torchaudio.load(wav_path)  # [C, T]

            # Resample nếu cần
            if sr != AUDIO_CONFIG["sample_rate"]:
                resampler = T.Resample(sr, AUDIO_CONFIG["sample_rate"])
                waveform = resampler(waveform)

            # Ensure mono
            if waveform.shape[0] > 1:
                waveform = waveform.mean(dim=0, keepdim=True)  # [1, T]

            # Mel-spectrogram
            mel = self.mel_spec(waveform)  # [1, n_mels=80, Tm]
            mel_db = self.amp_to_db(mel).squeeze(0).float()  # [80, Tm]

            logger.debug(
                f"Mel-spectrogram shape before CMVN: {mel_db.shape}, "
                f"mean={mel_db.mean():.3f}, std={mel_db.std():.3f}"
            )

            # CMVN: per-sample normalization (GIỐNG NOTEBOOK)
            mel_db = (mel_db - mel_db.mean()) / (mel_db.std() + 1e-6)

            # Crop or pad to TARGET_MEL_T (EXACT như notebook)
            mel_db = self._crop_or_pad_mel(mel_db, TARGET_MEL_T, mode="center")

            #  KHÔNG re-normalize lần 2 (Colab không làm bước này)
            logger.debug(
                f"Mel-spectrogram after crop: mean={mel_db.mean():.6f}, std={mel_db.std():.6f}"
            )

            # [80, 320] -> [1,1,80,320]
            mel_tensor = mel_db.unsqueeze(0).unsqueeze(0)

            logger.info(
                f"Audio tensor: shape={mel_tensor.shape}, "
                f"mean={mel_tensor[0,0].mean():.6f}, std={mel_tensor[0,0].std():.6f}"
            )
            return mel_tensor

        finally:
            try:
                os.remove(wav_path)
            except Exception:
                pass

    def _crop_or_pad_mel(
        self, mel: torch.Tensor, target_T: int = 320, mode: str = "center"
    ) -> torch.Tensor:
        """
        Crop hoặc pad mel-spectrogram về target length (EXACT match với notebook)
        mel: [80, Tm]
        """
        Tm = mel.shape[-1]
        if Tm == target_T:
            return mel

        if Tm > target_T:
            if mode == "random":
                s = np.random.randint(0, Tm - target_T + 1)
            else:
                s = max((Tm - target_T) // 2, 0)
            return mel[:, s : s + target_T]
        else:
            pad_l = (target_T - Tm) // 2
            pad_r = target_T - Tm - pad_l
            return torch.nn.functional.pad(mel, (pad_l, pad_r), value=0.0)
