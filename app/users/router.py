from fastapi import APIRouter, Depends, HTTPException, status

from app.users.schemas import UserCreate, UserLogin, UserOut, Token
from app.users import service as user_service
from app.users import security
from app.users.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate):
    return user_service.register_user(data)


@router.post("/login", response_model=Token)
def login(data: UserLogin):
    user = user_service.auth_user(data.email, data.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = security.create_access_token({"sub": str(user["id"])})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user=Depends(get_current_user)):
    return current_user
