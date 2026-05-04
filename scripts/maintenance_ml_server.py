# -*- coding: utf-8 -*-
"""
خادم استدلال صيانة متوافق مع عَمارتي (MAINTENANCE_ML_API_URL).

مستند إلى الدفتر:
https://colab.research.google.com/drive/1BFWwkmam1MXkW5FBLrQR77OiDleyKLMy
والملف المصدَّر maintenance_predictive_*_project.py (RandomForest + توصيات مكة).

تشغيل:
  pip install -r scripts/requirements-ml.txt
  python scripts/maintenance_ml_server.py

بيئة اختيارية:
  MODEL_PATH — مسار ملف joblib/pkl للنموذج (إن وُجد يُحمَّل ولا يُعاد التدريب)
  PORT — المنفذ (افتراضي 8080)
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd
from flask import Flask, jsonify, request
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_PATH = SCRIPT_DIR / "home_failure_model.pkl"

# ترتيب الأعمدة كما في دفتر Colab
FEATURE_ORDER = [
    "house_age",
    "humidity",
    "rainfall_level",
    "water_pressure",
    "electric_load",
    "soil_movement",
    "maintenance_count",
    "last_maintenance_days",
]

ISSUE_AR = {
    "Water_Leakage": "تسريب مياه / سباكة",
    "Wall_Crack": "تشققات في الجدران",
    "Electrical_Issue": "عطل كهربائي",
    "Drainage_Blockage": "انسداد تصريف",
    "Roof_Leakage": "تسريب سقف",
    "No_Issue": "لا يظهر خطر حاد من المؤشرات التقريبية",
}

# نفس بيانات makkah_services من Colab (CSV مضمَّن)
SERVICES_ROWS = [
    ("Electrical_Issue", "Makkah Electric Services", 4.7, 21.3891, 39.8579),
    ("Electrical_Issue", "Al Haram Electric", 4.6, 21.4000, 39.8600),
    ("Water_Leakage", "Zamzam Plumbing", 4.8, 21.4225, 39.8262),
    ("Water_Leakage", "Al Noor Plumbing", 4.5, 21.4180, 39.8300),
    ("Roof_Leakage", "Haram Roof Repair", 4.6, 21.4300, 39.8350),
    ("Wall_Crack", "Makkah Wall Repair", 4.3, 21.4100, 39.8200),
    ("Drainage_Blockage", "Zamzam Drain Service", 4.4, 21.4230, 39.8250),
    ("Drainage_Blockage", "Al Makkah Drain Fix", 4.2, 21.4150, 39.8220),
]

_model: RandomForestClassifier | None = None

app = Flask(__name__)


def _services_df() -> pd.DataFrame:
    return pd.DataFrame(
        SERVICES_ROWS,
        columns=["service_type", "company", "rating", "latitude", "longitude"],
    )


def recommend_services(issue: str, limit: int = 3) -> pd.DataFrame:
    services = _services_df()
    if issue == "No_Issue":
        return services.sort_values(by="rating", ascending=False).head(limit)
    filtered = services[services["service_type"] == issue]
    if filtered.empty:
        return services.sort_values(by="rating", ascending=False).head(limit)
    return filtered.sort_values(by="rating", ascending=False).head(limit)


def _synthetic_training_frame(n: int = 3000) -> tuple[pd.DataFrame, pd.Series]:
    rng = np.random.default_rng(42)
    data = pd.DataFrame(
        {
            "house_age": rng.integers(1, 40, n),
            "humidity": rng.integers(30, 90, n),
            "rainfall_level": rng.integers(0, 50, n),
            "water_pressure": rng.integers(30, 80, n),
            "electric_load": rng.integers(1000, 5000, n),
            "soil_movement": rng.integers(0, 5, n),
            "maintenance_count": rng.integers(0, 10, n),
            "last_maintenance_days": rng.integers(10, 500, n),
        }
    )
    conditions = [
        (data["water_pressure"] > 70),
        (data["humidity"] > 80),
        (data["electric_load"] > 4200),
        (data["maintenance_count"] < 2),
        (data["rainfall_level"] > 35),
    ]
    choices = [
        "Water_Leakage",
        "Wall_Crack",
        "Electrical_Issue",
        "Drainage_Blockage",
        "Roof_Leakage",
    ]
    y = np.select(conditions, choices, default="No_Issue")
    return data, pd.Series(y)


def load_or_train_model() -> RandomForestClassifier:
    global _model
    if _model is not None:
        return _model

    path = os.environ.get("MODEL_PATH", str(DEFAULT_MODEL_PATH))
    p = Path(path)
    if p.is_file():
        _model = joblib.load(p)
        return _model

    X, y = _synthetic_training_frame(3000)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    clf.fit(X_train, y_train)
    _model = clf
    try:
        joblib.dump(clf, DEFAULT_MODEL_PATH)
    except OSError:
        pass
    return clf


def text_to_feature_row(description: str, city: str) -> np.ndarray:
    """
    النموذج يتوقع أرقاماً؛ نشتق قيماً تقريبية من وصف الطلب (عربي/إنجليزي) والمدينة.
    يمكن لاحقاً استبدال ذلك بمؤشرات حقيقية من المبنى.
    """
    d = (description or "").lower()
    c = (city or "").lower()

    base = {
        "house_age": 25.0,
        "humidity": 55.0,
        "rainfall_level": 15.0,
        "water_pressure": 55.0,
        "electric_load": 2500.0,
        "soil_movement": 2.0,
        "maintenance_count": 3.0,
        "last_maintenance_days": 180.0,
    }

    water_kw = (
        "ماء",
        "تسريب",
        "سباكة",
        "رطوبة",
        "بلل",
        "water",
        "leak",
        "plumb",
        "humid",
    )
    elec_kw = ("كهرب", "كهرباء", "electric", "fuse", "مصعد", "elevator", "إنارة", "lift")
    roof_kw = ("سقف", "roof", "مطر", "أمطار", "rain")
    crack_kw = ("شق", "تشقق", "جدار", "crack", "wall")
    drain_kw = ("صرف", "انسداد", "drain", "block", "بالوعة")

    if any(k in d for k in water_kw):
        base["humidity"] += 18
        base["water_pressure"] += 12
        base["rainfall_level"] += 5

    if any(k in d for k in elec_kw):
        base["electric_load"] += 1200

    if any(k in d for k in roof_kw):
        base["rainfall_level"] += 15
        base["humidity"] += 8

    if any(k in d for k in crack_kw):
        base["soil_movement"] = min(4.0, base["soil_movement"] + 1.5)

    if any(k in d for k in drain_kw):
        base["maintenance_count"] = max(0.0, base["maintenance_count"] - 1)
        base["rainfall_level"] += 8

    if "مكة" in description or "makkah" in c or "mecca" in c:
        base["house_age"] += 3

    # حدود معقولة
    base["humidity"] = float(np.clip(base["humidity"], 30, 95))
    base["water_pressure"] = float(np.clip(base["water_pressure"], 30, 85))
    base["electric_load"] = float(np.clip(base["electric_load"], 1000, 5500))
    base["rainfall_level"] = float(np.clip(base["rainfall_level"], 0, 49))
    base["soil_movement"] = float(np.clip(base["soil_movement"], 0, 4))
    base["maintenance_count"] = float(np.clip(base["maintenance_count"], 0, 9))
    base["last_maintenance_days"] = float(np.clip(base["last_maintenance_days"], 10, 499))
    base["house_age"] = float(np.clip(base["house_age"], 1, 39))

    row = [base[k] for k in FEATURE_ORDER]
    return np.array([row], dtype=np.float64)


@app.post("/predict")
def predict():
    data = request.get_json(silent=True) or {}
    description = str(data.get("description", "")).strip()
    city = str(data.get("city", "")).strip()

    model = load_or_train_model()
    X = text_to_feature_row(description, city)
    issue = str(model.predict(X)[0])
    issue_ar = ISSUE_AR.get(issue, issue)

    recs = recommend_services(issue)
    lines = [
        f"{r.company} — تقييم {r.rating:.1f} (مكة المكرمة تقريباً)"
        for r in recs.itertuples(index=False)
    ]
    suggestions = "\n".join(lines) if lines else "لا توجد توصية مطابقة في القائمة المحلية."

    summary = (
        f"نتيجة النموذج التنبؤي (RandomForest كما في مشروع Colab): {issue_ar}.\n"
        f"المؤشرات مُستنتجة تقريبياً من نص البلاغ والمدينة ({city or 'غير محدد'}). "
        "للدقة الأعلى صِل مؤشرات حقيقية من المبنى لاحقاً."
    )
    tags = [issue_ar, issue]
    if city:
        tags.append(city[:40])

    return jsonify(
        {
            "summary": summary,
            "suggestions": suggestions,
            "tags": tags,
            "meta": {
                "predicted_class": issue,
                "features": {k: float(X[0][i]) for i, k in enumerate(FEATURE_ORDER)},
            },
        }
    )


@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "maintenance_ml_colab_bridge"})


if __name__ == "__main__":
    load_or_train_model()
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port, debug=False)
