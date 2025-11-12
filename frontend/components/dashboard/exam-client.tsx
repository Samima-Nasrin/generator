"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Brain, ArrowLeft, CheckCircle, Loader2, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"

interface ExamClientProps {
  questionSet: any
  user: any
}

export default function ExamClient({ questionSet, user }: ExamClientProps) {
  const router = useRouter()
  const questions = questionSet.questions_json || []
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isSpeaking, currentQuestionId, speak, stop, isSupported } = useTextToSpeech()

  useEffect(() => {
    console.log("[v0] ExamClient mounted with:", {
      questionSetId: questionSet.id,
      totalQuestions: questions.length,
      userId: user.id,
    })

    if (questions.length > 0) {
      console.log("[v0] First question structure:", {
        id: questions[0].id,
        type: questions[0].type,
        text: questions[0].text,
        has_options: !!questions[0].options,
        options_type: typeof questions[0].options,
        options: questions[0].options,
      })
      console.log(
        "[v0] All question IDs:",
        questions.map((q: any) => q.id),
      )
      console.log(
        "[v0] All question types:",
        questions.map((q: any) => q.type),
      )
    } else {
      console.error("[v0] ❌ No questions found in questionSet.questions_json")
    }
  }, [questionSet, user])

  const handleAnswerChange = (questionId: number, answer: string) => {
    console.log(`[v0] Answer changed for question ${questionId}:`, answer)
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Calculate marks
      let totalMarks = 0
      let obtainedMarks = 0

      questions.forEach((q: any) => {
        totalMarks += q.marks
        const userAnswer = answers[q.id]

        // For MCQs, check if correct
        if (q.type === "mcq" && userAnswer === q.correct_answer) {
          obtainedMarks += q.marks
        } else if (q.type !== "mcq" && userAnswer) {
          // For subjective questions, give 70% marks if answered
          obtainedMarks += q.marks * 0.7
        }
      })

      const percentage = (obtainedMarks / totalMarks) * 100

      // Save exam result
      const { error: insertError } = await supabase.from("exam_results").insert({
        user_id: user.id,
        question_set_id: questionSet.id,
        total_questions: questions.length,
        total_marks: totalMarks,
        marks_obtained: obtainedMarks,
        percentage: percentage,
        student_name: user.email?.split("@")[0],
        answers_json: answers,
      })

      if (insertError) throw insertError

      // Navigate to results
      router.push(`/dashboard/results/${questionSet.id}`)
    } catch (err) {
      console.error("Error submitting exam:", err)
      alert("Failed to submit exam. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const speakQuestion = (question: any) => {
    let textToSpeak = `Question ${question.id}. ${question.text}`

    // Add options for MCQ questions
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
    const allText = questions
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

    speak(allText, -1) // -1 indicates reading all questions
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit Exam
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Take Exam</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
            <div className="text-sm text-muted-foreground">{questions.length} Questions</div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Exam Info */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <h2 className="mb-2 text-2xl font-bold">{questionSet.pdf_name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Difficulty: {questionSet.difficulty}</span>
              <span>•</span>
              <span>Total Questions: {questions.length}</span>
              <span>•</span>
              <span>Total Marks: {questions.reduce((sum: number, q: any) => sum + q.marks, 0)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question: any, index: number) => (
            <Card key={question.id} className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-start gap-3 text-lg">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">{question.text}</div>
                      {isSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            if (isSpeaking && currentQuestionId === question.id) {
                              stop()
                            } else {
                              speakQuestion(question)
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
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-primary/10 px-2 py-1 text-primary">
                        {question.type === "mcq" ? "Multiple Choice" : `${question.marks} Marks`}
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {question.type === "mcq" ? (
                  <RadioGroup
                    value={answers[question.id] || ""}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    {question.options &&
                      typeof question.options === "object" &&
                      Object.entries(question.options).map(([key, value]: [string, any]) => (
                        <div
                          key={key}
                          className="flex items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                        >
                          <RadioGroupItem value={key} id={`q${question.id}-${key}`} />
                          <Label htmlFor={`q${question.id}-${key}`} className="flex-1 cursor-pointer">
                            <span className="font-semibold">{key}.</span> {value}
                          </Label>
                        </div>
                      ))}
                  </RadioGroup>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor={`answer-${question.id}`}>Your Answer</Label>
                    <Textarea
                      id={`answer-${question.id}`}
                      placeholder="Type your answer here..."
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <Card className="mt-8 border-border/50">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Answered: {Object.keys(answers).length} / {questions.length}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || Object.keys(answers).length === 0}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting Exam...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Submit Exam
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
