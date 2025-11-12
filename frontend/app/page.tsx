import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { FileText, Brain, Award, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AI Exam Generator</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Question Generation</span>
          </div>
          <h1 className="mb-6 text-balance text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Transform Documents into{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Smart Exams</span>
          </h1>
          <p className="mb-10 text-pretty text-lg text-muted-foreground md:text-xl">
            Upload your study materials and let AI generate comprehensive exam questions. Take tests, get instant
            evaluation, and track your progress with intelligent insights.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="min-w-[200px]">
                Start Creating Exams
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="min-w-[200px] bg-transparent">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border/50 bg-card hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-start gap-4 p-6">
              <div className="rounded-lg bg-primary/10 p-3">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Upload & Generate</h3>
              <p className="text-muted-foreground">
                Upload PDFs, DOCX, or TXT files. Our AI extracts key concepts and generates relevant questions
                automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card hover:border-accent/50 transition-colors">
            <CardContent className="flex flex-col items-start gap-4 p-6">
              <div className="rounded-lg bg-accent/10 p-3">
                <Brain className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold">AI Evaluation</h3>
              <p className="text-muted-foreground">
                Get instant feedback with intelligent AI evaluation. Receive detailed explanations and improvement
                suggestions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card hover:border-chart-3/50 transition-colors">
            <CardContent className="flex flex-col items-start gap-4 p-6">
              <div className="rounded-lg bg-chart-3/10 p-3">
                <Award className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your performance over time. View detailed analytics and identify areas for improvement.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Questions Generated</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-accent">5K+</div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-chart-3">98%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold text-chart-4">24/7</div>
              <div className="text-sm text-muted-foreground">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold md:text-4xl">Ready to revolutionize your learning?</h2>
            <p className="mb-8 text-pretty text-lg text-muted-foreground">
              Join thousands of students and educators using AI-powered exam generation.
            </p>
            <Link href="/auth/sign-up">
              <Button size="lg" className="min-w-[250px]">
                Create Free Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 AI Exam Generator. Powered by Gemini AI.</p>
        </div>
      </footer>
    </div>
  )
}
