from fastapi import HTTPException
from app.users.schemas.user_schemas import UserCreate
from app.users.repositories import user_repo
from app.users import security
from app.macros.repositories import macro_repo

DEFAULT_MEALS = [
    ("Breakfast", 1),
    ("Lunch", 2),
    ("Afternoon snack", 3),
    ("Dinner", 4),
]

def register_user(data: UserCreate):
    email = user_repo.get_user_by_email(data.email)
    if email is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    pass_hash = security.hash_password(data.password)
    new_user = user_repo.create_user(data.username, data.email, pass_hash)

    for name, position in DEFAULT_MEALS:
        macro_repo.new_meal(new_user["id"], name, position, None)

    return new_user

def auth_user(email, password):
    user = user_repo.get_user_by_email(email)
    if user is None:
        return None
    if not security.verify_password(password, user["password_hash"]):
        return None
    return user
    
