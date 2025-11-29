import torch
import torch.nn as nn
import torchvision.models as models
import os

from app.core.logger import setup_logger

logger = setup_logger(__name__)

# Cảm xúc theo thứ tự từ notebook (id 0..5)
EMOTION_ORDER = ["angry", "disgust", "fear", "happy", "neutral", "sad"]


class VideoEncoder(nn.Module):
    """Encode video frames using ResNet18"""

    def __init__(self, out_dim=512, pretrained=True):
        super().__init__()
        base = models.resnet18(pretrained=pretrained)
        # Loại bỏ fully connected layer cuối cùng
        self.backbone = nn.Sequential(*list(base.children())[:-1])
        self.out_dim = out_dim

    def forward(self, x):
        """
        Args:
            x: [B, T, 3, 224, 224]
        Returns:
            feat: [B, 512]
        """
        B, T, C, H, W = x.shape
        x = x.view(B * T, C, H, W)
        feat = self.backbone(x)  # [B*T, 512, 1, 1]
        feat = feat.view(B, T, self.out_dim)
        feat = feat.mean(dim=1)  # [B,512]
        return feat


class AudioEncoder(nn.Module):
    """Encode mel-spectrogram using 2D CNN"""

    def __init__(self, out_dim=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),  # [1,80,T] -> [32,40,T/2]

            nn.Conv2d(32, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),  # [64,20,T/4]

            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1)),  # [128,1,1]
        )
        self.fc = nn.Linear(128, out_dim)

    def forward(self, x):
        """
        x: [B,1,80,T]
        """
        h = self.net(x)  # [B,128,1,1]
        h = h.view(h.size(0), -1)  # [B,128]
        h = self.fc(h)  # [B,256]
        return h


class AVEmotionNet(nn.Module):
    """Audio-Video Emotion Recognition Network - Fusion Model"""

    def __init__(self, num_classes=6):
        super().__init__()
        self.video_enc = VideoEncoder(out_dim=512, pretrained=True)
        self.audio_enc = AudioEncoder(out_dim=256)

        # Fusion layer: concatenate video + audio features
        self.fusion = nn.Sequential(
            nn.Linear(512 + 256, 512),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes),
        )

    def forward(self, video, audio):
        """
        video: [B,T,3,224,224]
        audio: [B,1,80,T]
        """
        v = self.video_enc(video)
        a = self.audio_enc(audio)
        x = torch.cat([v, a], dim=1)  # [B,768]
        logits = self.fusion(x)  # [B,6]
        return logits


class AudioVideoModel:
    """Wrapper class để load và sử dụng fusion model"""

    def __init__(self, model_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        if torch.cuda.is_available():
            logger.info(f"PyTorch: Using GPU device: {torch.cuda.get_device_name(self.device)}")
        else:
            logger.info("PyTorch: Using CPU (no GPU found)")

        # Tạo model
        self.model = AVEmotionNet(num_classes=len(EMOTION_ORDER))
        logger.info(
            f"Model created with {len(EMOTION_ORDER)} emotion classes: {EMOTION_ORDER}"
        )

        # Đường dẫn checkpoint mặc định
        if model_path is None:
            model_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
                "models",
                "fusion_video_audio",
                "best_fusion.pth", 
            )

        model_path = os.path.abspath(model_path)
        logger.info(f"[MODEL] Model path: {model_path}")
        logger.info(f"[MODEL] Path exists: {os.path.exists(model_path)}")

        if os.path.exists(model_path):
            try:
                logger.info("[MODEL] Loading fusion model weights...")
                checkpoint = torch.load(
                    model_path, map_location=self.device, weights_only=False
                )
                logger.info(f"[MODEL] Checkpoint type: {type(checkpoint)}")

                # Handle checkpoint format giống Colab
                if isinstance(checkpoint, dict):
                    if "model_state" in checkpoint:
                        logger.info("[MODEL] Found 'model_state' key")
                        self.model.load_state_dict(checkpoint["model_state"])
                        if "val_f1" in checkpoint:
                            logger.info(
                                f"[MODEL] Best val_f1 from checkpoint: {checkpoint['val_f1']:.4f}"
                            )
                    elif "state_dict" in checkpoint:
                        logger.info("[MODEL] Found 'state_dict' key")
                        self.model.load_state_dict(checkpoint["state_dict"])
                    else:
                        logger.info("[MODEL] Dict checkpoint as direct state dict")
                        self.model.load_state_dict(checkpoint)
                else:
                    logger.info("[MODEL] Direct state dict")
                    self.model.load_state_dict(checkpoint)

                logger.info("[MODEL] SUCCESS: Fusion model weights loaded!")

            except Exception as e:
                logger.error(f"[MODEL] ERROR loading model: {e}")
                logger.warning(
                    "[MODEL] WARNING: Model initialized with random weights (NOT trained!)"
                )
        else:
            logger.warning(f"[MODEL] ERROR: Model file NOT found at: {model_path}")
            logger.warning(
                "[MODEL] WARNING: Model initialized with random weights (predictions will be wrong!)"
            )

        self.model = self.model.to(self.device)
        self.model.eval()
        logger.info(f"[MODEL] SUCCESS: Model ready for inference on device: {self.device}")

    def predict(self, video_tensor: torch.Tensor, audio_tensor: torch.Tensor):
        """
        Predict emotion from video and audio tensors
        video_tensor: [1,T,3,224,224]
        audio_tensor: [1,1,80,T]
        """
        video_tensor = video_tensor.to(self.device)
        audio_tensor = audio_tensor.to(self.device)

        with torch.no_grad():
            logits = self.model(video_tensor, audio_tensor)
            probs = torch.softmax(logits, dim=1)[0]  # [6]
            pred_id = int(torch.argmax(probs).item())
            pred_emotion = EMOTION_ORDER[pred_id]
            confidence = float(probs[pred_id].item())

            # Log để debug
            logger.info(f"[PRED] probs={probs.tolist()}, pred={pred_emotion}")

            all_emotions = {
                EMOTION_ORDER[i]: float(probs[i].item())
                for i in range(len(EMOTION_ORDER))
            }

        return {
            "emotion": pred_emotion,
            "confidence": confidence,
            "all_emotions": all_emotions,
        }
