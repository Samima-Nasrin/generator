import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import HistoryClient from "@/components/dashboard/history-client"

export default async function HistoryPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Fetch all question sets
  const { data: questionSets } = await supabase
    .from("question_sets")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: false })

  return <HistoryClient questionSets={questionSets || []} />
}
