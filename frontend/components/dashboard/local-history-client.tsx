"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Calendar, Trash2, Eye } from "lucide-react"
import { getTestHistory, deleteTestFromHistory } from "@/lib/local-storage"
import { useRouter } from "next/navigation"

export default function LocalHistoryClient() {
  const router = useRouter()
  const [localTests, setLocalTests] = useState<any[]>([])

  useEffect(() => {
    // Load tests from localStorage
    const tests = getTestHistory()
    setLocalTests(tests)
  }, [])

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this test?")) {
      deleteTestFromHistory(id)
      setLocalTests(getTestHistory())
    }
  }

  const handleView = (id: string) => {
    router.push(`/dashboard/local-test/${id}`)
  }

  if (localTests.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-center text-muted-foreground">No tests saved locally yet</p>
          <p className="text-xs text-muted-foreground mt-2">Tests will be saved here after generation</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {localTests.map((test) => (
        <Card key={test.id} className="border-border/50 hover:border-primary/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{test.pdfName}</h3>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs text-primary">
                    {test.totalQuestions} Questions
                  </span>
                  <span className="rounded bg-accent/10 px-2 py-1 text-xs text-accent">{test.difficulty}</span>
                  <span className="rounded bg-chart-3/10 px-2 py-1 text-xs text-chart-3">{test.subject}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(test.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{new Date(test.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleView(test.id)} size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button onClick={() => handleDelete(test.id)} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
