"""
============================================================
  IIT Cutoff Predictor — based on finalmodel.py
  Trains on 2016-2022 JEE Advanced CSV datasets
  Predicts 2025 cutoffs using Random Forest Regressor
============================================================
"""

import os
import pandas as pd
import numpy as np
import joblib

from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# ── Paths ──
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "iit_cutoff_model.pkl")
ENC_PATH   = os.path.join(BASE_DIR, "iit_encoders.pkl")

DATASET_FILES = [
    "2016.csv", "2017.csv", "2018.csv", "2019.csv",
    "2020.csv", "2021.csv", "2022.csv",
]


# ─────────────────────────────────────────────────────────
#  LOAD / TRAIN
# ─────────────────────────────────────────────────────────

def _load_raw_data():
    """Load and concatenate 2016-2022 CSVs (exact logic from finalmodel.py)."""
    dataframes = []
    for fname in DATASET_FILES:
        fpath = os.path.join(BASE_DIR, fname)
        if not os.path.exists(fpath):
            print(f"  [WARN] Missing: {fpath} — skipping")
            continue
        df   = pd.read_csv(fpath)
        year = int(fname.split(".")[0])
        df["Year"] = year
        dataframes.append(df)

    if not dataframes:
        raise FileNotFoundError("No JEE CSV datasets found in backend/")

    data = pd.concat(dataframes, ignore_index=True)
    print(f"  [OK] Raw data loaded: {data.shape[0]} rows")
    return data


def _preprocess(data):
    """Clean and filter data — mirrors finalmodel.py steps 3-6."""
    data = data.dropna(subset=["Closing Rank"]).drop_duplicates()

    # IIT only
    df = data[data["Institute"].str.contains("Indian Institute of Technology", na=False)].copy()

    # Final round only
    if "Round" in df.columns:
        max_round = df["Round"].max()
        df = df[df["Round"] == max_round]

    # Clean rank column
    df["Closing Rank"] = (
        df["Closing Rank"].astype(str).str.replace(",", "")
    )
    df["Closing Rank"] = pd.to_numeric(df["Closing Rank"], errors="coerce")
    df = df.dropna(subset=["Closing Rank"])
    df = df[df["Closing Rank"] > 0]

    features = ["Year", "Institute", "Academic Program Name", "Seat Type", "Gender"]
    df = df[features + ["Closing Rank"]].copy()

    print(f"  [OK] After cleaning: {df.shape[0]} IIT rows")
    return df


def _encode(df):
    """Label-encode categorical columns, return df + encoders dict."""
    encoders = {}
    for col in ["Institute", "Academic Program Name", "Seat Type", "Gender"]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    return df, encoders


def _train(df, encoders):
    """Train Random Forest — same params as finalmodel.py."""
    features = ["Year", "Institute", "Academic Program Name", "Seat Type", "Gender"]
    X = df[features]
    y = df["Closing Rank"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.30, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=500,
        max_depth=25,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)
    print(f"  [OK] IIT model trained | MAE={mae:.0f} | R²={r2:.3f}")

    return model


def load_iit_model():
    """
    Load model from cache or train fresh.
    Returns (model, encoders, raw_iit_data_df).
    """
    try:
        raw_data  = _load_raw_data()
        clean_df  = _preprocess(raw_data)
        clean_df, encoders = _encode(clean_df)

        if os.path.exists(MODEL_PATH) and os.path.exists(ENC_PATH):
            model    = joblib.load(MODEL_PATH)
            encoders = joblib.load(ENC_PATH)
            print("  [OK] IIT cutoff model loaded from cache")
        else:
            model = _train(clean_df, encoders)
            joblib.dump(model, MODEL_PATH)
            joblib.dump(encoders, ENC_PATH)
            print(f"  [OK] IIT model saved -> {MODEL_PATH}")

        return model, encoders, clean_df

    except Exception as e:
        print(f"  [WARN] IIT model not available: {e}")
        return None, None, None


# ─────────────────────────────────────────────────────────
#  PREDICT 2025 CUTOFFS  (mirrors finalmodel.py steps 11-16)
# ─────────────────────────────────────────────────────────

def predict_iit_cutoffs(model, encoders, data,
                        branch_keyword="Computer Science",
                        seat_type="OPEN",
                        gender="Gender-Neutral",
                        top_n=10):
    """
    Predict 2025 closing ranks for all IIT + program combos
    filtered by branch_keyword.

    Returns list of dicts with Institute, Program, Predicted_Closing_Rank.
    """
    if model is None or encoders is None:
        return []

    try:
        seat_enc = encoders["Seat Type"].transform([seat_type])[0]
    except (ValueError, KeyError):
        # Category not in training data — fall back to OPEN
        try:
            seat_enc = encoders["Seat Type"].transform(["OPEN"])[0]
        except Exception:
            seat_enc = 0

    try:
        gender_enc = encoders["Gender"].transform([gender])[0]
    except (ValueError, KeyError):
        gender_enc = 0

    institutes = encoders["Institute"].classes_
    programs   = encoders["Academic Program Name"].classes_

    results = []
    for inst in institutes:
        inst_code = encoders["Institute"].transform([inst])[0]
        for prog in programs:
            # Filter by keyword
            if branch_keyword.lower() not in prog.lower():
                continue
            prog_code = encoders["Academic Program Name"].transform([prog])[0]
            sample = pd.DataFrame(
                [[2025, inst_code, prog_code, seat_enc, gender_enc]],
                columns=["Year", "Institute", "Academic Program Name", "Seat Type", "Gender"]
            )
            pred_rank = int(model.predict(sample)[0])
            results.append({
                "institute":    inst,
                "program":      prog,
                "predicted_closing_rank": pred_rank,
            })

    results = sorted(results, key=lambda x: x["predicted_closing_rank"])
    return results[:top_n]
