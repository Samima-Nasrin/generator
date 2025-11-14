"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowLeft, FileText, Volume2, VolumeX } from 'lucide-react'
import Link from "next/link"
import { getTestById } from "@/lib/local-storage"
import { useRouter } from 'next/navigation'
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface LocalTestViewerClientProps {
  testId: string
  userId: string
}

export default function LocalTestViewerClient({ testId, userId }: LocalTestViewerClientProps) {
  const router = useRouter()
  const [test, setTest] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { isSpeaking, currentQuestionId, speak, stop, isSupported } = useTextToSpeech()

  useEffect(() => {
    const testData = getTestById(userId, testId)
    if (!testData) {
      router.push("/dashboard/history")
      return
    }
    setTest(testData)
    setLoading(false)
  }, [testId, userId, router])

  const speakQuestion = (question: any, index: number) => {
    let textToSpeak = `Question ${index + 1}. ${question.text}`

    if (question.type === "mcq" && question.options && typeof question.options === "object") {
      textToSpeak += ". Options are: "
      const optionsText = Object.entries(question.options)
        .map(([key, value]: [string, any]) => `${key}. ${value}`)
        .join(". ")
      textToSpeak += optionsText
    }

    speak(textToSpeak, question.id)
  }

  const speakAllQuestions = () => {
    const allText = test.questions
      .map((question: any, index: number) => {
        let text = `Question ${index + 1}. ${question.text}`
        if (question.type === "mcq" && question.options && typeof question.options === "object") {
          text += ". Options are: "
          const optionsText = Object.entries(question.options)
            .map(([key, value]: [string, any]) => `${key}. ${value}`)
            .join(". ")
          text += optionsText
        }
        return text
      })
      .join(". Next question. ")

    speak(allText, -1)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    )
  }

  if (!test) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/history">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to History
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Saved Test</span>
            </div>
          </div>
          {isSupported && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isSpeaking && currentQuestionId === -1) {
                  stop()
                } else {
                  speakAllQuestions()
                }
              }}
            >
              {isSpeaking && currentQuestionId === -1 ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Listen to All
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Test Info */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <h2 className="mb-2 text-2xl font-bold">{test.pdfName}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Subject: {test.subject}</span>
              <span>•</span>
              <span>Difficulty: {test.difficulty}</span>
              <span>•</span>
              <span>Total Questions: {test.totalQuestions}</span>
              <span>•</span>
              <span>Total Marks: {test.totalMarks}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* PDF Viewer */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Document Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-muted">
                <iframe
                  src={
                    test.pdfData.startsWith("data:application/pdf")
                      ? test.pdfData
                      : `data:application/pdf;base64,${test.pdfData}`
                  }
                  className="h-full w-full"
                  title="PDF Preview"
                  style={{ border: "none" }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Generated Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[700px] space-y-4 overflow-y-auto pr-2">
                {test.questions.map((question: any, index: number) => (
                  <div key={question.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="flex-1 font-medium">{question.text}</p>
                          {isSupported && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 h-8 w-8 p-0"
                              onClick={() => {
                                if (isSpeaking && currentQuestionId === question.id) {
                                  stop()
                                } else {
                                  speakQuestion(question, index)
                                }
                              }}
                            >
                              {isSpeaking && currentQuestionId === question.id ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                        <span className="mt-1 inline-block rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {question.type === "mcq" ? "MCQ" : `${question.marks} Marks`}
                        </span>
                      </div>
                    </div>

                    {question.type === "mcq" && question.options && (
                      <div className="ml-8 mt-3 space-y-2">
                        {Object.entries(question.options).map(([key, value]: [string, any]) => (
                          <div
                            key={key}
                            className={`rounded border p-2 text-sm ${
                              key === question.correct_answer
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border"
                            }`}
                          >
                            <span className="font-semibold">{key}.</span> {value}
                            {key === question.correct_answer && (
                              <span className="ml-2 text-xs text-primary">(Correct)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
