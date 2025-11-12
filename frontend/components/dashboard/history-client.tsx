"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, ArrowLeft, FileText, Calendar, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import LocalHistoryClient from "./local-history-client"

interface HistoryClientProps {
  questionSets: any[]
}

export default function HistoryClient({ questionSets }: HistoryClientProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              <span className="text-xl font-bold">Question Set History</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Question Sets</h1>
            <p className="text-muted-foreground">{questionSets.length} sets in database</p>
          </div>
          <Link href="/dashboard/generate">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Set
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="database">Database History</TabsTrigger>
            <TabsTrigger value="local">Local Saved Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="database">
            {questionSets.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileText className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">No question sets yet</h3>
                  <p className="mb-6 text-center text-muted-foreground">
                    Upload a document to generate your first question set
                  </p>
                  <Link href="/dashboard/generate">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Questions
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {questionSets.map((set) => (
                  <Card key={set.id} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold">{set.pdf_name}</h3>
                          </div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                              {set.total_questions} Questions
                            </span>
                            <span className="rounded bg-accent/10 px-2 py-1 text-xs text-accent">{set.difficulty}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(set.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Link href={`/dashboard/exam/${set.id}`}>
                          <Button>Take Exam</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="local">
            <LocalHistoryClient />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
