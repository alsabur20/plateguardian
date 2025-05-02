from dotenv import load_dotenv
import os

import redis

load_dotenv()


class ApplicationConfig:
    """
    Configuration class for the application.
    """

    SECRET_KEY = os.getenv("SECRET_KEY")

    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Disable track modifications to save memory
    SQLALCHEMY_ECHO = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///./db.sqlite"  # SQLite database URI

    SESSION_TYPE = "redis"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    SESSION_REDIS = redis.from_url("redis://127.0.0.1:6379")  # Redis server URL
