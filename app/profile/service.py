from app.profile import repository as profile_repo
from app.profile.schemas import ProfileIn
from app.nutrition import make_plan


def get_profile(user_id):
    return profile_repo.get_profile(user_id)


def save_profile(profile: ProfileIn, user_id):
    profile_repo.save_profile(
        user_id,
        profile.weight_kg,
        profile.height_cm,
        profile.age,
        profile.sex,
        profile.activity,
        profile.weekly_change_kg,
    )

    plan = make_plan(
        profile.weight_kg,
        profile.height_cm,
        profile.age,
        profile.sex,
        profile.activity,
        profile.weekly_change_kg,
    )

    return profile_repo.save_targets(
        user_id,
        plan["calories"],
        plan["protein_g"],
        plan["carbs_g"],
        plan["fat_g"],
    )
