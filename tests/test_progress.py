# Tests for app/progress.py  (the harder debugging-practice module).
#
# Run from the project root:
#     ./venv/Scripts/python -m pytest tests/test_progress.py -q
#
# When you plant bugs (via tests/bug_hunt_progress.py), some of these go red.
# Read each failure: which test -> which function -> reason from actual vs
# expected to the broken line.

import pytest
from app.progress import (
    daily_totals,
    remaining_calories,
    weekly_average,
    weight_change,
    weight_trend,
    weeks_to_goal,
    bmi,
    bmi_category,
    kg_to_lb,
    lb_to_kg,
    macro_percentages,
    longest_streak,
)


ENTRIES = [
    {"calories": 200, "protein_g": 10, "carbs_g": 20, "fat_g": 5},
    {"calories": 300, "protein_g": 25, "carbs_g": 10, "fat_g": 8},
]


def test_daily_totals():
    assert daily_totals(ENTRIES) == {
        "calories": 500,
        "protein_g": 35,
        "carbs_g": 30,
        "fat_g": 13,
    }


def test_daily_totals_empty():
    assert daily_totals([]) == {
        "calories": 0,
        "protein_g": 0,
        "carbs_g": 0,
        "fat_g": 0,
    }


def test_remaining_calories():
    assert remaining_calories(2000, ENTRIES) == 1500      # 2000 - 500


def test_remaining_calories_floors_at_zero():
    assert remaining_calories(400, ENTRIES) == 0          # 400 - 500 -> clamp


def test_weekly_average():
    assert weekly_average([80, 82, 81]) == pytest.approx(81)   # 243 / 3


def test_weekly_average_empty():
    assert weekly_average([]) == 0.0


def test_weight_change():
    assert weight_change([85, 83, 80]) == pytest.approx(-5)    # 80 - 85


def test_weight_change_single():
    assert weight_change([80]) == 0.0


def test_weight_trend():
    assert weight_trend([85, 80]) == "down"
    assert weight_trend([80, 85]) == "up"
    assert weight_trend([80, 80]) == "flat"


def test_weeks_to_goal():
    assert weeks_to_goal(85, 80, 0.5) == 10                # 5 / 0.5
    assert weeks_to_goal(80, 80, 0.5) == 0
    assert weeks_to_goal(85, 80, 0) is None               # zero rate


def test_bmi():
    assert bmi(80, 180) == 24.7                           # 80 / 1.8**2


def test_bmi_category():
    assert bmi_category(17) == "underweight"
    assert bmi_category(22) == "normal"
    assert bmi_category(27) == "overweight"
    assert bmi_category(32) == "obese"


def test_conversions():
    assert kg_to_lb(100) == pytest.approx(220.5)
    assert lb_to_kg(100) == pytest.approx(45.4)


def test_macro_percentages():
    assert macro_percentages(40, 40, 10) == {"protein": 39, "carbs": 39, "fat": 22}


def test_macro_percentages_zero():
    assert macro_percentages(0, 0, 0) == {"protein": 0, "carbs": 0, "fat": 0}


def test_longest_streak():
    assert longest_streak([1, 2, 3, 5, 6]) == 3
    assert longest_streak([1, 2, 2, 3, 4]) == 4           # dedup then count
    assert longest_streak([1, 3, 5]) == 1
    assert longest_streak([]) == 0
