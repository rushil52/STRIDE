# STRIDE — Adaptive AI Running Coach
### Technical BTech Research Project & Sports Analytics Platform

STRIDE is an adaptive, AI-powered personal running coach that analyzes historical and continuous running activity, predicts future race performances (5K, 10K, Half Marathon), and dynamically adapts training microcycles based on acute-to-chronic workload fatigue indicators.

---

## 1. Central Research Question

> **"Can an individually adaptive training system produce more accurate performance predictions and better personalised training recommendations than conventional static running plans?"**

Conventional running apps provide static training schedules that fail to account for biological recovery variations, unforeseen fatigue, or inconsistent training weeks. STRIDE investigates whether continuous physiological modeling (Banister TRIMP, EWMA ACWR, and Bayesian microcycle updating) produces superior athlete pacing and injury-safe overload.

---

## 2. Core Architecture & Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: Python 3.9+, FastAPI, Pydantic v2, JWT Security, Async SQLAlchemy 2.0 with aiosqlite / asyncpg.
- **Machine Learning & Sports Science**:
  - **Banister TRIMP**: Fractional heart rate reserve exponential weighting.
  - **EWMA ACWR (Gabbett)**: 7-day acute fatigue decay ($\lambda=0.25$) vs. 28-day chronic fitness accumulation ($\lambda=0.069$).
  - **Race Predictor**: Gradient-calibrated Jack Daniels VDOT oxygen utilization curves + Pete Riegel power fatigue decay ($T_2 = T_1 \times (D_2/D_1)^{1.06}$) with 90% confidence uncertainty intervals.
  - **Adaptive Optimizer**: Microcycle scheduling with Bayesian updating based on athlete subjective RPE.
- **Integrations**: Strava API v3 OAuth 2.0, GPX XML parsing (`gpxpy`), and FIT binary parsing (`fitparse`).

---

## 3. Quick Start (Run Locally)

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+

### A. Run Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start FastAPI server on port 8000
PYTHONPATH=. uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Swagger documentation is live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### B. Run Frontend
```bash
cd frontend
npm install
npm run dev # or npm run build && npm run start
```
Frontend web application is live at: [http://localhost:3000](http://localhost:3000)

---

## 4. Testing & Verification

Run the automated test suite across the ML engine, sports science models, and auth/analytics REST APIs:
```bash
PYTHONPATH=backend backend/venv/bin/pytest backend/tests
```
All 8 test suites pass (`test_pace_calculation`, `test_banister_trimp`, `test_acwr_classification`, `test_riegel_prediction`, `test_race_predictor_engine`, `test_adaptive_optimizer`, `test_health_check`, `test_auth_and_synthetic_seed`).

---

## 5. Strava OAuth Setup Instructions

To connect your personal Strava athlete account:
1. Go to [https://www.strava.com/settings/api](https://www.strava.com/settings/api) and create an API Application.
2. Set **Authorization Callback Domain** to `localhost:3000`.
3. In `backend/.env`, set:
   ```env
   STRAVA_CLIENT_ID="<your_client_id>"
   STRAVA_CLIENT_SECRET="<your_client_secret>"
   STRAVA_REDIRECT_URI="http://localhost:3000/strava/callback"
   ```
4. Restart the backend. Users can then link Strava via the Dashboard to automatically sync runs.
*(Note: You can also use STRIDE offline immediately without Strava credentials by clicking "Seed 60-Day Synthetic Dataset" or uploading `.gpx` / `.fit` activity files).*

---

## 6. Disclaimer

STRIDE calculates training workload indicators and performance predictions for athletic conditioning. It does **not** provide medical diagnoses or replace licensed clinical evaluation.
