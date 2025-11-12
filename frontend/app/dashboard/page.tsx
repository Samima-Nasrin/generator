import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import DashboardClient from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch user's question sets
  const { data: questionSets } = await supabase
    .from("question_sets")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  // Fetch user's exam results
  const { data: examResults } = await supabase
    .from("exam_results")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return <DashboardClient user={data.user} questionSets={questionSets || []} examResults={examResults || []} />
}
