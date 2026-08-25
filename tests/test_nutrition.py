# Tests for app/nutrition.py
#
# HOW TO RUN (from the project root):
#     ./venv/Scripts/python -m pytest -q
#
# pytest basics:
#   - the FILE name must start with  test_
#   - each TEST is a function starting with  test_
#   - you check things with  assert <something that should be True>
#   - if an assert is False, the test FAILS and pytest shows you the line
#     and the actual vs expected value  <- that's your bug-finder

import pytest
from app.nutrition import (
    calories_from_macros,
    bmr,
    tdee,
    target_calories,
    macro_split,
    make_plan,
)


# ============================================================
# EXAMPLES — learn the pattern from these
# ============================================================

def test_calories_from_macros():
    # 4*10 + 4*20 + 9*5  =  40 + 80 + 45  =  165
    assert calories_from_macros(10, 20, 5) == 165


def test_bmr_male():
    # 10*80 + 6.25*180 - 5*25 + 5  =  800 + 1125 - 125 + 5
    assert bmr(180, 80, 25, "male") == 1805


def test_bmr_female():
    # 10*60 + 6.25*165 - 5*30 - 161  =  600 + 1031.25 - 150 - 161
    assert bmr(165, 60, 30, "female") == 1320.25


def test_macro_split():
    m = macro_split(2000, 80)
    assert m["protein_g"] == 160                             # 2 * 80
    # floats are messy -> use pytest.approx, never == on long decimals
    assert m["fat_g"] == pytest.approx(55.5556, abs=0.01)    # 0.25*2000 / 9
    assert m["carbs_g"] == pytest.approx(215)                # (2000 - 640 - 500) / 4


# ============================================================
# YOUR TURN — write these (compute the expected values by hand)
# ============================================================

def test_tdee():
    # tdee(bmr, activity) = bmr * ACTIVITY[activity]
    # ACTIVITY["moderate"] = 1.55  ->  1805 * 1.55 = 2797.75
    assert tdee(1805, "moderate") == pytest.approx(2797.75)

# def test_target_calories():
#     # target_calories(2000, -0.5)  =  2000 + (-0.5 * 7700 / 7)  =  ?
#     assert target_calories(2000, -0.5) == ???

def test_target_calories():
    assert target_calories(2000, -0.5) == pytest.approx(1450)

# def test_make_plan():
#     # make_plan(80, 180, 25, "male", "moderate", -0.5) returns a dict with
#     # keys: calories, protein_g, carbs_g, fat_g.  Work out the numbers and
#     # assert a couple of them (use pytest.approx for the decimals).
#     plan = make_plan(80, 180, 25, "male", "moderate", -0.5)
#     assert plan["protein_g"] == ???

def test_make_plan():
    plan = make_plan(80, 180, 25, "male", "moderate", -0.5)
    assert plan["protein_g"] == pytest.approx(160)
