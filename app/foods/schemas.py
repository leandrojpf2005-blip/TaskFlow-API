from pydantic import BaseModel


class FoodOut(BaseModel):
    id: int
    name: str
    barcode: str
    calories: float | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    sat_fat_g: float | None = None 
    mono_fat_g: float | None = None 
    poly_fat_g: float | None = None
    trans_fat_g: float | None = None
    fiber_g: float | None = None
    sugar_g: float | None = None 
    sodium_mg: float | None = None 
    potassium_mg: float | None = None 
    calcium_mg: float | None = None
    iron_mg: float | None = None
    cholesterol_mg: float | None = None

class NewFood (BaseModel):
    name: str 
    calories: float 
    protein_g: float 
    carbs_g: float 
    fat_g: float 
    sat_fat_g: float | None = None
    mono_fat_g: float | None = None 
    poly_fat_g: float | None = None
    trans_fat_g: float | None = None
    fiber_g: float | None = None
    sugar_g: float | None = None
    sodium_mg: float | None = None
    potassium_mg: float | None = None
    calcium_mg: float | None = None
    iron_mg: float | None = None
    cholesterol_mg: float | None = None
