from fastapi import APIRouter, Depends, HTTPException
from app.profile.services import profile_service
from app.profile.schemas.profile_schemas import ProfileIn, ProfileOut
from app.users.dependencies import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("", response_model=ProfileOut)
def get_profile(user=Depends(get_current_user)):
    profile = profile_service.get_profile(user["id"])
    if profile is None:
        raise HTTPException(status_code=404, detail="No profile yet")
    return profile

@router.put("", response_model=ProfileOut)
def save_profile(profile: ProfileIn, user=Depends(get_current_user)):
    return profile_service.save_profile(profile, user["id"])