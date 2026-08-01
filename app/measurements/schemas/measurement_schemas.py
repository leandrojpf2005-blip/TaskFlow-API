import datetime
from pydantic import BaseModel


class MeasurementIn(BaseModel):
    weight_kg: float | None = None
    chest_cm: float | None = None
    waist_cm: float | None = None
    arm_cm: float | None = None
    thigh_cm: float | None = None
    date: datetime.date | None = None


class MeasurementOut(MeasurementIn):
    id: int
    date: datetime.date
