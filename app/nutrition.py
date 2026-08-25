
def calories_from_macros( protein: int, carbs: int, fat: int):
    return round( 4*protein + 4*carbs + 9*fat )

def bmr(height, weight, age, sex):
    if sex == "male":
        return 10*weight + 6.25*height - 5*age + 5
    else:
        return 10*weight + 6.25*height - 5*age - 161

ACTIVITY = {
    "sedentary": 1.2,
    "light": 1.3,
    "moderate": 1.55,
    "active": 1.725,
    "very_active": 1.9,
}

def tdee(bmr, activity):
    return bmr * ACTIVITY[activity]

def target_calories(tdee, weekly_change):
    return tdee + (weekly_change*7700/7)

def macro_split(calories, weight):
    protein_g = 2* weight
    fat_g = (0.25*calories) / 9
    carbs_g = (calories - protein_g*4 -fat_g*9) / 4
    return {
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
    }

def make_plan(weight, height, age, sex, activity, weekly_change):
    b = bmr(height, weight, age, sex)
    t = tdee(b, activity)
    target = target_calories(t, weekly_change)
    macros = macro_split(target, weight)
    return {
    "calories": target,
    "protein_g": macros["protein_g"],
    "carbs_g": macros["carbs_g"],
    "fat_g": macros["fat_g"],
}
    