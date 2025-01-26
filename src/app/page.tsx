'use client'

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, FileJson, AlertTriangle, Bell } from "lucide-react";
import { ConnectButton } from '@/components/ui/ConnectButton'
import { useToast } from "@/components/ui/use-toast"
import { SiGithub as GithubIcon } from '@icons-pack/react-simple-icons'

export default function Home() {
  const { toast } = useToast()

  return (
    <main className="container mx-auto p-8 bg-background">
      <div className="flex justify-end">
        <ConnectButton />
      </div>
      <Card className="max-w-2xl mx-auto border-border">
        <CardHeader>
          <CardTitle className="text-4xl text-foreground">
            Bitte Beefy Agent
          </CardTitle>
          <CardDescription>
            Find the best yield opportunities across 23 chains in the Beefy ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button
            variant="outline"
            className="w-full justify-between hover:bg-accent"
            asChild
          >
            <a
              href="https://docs.bitte.ai/agents/quick-start"
              target="_blank"
              rel="noreferrer"
            >
              Documentation
              <BookOpen className="h-4 w-4 ml-2" />
            </a>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between hover:bg-accent"
            asChild
          >
            <Link href="/.well-known/ai-plugin.json">
              OpenAPI Spec
              <FileJson className="h-4 w-4 ml-2" />
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between hover:bg-accent"
            asChild
          >
            <Link href="/api/swagger">
              Swagger
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between hover:bg-accent"
            asChild
          >
            <a
              href="https://github.com/agentool/bitte-beefy-agent"
              target="_blank"
              rel="noreferrer"
            >
              Source Code
              <GithubIcon className="h-4 w-4 ml-2" />
            </a>
          </Button>

          <Button
            variant="destructive"
            className="w-full justify-between"
            onClick={() => {
              throw new Error('Test Error Boundary')
            }}
          >
            Test Error Boundary
            <AlertTriangle className="h-4 w-4 ml-2" />
          </Button>

          <Button
            variant="secondary"
            className="w-full justify-between"
            onClick={() => {
              toast({
                title: "Test Toast",
                description: "This is a test notification",
                variant: "default",
              })
            }}
          >
            Test Toast
            <Bell className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}