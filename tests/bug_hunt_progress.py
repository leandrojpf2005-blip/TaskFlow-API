# Bug-hunt trainer for app/progress.py — self-serve, blind, repeatable.
#
# Run from the project root:
#     ./venv/Scripts/python tests/bug_hunt_progress.py            (random 10-15 bugs)
#     ./venv/Scripts/python tests/bug_hunt_progress.py --n 6      (plant exactly 6)
#     ./venv/Scripts/python tests/bug_hunt_progress.py --restore  (clean version back)
#
# It keeps a PRISTINE snapshot the first time it runs, always injects from
# that snapshot (so bugs never stack), and --restore puts the clean file back.
# It picks the bugs RANDOMLY at runtime, so you never know which are live.
#
# Then hunt:  ./venv/Scripts/python -m pytest tests/test_progress.py -q
# Answer key (last resort):  python tests/bug_hunt_progress.py --restore  then diff.
#
# Named without "test_" so pytest ignores this file.

import argparse
import random
import shutil
from pathlib import Path

TARGET = Path("app/progress.py")
PRISTINE = Path("tests/.progress_pristine.py")

# Pool of mutations: (find, replace). Each introduces one realistic bug.
# The pool is visible; which ones are LIVE on a run is random.
BUGS = [
    # daily_totals
    ('totals["carbs_g"] += e["carbs_g"]', 'totals["carbs_g"] += e["protein_g"]'),
    ('totals["fat_g"] += e["fat_g"]', 'totals["fat_g"] += 0'),
    # remaining_calories
    ("if left < 0:", "if left > 0:"),
    ("left = target - consumed", "left = consumed - target"),
    # weekly_average
    ("sum(weights) / len(weights)", "sum(weights) / (len(weights) - 1)"),
    # weight_change
    ("weights[-1] - weights[0]", "weights[0] - weights[-1]"),
    # weight_trend
    ("if change < 0:", "if change <= 0:"),
    ('        return "down"', '        return "up"'),
    # weeks_to_goal
    ("if weekly_rate <= 0:", "if weekly_rate < 0:"),
    ("abs(target - current) / weekly_rate", "(target - current) / weekly_rate"),
    # bmi
    ("height_m = height_cm / 100", "height_m = height_cm / 10"),
    ("weight_kg / (height_m ** 2)", "weight_kg * (height_m ** 2)"),
    ("(height_m ** 2), 1)", "(height_m ** 2), 0)"),
    # bmi_category
    ('        return "overweight"', '        return "obese"'),
    ("elif bmi_value < 30:", "elif bmi_value < 35:"),
    # conversions
    ("kg * 2.20462", "kg * 2.0462"),
    ("lb / 2.20462", "lb * 2.20462"),
    # macro_percentages
    ('"fat": round(9 * fat_g', '"fat": round(4 * fat_g'),
    ("4 * carbs_g + 9 * fat_g", "4 * carbs_g + 8 * fat_g"),
    # longest_streak
    ("days = sorted(set(days_logged))", "days = sorted(days_logged)"),
    ("days[i] == days[i - 1] + 1:", "days[i] == days[i - 1] + 2:"),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=random.randint(10, 15),
                    help="how many bugs to plant (default: random 10-15)")
    ap.add_argument("--restore", action="store_true",
                    help="put the clean version back and exit")
    args = ap.parse_args()

    # First run: snapshot the clean file so we can always reset to it.
    if not PRISTINE.exists():
        shutil.copy(TARGET, PRISTINE)

    if args.restore:
        shutil.copy(PRISTINE, TARGET)
        print("Restored the clean app/progress.py")
        return

    text = PRISTINE.read_text(encoding="utf-8")
    chosen = random.sample(BUGS, min(args.n, len(BUGS)))

    planted = 0
    for find, replace in chosen:
        if find in text:
            text = text.replace(find, replace, 1)
            planted += 1

    TARGET.write_text(text, encoding="utf-8")

    print(f"\n  Planted {planted} bug(s) in {TARGET}.  Happy hunting.\n")
    print("  Hunt:     ./venv/Scripts/python -m pytest tests/test_progress.py -q")
    print("  Restore:  ./venv/Scripts/python tests/bug_hunt_progress.py --restore\n")


if __name__ == "__main__":
    main()
