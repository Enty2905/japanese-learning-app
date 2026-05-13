# japanese-learning-app

Monorepo scaffold for a Japanese language learning web application.

## Project Structure
- frontend: React.js app (Vite)
- backend: Node.js + Express.js API
- rule-code: Shared development conventions and lint/format rules

## Database Setup
From `backend`, create the PostgreSQL schema and seed demo learning data with:

```bash
npm run db:setup
```

The command reads database connection settings from `backend/.env`.
