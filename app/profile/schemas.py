from pydantic import BaseModel, Field
from typing import Literal

Sex = Literal["male", "female"]
Activity = Literal["sedentary", "light", "moderate", "active", "very_active"]

class ProfileIn ( BaseModel ):
    weight_kg: float
    height_cm: float
    age: int
    sex: Sex
    activity: Activity
    weekly_change_kg: float

class ProfileOut ( BaseModel ):
    weight_kg: float
    height_cm: float
    age: int
    sex: str
    activity: str
    weekly_change_kg: float
    target_calories: int | None
    target_protein_g: float | None
    target_carbs_g: float | None
    target_fat_g: float | None

class PlanOut ( BaseModel ):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

class TargetsIn ( BaseModel ):
    target_calories: int = Field(gt=0)
    target_protein_g: float = Field(gt=0)
    target_carbs_g: float = Field(ge=0)
    target_fat_g: float = Field(gt=0)
