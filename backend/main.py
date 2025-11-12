from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
import io
import json
import tempfile
import os
from datetime import datetime
import base64
load_dotenv()

# Try importing document processing libraries
try:
    import PyPDF2
    PYPDF2_AVAILABLE = True
except ImportError:
    PYPDF2_AVAILABLE = False

try:
    from docx import Document
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import fitz  # PyMuPDF
    FITZ_AVAILABLE = True
except ImportError:
    FITZ_AVAILABLE = False

try:
    from gtts import gTTS
    import speech_recognition as sr
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False

try:
    from fpdf import FPDF
    PDF_EXPORT_AVAILABLE = True
except ImportError:
    PDF_EXPORT_AVAILABLE = False

# Initialize FastAPI
app = FastAPI(
    title="AI Question Generator & Exam System API",
    description="Comprehensive API for generating questions and conducting exams",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_BASE_URL = "https://api.mistral.ai/v1"

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Supabase client for database operations
import os
from supabase import create_client, Client

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic Models
class Question(BaseModel):
    id: int
    text: str
    type: str
    marks: int
    options: Optional[Dict[str, str]] = None
    correct_answer: Optional[str] = None
    hint: Optional[str] = None
    sample_answer: Optional[str] = None

class QuestionGenerationRequest(BaseModel):
    mcq_count: int = 5
    short_count: int = 3
    medium_count: int = 2
    long_count: int = 1
    case_study_count: int = 0
    difficulty_level: str = "Medium (Graduate Level)"
    language: str = "English"
    include_answers: bool = False
    include_marks: bool = True
    model_choice: str = "Gemini"
    subject: Optional[str] = "General Knowledge"
    question_style: str = "Academic/Formal Style"
    exam_type: str = "Regular Assessment"
    time_limit: str = "1.5 hours"
    custom_instructions: Optional[str] = None

class Answer(BaseModel):
    question_id: int
    answer: str

class ExamSubmission(BaseModel):
    answers: List[Answer]
    username: Optional[str] = None

class EvaluationResponse(BaseModel):
    score: float
    max_score: float
    feedback: str
    suggestions: Optional[str] = None
    correct: bool

# Utility Functions
class DocumentProcessor:
    """Handles document processing for various file types"""
    
    @staticmethod
    def extract_text_from_pdf(file_content: bytes) -> str:
        """Extract text from PDF using PyMuPDF first, fallback to PyPDF2"""
        text = ""
        
        # Try PyMuPDF first
        if FITZ_AVAILABLE:
            try:
                pdf_stream = io.BytesIO(file_content)
                with fitz.open(stream=pdf_stream, filetype="pdf") as pdf:
                    for page in pdf:
                        page_text = page.get_text("text")
                        if page_text:
                            text += page_text + "\n"
            except Exception as e:
                print(f"[PyMuPDF] Error extracting text: {e}")
        
        # Fallback to PyPDF2 if no text extracted
        if not text.strip() and PYPDF2_AVAILABLE:
            try:
                reader = PyPDF2.PdfReader(io.BytesIO(file_content))
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            except Exception as e:
                print(f"[PyPDF2] Error extracting text: {e}")
        
        return text.strip()

    
    @staticmethod
    def extract_text_from_docx(file_content: bytes) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            if DOCX_AVAILABLE:
                doc = Document(io.BytesIO(file_content))
                for paragraph in doc.paragraphs:
                    text += paragraph.text + "\n"
        except Exception as e:
            print(f"Error extracting DOCX text: {str(e)}")
        return text.strip()
    
    @staticmethod
    def extract_text_from_txt(file_content: bytes) -> str:
        """Extract text from TXT file"""
        try:
            return file_content.decode('utf-8')
        except UnicodeDecodeError:
            try:
                return file_content.decode('latin-1')
            except Exception as e:
                print(f"Error reading text file: {str(e)}")
                return ""
    
    @staticmethod
    def pdf_to_images(file_content: bytes) -> List[Any]:
        """Convert PDF to images using PyMuPDF"""
        images = []
        if not FITZ_AVAILABLE or not PIL_AVAILABLE:
            return images
        
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(file_content)
                tmp_path = tmp_file.name
            
            doc = fitz.open(tmp_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                images.append(img)
            
            doc.close()
            os.unlink(tmp_path)
        except Exception as e:
            print(f"Error converting PDF to images: {str(e)}")
        
        return images

class AIModelAPI:
    """Handles AI model interactions"""
    
    @staticmethod
    def generate_questions(text: str, question_type: str, num_questions: int = 5, 
                          model_choice: str = "Gemini") -> List[Question]:
        """Generate questions using AI"""
        if question_type == "mcq":
            prompt = f"""
            Generate {num_questions} multiple choice questions based on the following text.
            
            Text: {text[:2000]}...
            
            Return ONLY a JSON array with this exact format:
            [
                {{
                    "question": "Question text here?",
                    "options": {{
                        "A": "Option A",
                        "B": "Option B", 
                        "C": "Option C",
                        "D": "Option D"
                    }},
                    "correct_answer": "A",
                    "hint": "Brief hint"
                }}
            ]
            """
        else:
            marks = int(question_type.split('_')[0])
            prompt = f"""
            Generate {num_questions} subjective questions worth {marks} marks each based on the following text.
            
            Text: {text[:2000]}...
            
            Return ONLY a JSON array with this exact format:
            [
                {{
                    "question": "Question text here?",
                    "hint": "Brief hint for answering"
                }}
            ]
            """

        try:
            if model_choice == "Gemini" and GEMINI_API_KEY:
                model = genai.GenerativeModel('gemini-2.5-flash')
                response = model.generate_content(prompt)
                content = response.text
            elif MISTRAL_API_KEY:
                import requests
                response = requests.post(
                    f"{MISTRAL_BASE_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {MISTRAL_API_KEY}"},
                    json={
                        "model": "mistral-small",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 1000,
                        "temperature": 0.7
                    }
                )
                if response.status_code == 200:
                    content = response.json()["choices"][0]["message"]["content"]
                else:
                    return []
            else:
                return []

            # Extract JSON from response
            start_idx = content.find('[')
            end_idx = content.rfind(']') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = content[start_idx:end_idx]
                questions_data = json.loads(json_str)
                questions = []
                for i, q_data in enumerate(questions_data):
                    marks = 1 if question_type == "mcq" else int(question_type.split('_')[0])
                    question = Question(
                        id=i + 1,
                        text=q_data["question"],
                        type=question_type,
                        marks=marks,
                        options=q_data.get("options"),
                        correct_answer=q_data.get("correct_answer"),
                        hint=q_data.get("hint")
                    )
                    questions.append(question)
                return questions
        except Exception as e:
            print(f"Error generating questions: {str(e)}")
        return []

    @staticmethod
    def evaluate_answer(question: Question, user_answer: str, 
                       model_choice: str = "Gemini", subject: str = "General Knowledge") -> Dict:
        """Evaluate user's answer using AI"""
        if question.type == "mcq":
            correct = user_answer == question.correct_answer
            score = question.marks if correct else 0
            feedback = "Correct!" if correct else f"Incorrect. The correct answer is {question.correct_answer}."
            return {
                "score": score,
                "max_score": question.marks,
                "feedback": feedback,
                "correct": correct
            }
        else:
            prompt = f"""
            Evaluate this answer for the given question. Subject: {subject}.
            Give a score out of {question.marks} marks.
            Question: {question.text}
            Answer: {user_answer}
            Provide evaluation in JSON format:
            {{
                "score": <number>,
                "feedback": "<detailed feedback>",
                "suggestions": "<suggestions for improvement>"
            }}
            """
            try:
                if model_choice == "Gemini" and GEMINI_API_KEY:
                    model = genai.GenerativeModel('gemini-2.5-flash')
                    response = model.generate_content(prompt)
                    content = response.text
                elif MISTRAL_API_KEY:
                    import requests
                    response = requests.post(
                        f"{MISTRAL_BASE_URL}/chat/completions",
                        headers={"Authorization": f"Bearer {MISTRAL_API_KEY}"},
                        json={
                            "model": "mistral-small",
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": 300,
                            "temperature": 0.3
                        }
                    )
                    if response.status_code == 200:
                        content = response.json()["choices"][0]["message"]["content"]
                    else:
                        return {
                            "score": 0,
                            "max_score": question.marks,
                            "feedback": "API error.",
                            "correct": False
                        }
                else:
                    return {
                        "score": question.marks // 2,
                        "max_score": question.marks,
                        "feedback": "Answer submitted successfully.",
                        "correct": False
                    }
                
                start_idx = content.find('{')
                end_idx = content.rfind('}') + 1
                if start_idx != -1 and end_idx != -1:
                    json_str = content[start_idx:end_idx]
                    eval_data = json.loads(json_str)
                    return {
                        "score": eval_data.get("score", 0),
                        "max_score": question.marks,
                        "feedback": eval_data.get("feedback", "No feedback available"),
                        "suggestions": eval_data.get("suggestions", ""),
                        "correct": eval_data.get("score", 0) == question.marks
                    }
            except Exception as e:
                print(f"Error evaluating answer: {str(e)}")
            return {
                "score": question.marks // 2,
                "max_score": question.marks,
                "feedback": "Answer submitted successfully. Manual review may be needed.",
                "correct": False
            }

class AudioProcessor:
    """Handles audio processing"""
    
    @staticmethod
    def text_to_speech(text: str) -> bytes:
        """Convert text to speech"""
        if not AUDIO_AVAILABLE:
            return b""
        
        try:
            clean_text = text.replace("**", "").replace("*", "").strip()
            if len(clean_text) > 500:
                clean_text = clean_text[:500] + "..."
            
            tts = gTTS(text=clean_text, lang='en', slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            return audio_buffer.read()
        except Exception as e:
            print(f"Error generating speech: {str(e)}")
            return b""

# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Question Generator & Exam System API",
        "version": "1.0.0",
        "endpoints": {
            "generate": "/api/generate-questions",
            "evaluate": "/evaluate-answers",
            "tts": "/text-to-speech",
            "health": "/health",
            "create_exam": "/api/exams",
            "submit_answer": "/api/answers",
            "submit_exam": "/api/exams/{exam_id}/submit",
            "get_exam_results": "/api/exams/{exam_id}/results"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "libraries": {
            "pypdf2": PYPDF2_AVAILABLE,
            "docx": DOCX_AVAILABLE,
            "pil": PIL_AVAILABLE,
            "fitz": FITZ_AVAILABLE,
            "audio": AUDIO_AVAILABLE,
            "pdf_export": PDF_EXPORT_AVAILABLE
        },
        "api_keys": {
            "gemini": bool(GEMINI_API_KEY),
            "mistral": bool(MISTRAL_API_KEY)
        },
        "database": {
            "supabase": bool(supabase)
        }
    }

@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extract text from uploaded document"""
    try:
        file_content = await file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        if file_extension == 'pdf':
            text = DocumentProcessor.extract_text_from_pdf(file_content)
        elif file_extension == 'docx':
            text = DocumentProcessor.extract_text_from_docx(file_content)
        elif file_extension == 'txt':
            text = DocumentProcessor.extract_text_from_txt(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        return {
            "filename": file.filename,
            "text": text,
            "word_count": len(text.split()),
            "char_count": len(text)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-questions")
async def generate_questions_api(
    file: UploadFile = File(...),
    num_mcqs: int = Form(5),
    num_short: int = Form(3),
    num_medium: int = Form(2),
    num_long: int = Form(1),
    subject: str = Form("General Knowledge"),
    difficulty: str = Form("Medium (Graduate Level)")
):
    """Generate questions from uploaded document - API endpoint for frontend"""
    try:
        print(f"[v0] Received file: {file.filename}")
        print(f"[v0] Question counts - MCQ: {num_mcqs}, Short: {num_short}, Medium: {num_medium}, Long: {num_long}")
        
        # Extract text from file
        file_content = await file.read()
        file_extension = file.filename.split('.')[-1].lower()
        
        print(f"[v0] File extension: {file_extension}, Size: {len(file_content)} bytes")
        
        if file_extension == 'pdf':
            text = DocumentProcessor.extract_text_from_pdf(file_content)
        elif file_extension == 'docx':
            text = DocumentProcessor.extract_text_from_docx(file_content)
        elif file_extension == 'txt':
            text = DocumentProcessor.extract_text_from_txt(file_content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload PDF, DOCX, or TXT")
        
        if not text:
            raise HTTPException(status_code=400, detail="No text could be extracted from the file")
        
        print(f"[v0] Extracted text length: {len(text)} characters")
        
        # Generate questions
        all_questions = []
        question_id = 1
        
        if num_mcqs > 0:
            print(f"[v0] Generating {num_mcqs} MCQ questions...")
            mcq_questions = AIModelAPI.generate_questions(
                text, "mcq", num_mcqs, "Gemini"
            )
            for q in mcq_questions:
                q.id = question_id
                question_id += 1
            all_questions.extend(mcq_questions)
            print(f"[v0] Generated {len(mcq_questions)} MCQ questions")
        
        if num_short > 0:
            print(f"[v0] Generating {num_short} short questions...")
            short_questions = AIModelAPI.generate_questions(
                text, "2_mark", num_short, "Gemini"
            )
            for q in short_questions:
                q.id = question_id
                question_id += 1
            all_questions.extend(short_questions)
            print(f"[v0] Generated {len(short_questions)} short questions")
        
        if num_medium > 0:
            print(f"[v0] Generating {num_medium} medium questions...")
            medium_questions = AIModelAPI.generate_questions(
                text, "5_mark", num_medium, "Gemini"
            )
            for q in medium_questions:
                q.id = question_id
                question_id += 1
            all_questions.extend(medium_questions)
            print(f"[v0] Generated {len(medium_questions)} medium questions")
        
        if num_long > 0:
            print(f"[v0] Generating {num_long} long questions...")
            long_questions = AIModelAPI.generate_questions(
                text, "10_mark", num_long, "Gemini"
            )
            for q in long_questions:
                q.id = question_id
                question_id += 1
            all_questions.extend(long_questions)
            print(f"[v0] Generated {len(long_questions)} long questions")
        
        # Save to Supabase if available
        question_set_id = None
        if supabase:
            try:
                # Insert question set
                set_result = supabase.table("question_sets").insert({
                    "title": f"{subject} - {file.filename}",
                    "subject": subject,
                    "difficulty": difficulty,
                    "total_marks": sum(q.marks for q in all_questions)
                }).execute()
                
                question_set_id = set_result.data[0]["id"]
                print(f"[v0] Created question set with ID: {question_set_id}")
                
                # Insert questions
                questions_data = []
                for q in all_questions:
                    questions_data.append({
                        "question_set_id": question_set_id,
                        "question_text": q.text,
                        "question_type": q.type,
                        "marks": q.marks,
                        "options": q.options,
                        "correct_answer": q.correct_answer,
                        "hint": q.hint
                    })
                
                supabase.table("questions").insert(questions_data).execute()
                print(f"[v0] Saved {len(questions_data)} questions to database")
            except Exception as e:
                print(f"[v0] Database error: {str(e)}")
        
        return {
            "question_set_id": question_set_id or "local",
            "questions": [q.dict() for q in all_questions],
            "total_questions": len(all_questions),
            "total_marks": sum(q.marks for q in all_questions)
        }
    except Exception as e:
        print(f"[v0] Error in generate_questions_api: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/exams")
async def create_exam(question_set_id: str = Form(...)):
    """Create a new exam session"""
    try:
        if not supabase:
            # Return mock exam ID if no database
            exam_id = f"exam_{datetime.now().timestamp()}"
            return {"exam_id": exam_id}
        
        result = supabase.table("exams").insert({
            "question_set_id": question_set_id,
            "status": "in_progress"
        }).execute()
        
        return {"exam_id": result.data[0]["id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/answers")
async def submit_answer(
    exam_id: str = Form(...),
    question_id: str = Form(...),
    answer_text: Optional[str] = Form(None),
    answer_image: Optional[UploadFile] = File(None),
    answer_audio: Optional[UploadFile] = File(None)
):
    """Submit answer for a question"""
    try:
        answer_data = {
            "exam_id": exam_id,
            "question_id": question_id,
            "answer_text": answer_text
        }
        
        # Handle file uploads if present
        if answer_image:
            image_content = await answer_image.read()
            answer_data["answer_image"] = base64.b64encode(image_content).decode()
        
        if answer_audio:
            audio_content = await answer_audio.read()
            answer_data["answer_audio"] = base64.b64encode(audio_content).decode()
        
        if supabase:
            supabase.table("answers").insert(answer_data).execute()
        
        return {"message": "Answer submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/exams/{exam_id}/submit")
async def submit_exam(exam_id: str):
    """Submit exam and evaluate answers"""
    try:
        if not supabase:
            return {
                "exam_id": exam_id,
                "total_marks": 50,
                "obtained_marks": 35,
                "percentage": 70,
                "answers": []
            }
        
        # Get exam and questions
        exam = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not exam.data:
            raise HTTPException(status_code=404, detail="Exam not found")
        
        question_set_id = exam.data[0]["question_set_id"]
        questions = supabase.table("questions").select("*").eq("question_set_id", question_set_id).execute()
        answers = supabase.table("answers").select("*").eq("exam_id", exam_id).execute()
        
        # Evaluate answers
        total_marks = 0
        obtained_marks = 0
        evaluated_answers = []
        
        for question in questions.data:
            total_marks += question["marks"]
            user_answer = next((a for a in answers.data if a["question_id"] == question["id"]), None)
            
            if user_answer:
                # Simple evaluation logic
                if question["question_type"] == "mcq" and question["correct_answer"]:
                    is_correct = user_answer["answer_text"] == question["correct_answer"]
                    marks = question["marks"] if is_correct else 0
                else:
                    # For subjective questions, assign partial marks
                    marks = question["marks"] * 0.7  # Mock evaluation
                
                obtained_marks += marks
                evaluated_answers.append({
                    "question_id": question["id"],
                    "is_correct": marks == question["marks"],
                    "marks_obtained": marks
                })
        
        # Update exam status
        supabase.table("exams").update({
            "status": "completed",
            "total_marks": total_marks,
            "obtained_marks": obtained_marks
        }).eq("id", exam_id).execute()
        
        return {
            "exam_id": exam_id,
            "total_marks": total_marks,
            "obtained_marks": obtained_marks,
            "percentage": (obtained_marks / total_marks * 100) if total_marks > 0 else 0,
            "answers": evaluated_answers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/exams/{exam_id}/results")
async def get_exam_results(exam_id: str):
    """Get exam results"""
    try:
        if not supabase:
            return {
                "exam_id": exam_id,
                "total_marks": 50,
                "obtained_marks": 35,
                "percentage": 70,
                "answers": []
            }
        
        exam = supabase.table("exams").select("*").eq("id", exam_id).execute()
        if not exam.data or exam.data[0]["status"] != "completed":
            raise HTTPException(status_code=404, detail="Results not available")
        
        return exam.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/evaluate-answers")
async def evaluate_answers(submission: ExamSubmission):
    """Evaluate exam answers"""
    try:
        # This endpoint expects questions to be stored or passed with answers
        # For now, we'll return a simple response
        # In production, you'd retrieve questions from a database or session
        
        results = []
        total_score = 0
        
        for answer in submission.answers:
            # Mock evaluation - in production, retrieve actual question
            result = {
                "question_id": answer.question_id,
                "score": 0,
                "max_score": 5,
                "feedback": "Question data not available for evaluation",
                "correct": False
            }
            results.append(result)
        
        return {
            "username": submission.username,
            "results": results,
            "total_score": total_score,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/text-to-speech")
async def text_to_speech(text: str = Form(...)):
    """Convert text to speech"""
    try:
        audio_data = AudioProcessor.text_to_speech(text)
        if not audio_data:
            raise HTTPException(status_code=500, detail="Audio generation failed")
        
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf-to-images")
async def pdf_to_images(file: UploadFile = File(...)):
    """Convert PDF pages to images"""
    try:
        file_content = await file.read()
        images = DocumentProcessor.pdf_to_images(file_content)
        
        if not images:
            raise HTTPException(status_code=500, detail="Failed to convert PDF to images")
        
        # Convert images to base64 for JSON response
        image_data = []
        for i, img in enumerate(images):
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            img_base64 = base64.b64encode(buffer.read()).decode()
            image_data.append({
                "page": i + 1,
                "image": f"data:image/png;base64,{img_base64}"
            })
        
        return {
            "filename": file.filename,
            "total_pages": len(images),
            "images": image_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
