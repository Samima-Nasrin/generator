import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ExamClient from "@/components/dashboard/exam-client"

export default async function ExamPage({
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

  // Fetch question set
  const { data: questionSet, error: setError } = await supabase
    .from("question_sets")
    .select("*")
    .eq("id", id)
    .eq("user_id", data.user.id)
    .single()

  if (setError || !questionSet) {
    redirect("/dashboard")
  }

  return <ExamClient questionSet={questionSet} user={data.user} />
}
