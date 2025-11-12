import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Card className="border-border/50">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Check your email</CardTitle>
            <CardDescription className="text-center">We've sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Please check your email inbox and click the confirmation link to activate your account. Once confirmed,
              you can sign in and start generating exams.
            </p>
            <Link href="/auth/login">
              <Button className="w-full bg-transparent" variant="outline">
                Back to Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
