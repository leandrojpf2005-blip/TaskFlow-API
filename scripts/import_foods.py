"""
Open Food Facts -> CoachFuel food catalog importer.

Streams the OFF export, cleans each chunk, and bulk-loads it into the
`food` (and `company`) tables. Run once to populate the catalog:

    python scripts/import_foods.py

The pipeline runs in 5 stages (labeled below):
    1. STREAM       read the huge file a chunk at a time
    2. SELECT       keep only the ~15 columns we need
    3. CLEAN        coerce types, drop junk, fix units      <- your part
    4. DEDUPE BRANDS brand names -> company table
    5. BULK INSERT  push each clean chunk into `food`

Dev tip: while writing clean_chunk(), main() reads only nrows=1000 so every
run is instant. Switch to the streaming loop once cleaning + inserting work.
"""

import pandas as pd
import psycopg2
import psycopg2.extras


# ============================================================================
# STAGE 1 — STREAM : the file, and how big a bite we read at a time
# ============================================================================
OFF_FILE = r"C:\Users\woxte\Downloads\en.openfoodfacts.org.products.csv.gz"  
CHUNK_SIZE = 100_000                     # rows per chunk on the full run


# ============================================================================
# STAGE 2 — SELECT : which of OFF's 211 columns we keep
# Left = OFF's column name, comment = the `food` column it maps to.
# ============================================================================

USECOLS = [
    "code",               
    "product_name",         
    "brands",               
    "energy-kcal_100g",    
    "proteins_100g",       
    "carbohydrates_100g",   
    "fat_100g",            
    "saturated-fat_100g",   
    "sugars_100g",          
    "fiber_100g",           
    "sodium_100g",
    "monounsaturated-fat_100g",
    "polyunsaturated-fat_100g",
    "trans-fat_100g",
    "potassium_100g",
    "calcium_100g",
    "iron_100g",
    "cholesterol_100g",
]


# ============================================================================
# STAGE 3 — CLEAN : raw chunk (all strings) -> clean DataFrame   [YOUR PART]
# ============================================================================
def clean_chunk(df):
    df["proteins_100g"] = pd.to_numeric(df["proteins_100g"], errors="coerce")
    df["fat_100g"] = pd.to_numeric(df["fat_100g"], errors="coerce")
    df["carbohydrates_100g"] = pd.to_numeric(df["carbohydrates_100g"], errors="coerce")
    df["energy-kcal_100g"] = pd.to_numeric(df["energy-kcal_100g"], errors="coerce")
    df["saturated-fat_100g"] = pd.to_numeric(df["saturated-fat_100g"], errors="coerce")
    df["sugars_100g"] = pd.to_numeric(df["sugars_100g"], errors="coerce")
    df["fiber_100g"] = pd.to_numeric(df["fiber_100g"], errors="coerce")
    df["sodium_100g"] = pd.to_numeric(df["sodium_100g"], errors="coerce")
    df["monounsaturated-fat_100g"] = pd.to_numeric(df["monounsaturated-fat_100g"], errors="coerce")
    df["polyunsaturated-fat_100g"] = pd.to_numeric(df["polyunsaturated-fat_100g"], errors="coerce")
    df["trans-fat_100g"] = pd.to_numeric(df["trans-fat_100g"], errors="coerce")
    df["potassium_100g"] = pd.to_numeric(df["potassium_100g"], errors="coerce")
    df["calcium_100g"] = pd.to_numeric(df["calcium_100g"], errors="coerce")
    df["iron_100g"] = pd.to_numeric(df["iron_100g"], errors="coerce")
    df["cholesterol_100g"] = pd.to_numeric(df["cholesterol_100g"], errors="coerce")

    core = ["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"]
    df = df[df["product_name"].notna()]
    df = df[df["code"].notna()]
    df = df[df[core].notna().any(axis=1)]
    df = df[df["energy-kcal_100g"].isna() | (df["energy-kcal_100g"] <= 900)]
    df = df.drop_duplicates(subset="code")
    df["sodium_100g"] = df["sodium_100g"] * 1000
    df["potassium_100g"] = df["potassium_100g"] * 1000
    df["calcium_100g"] = df["calcium_100g"] * 1000
    df["iron_100g"] = df["iron_100g"] * 1000
    df["cholesterol_100g"] = df["cholesterol_100g"] * 1000

    return df

# ============================================================================
# STAGE 4 — DEDUPE BRANDS : brand names -> company table   (leave for later)
# ============================================================================


# ============================================================================
# STAGE 5 — BULK INSERT : cleaned chunk -> food table   (leave for later)
# ============================================================================

SRC_COLS = ["product_name", "code", "energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g", "saturated-fat_100g", "monounsaturated-fat_100g", "polyunsaturated-fat_100g",
            "trans-fat_100g", "fiber_100g", "sugars_100g", "sodium_100g", "potassium_100g", "calcium_100g", "iron_100g", "cholesterol_100g"]

def insert_foods(cur, df):
    values = [
    tuple(None if pd.isna(v) else v for v in row)
    for row in df[SRC_COLS].itertuples(index=False, name=None)
    ]
    psycopg2.extras.execute_values(
        cur, """INSERT INTO food (name, barcode, calories, protein_g, carbs_g, fat_g, sat_fat_g, mono_fat_g, poly_fat_g, trans_fat_g, fiber_g, sugar_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, cholesterol_mg)
                VALUES %s
                ON CONFLICT (barcode) DO NOTHING
            """, values)


# ============================================================================
# PIPELINE : runs the 5 stages in order
# ============================================================================

def main():
    conn = psycopg2.connect(dbname = "taskflow", user="postgres", password="352", host="localhost", port="5432")
    cur = conn.cursor()
    reader = pd.read_csv(
        OFF_FILE, sep="\t", usecols=USECOLS,
        chunksize=100_000, dtype=str, on_bad_lines="skip",
    )
    for i, chunk in enumerate(reader):
        cleaned = clean_chunk(chunk)
        insert_foods(cur, cleaned)
        conn.commit()
        print(f" Inserted {cur.rowcount} foods into the catalog (from chunk {i}")
    

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
