from fastapi import APIRouter, Depends
from app.measurements.schemas import MeasurementIn, MeasurementOut
from app.measurements import service as measurement_service
from app.users.dependencies import get_current_user


router = APIRouter(prefix="/measurements", tags=["measurements"])


@router.get("")
def list_measurements(user=Depends(get_current_user)):
    return measurement_service.get_measurements(user["id"])


@router.post("", response_model=MeasurementOut)
def create_measurement(measurement: MeasurementIn, user=Depends(get_current_user)):
    return measurement_service.new_measurement(measurement, user["id"])