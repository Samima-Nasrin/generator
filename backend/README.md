# AI Question Generator & Exam System

A full-stack application that generates AI-powered questions from documents and conducts exams with automatic evaluation.

## Architecture

- **Frontend & Backend**: Next.js 16 with App Router (Full-stack)
- **Database**: Supabase (PostgreSQL)
- **AI Models**: Google Gemini

## Features

### Document Processing
- PDF text extraction (pdf-parse)
- TXT file processing
- Real-time text analysis

### Question Generation
- Multiple choice questions (MCQ)
- Short answer questions (2 marks)
- Medium answer questions (5 marks)
- Long answer questions (10 marks)
- AI-powered using Google Gemini
- Subject-specific question generation
- Customizable difficulty levels

### Exam System
- Interactive exam interface
- Progress tracking
- Multiple answer formats (text, image, audio)
- Auto-save answers
- Submit and evaluate exams
- AI-powered evaluation and feedback

### Authentication
- User signup and login with Supabase Auth
- Protected routes
- Session management

### Database
- Store question sets
- Track exams and answers
- Save evaluation results
- User management

## Setup Instructions

### 1. Environment Variables

Add these in the **Vars section** of the v0 in-chat sidebar:

\`\`\`env
# Gemini API Key (REQUIRED for question generation)
GEMINI_API_KEY=your-gemini-api-key-here

# Auth redirect URL for development (optional)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

**How to get a Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and paste it in the Vars section

**Note:** Supabase credentials are already configured in v0.

### 2. Database Setup

Run the SQL script to create the database schema:

\`\`\`bash
# The script is in scripts/001_create_schema.sql
# Run it from the v0 interface by clicking the "Run" button on the script
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Run the Application

\`\`\`bash
npm run dev
\`\`\`

The application will be available at the v0 preview URL or http://localhost:3000

## Using the Application

1. **Sign Up/Login**: Go to `/auth/signup` or `/auth/login`
2. **Generate Questions**: 
   - Navigate to `/generate`
   - Upload a PDF or TXT document
   - Configure question types and counts
   - Click "Generate Questions"
3. **Take Exam**:
   - Click "Start Exam" after generating questions
   - Answer questions in the exam interface
   - Submit for evaluation
4. **View Results**:
   - See your scores and feedback
   - Review correct/incorrect answers

## API Endpoints

All endpoints are Next.js API routes under `/api`:

### Main Endpoints
- `POST /api/generate-questions` - Generate questions from document
  - Form Data: file, num_mcqs, num_short, num_medium, num_long, subject, difficulty
  - Returns: question_set_id, questions array, total_questions, total_marks

## Troubleshooting

### Questions not generating
1. **Verify GEMINI_API_KEY**: 
   - Go to v0's Vars section in the sidebar
   - Make sure `GEMINI_API_KEY` is set with a valid key
   - Get one from https://aistudio.google.com/app/apikey if needed
2. **Check browser console**: Look for `[v0]` prefixed messages showing the generation progress
3. **Document format**: Ensure your document has extractable text (scanned PDFs won't work)
4. **File size**: Keep documents under 10MB

### Database errors
1. **Run the schema script**: Make sure you've executed `scripts/001_create_schema.sql`
2. **Check Supabase connection**: Verify in v0's Connect section that Supabase is properly connected
3. **Check RLS policies**: The schema includes RLS policies for security

### Authentication issues
1. **Check email confirmation**: Supabase sends a confirmation email on signup
2. **Clear browser data**: Sometimes old sessions cause issues
3. **Verify redirect URL**: Set `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` for local development

### File upload issues
1. **Supported formats**: Only PDF and TXT files are currently supported
2. **File size limit**: Maximum 10MB per file
3. **Text extraction**: The PDF must contain selectable text (not just scanned images)

## Development

### Adding New Question Types
1. Update the `generateQuestions` function in `app/api/generate-questions/route.ts`
2. Add UI controls in `app/generate/page.tsx`
3. Update database schema if needed

### Debugging
- Check browser console for `[v0]` prefixed messages
- All API routes log detailed information
- Use Supabase dashboard to inspect database tables

## Production Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - All Supabase variables (auto-configured if using Vercel integration)
4. Deploy!

## Merged Logic

This app combines functionality from two Streamlit apps:

**App 1 - Book Question Generator:**
- Document text extraction (PDF, DOCX, TXT)
- AI question generation with Gemini/Mistral
- Subject-specific answer evaluation
- Audio text-to-speech conversion
- Multiple question types with configurable marks

**App 2 - PDF Question Generator:**
- PDF to images conversion
- Pattern-based question formatting
- Exam system with progress tracking
- Multimodal answer support (text, image, audio)
- Advanced AI evaluation with detailed feedback

All logic has been merged into a single Next.js full-stack application with proper authentication, database persistence, and a modern UI.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Google Gemini (via @google/generative-ai)
- **PDF Processing**: pdf-parse
- **State Management**: React hooks + localStorage

## License

MIT License
