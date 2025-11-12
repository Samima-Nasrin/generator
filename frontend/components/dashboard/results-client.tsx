"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ArrowLeft, Award, TrendingUp, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

interface ResultsClientProps {
  examResult: any
  questionSet: any
  user: any
}

export default function ResultsClient({ examResult, questionSet }: ResultsClientProps) {
  const percentage = examResult.percentage || 0
  const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B" : percentage >= 60 ? "C" : "F"

  const questions = questionSet?.questions_json || []
  const userAnswers = examResult.answers_json || {}

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Exam Results</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Results Summary */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-8">
            <div className="mb-6 flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <Award className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h2 className="mb-2 text-center text-3xl font-bold">Exam Completed!</h2>
            <p className="mb-8 text-center text-muted-foreground">{questionSet?.pdf_name}</p>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-primary">{percentage.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Score</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-accent">
                  {examResult.marks_obtained.toFixed(1)}/{examResult.total_marks}
                </div>
                <p className="text-sm text-muted-foreground">Marks</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-chart-3">{grade}</div>
                <p className="text-sm text-muted-foreground">Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Breakdown */}
        <Card className="mb-8 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Questions Answered</span>
                <span className="font-semibold">
                  {Object.keys(userAnswers).length} / {questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <span className="font-semibold">
                  {((Object.keys(userAnswers).length / questions.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <h3 className="mb-4 text-2xl font-bold">Question Review</h3>
        <div className="space-y-4">
          {questions.map((question: any, index: number) => {
            const userAnswer = userAnswers[question.id]
            const isCorrect = question.type === "mcq" ? userAnswer === question.correct_answer : Boolean(userAnswer)

            return (
              <Card
                key={question.id}
                className={`border-border/50 ${
                  isCorrect ? "border-l-4 border-l-chart-3" : "border-l-4 border-l-destructive"
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-start gap-3 text-lg">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="mb-2">{question.text}</div>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <div className="flex items-center gap-1 text-sm text-chart-3">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Correct</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span>{userAnswer ? "Incorrect" : "Not Answered"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {question.type === "mcq" ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Answer:</p>
                        <p className="font-medium">
                          {userAnswer ? `${userAnswer}. ${question.options?.[userAnswer]}` : "Not answered"}
                        </p>
                      </div>
                      {!isCorrect && question.correct_answer && (
                        <div>
                          <p className="text-sm text-muted-foreground">Correct Answer:</p>
                          <p className="font-medium text-chart-3">
                            {question.correct_answer}. {question.options?.[question.correct_answer]}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Answer:</p>
                        <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3">
                          {userAnswer || "Not answered"}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="w-full bg-transparent" size="lg">
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/generate" className="flex-1">
            <Button className="w-full" size="lg">
              Generate New Exam
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
