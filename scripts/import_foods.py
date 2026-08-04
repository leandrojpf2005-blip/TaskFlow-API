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

    core = ["energy-kcal_100g", "proteins_100g", "carbohydrates_100g", "fat_100g"]
    df = df[df["product_name"].notna()]
    df = df[df["code"].notna()]
    df = df[df[core].notna().any(axis=1)]
    df = df[df["energy-kcal_100g"].isna() | (df["energy-kcal_100g"] <= 900)]
    df = df.drop_duplicates(subset="code")
    df["sodium_100g"] = df["sodium_100g"] * 1000
    
    return df

# ============================================================================
# STAGE 4 — DEDUPE BRANDS : brand names -> company table   (leave for later)
# ============================================================================

def load_brands(cur, df):
    """Dedupe brand names into `company`, return a {brand_name: brand_id} map."""
    # TODO: later
    return {}


# ============================================================================
# STAGE 5 — BULK INSERT : cleaned chunk -> food table   (leave for later)
# ============================================================================

def insert_foods(cur, df):
    """Bulk-insert a cleaned chunk into `food` with psycopg2 execute_values."""
    # TODO: later
    pass


# ============================================================================
# PIPELINE : runs the 5 stages in order
# ============================================================================

def main():
    # DEV MODE: STAGE 1 + 2 read just a 1000-row sample so iterating is instant.
    df = pd.read_csv(
        OFF_FILE, sep="\t", usecols=USECOLS,        # stage 1 (stream) + 2 (select)
        nrows=4000000, dtype=str, on_bad_lines="skip",
    )
    print(f"read {len(df)} raw rows\n")

    cleaned = clean_chunk(df)                        # stage 3 (clean)

    print(cleaned.head(20))
    print(f"\n{len(cleaned)} rows left after cleaning (from {len(df)} raw)")

    # --- THE REAL RUN (uncomment once clean_chunk + insert_foods work) -------
    # conn = psycopg2.connect(dbname="taskflow", user="postgres",
    #                         password="352", host="localhost", port="5432")
    # cur = conn.cursor()
    #
    # reader = pd.read_csv(OFF_FILE, sep="\t", usecols=USECOLS,   # stage 1 + 2
    #                      chunksize=CHUNK_SIZE, dtype=str, on_bad_lines="skip")
    # for i, chunk in enumerate(reader):
    #     cleaned = clean_chunk(chunk)                # stage 3
    #     load_brands(cur, cleaned)                   # stage 4
    #     insert_foods(cur, cleaned)                  # stage 5
    #     conn.commit()
    #     print(f"chunk {i}: inserted {len(cleaned)} rows")
    #
    # cur.close()
    # conn.close()


if __name__ == "__main__":
    main()
