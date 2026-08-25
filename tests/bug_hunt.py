# Bug-hunt trainer — self-serve, blind, repeatable debugging practice.
#
# Run it from the project root:
#     ./venv/Scripts/python tests/bug_hunt.py
#     ./venv/Scripts/python tests/bug_hunt.py --n 4      (plant exactly 4)
#
# It resets app/nutrition.py to its committed (clean) version, then plants a
# RANDOM handful of bugs. You don't know which ones. Then hunt them:
#     ./venv/Scripts/python -m pytest -q
#
# Restore the clean version anytime:   git checkout app/nutrition.py
# Truly stuck?  git diff app/nutrition.py   (that's the answer key — last resort)
#
# Named without "test_" so pytest ignores this file.

import argparse
import random
import subprocess
from pathlib import Path

TARGET = Path("app/nutrition.py")

# Pool of mutations: (find, replace). Each introduces one realistic bug.
# The pool is visible, but you never know WHICH get planted on a given run.
BUGS = [
    ("+ 9*fat )", "+ 8*fat )"),                                # calories: fat 9 -> 8
    ("round( 4*protein", "round( 3*protein"),                  # calories: protein 4 -> 3
    ("+ 4*carbs +", "+ 5*carbs +"),                            # calories: carbs 4 -> 5
    ("- 5*age + 5", "- 5*age - 5"),                            # bmr male: +5 -> -5
    ("- 5*age - 161", "- 5*age - 160"),                        # bmr female: 161 -> 160
    ("bmr * ACTIVITY[activity]", "bmr + ACTIVITY[activity]"),  # tdee: * -> +  (operator)
    ('"moderate": 1.55', '"moderate": 1.5'),                   # activity multiplier
    ('"active": 1.725', '"active": 1.7'),                      # activity (coverage-gap!)
    ("weekly_change*7700/7", "weekly_change*7700*7"),          # target_calories: / -> *
    ("protein_g = 2* weight", "protein_g = 3* weight"),        # macro_split: protein 2 -> 3
    ("(0.25*calories) / 9", "(0.25*calories) / 8"),            # macro_split: fat /9 -> /8
    ("-fat_g*9) / 4", "-fat_g*9) / 3"),                        # macro_split: carbs /4 -> /3
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=random.randint(3, 5),
                    help="how many bugs to plant (default: random 3-5)")
    args = ap.parse_args()

    # Reset to the clean committed version so bugs never stack up.
    subprocess.run(["git", "checkout", str(TARGET)], check=True)

    text = TARGET.read_text(encoding="utf-8")
    chosen = random.sample(BUGS, min(args.n, len(BUGS)))

    planted = 0
    for find, replace in chosen:
        if find in text:
            text = text.replace(find, replace, 1)
            planted += 1

    TARGET.write_text(text, encoding="utf-8")

    print(f"\n  Planted {planted} bug(s) in {TARGET}.  Good luck. \n")
    print("  Hunt them:   ./venv/Scripts/python -m pytest -q")
    print("  Restore:     git checkout", TARGET, "\n")


if __name__ == "__main__":
    main()
