interface TestHistoryItem {
  id: string
  pdfName: string
  pdfData: string // Base64 encoded PDF
  questions: any[]
  timestamp: string
  subject: string
  difficulty: string
  totalQuestions: number
  totalMarks: number
}

const STORAGE_KEY = "testHistory"

export function saveTestToLocalStorage(data: {
  pdfFile: File
  pdfData: string
  questions: any[]
  subject: string
  difficulty: string
  totalQuestions: number
  totalMarks: number
}): void {
  try {
    const historyItem: TestHistoryItem = {
      id: `test_${Date.now()}`,
      pdfName: data.pdfFile.name,
      pdfData: data.pdfData,
      questions: data.questions,
      timestamp: new Date().toISOString(),
      subject: data.subject,
      difficulty: data.difficulty,
      totalQuestions: data.totalQuestions,
      totalMarks: data.totalMarks,
    }

    const existingHistory = getTestHistory()
    const updatedHistory = [historyItem, ...existingHistory]

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
    console.log("[v0] ✅ Saved test to localStorage:", historyItem.id)
  } catch (error) {
    console.error("[v0] ❌ Error saving to localStorage:", error)
  }
}

export function getTestHistory(): TestHistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("[v0] ❌ Error reading from localStorage:", error)
    return []
  }
}

export function getTestById(id: string): TestHistoryItem | null {
  try {
    const history = getTestHistory()
    return history.find((item) => item.id === id) || null
  } catch (error) {
    console.error("[v0] ❌ Error getting test from localStorage:", error)
    return null
  }
}

export function deleteTestFromHistory(id: string): void {
  try {
    const history = getTestHistory()
    const updatedHistory = history.filter((item) => item.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))
    console.log("[v0] ✅ Deleted test from localStorage:", id)
  } catch (error) {
    console.error("[v0] ❌ Error deleting from localStorage:", error)
  }
}

export function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = (error) => reject(error)
    reader.readAsDataURL(file)
  })
}
