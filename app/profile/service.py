from app.profile import repository as profile_repo
from app.profile.schemas import ProfileIn, TargetsIn
from app.nutrition import make_plan


def get_profile(user_id):
    return profile_repo.get_profile(user_id)


def save_profile(profile: ProfileIn, user_id):
    row = profile_repo.save_profile(
        user_id,
        profile.weight_kg,
        profile.height_cm,
        profile.age,
        profile.sex,
        profile.activity,
        profile.weekly_change_kg,
    )
    if row["target_calories"] is not None:
        return row

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

def save_targets(user_id, targets: TargetsIn):
    return profile_repo.save_targets(
        user_id,
        targets.target_calories,
        targets.target_protein_g,
        targets.target_carbs_g,
        targets.target_fat_g,
    )

def get_plan(user_id):
    profile = profile_repo.get_profile(user_id)
    if profile is None:
        return None
    return make_plan(
        float(profile["weight_kg"]), 
        float(profile["height_cm"]), 
        profile["age"], 
        profile["sex"],
        profile["activity"],
        float(profile["weekly_change_kg"])
    )
