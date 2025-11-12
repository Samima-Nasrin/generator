# RAG

## Environment

### Commands
```bash
mkdir "directory"
cd "directory"
python -m venv venv
venv\Scripts\activate     # on Windows
source venv/bin/activate  # on macOS/Linux
```

## Repository

### Commands
```bash
git clone https://github.com/Samima-Nasrin/generator.git
cd generator

```

## Backend (cd backend)

### Commands 
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
```
http://127.0.0.1:8000
```

### Environmental Variables (backend/.env)
```
GEMINI_API_KEY=AI_test_...
MISTRAL_API_KEY=Df_test_...
```

## Frontend (cd frontend)

### Commands 
```bash
npm install
npm run dev
```
```
http://localhost:3000
```

### Environmental Variables (frontend/.env.local)
```
NEXT_PUBLIC_BACKEND_URL=test_...
MISTRAL_API_KEY=test_...
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=test_...
NEXT_PUBLIC_SUPABASE_ANON_KEY=test_...
NEXT_PUBLIC_SUPABASE_URL=test_...
POSTGRES_DATABASE=test_...
POSTGRES_HOST=test_...
POSTGRES_PASSWORD=test_...
POSTGRES_PRISMA_URL=test_...
POSTGRES_URL=test_...
POSTGRES_URL_NON_POOLING=test_...
POSTGRES_USER=test_...
SUPABASE_ANON_KEY=test_...
SUPABASE_JWT_SECRET=test_...
SUPABASE_SERVICE_ROLE_KEY=test_...
SUPABASE_URL=test_...
```
