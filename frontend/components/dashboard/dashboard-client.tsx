"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, FileText, Plus, LogOut, Award, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface DashboardClientProps {
  user: any
  questionSets: any[]
  examResults: any[]
}

export default function DashboardClient({ user, questionSets, examResults }: DashboardClientProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const totalExams = examResults.length
  const avgPercentage =
    examResults.length > 0
      ? examResults.reduce((acc, result) => acc + (result.percentage || 0), 0) / examResults.length
      : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Exam Generator</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
              <span className="ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome back, {user.email?.split("@")[0]}!</h1>
          <p className="text-muted-foreground">Generate questions from your documents and take AI-powered exams</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Question Sets</CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{questionSets.length}</div>
              <p className="text-xs text-muted-foreground">Total generated sets</p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Exams Taken</CardTitle>
              <Clock className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{totalExams}</div>
              <p className="text-xs text-muted-foreground">Total completed exams</p>
            </CardContent>
          </Card>

          <Card className="border-chart-3/20 bg-gradient-to-br from-chart-3/5 to-chart-3/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-chart-3" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-chart-3">{avgPercentage.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Across all exams</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Link href="/dashboard/generate">
                <Button size="lg" className="gap-2">
                  <Plus className="h-5 w-5" />
                  Generate Questions
                </Button>
              </Link>
              <Link href="/dashboard/history">
                <Button size="lg" variant="outline" className="gap-2 bg-transparent">
                  <FileText className="h-5 w-5" />
                  View History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Exam Results */}
        {examResults.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-bold">Recent Results</h2>
            <div className="grid gap-4">
              {examResults.map((result) => (
                <Card key={result.id} className="border-border/50">
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-primary/10 p-3">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{result.student_name || "Exam"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{result.percentage?.toFixed(0)}%</div>
                      <p className="text-sm text-muted-foreground">
                        {result.marks_obtained}/{result.total_marks} marks
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
