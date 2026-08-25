# DEBUGGING PRACTICE MODULE — not part of the CoachFuel app. Safe to delete.
#
# Pure functions (no DB), so they're unit-testable like nutrition.py — but
# harder: loops, dict/list handling, chained conditionals, and edge cases
# (empty lists, zero division, boundaries). Debug it with:
#     ./venv/Scripts/python -m pytest tests/test_progress.py -q

import math


def daily_totals(entries):
    """Sum the macros over a day's diary entries (each entry is a dict)."""
    totals = {"calories": 0.0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0}
    for e in entries:
        totals["calories"] += e["calories"]
        totals["protein_g"] += e["protein_g"]
        totals["carbs_g"] += e["carbs_g"]
        totals["fat_g"] += e["fat_g"]
    return totals


def remaining_calories(target, entries):
    consumed = daily_totals(entries)["calories"]
    left = target - consumed
    if left < 0:
        return 0
    return left


def weekly_average(weights):
    if not weights:
        return 0.0
    return sum(weights) / (len(weights))


def weight_change(weights):
    """Net change from first to last weigh-in (last - first)."""
    if len(weights) < 2:
        return 0.0
    return weights[-1] - weights[0]


def weight_trend(weights):
    """'down', 'up' or 'flat' based on the net change."""
    change = weight_change(weights)
    if change < 0:
        return "down"
    elif change > 0:
        return "up"
    else:
        return "flat"


def weeks_to_goal(current, target, weekly_rate):
    """Whole weeks to reach target at weekly_rate (a positive magnitude).
    Returns None if the rate is zero or negative."""
    if weekly_rate <= 0:
        return None
    return math.ceil(abs(target - current) / weekly_rate)


def bmi(weight_kg, height_cm):
    """Body-mass index, rounded to 1 decimal."""
    height_m = height_cm / 100
    return round(weight_kg / (height_m ** 2), 1)


def bmi_category(bmi_value):
    if bmi_value < 18.5:
        return "underweight"
    elif bmi_value < 25:
        return "normal"
    elif bmi_value < 30:
        return "overweight"
    else:
        return "obese"


def kg_to_lb(kg):
    return round(kg * 2.20462, 1)


def lb_to_kg(lb):
    return round(lb / 2.20462, 1)


def macro_percentages(protein_g, carbs_g, fat_g):
    """Percent of total calories from each macro (rounded ints).
    Zero-calorie input -> all zeros."""
    cals = 4 * protein_g + 4 * carbs_g + 9 * fat_g
    if cals == 0:
        return {"protein": 0, "carbs": 0, "fat": 0}
    return {
        "protein": round(4 * protein_g / cals * 100),
        "carbs": round(4 * carbs_g / cals * 100),
        "fat": round(9 * fat_g / cals * 100),
    }


def longest_streak(days_logged):
    """Given day-numbers (ints, possibly unsorted/duplicated), return the
    length of the longest run of consecutive days."""
    if not days_logged:
        return 0
    days = sorted(set(days_logged))
    longest = 1
    current = 1
    for i in range(1, len(days)):
        if days[i] == days[i - 1] + 1:
            current += 1
            if current > longest:
                longest = current
        else:
            current = 1
    return longest
