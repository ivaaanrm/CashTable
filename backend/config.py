from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./cashtable.db"
    secret_key: str = "dev-secret-key"
    admin_pin_hash: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
