"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getTestById } from "@/lib/local-storage"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function LocalTestViewer() {
  const { id } = useParams()
  const router = useRouter()
  const [test, setTest] = useState<any>(null)

  useEffect(() => {
    if (!id) return
    const data = getTestById(id as string)
    if (data) setTest(data)
    else router.push("/dashboard/history") // redirect if not found
  }, [id, router])

  if (!test) {
    return <p className="text-center mt-10 text-muted-foreground">Loading test...</p>
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-lg font-semibold">{test.pdfName}</h2>
      </div>

      {/* PDF Viewer */}
      <div className="w-full h-[80vh] border rounded-lg overflow-hidden shadow-md">
        <iframe
          src={test.pdfData}
          title={test.pdfName}
          className="w-full h-full"
          frameBorder="0"
        ></iframe>
      </div>

      {/* You can add more info below if you want */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p><strong>Subject:</strong> {test.subject}</p>
        <p><strong>Difficulty:</strong> {test.difficulty}</p>
        <p><strong>Total Questions:</strong> {test.totalQuestions}</p>
        <p><strong>Total Marks:</strong> {test.totalMarks}</p>
        <p><strong>Created:</strong> {new Date(test.timestamp).toLocaleString()}</p>
      </div>
    </div>
  )
}
