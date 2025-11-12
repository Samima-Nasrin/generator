import axios from "axios"

// Backend API URL - adjust this to match your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Question generation types
export interface QuestionGenerationParams {
  file: File
  num_mcqs?: number
  num_short?: number
  num_medium?: number
  num_long?: number
  subject?: string
  difficulty?: string
}

export interface Question {
  id: number
  text: string // Backend returns 'text', not 'question_text'
  type: string
  marks: number
  options?: { [key: string]: string } | null // Backend returns {"A": "...", "B": "...", "C": "...", "D": "..."}
  correct_answer?: string | null
  hint?: string | null
  sample_answer?: string | null
}

export interface QuestionSet {
  question_set_id: string
  questions: Question[]
  total_questions: number
  total_marks: number
}

export interface ExamAnswer {
  question_id: number
  answer: string
}

export interface ExamSubmission {
  exam_id: string
  total_marks: number
  obtained_marks: number
  percentage: number
  answers: Array<{
    question_id: string
    is_correct: boolean
    marks_obtained: number
  }>
}

// API functions
export const generateQuestions = async (params: QuestionGenerationParams): Promise<QuestionSet> => {
  const formData = new FormData()
  formData.append("file", params.file)
  formData.append("num_mcqs", String(params.num_mcqs ?? 5))
  formData.append("num_short", String(params.num_short ?? 3))
  formData.append("num_medium", String(params.num_medium ?? 2))
  formData.append("num_long", String(params.num_long ?? 1))

  if (params.subject) {
    formData.append("subject", params.subject)
  }
  if (params.difficulty) {
    formData.append("difficulty", params.difficulty)
  }

  console.log("[v0] 📤 Sending to backend:")
  console.log(`[v0]   File: ${params.file.name} (${params.file.size} bytes)`)
  console.log(`[v0]   num_mcqs: ${params.num_mcqs ?? 5}`)
  console.log(`[v0]   num_short: ${params.num_short ?? 3}`)
  console.log(`[v0]   num_medium: ${params.num_medium ?? 2}`)
  console.log(`[v0]   num_long: ${params.num_long ?? 1}`)
  console.log(`[v0]   subject: ${params.subject}`)
  console.log(`[v0]   difficulty: ${params.difficulty}`)

  try {
    const response = await axios.post(`${API_BASE_URL}/api/generate-questions`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })

    console.log("[v0] 📥 Backend response status:", response.status)
    console.log("[v0] 📥 Backend response data:", response.data)

    const data = response.data

    if (!data) {
      console.error("[v0] ❌ No data in response")
      throw new Error("No data received from backend")
    }

    if (!data.questions) {
      console.error("[v0] ❌ No questions field in response. Response keys:", Object.keys(data))
      throw new Error("Invalid response format: missing questions field")
    }

    if (!Array.isArray(data.questions)) {
      console.error("[v0] ❌ Questions field is not an array. Type:", typeof data.questions)
      throw new Error("Invalid response format: questions is not an array")
    }

    if (data.questions.length === 0) {
      console.warn("[v0] ⚠️ Backend returned 0 questions")
      throw new Error(
        "No questions were generated. This could be due to:\n\n" +
          "• API rate limits - Please wait a few minutes and try again.\n" +
          "• Insufficient document content - The file may not contain enough text.\n" +
          "• Backend generation error - Check backend logs for details.\n\n" +
          "The backend returned a successful response but with 0 questions.",
      )
    }

    console.log("[v0] ✅ Response validation passed")
    console.log(`[v0] ✅ Received ${data.questions.length} questions`)
    console.log("[v0] ✅ Total marks:", data.total_marks)

    if (data.questions.length > 0) {
      console.log("[v0] First question structure:", {
        id: data.questions[0].id,
        text: data.questions[0].text,
        type: data.questions[0].type,
        options: data.questions[0].options,
      })
    }

    return data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("[v0] ❌ Backend HTTP error:", error.response.status)
        console.error("[v0] ❌ Error data:", error.response.data)
        throw new Error(
          `Backend error (${error.response.status}): ${error.response.data?.detail || error.response.statusText}`,
        )
      } else if (error.request) {
        console.error("[v0] ❌ No response from backend")
        throw new Error(
          `Cannot connect to backend at ${API_BASE_URL}.\n\n` + `Make sure backend is running and CORS is enabled.`,
        )
      }
    }
    console.error("[v0] ❌ Unexpected error:", error)
    throw error
  }
}

export const createExam = async (questionSetId: string): Promise<{ exam_id: string }> => {
  const formData = new FormData()
  formData.append("question_set_id", questionSetId)

  const response = await axios.post(`${API_BASE_URL}/api/exams`, formData)
  return response.data
}

export const submitExam = async (examId: string): Promise<ExamSubmission> => {
  const response = await axios.post(`${API_BASE_URL}/api/exams/${examId}/submit`)
  return response.data
}

export const getExamResults = async (examId: string): Promise<ExamSubmission> => {
  const response = await axios.get(`${API_BASE_URL}/api/exams/${examId}/results`)
  return response.data
}
