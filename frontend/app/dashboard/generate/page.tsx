import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import GenerateClient from "@/components/dashboard/generate-client"

export default async function GeneratePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <GenerateClient user={data.user} />
}
