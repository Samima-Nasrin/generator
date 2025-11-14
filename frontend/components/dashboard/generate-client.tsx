"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Brain, Upload, ArrowLeft, Loader2 } from 'lucide-react'
import Link from "next/link"
import { generateQuestions } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"
import { generateFileHash } from "@/lib/utils"
import { saveTestToLocalStorage, convertFileToBase64 } from "@/lib/local-storage"

interface GenerateClientProps {
  user: any
}

export default function GenerateClient({ user }: GenerateClientProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [numMcqs, setNumMcqs] = useState(5)
  const [numShort, setNumShort] = useState(3)
  const [numMedium, setNumMedium] = useState(2)
  const [numLong, setNumLong] = useState(1)
  const [subject, setSubject] = useState("General Knowledge")
  const [difficulty, setDifficulty] = useState("Medium (Graduate Level)")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleGenerate = async () => {
    if (!file) {
      setError("Please upload a file")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      console.log("[v0] ========== STARTING QUESTION GENERATION ==========")
      console.log("[v0] File:", file.name, "Size:", file.size, "bytes")
      console.log("[v0] Parameters being sent:", {
        num_mcqs: numMcqs,
        num_short: numShort,
        num_medium: numMedium,
        num_long: numLong,
        subject,
        difficulty,
      })

      console.log("[v0] Generating file hash...")
      const fileHash = await generateFileHash(file)
      console.log("[v0] File hash generated:", fileHash.substring(0, 16) + "...")

      console.log("[v0] Converting PDF to Base64...")
      const pdfBase64 = await convertFileToBase64(file)
      console.log("[v0] PDF converted to Base64, size:", pdfBase64.length, "characters")

      const questionSet = await generateQuestions({
        file,
        num_mcqs: numMcqs,
        num_short: numShort,
        num_medium: numMedium,
        num_long: numLong,
        subject,
        difficulty,
      })

      console.log("[v0] ========== BACKEND RESPONSE RECEIVED ==========")
      console.log("[v0] Question Set ID:", questionSet.question_set_id)
      console.log("[v0] Total Questions:", questionSet.total_questions)
      console.log("[v0] Total Marks:", questionSet.total_marks)
      console.log("[v0] Questions Array Length:", questionSet.questions?.length || 0)

      if (!questionSet.questions) {
        console.error("[v0] ❌ questions field is missing or undefined")
        throw new Error("Backend response is missing questions field")
      }

      if (!Array.isArray(questionSet.questions)) {
        console.error("[v0] ❌ questions field is not an array. Type:", typeof questionSet.questions)
        throw new Error("Backend response has invalid questions format")
      }

      if (questionSet.questions.length === 0) {
        console.error("[v0] ❌ Backend returned 0 questions despite successful request")
        throw new Error("Backend returned 0 questions. Check backend logs for generation errors.")
      }

      console.log("[v0] ✅ Question validation passed")
      console.log("[v0] Question breakdown by type:")
      const mcqCount = questionSet.questions.filter((q) => q.type === "mcq").length
      const shortCount = questionSet.questions.filter((q) => q.type === "2_mark").length
      const mediumCount = questionSet.questions.filter((q) => q.type === "5_mark").length
      const longCount = questionSet.questions.filter((q) => q.type === "10_mark").length
      console.log(`[v0]   - MCQ: ${mcqCount}`)
      console.log(`[v0]   - Short (2 mark): ${shortCount}`)
      console.log(`[v0]   - Medium (5 mark): ${mediumCount}`)
      console.log(`[v0]   - Long (10 mark): ${longCount}`)

      const supabase = createClient()
      console.log("[v0] ========== SAVING TO SUPABASE ==========")
      console.log("[v0] User ID:", user.id)

      const questionsText = questionSet.questions
        .map((q, idx) => {
          let text = `${idx + 1}. ${q.text}\n`
          if (q.type === "mcq" && q.options) {
            Object.entries(q.options).forEach(([key, value]) => {
              text += `   ${key}) ${value}\n`
            })
            text += `   Correct Answer: ${q.correct_answer || "N/A"}\n`
          }
          return text
        })
        .join("\n")

      const dataToInsert = {
        user_id: user.id,
        pdf_name: file.name,
        pdf_hash: fileHash,
        file_size: file.size,
        exam_type: subject || "General Knowledge",
        difficulty: difficulty,
        language: "English",
        custom_instructions: null,
        total_questions: questionSet.total_questions,
        questions_json: questionSet.questions,
        questions_text: questionsText,
        question_counts: {
          mcq: numMcqs,
          short: numShort,
          medium: numMedium,
          long: numLong,
        },
        pattern_used: false,
        tags: [subject, difficulty],
        generation_date: new Date().toISOString(),
      }

      console.log("[v0] Inserting into Supabase...")

      const { data: insertedSet, error: insertError } = await supabase
        .from("question_sets")
        .insert(dataToInsert)
        .select()
        .single()

      if (insertError) {
        console.error("[v0] ❌ Supabase insert error:", insertError)
        console.error("[v0] Error details:", {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        })
        throw new Error(`Database error: ${insertError.message}`)
      }

      if (!insertedSet) {
        console.error("[v0] ❌ No data returned from Supabase insert")
        throw new Error("Failed to save question set to database")
      }

      console.log("[v0] ✅ Successfully saved to database with ID:", insertedSet.id)

      console.log("[v0] Saving to localStorage...")
      saveTestToLocalStorage(user.id, {
        pdfFile: file,
        pdfData: pdfBase64,
        questions: questionSet.questions,
        subject,
        difficulty,
        totalQuestions: questionSet.total_questions,
        totalMarks: questionSet.total_marks,
      })
      console.log("[v0] ✅ Successfully saved to localStorage")

      console.log("[v0] ✅ SUCCESS! Redirecting to exam page...")

      router.push(`/dashboard/exam/${insertedSet.id}`)
    } catch (err) {
      console.error("[v0] ========== ERROR OCCURRED ==========")
      console.error("[v0] Error type:", err instanceof Error ? err.constructor.name : typeof err)
      console.error("[v0] Error message:", err instanceof Error ? err.message : String(err))
      console.error("[v0] Full error:", err)

      const errorMessage = err instanceof Error ? err.message : "Failed to generate questions. Please try again."
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
      console.log("[v0] ========== GENERATION PROCESS COMPLETE ==========")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Generate Questions</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Upload Document & Configure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Document</Label>
              <div className="flex items-center gap-4">
                <Input id="file" type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} className="flex-1" />
                {file && (
                  <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">{file.name}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Supported formats: PDF, DOCX, TXT</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Computer Science, Mathematics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy (High School Level)">Easy (High School Level)</SelectItem>
                  <SelectItem value="Medium (Graduate Level)">Medium (Graduate Level)</SelectItem>
                  <SelectItem value="Hard (Advanced/Research Level)">Hard (Advanced/Research Level)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mcq">MCQ Questions</Label>
                <Input
                  id="mcq"
                  type="number"
                  min="0"
                  value={numMcqs}
                  onChange={(e) => setNumMcqs(Number.parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="short">Short Questions (2 marks)</Label>
                <Input
                  id="short"
                  type="number"
                  min="0"
                  value={numShort}
                  onChange={(e) => setNumShort(Number.parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medium">Medium Questions (5 marks)</Label>
                <Input
                  id="medium"
                  type="number"
                  min="0"
                  value={numMedium}
                  onChange={(e) => setNumMedium(Number.parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="long">Long Questions (10 marks)</Label>
                <Input
                  id="long"
                  type="number"
                  min="0"
                  value={numLong}
                  onChange={(e) => setNumLong(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-medium">
                Total Questions: <span className="text-primary">{numMcqs + numShort + numMedium + numLong}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated Marks: {numMcqs * 1 + numShort * 2 + numMedium * 5 + numLong * 10}
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="mb-2 font-semibold text-destructive">Error Generating Questions</p>
                <p className="whitespace-pre-line text-sm text-destructive/90">{error}</p>
              </div>
            )}

            <Button onClick={handleGenerate} disabled={isGenerating || !file} className="w-full" size="lg">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  Generate Questions
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
