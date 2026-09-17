import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Try loading from backend/.env first, then root ../.env.local, then root ../.env
current_dir = Path(__file__).resolve().parent
parent_dir = current_dir.parent

load_dotenv(current_dir / ".env")
load_dotenv(parent_dir / ".env.local")
load_dotenv(parent_dir / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "NagrikAI Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL: str = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://clivjsmzwiegehayitze.supabase.co")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    NEXT_PUBLIC_SUPABASE_ANON_KEY: str = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    
    # Security & Internal API
    BACKEND_INTERNAL_SECRET: str = os.getenv("BACKEND_INTERNAL_SECRET", "nagrik_ai_sentinel_secret_2026")
    
    # AI Provider Settings (Local Ollama vs Cloud Gemini)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "ollama")  # 'ollama' or 'gemini'
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_VISION_MODEL: str = os.getenv("OLLAMA_VISION_MODEL", "llama3.2-vision")
    OLLAMA_TEXT_MODEL: str = os.getenv("OLLAMA_TEXT_MODEL", "llama3.1:8b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
