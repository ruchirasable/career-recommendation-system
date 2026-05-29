"""
============================================================
  COLLEGE COMPASS v2.0 — AI-Based Career Guidance System
  ─────────────────────────────────────────────────────────
  MODULE 1 : JEE Rank Predictor (Random Forest ML)
  MODULE 2 : Course Recommender (Subject -> Course Mapping)
  MODULE 3 : College Recommender (NIRF-based, ML-ranked)
  ─────────────────────────────────────────────────────────
  Suitable for: Class 12 students / BCA Final Year Project
  Dataset    : NIRF 2025-inspired, 2200+ college records
============================================================
"""

import pandas as pd
import numpy as np
import os
import warnings

warnings.filterwarnings("ignore")

from sklearn.ensemble import RandomForestRegressor
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
from sklearn.metrics.pairwise import euclidean_distances
import joblib

# ─────────────────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────────────────

_HERE = os.path.dirname(os.path.abspath(__file__))
JEE_DATA_PATH     = os.path.join(_HERE, "jee_dataset.csv")
JEE_MODEL_PATH    = os.path.join(_HERE, "jee_rank_model.pkl")
COLLEGE_DATA_PATH = os.path.join(_HERE, "nirf_colleges_dataset.csv")


# ─────────────────────────────────────────────────────────
#  MODULE 1 — JEE RANK PREDICTOR  (original code preserved)
# ─────────────────────────────────────────────────────────

def generate_jee_dataset(n=3000, save_path=JEE_DATA_PATH):
    """Generate realistic JEE rank dataset using non-linear score->rank mapping."""
    np.random.seed(42)

    def score_to_rank(score):
        if score >= 290:   return np.random.randint(1, 50)
        elif score >= 270: return np.random.randint(50, 200)
        elif score >= 250: return np.random.randint(200, 800)
        elif score >= 230: return np.random.randint(800, 2500)
        elif score >= 210: return np.random.randint(2500, 6000)
        elif score >= 190: return np.random.randint(6000, 12000)
        elif score >= 170: return np.random.randint(12000, 22000)
        elif score >= 150: return np.random.randint(22000, 40000)
        elif score >= 130: return np.random.randint(40000, 65000)
        elif score >= 110: return np.random.randint(65000, 95000)
        elif score >= 90:  return np.random.randint(95000, 130000)
        elif score >= 70:  return np.random.randint(130000, 180000)
        else:              return np.random.randint(180000, 250000)

    scores_phy  = np.random.randint(10, 100, n)
    scores_chem = np.random.randint(10, 100, n)
    scores_math = np.random.randint(10, 100, n)
    mock_score  = np.random.randint(50, 280, n)
    attempts    = np.random.choice([1, 2], n, p=[0.6, 0.4])
    study_hrs   = np.clip(np.random.normal(8, 2, n), 2, 16).astype(int)
    coaching    = np.random.choice([0, 1], n, p=[0.3, 0.7])
    total_score = scores_phy + scores_chem + scores_math

    data = {
        "physics_score":       scores_phy,
        "chemistry_score":     scores_chem,
        "maths_score":         scores_math,
        "total_score":         total_score,
        "mock_test_score":     mock_score,
        "attempts":            attempts,
        "study_hours_per_day": study_hrs,
        "coaching":            coaching,
        "rank":                [score_to_rank(s) for s in total_score],
    }

    df = pd.DataFrame(data)
    df.to_csv(save_path, index=False)
    print(f"  [OK] JEE dataset saved -> {save_path}  ({n} records)")
    return df


def train_jee_model(df, model_path=JEE_MODEL_PATH):
    """Train a Random Forest model on JEE data."""
    features = ["physics_score", "chemistry_score", "maths_score",
                "total_score", "mock_test_score", "attempts",
                "study_hours_per_day", "coaching"]
    X = df[features]
    y = df["rank"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(
        n_estimators=200, max_depth=12,
        min_samples_split=5, random_state=42, n_jobs=-1
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    mae   = mean_absolute_error(y_test, preds)
    print(f"  [OK] JEE Model trained | MAE = {mae:.0f} ranks")

    joblib.dump(model, model_path)
    return model, features


def predict_rank(model, physics, chemistry, maths, mock_score,
                 attempts=1, study_hours=8, coaching=1):
    """
    Predict JEE rank from exam scores and study details.

    Parameters
    ----------
    model       : trained RandomForest model
    physics     : Physics score (0-100)
    chemistry   : Chemistry score (0-100)
    maths       : Maths score (0-100)
    mock_score  : Best mock test total score (0-300)
    attempts    : 1 or 2
    study_hours : Daily study hours (1-18)
    coaching    : 1 if attending coaching, else 0

    Returns
    -------
    int -- predicted JEE rank
    """
    total = physics + chemistry + maths
    data  = np.array([[physics, chemistry, maths, total,
                       mock_score, attempts, study_hours, coaching]])
    rank  = int(model.predict(data)[0])
    return max(1, rank)


# ─────────────────────────────────────────────────────────
#  MODULE 2 — COURSE RECOMMENDER
# ─────────────────────────────────────────────────────────

SUBJECT_COURSE_MAP = {
    "Maths": [
        "Computer Science & Engineering",
        "Data Science",
        "Artificial Intelligence & Machine Learning",
        "B.Sc Mathematics (Hons.)",
        "Information Technology",
        "B.Sc Statistics",
        "Integrated M.Sc Mathematics",
        "Electrical Engineering",
    ],
    "Physics": [
        "Mechanical Engineering",
        "Electrical Engineering",
        "Civil Engineering",
        "Electronics & Communication Engineering",
        "Aerospace Engineering",
        "Instrumentation Engineering",
        "Integrated M.Sc Physics",
        "B.Sc Physics (Hons.)",
    ],
    "Chemistry": [
        "Chemical Engineering",
        "Biotechnology",
        "B.Sc Chemistry (Hons.)",
        "Petroleum Engineering",
        "B.Pharm",
        "Integrated M.Sc Chemistry",
        "B.Sc Forensic Science",
        "B.Sc Microbiology",
    ],
    "Biology": [
        "Biotechnology",
        "B.Sc Biology (Hons.)",
        "MBBS",
        "B.Pharm",
        "B.Sc Microbiology",
        "B.Sc Biochemistry",
        "BDS",
        "Biomedical Engineering",
    ],
    "Computer Science": [
        "Computer Science & Engineering",
        "Artificial Intelligence & Machine Learning",
        "Cyber Security",
        "Data Science",
        "Information Technology",
        "B.Sc Computer Science",
        "B.Sc Data Science",
        "Electronics & Communication Engineering",
    ],
}

COURSE_DESCRIPTIONS = {
    "Computer Science & Engineering":            "Core CS degree -- algorithms, AI, systems; most in-demand at IITs/NITs.",
    "Data Science":                              "Analytics + ML -- top hiring sector at Google, Amazon, startups.",
    "Artificial Intelligence & Machine Learning":"Specialised AI/ML -- highest salary growth field in India.",
    "B.Sc Mathematics (Hons.)":                 "Pure/applied math -- gateway to research, finance & data analytics.",
    "Information Technology":                    "Applied CS -- software systems, databases, networking.",
    "B.Sc Statistics":                           "Probability, inference, actuarial science -- niche high-salary path.",
    "Integrated M.Sc Mathematics":               "5-year direct M.Sc -- skip separate PG entrance.",
    "Electrical Engineering":                    "Circuits, power, signal processing -- evergreen engineering.",
    "Mechanical Engineering":                    "Design, thermodynamics, manufacturing -- always in demand.",
    "Civil Engineering":                         "Infrastructure, structures, construction -- backbone of development.",
    "Electronics & Communication Engineering":   "Telecom, embedded systems, IoT, VLSI.",
    "Aerospace Engineering":                     "Aircraft, rockets, satellites -- ISRO, DRDO careers.",
    "Instrumentation Engineering":               "Sensors, control systems, automation -- industrial applications.",
    "Integrated M.Sc Physics":                   "5-year deep dive into theoretical & experimental physics.",
    "B.Sc Physics (Hons.)":                      "Foundation for research, GATE, UPSC physics optional.",
    "Chemical Engineering":                      "Industrial chemistry, process design, petroleum -- high salary.",
    "Biotechnology":                             "Bio-processes, genetic engineering, pharma -- growing sector.",
    "B.Sc Chemistry (Hons.)":                    "Organic/inorganic/physical chemistry -- R&D labs, pharma.",
    "Petroleum Engineering":                     "Oil & gas exploration, refining -- high-paying niche.",
    "B.Pharm":                                   "Drug formulation, clinical trials, pharmacology.",
    "Integrated M.Sc Chemistry":                 "5-year combined chemistry program.",
    "B.Sc Forensic Science":                     "Crime lab, chemical analysis -- govt & private labs.",
    "B.Sc Biology (Hons.)":                      "Broad biological sciences -- research & academia.",
    "MBBS":                                      "Doctor of Medicine -- highest-impact biology career.",
    "B.Sc Microbiology":                         "Bacteria, viruses, infection control, food safety.",
    "B.Sc Biochemistry":                         "Biochemical pathways, clinical lab sciences.",
    "BDS":                                       "Dental sciences -- high demand, good earnings.",
    "Biomedical Engineering":                    "Medical devices, diagnostics, imaging systems.",
    "Cyber Security":                            "Ethical hacking, network defense -- fastest-growing field.",
    "B.Sc Computer Science":                     "Academic CS -- research-oriented pathway.",
    "B.Sc Data Science":                         "Applied data science -- analytics + visualisation.",
}


def recommend_courses(subject, top_n=5):
    """
    Recommend courses for a given favourite subject.

    Parameters
    ----------
    subject : str  -- Maths / Physics / Chemistry / Biology / Computer Science
    top_n   : int  -- number of courses to return (default 5)

    Returns
    -------
    list of (course_name: str, description: str) tuples
    """
    subject = subject.strip().title()
    aliases = {
        "Math": "Maths", "Mathematics": "Maths",
        "Bio":  "Biology", "Cs": "Computer Science",
        "Chem": "Chemistry", "Phy": "Physics",
        "Pc":   "Computer Science",
    }
    subject = aliases.get(subject, subject)

    courses = SUBJECT_COURSE_MAP.get(subject, [])
    if not courses:
        return []

    result = []
    for c in courses[:top_n]:
        desc = COURSE_DESCRIPTIONS.get(c, "Great career prospects in this field.")
        result.append((c, desc))
    return result


# ─────────────────────────────────────────────────────────
#  MODULE 3 — COLLEGE RECOMMENDER (NIRF 2025 dataset)
# ─────────────────────────────────────────────────────────

SUBJECT_BRANCH_MAP = {
    "Maths": [
        "Computer Science & Engineering", "Data Science",
        "Artificial Intelligence & Machine Learning",
        "B.Sc Mathematics (Hons.)", "Information Technology",
        "B.Sc Statistics", "Integrated M.Sc Mathematics",
        "Electrical Engineering", "Mechanical Engineering",
    ],
    "Physics": [
        "Mechanical Engineering", "Electrical Engineering",
        "Civil Engineering", "Electronics & Communication Engineering",
        "Aerospace Engineering", "Instrumentation Engineering",
        "Integrated M.Sc Physics", "B.Sc Physics (Hons.)",
        "Industrial Engineering",
    ],
    "Chemistry": [
        "Chemical Engineering", "Biotechnology",
        "B.Sc Chemistry (Hons.)", "Petroleum Engineering",
        "B.Pharm", "Integrated M.Sc Chemistry",
        "B.Sc Forensic Science", "B.Sc Microbiology",
    ],
    "Biology": [
        "Biotechnology", "B.Sc Biology (Hons.)",
        "B.Sc Microbiology", "B.Sc Biochemistry",
        "Biomedical Engineering", "B.Pharm",
        "B.Sc Environmental Science",
    ],
    "Computer Science": [
        "Computer Science & Engineering",
        "Artificial Intelligence & Machine Learning",
        "Cyber Security", "Data Science",
        "Information Technology", "B.Sc Computer Science",
        "B.Sc Data Science",
    ],
}


def load_college_dataset(path=COLLEGE_DATA_PATH):
    """Load the NIRF 2025-inspired college CSV dataset."""
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found: '{path}'\n"
            "Make sure nirf_colleges_dataset.csv is in the project folder."
        )
    df = pd.read_csv(path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    return df


def train_college_ml_model(df):
    """
    Train KNN model on college features (nirf_rank, avg_package).
    Returns knn, scaler, feature_cols for use in recommend_colleges().
    """
    df = df.copy()
    df["nirf_score"] = 1.0 / (df["nirf_rank"] + 1)
    feature_cols = ["nirf_score", "avg_package"]

    X      = df[feature_cols].values
    scaler = StandardScaler()
    X_sc   = scaler.fit_transform(X)

    knn = NearestNeighbors(n_neighbors=min(30, len(df)), metric="euclidean")
    knn.fit(X_sc)

    print(f"  [OK] College ML model ready | {len(df)} records indexed")
    return knn, scaler, feature_cols


def _ml_scores(df, scaler, feature_cols):
    """Internal helper: return ML scores for every row (higher = better)."""
    df = df.copy()
    df["nirf_score"] = 1.0 / (df["nirf_rank"] + 1)
    X    = df[feature_cols].values
    X_sc = scaler.transform(X)
    ref  = np.array([[1.0, df["avg_package"].max()]])
    ref_sc = scaler.transform(ref)
    dists  = euclidean_distances(ref_sc, X_sc)[0]
    return -dists


def recommend_colleges(df, scaler, feature_cols,
                       subject=None, location=None,
                       location_type="state", jee_rank=None,
                       top_n=10):
    """
    Recommend top colleges using hybrid rule-based + ML ranking.

    Parameters
    ----------
    df            : college DataFrame from load_college_dataset()
    scaler        : StandardScaler from train_college_ml_model()
    feature_cols  : list from train_college_ml_model()
    subject       : str -- Maths/Physics/Chemistry/Biology/Computer Science
    location      : str -- city or state name (None = All India)
    location_type : "city" | "state"
    jee_rank      : int -- predicted rank for cutoff filtering (None = ignore)
    top_n         : int -- number of colleges to return

    Returns
    -------
    pd.DataFrame with columns:
        college_name, city, state, type, course, branch,
        nirf_rank, avg_package, jee_cutoff
    """
    filtered = df.copy()
    loc_clean = location.strip().lower() if location else None

    # Step 1: Subject/branch filter
    if subject:
        s = subject.strip().title()
        aliases = {"Math": "Maths", "Mathematics": "Maths",
                   "Bio": "Biology", "Cs": "Computer Science",
                   "Chem": "Chemistry", "Phy": "Physics"}
        s = aliases.get(s, s)
        branches = SUBJECT_BRANCH_MAP.get(s, [])
        if branches:
            tmp = filtered[filtered["branch"].isin(branches)]
            if not tmp.empty:
                filtered = tmp

    # Step 2: Location filter
    if loc_clean:
        col = "city" if location_type == "city" else "state"
        tmp = filtered[filtered[col].str.lower() == loc_clean]
        if not tmp.empty:
            filtered = tmp
        else:
            print(f"\n  [!] No colleges found in {location_type} '{location}'. "
                  "Showing All-India results.\n")

    # Step 3: JEE cutoff filter (keep colleges where our rank beats cutoff)
    if jee_rank is not None:
        tmp = filtered[filtered["jee_cutoff"] >= jee_rank]
        if not tmp.empty:
            filtered = tmp
        else:
            print(f"\n  [!] No colleges match cutoff for rank {jee_rank}. "
                  "Ignoring cutoff filter.\n")

    if filtered.empty:
        filtered = df.copy()

    # Step 4: ML scoring and return
    filtered = filtered.copy()
    filtered["_ml_score"] = _ml_scores(filtered, scaler, feature_cols)

    out_cols = ["college_name", "city", "state", "type",
                "course", "branch", "nirf_rank", "avg_package", "jee_cutoff"]

    result = (
        filtered
        .drop_duplicates(subset=["college_name", "branch"])
        .sort_values("_ml_score", ascending=False)
        .head(top_n)[out_cols]
        .reset_index(drop=True)
    )
    return result


# ─────────────────────────────────────────────────────────
#  CLI RUNNER
# ─────────────────────────────────────────────────────────

def _get_int(prompt, lo, hi):
    while True:
        try:
            v = int(input(prompt))
            if lo <= v <= hi:
                return v
            print(f"  [!] Enter a number between {lo} and {hi}.")
        except ValueError:
            print("  [!] Invalid input.")


def _pick_subject():
    subjects = list(SUBJECT_COURSE_MAP.keys())
    print("\n  Favourite Subjects:")
    for i, s in enumerate(subjects, 1):
        print(f"    {i}. {s}")
    idx = _get_int(f"  Enter number (1-{len(subjects)}): ", 1, len(subjects))
    return subjects[idx - 1]


def _cli_jee(jee_model):
    print("\n--- MODULE 1: JEE RANK PREDICTOR ---")
    phy   = _get_int("  Physics score    (0-100): ", 0, 100)
    chem  = _get_int("  Chemistry score  (0-100): ", 0, 100)
    math  = _get_int("  Maths score      (0-100): ", 0, 100)
    mock  = _get_int("  Mock test score  (0-300): ", 0, 300)
    att   = _get_int("  Attempts (1 or 2)       : ", 1, 2)
    hrs   = _get_int("  Study hours/day (1-18)  : ", 1, 18)
    coach = _get_int("  Coaching? (1=Yes/0=No)  : ", 0, 1)

    rank = predict_rank(jee_model, phy, chem, math, mock, att, hrs, coach)
    print(f"\n  Predicted JEE Rank : {rank}")

    if rank <= 500:        cat = "Elite -- IIT top branches"
    elif rank <= 2500:     cat = "Excellent -- IIT most branches"
    elif rank <= 10000:    cat = "Great -- IIT core / NIT CS top NITs"
    elif rank <= 30000:    cat = "Good -- NIT CS/EE / BITS Pilani"
    elif rank <= 60000:    cat = "Average -- IIIT / Top State Colleges"
    elif rank <= 120000:   cat = "Below Avg -- State Govt Colleges"
    else:                  cat = "Consider private colleges with good placements"

    print(f"  Category           : {cat}\n")
    return rank


def _cli_course():
    print("\n--- MODULE 2: COURSE RECOMMENDER ---")
    subject = _pick_subject()
    courses = recommend_courses(subject, top_n=8)
    print(f"\n  Top courses for '{subject}':")
    for i, (c, d) in enumerate(courses, 1):
        print(f"  {i}. {c}")
        print(f"     -> {d}")
    return subject


def _cli_college(df, scaler, feature_cols, subject=None, jee_rank=None):
    print("\n--- MODULE 3: COLLEGE RECOMMENDER (NIRF 2025) ---")
    if not subject:
        subject = _pick_subject()

    print("\n  Location Filter:")
    print("    1. City  |  2. State  |  3. All India")
    lc = input("  Choice (1/2/3): ").strip()

    location = None
    loc_type = "state"
    if lc == "1":
        location = input("  Enter city : ").strip()
        loc_type  = "city"
    elif lc == "2":
        location = input("  Enter state: ").strip()
        loc_type  = "state"

    top_n  = _get_int("  Top N colleges (1-20): ", 1, 20)
    result = recommend_colleges(df, scaler, feature_cols,
                                subject=subject,
                                location=location,
                                location_type=loc_type,
                                jee_rank=jee_rank,
                                top_n=top_n)

    loc_lbl = f"in {location.title()}" if location else "(All India)"
    print(f"\n  Top {top_n} colleges {loc_lbl} for '{subject}':")
    print(f"  {'#':<4}{'College':<36}{'Branch':<34}{'Type':<8}{'NIRF':<6}{'Pkg LPA':<9}Cutoff")
    print("  " + "-" * 110)
    for i, row in result.iterrows():
        print(f"  {i+1:<4}{row['college_name']:<36}{row['branch']:<34}"
              f"{row['type']:<8}{row['nirf_rank']:<6}{row['avg_package']:<9}{row['jee_cutoff']}")
    return result


def main():
    print("\n" + "=" * 60)
    print("   COLLEGE COMPASS v2.0 -- AI Career Guidance System")
    print("=" * 60)
    print("  NIRF 2025 Data | Random Forest + KNN | Beginner-Friendly")
    print("=" * 60)

    print("\nLoading models...\n")

    if os.path.exists(JEE_MODEL_PATH):
        jee_model = joblib.load(JEE_MODEL_PATH)
        print("  [OK] JEE model loaded from cache")
    else:
        jee_df    = generate_jee_dataset(n=3000)
        jee_model, _ = train_jee_model(jee_df)

    college_df = load_college_dataset(COLLEGE_DATA_PATH)
    _, scaler, feature_cols = train_college_ml_model(college_df)

    print("\n  All systems ready!\n")

    MENU = """
  1. Predict JEE Rank
  2. Course Recommendations
  3. College Recommendations (NIRF)
  4. Full Guidance (JEE -> Courses -> Colleges)
  5. Exit
"""
    while True:
        print(MENU)
        ch = input("  Enter choice (1-5): ").strip()

        if ch == "1":
            _cli_jee(jee_model)
        elif ch == "2":
            _cli_course()
        elif ch == "3":
            _cli_college(college_df, scaler, feature_cols)
        elif ch == "4":
            rank    = _cli_jee(jee_model)
            subject = _cli_course()
            _cli_college(college_df, scaler, feature_cols,
                         subject=subject, jee_rank=rank)
        elif ch == "5":
            print("\n  Best of luck for your future! -- College Compass\n")
            break
        else:
            print("  Invalid choice. Enter 1-5.")


if __name__ == "__main__":
    main()
