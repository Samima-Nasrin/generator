# RAG

## 1. Environment

### Commands
```bash
mkdir "directory"
cd "directory"
python -m venv venv
venv\Scripts\activate     # on Windows
source venv/bin/activate  # on macOS/Linux
```

## 2. Repository

### Commands
```bash
git clone https://github.com/Samima-Nasrin/generator.git
cd generator

```

## 3. Backend (cd backend)

### Environmental Variables (backend/.env)
```
GEMINI_API_KEY=AI_test_...
MISTRAL_API_KEY=Df_test_...
```

### Commands 
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
Backend running on
```
http://127.0.0.1:8000
```

## 4. Frontend (cd frontend)

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

### Commands 
```bash
npm install
npm run dev
```
Next.js 16.0.0 (Turbopack) - Local: (Main browser app)
```
http://localhost:3000
```

## 5. Required Accounts & APIs

[supabase.com](https://supabase.com/)  
[mistral.ai](https://mistral.ai/)  
[aistudio.google.com](https://aistudio.google.com/)  
[v0.app](https://v0.app/)

