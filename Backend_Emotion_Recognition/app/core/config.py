from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # App settings
    APP_NAME: str = "Emotion Recognition API"
    DEBUG: bool = True
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    MODEL_DIR: Path = BASE_DIR / "models"
    UPLOAD_DIR: Path = BASE_DIR / "app" / "static" / "uploads"
    RESULTS_DIR: Path = BASE_DIR / "app" / "static" / "results"
    
    # Model paths
    FACE_MODEL_PATH: Path = MODEL_DIR / "faces/face_emotion_model.keras"
    AUDIO_MODEL_PATH: Path = MODEL_DIR / "audio/best_model1_weights.h5"
    FUSION_MODEL_PATH: Path = MODEL_DIR / "fusion_video_audio/best_fusion.pth"
    
    # API settings
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png"]
    ALLOWED_AUDIO_TYPES: list = [
        "audio/wav",
        "audio/wave",
        "audio/x-wav",
        "audio/weba",
        "audio/webm",
        "audio/ogg",
        "audio/mpeg",
        "audio/mp3",
    ]

    class Config:
        env_file = ".env"

    # Database (SQL Server) settings
    DB_DRIVER: str = "ODBC Driver 17 for SQL Server"
    DB_HOST: str = "localhost"
    DB_PORT: int = 1433
    DB_NAME: str = "emotion_db"
    DB_USER: str = "sa"
    DB_PASSWORD: str = "123456"
    DB_ECHO: bool = False

    def get_sqlalchemy_url(self) -> str:
        # Build SQLAlchemy URL for mssql+pyodbc
        # Example: mssql+pyodbc://user:pass@host:1433/dbname?driver=ODBC+Driver+17+for+SQL+Server
        driver = self.DB_DRIVER.replace(" ", "+")
        if self.DB_USER and self.DB_PASSWORD:
            return f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?driver={driver}"
        # Use trusted connection / integrated authentication if user/password not provided
        return f"mssql+pyodbc://{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?driver={driver}"

settings = Settings()