interface TestHistoryItem {
  id: string
  pdfName: string
  pdfData: string
  questions: any[]
  timestamp: string
  subject: string
  difficulty: string
  totalQuestions: number
  totalMarks: number
}

function getStorageKey(userId: string): string {
  return `testHistory_${userId}`
}

export function saveTestToLocalStorage(
  userId: string,
  data: {
    pdfFile: File
    pdfData: string
    questions: any[]
    subject: string
    difficulty: string
    totalQuestions: number
    totalMarks: number
  }
): void {
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

    const storageKey = getStorageKey(userId)
    const existingHistory = getTestHistory(userId)
    const updatedHistory = [historyItem, ...existingHistory]

    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
    console.log("[v0] ✅ Saved test to localStorage:", historyItem.id)
  } catch (error) {
    console.error("[v0] ❌ Error saving to localStorage:", error)
  }
}

export function getTestHistory(userId: string): TestHistoryItem[] {
  try {
    const storageKey = getStorageKey(userId)
    const data = localStorage.getItem(storageKey)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("[v0] ❌ Error reading from localStorage:", error)
    return []
  }
}

export function getTestById(userId: string, id: string): TestHistoryItem | null {
  try {
    const history = getTestHistory(userId)
    return history.find((item) => item.id === id) || null
  } catch (error) {
    console.error("[v0] ❌ Error getting test from localStorage:", error)
    return null
  }
}

export function deleteTestFromHistory(userId: string, id: string): void {
  try {
    const storageKey = getStorageKey(userId)
    const history = getTestHistory(userId)
    const updatedHistory = history.filter((item) => item.id !== id)
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
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
