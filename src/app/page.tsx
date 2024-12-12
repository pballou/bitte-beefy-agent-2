import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileJson, Github, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto p-8 bg-background">
      <Card className="max-w-2xl mx-auto border-border">
        <CardHeader>
          <CardTitle className="text-4xl text-foreground">
            Bitte Karma Agent
          </CardTitle>
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
              href="https://github.com/alexastrum/bitte-karma-agent"
              target="_blank"
              rel="noreferrer"
            >
              Source Code
              <Github className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
