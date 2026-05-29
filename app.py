"""
============================================================
  COLLEGE COMPASS — Flask Backend API
  
  FIXED in this version:
    * /iit-names, /iit-programs, /iit-cutoff-lookup routes
      are now registered BEFORE app.run() — this was the root
      cause of "Server error. Make sure the backend is running."
    * MongoDB failure is graceful — app starts even if MongoDB
      is down (only auth features need it).
    * Added python-dotenv auto-loading.
    * Cleaner _inst_keyword() helper reused across all IIT routes.
    * CORS headers explicitly cover all required methods/origins.
============================================================
"""

import os
import re
import warnings
import joblib

warnings.filterwarnings("ignore")

# ── Auto-load .env if python-dotenv is available ──────────
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(_env_path):
        load_dotenv(_env_path)
        print("[STARTUP] Loaded .env file")
except ImportError:
    pass

import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

from auth_routes import auth_bp

from college_compass import (
    recommend_courses,
    load_college_dataset,
    train_college_ml_model,
    recommend_colleges,
    SUBJECT_COURSE_MAP,
    COLLEGE_DATA_PATH,
)
from iit_predictor import load_iit_model, predict_iit_cutoffs

# ── Flask app ─────────────────────────────────────────────
app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "allow_headers": ["Content-Type", "Authorization"],
    "expose_headers": ["Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}})

app.register_blueprint(auth_bp)

# ── Load ML models ────────────────────────────────────────
print("\n[STARTUP] Loading models...")
college_df = load_college_dataset(COLLEGE_DATA_PATH)
_, scaler, feature_cols = train_college_ml_model(college_df)
iit_model, iit_encoders, iit_data = load_iit_model()
print("[STARTUP] All models ready!\n")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ── MongoDB index setup (non-fatal) ───────────────────────
def setup_db_indexes():
    try:
        from pymongo import MongoClient, ASCENDING, DESCENDING
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
        db_name   = os.environ.get("DB_NAME", "college_compass")
        client    = MongoClient(mongo_uri, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")
        db = client[db_name]
        db.results.create_index([("studentId", ASCENDING), ("submittedAt", DESCENDING)])
        db.results.create_index([("studentId", ASCENDING), ("quizDate",    ASCENDING)])
        db.users.create_index([("email", ASCENDING)], unique=True, sparse=True)
        print("[STARTUP] MongoDB indexes ensured.\n")
    except Exception as e:
        print(f"[STARTUP] MongoDB unavailable (auth needs it): {e}\n"
              "          Set MONGO_URI in backend/.env to connect.\n")

setup_db_indexes()


# ─────────────────────────────────────────────────────────
#  CONSTANTS
# ─────────────────────────────────────────────────────────
CATEGORY_TO_SEAT_TYPE = {
    "General":     "OPEN",
    "OBC-NCL":     "OBC-NCL",
    "SC":          "SC",
    "ST":          "ST",
    "EWS":         "EWS",
    "OBC-NCL-PwD": "OBC-NCL (PwD)",
    "SC-PwD":      "SC (PwD)",
    "ST-PwD":      "ST (PwD)",
    "OPEN-PwD":    "OPEN (PwD)",
}
CATEGORIES = list(CATEGORY_TO_SEAT_TYPE.keys())


# ─────────────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────────────
def _inst_keyword(institute: str) -> str:
    """Extract a short keyword to match IIT names in the CSV.
    Handles: 'IIT Roorkee', 'Indian Institute of Technology Roorkee', etc.
    """
    s = institute.strip()
    sl = s.lower()
    if sl.startswith("indian institute of technology"):
        return s[len("Indian Institute of Technology"):].strip()
    if sl.startswith("iit "):
        return s[4:].strip()
    if sl.startswith("iit"):
        return s[3:].strip()
    return s


def score_to_rank_estimate(score):
    if   score >= 300: return 50
    elif score >= 280: return 200
    elif score >= 260: return 700
    elif score >= 240: return 2000
    elif score >= 220: return 5000
    elif score >= 200: return 10000
    elif score >= 180: return 18000
    elif score >= 160: return 30000
    elif score >= 140: return 50000
    elif score >= 120: return 80000
    elif score >= 100: return 120000
    elif score >= 80:  return 170000
    else:              return 250000


CATEGORY_RANK_RATIO = {
    "General": 1.00, "OBC-NCL": 0.27, "SC": 0.15, "ST": 0.075,
    "EWS": 0.10, "OBC-NCL-PwD": 0.005, "SC-PwD": 0.005,
    "ST-PwD": 0.003, "OPEN-PwD": 0.01,
}


def crl_to_category_rank(crl_rank, category):
    return max(1, int(crl_rank * CATEGORY_RANK_RATIO.get(category, 1.0)))


def rank_category_label(rank):
    if   rank <= 500:    return "Elite 🏆",        "#7c3aed", "Top 500 rankers — IIT Bombay / Delhi / Madras CS/EE are within reach."
    elif rank <= 2500:   return "Excellent 🌟",     "#1d4ed8", "Top 2,500 — CS/EE at most premier IITs comfortably in range."
    elif rank <= 10000:  return "Great 👍",          "#0891b2", "Top 10K — IIT core branches + NIT CS at top NITs."
    elif rank <= 30000:  return "Good ✅",           "#15803d", "Top 30K — NIT CS/EE at good NITs / BITS Pilani branches."
    elif rank <= 60000:  return "Average 📘",        "#b45309", "Top 60K — NIT core branches / IIIT / top state colleges."
    elif rank <= 120000: return "Below Average 📉", "#c2410c", "State Government Engineering Colleges / private options."
    else:                return "Keep Trying 💪",   "#9f1239", "Focus on strong private colleges with good placement records."


# ─────────────────────────────────────────────────────────
#  GET /health
# ─────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    mongo_ok = False
    try:
        from pymongo import MongoClient
        client = MongoClient(
            os.environ.get("MONGO_URI", "mongodb://localhost:27017/"),
            serverSelectionTimeoutMS=2000,
        )
        client.admin.command("ping")
        mongo_ok = True
    except Exception:
        pass
    return jsonify({
        "status": "ok",
        "models": {
            "college_recommender": True,
            "iit_cutoff_model": iit_model is not None,
        },
        "mongodb": mongo_ok,
        "dataset_records": len(college_df),
    })


# ─────────────────────────────────────────────────────────
#  GET /categories
# ─────────────────────────────────────────────────────────
@app.route("/categories", methods=["GET"])
def get_categories():
    return jsonify({"categories": CATEGORIES})


# ─────────────────────────────────────────────────────────
#  GET /iit-names
# ─────────────────────────────────────────────────────────
@app.route("/iit-names", methods=["GET"])
def get_iit_names():
    try:
        for yr in [2022, 2021, 2020]:
            fpath = os.path.join(BASE_DIR, f"{yr}.csv")
            if os.path.exists(fpath):
                df   = pd.read_csv(fpath, usecols=["Institute"])
                iits = sorted(
                    df[df["Institute"].str.contains(
                        "Indian Institute of Technology", na=False
                    )]["Institute"].unique().tolist()
                )
                if iits:
                    return jsonify({"iit_names": iits})
        return jsonify({"iit_names": []})
    except Exception as e:
        return jsonify({"iit_names": [], "error": str(e)})


# ─────────────────────────────────────────────────────────
#  GET /iit-programs?institute=<name>
# ─────────────────────────────────────────────────────────
@app.route("/iit-programs", methods=["GET"])
def get_iit_programs():
    try:
        institute = (request.args.get("institute") or "").strip()
        if not institute:
            return jsonify({"programs": []})

        keyword = _inst_keyword(institute)

        for yr in [2022, 2021, 2020]:
            fpath = os.path.join(BASE_DIR, f"{yr}.csv")
            if not os.path.exists(fpath):
                continue
            df   = pd.read_csv(fpath, usecols=["Institute", "Academic Program Name"])
            mask = df["Institute"].str.lower().str.contains(keyword.lower(), na=False)
            progs = sorted(df[mask]["Academic Program Name"].unique().tolist())
            if progs:
                return jsonify({"programs": progs})

        return jsonify({"programs": []})
    except Exception as e:
        return jsonify({"programs": [], "error": str(e)})


# ─────────────────────────────────────────────────────────
#  POST /iit-cutoff-lookup
# ─────────────────────────────────────────────────────────
@app.route("/iit-cutoff-lookup", methods=["POST"])
def iit_cutoff_lookup():
    try:
        body      = request.get_json(force=True)
        institute = (body.get("institute") or "").strip()
        stream    = (body.get("stream")    or "").strip()
        category  = (body.get("category") or "General").strip()

        if not institute or not stream:
            return jsonify({
                "success": False,
                "error": "Please provide both IIT name and stream."
            }), 400

        seat_type      = CATEGORY_TO_SEAT_TYPE.get(category, "OPEN")
        inst_keyword   = _inst_keyword(institute)
        stream_pattern = re.escape(stream)

        def load_rows(strict_seat=True):
            rows = []
            for year in [2016, 2017, 2018, 2019, 2020, 2021, 2022]:
                fpath = os.path.join(BASE_DIR, f"{year}.csv")
                if not os.path.exists(fpath):
                    continue
                df = pd.read_csv(fpath)
                if "Round" in df.columns:
                    df = df[df["Round"] == df["Round"].max()]
                mask = (
                    df["Institute"].str.lower().str.contains(inst_keyword.lower(), na=False)
                    & df["Academic Program Name"].str.lower().str.contains(
                        stream_pattern.lower(), na=False, regex=True
                    )
                    & (df["Gender"] == "Gender-Neutral")
                )
                if strict_seat:
                    mask &= df["Seat Type"].str.upper() == seat_type.upper()
                for _, row in df[mask].iterrows():
                    try:
                        op = int(float(str(row["Opening Rank"]).replace(",", "")))
                        cl = int(float(str(row["Closing Rank"]).replace(",", "")))
                        if op > 0 and cl > 0:
                            rows.append({
                                "year":         year,
                                "institute":    row["Institute"],
                                "program":      row["Academic Program Name"],
                                "seat_type":    row["Seat Type"],
                                "opening_rank": op,
                                "closing_rank": cl,
                            })
                    except Exception:
                        continue
            return rows

        rows = load_rows(strict_seat=True)
        if not rows:
            rows = load_rows(strict_seat=False)
        if not rows:
            return jsonify({
                "success": False,
                "error": (
                    f"No historical data found for '{institute}' + '{stream}'. "
                    "Try a broader keyword (e.g. 'Computer' instead of full program name)."
                ),
            }), 404

        result_df = pd.DataFrame(rows)
        programs  = result_df["program"].unique().tolist()
        output    = []

        for prog in programs:
            prog_df = result_df[result_df["program"] == prog]
            yearly  = []
            for yr in sorted(prog_df["year"].unique()):
                yr_df = prog_df[prog_df["year"] == yr]
                exact = yr_df[yr_df["seat_type"].str.upper() == seat_type.upper()]
                row   = exact.iloc[0] if not exact.empty else yr_df.iloc[0]
                yearly.append({
                    "year":         int(row["year"]),
                    "opening_rank": int(row["opening_rank"]),
                    "closing_rank": int(row["closing_rank"]),
                    "seat_type":    row["seat_type"],
                })

            predicted_2025 = None
            if iit_model and iit_encoders:
                try:
                    inst_classes = iit_encoders["Institute"].classes_
                    prog_classes = iit_encoders["Academic Program Name"].classes_
                    match_inst   = [c for c in inst_classes if inst_keyword.lower() in c.lower()]
                    match_prog   = [c for c in prog_classes if prog.lower() == c.lower()]
                    if match_inst and match_prog:
                        inst_enc = iit_encoders["Institute"].transform([match_inst[0]])[0]
                        prog_enc = iit_encoders["Academic Program Name"].transform([match_prog[0]])[0]
                        try:
                            seat_enc = iit_encoders["Seat Type"].transform([seat_type])[0]
                        except Exception:
                            seat_enc = iit_encoders["Seat Type"].transform(["OPEN"])[0]
                        gender_enc = iit_encoders["Gender"].transform(["Gender-Neutral"])[0]
                        sample = pd.DataFrame(
                            [[2025, inst_enc, prog_enc, seat_enc, gender_enc]],
                            columns=["Year", "Institute", "Academic Program Name", "Seat Type", "Gender"],
                        )
                        predicted_2025 = int(iit_model.predict(sample)[0])
                except Exception:
                    predicted_2025 = None

            trend = "stable"
            if len(yearly) >= 2:
                delta = yearly[-1]["closing_rank"] - yearly[0]["closing_rank"]
                if   delta >  200: trend = "increasing"
                elif delta < -200: trend = "decreasing"

            output.append({
                "program":        prog,
                "category":       category,
                "seat_type":      seat_type,
                "yearly_data":    yearly,
                "predicted_2025": predicted_2025,
                "trend":          trend,
            })

        output.sort(
            key=lambda p: p["yearly_data"][-1]["closing_rank"] if p["yearly_data"] else 999999
        )

        return jsonify({
            "success":   True,
            "institute": institute,
            "stream":    stream,
            "category":  category,
            "results":   output,
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ─────────────────────────────────────────────────────────
#  POST /iit-recommendation
# ─────────────────────────────────────────────────────────
@app.route("/iit-recommendation", methods=["POST"])
def iit_recommendation():
    try:
        body     = request.get_json(force=True)
        rank     = body.get("rank")
        score    = body.get("score")
        stream   = body.get("stream", "Computer Science").strip()
        category = body.get("category", "General").strip()

        seat_type     = CATEGORY_TO_SEAT_TYPE.get(category, "OPEN")
        score_display = None
        rank_provided  = rank  is not None and str(rank).strip()  != ""
        score_provided = score is not None and str(score).strip() != ""

        if rank_provided:
            rank = int(rank)
        elif score_provided:
            score_val = int(score)
            if not (0 <= score_val <= 360):
                return jsonify({"success": False, "error": "JEE score must be between 0 and 360."}), 400
            rank          = score_to_rank_estimate(score_val)
            score_display = score_val
        else:
            return jsonify({"success": False, "error": "Please enter your JEE rank or JEE score."}), 400

        if rank <= 0:
            return jsonify({"success": False, "error": "Please enter a valid positive JEE rank."}), 400

        cat_label, cat_color, cat_detail = rank_category_label(rank)
        category_info = {"label": cat_label, "color": cat_color, "detail": cat_detail}
        category_rank = crl_to_category_rank(rank, category)

        all_predictions = predict_iit_cutoffs(
            iit_model, iit_encoders, iit_data,
            branch_keyword=stream,
            seat_type=seat_type,
            gender="Gender-Neutral",
            top_n=500,
        )

        if not all_predictions:
            return jsonify({
                "success": True, "rank": rank, "score": score_display,
                "stream": stream, "category": category, "category_info": category_info,
                "iits": [],
                "message": f"No IIT programs found matching '{stream}'. Try a different keyword.",
            })

        eligible = sorted(
            [p for p in all_predictions if p["predicted_closing_rank"] >= category_rank],
            key=lambda x: x["predicted_closing_rank"], reverse=True,
        )
        top5 = eligible[:5]

        if not top5:
            closest = sorted(
                all_predictions,
                key=lambda x: abs(x["predicted_closing_rank"] - category_rank),
            )[:5]
            return jsonify({
                "success": True, "rank": rank, "score": score_display,
                "category_rank": category_rank,
                "stream": stream, "category": category, "category_info": category_info,
                "iits": [{
                    "institute": p["institute"], "program": p["program"],
                    "predicted_closing_rank": p["predicted_closing_rank"],
                    "chance": "Difficult",
                    "rank_margin": category_rank - p["predicted_closing_rank"],
                } for p in closest],
                "message": (
                    f"Your category rank (~{category_rank:,}) is above predicted IIT {stream} "
                    f"cutoffs for {category}. Showing closest options — consider improving rank."
                ),
            })

        result = []
        for p in top5:
            cutoff = p["predicted_closing_rank"]
            buffer = cutoff - category_rank
            pct    = buffer / category_rank if category_rank > 0 else 0
            chance = "High" if pct >= 0.15 else "Good" if pct >= 0.05 else "Moderate" if pct >= 0.01 else "Low"
            result.append({
                "institute": p["institute"], "program": p["program"],
                "predicted_closing_rank": cutoff,
                "chance": chance, "rank_margin": buffer,
            })

        return jsonify({
            "success": True, "rank": rank, "score": score_display,
            "category_rank": category_rank,
            "stream": stream, "category": category, "category_info": category_info,
            "iits": result,
            "message": (
                f"Found {len(result)} IIT(s) where you are eligible based on "
                f"predicted 2025 cutoffs ({category} category, est. category rank ~{category_rank:,})."
            ),
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ─────────────────────────────────────────────────────────
#  POST /college-recommendation
# ─────────────────────────────────────────────────────────
@app.route("/college-recommendation", methods=["POST"])
def college_recommendation():
    try:
        body          = request.get_json(force=True)
        subjects      = body.get("subjects", [])
        location      = body.get("location") or None
        location_type = body.get("location_type", "state")
        top_n         = int(body.get("top_n", 10))

        if not subjects:
            return jsonify({"success": False, "error": "Please select at least one subject."}), 400

        all_courses = {}
        for subj in subjects:
            for name, desc in recommend_courses(subj, top_n=8):
                if name not in all_courses:
                    all_courses[name] = {"name": name, "description": desc, "subjects": []}
                all_courses[name]["subjects"].append(subj)

        govt_colleges, private_colleges = {}, {}

        for subj in subjects:
            res = recommend_colleges(
                college_df, scaler, feature_cols,
                subject=subj, location=location,
                location_type=location_type, jee_rank=None,
                top_n=top_n * 2,
            )
            if res.empty:
                continue
            for _, row in res.iterrows():
                key = f"{row['college_name']}_{row['branch']}"
                d   = {
                    "college_name": row["college_name"], "city": row["city"],
                    "state": row["state"], "type": row["type"],
                    "course": row["course"], "branch": row["branch"],
                    "nirf_rank": int(row["nirf_rank"]),
                    "avg_package": float(row["avg_package"]),
                    "jee_cutoff": int(row["jee_cutoff"]),
                }
                if row["type"].strip().lower() == "govt":
                    if key not in govt_colleges: govt_colleges[key] = d
                else:
                    if key not in private_colleges: private_colleges[key] = d

        return jsonify({
            "success":  True, "subjects": subjects,
            "location": location or "All India",
            "courses":  list(all_courses.values()),
            "govt":     sorted(govt_colleges.values(),    key=lambda x: x["nirf_rank"])[:top_n],
            "private":  sorted(private_colleges.values(), key=lambda x: x["nirf_rank"])[:top_n],
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


# ─────────────────────────────────────────────────────────
#  GET /subjects
# ─────────────────────────────────────────────────────────
@app.route("/subjects", methods=["GET"])
def get_subjects():
    return jsonify({"subjects": list(SUBJECT_COURSE_MAP.keys())})


# ─────────────────────────────────────────────────────────
#  GET /locations
# ─────────────────────────────────────────────────────────
@app.route("/locations", methods=["GET"])
def get_locations():
    return jsonify({
        "states": sorted(college_df["state"].dropna().unique().tolist()),
        "cities": sorted(college_df["city"].dropna().unique().tolist()),
    })


# ─────────────────────────────────────────────────────────
#  GET /streams
# ─────────────────────────────────────────────────────────
@app.route("/streams", methods=["GET"])
def get_streams():
    return jsonify({"streams": [
        "Computer Science", "Electrical Engineering", "Mechanical Engineering",
        "Civil Engineering", "Chemical Engineering", "Electronics",
        "Aerospace", "Data Science", "Biotechnology", "Mathematics",
        "Physics", "Engineering Physics", "Instrumentation",
        "Metallurgy", "Mining",
    ]})


# ─────────────────────────────────────────────────────────
#  Entry point
# ─────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(debug=True, port=port, host="0.0.0.0")
