import os

SECRET_KEY = os.environ.get("JWT_SECRET", "dev-only-change-me-in-production")

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 43200
