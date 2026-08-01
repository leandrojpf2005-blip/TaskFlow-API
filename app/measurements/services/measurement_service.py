from app.measurements.repositories import measurement_repo
from app.measurements.schemas.measurement_schemas import MeasurementIn


def get_measurements(user_id):
    return measurement_repo.get_measurements(user_id)


def new_measurement(measurement: MeasurementIn, user_id):
    return measurement_repo.new_measurements(
        user_id,
        measurement.weight_kg,
        measurement.chest_cm,
        measurement.waist_cm,
        measurement.arm_cm,
        measurement.thigh_cm,
    )