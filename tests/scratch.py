# Scratch pad — compute expected values here, then copy the numbers into
# test_nutrition.py. Named WITHOUT "test_" so pytest ignores this file.
#
# Run it with:   ./venv/Scripts/python tests/scratch.py
#
# Do the ARITHMETIC here — but source the constants/logic yourself (don't
# import nutrition.py and call the functions to get the answers; that would
# just test the code against itself).

from app.nutrition import calories_from_macros, bmr, tdee, ACTIVITY, target_calories, macro_split, make_plan

print("tdee moderate:", 1805 * 1.55)
print("target_calories:", 2000 + (-0.5 * 7700 / 7))
