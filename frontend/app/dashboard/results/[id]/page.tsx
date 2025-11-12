import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ResultsClient from "@/components/dashboard/results-client"

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch the most recent exam result for this question set
  const { data: examResult, error: resultError } = await supabase
    .from("exam_results")
    .select("*")
    .eq("question_set_id", id)
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (resultError || !examResult) {
    redirect("/dashboard")
  }

  // Fetch question set for context
  const { data: questionSet } = await supabase.from("question_sets").select("*").eq("id", id).single()

  return <ResultsClient examResult={examResult} questionSet={questionSet} user={data.user} />
}
