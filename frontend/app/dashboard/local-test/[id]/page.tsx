"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import LocalTestViewerClient from "@/components/dashboard/local-test-viewer-client"

export default function LocalTestViewer() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (id && userId) {
      setIsReady(true)
    }
  }, [id, userId])

  if (!isReady || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return <LocalTestViewerClient testId={id as string} userId={userId} />
}
