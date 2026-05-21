# japanese-learning-app

Monorepo scaffold for a Japanese language learning web application.

## Project Structure
- frontend: React.js app (Vite)
- backend: Node.js + Express.js API
- ai: FastAPI Japanese handwriting recognition service
- rule-code: Shared development conventions and lint/format rules

## Handwriting AI Service
From `ai`, run the local inference API on port `8001`:

```powershell
$env:PYTHONPATH="src"
$env:JAPANESE_HANDWRITING_MODEL_PATH="models/japanese_handwriting_kana_kanji_n3_v1.pt"
py -3.13 -m uvicorn japanese_handwriting_ai.api:app --host 127.0.0.1 --port 8001
```

The backend proxies handwriting requests through `HANDWRITING_AI_BASE_URL`, defaulting to `http://127.0.0.1:8001`.

## Database Setup
From `backend`, create the PostgreSQL schema and seed demo learning data with:

```bash
npm run db:setup
```

The command reads database connection settings from `backend/.env`.
