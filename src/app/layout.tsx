import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Web3Provider } from '@/components/providers/Web3Provider'
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/ErrorBoundary"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bitte Beefy Agent",
  description:
    "API for finding high-yield opportunities across multiple chains within the Beefy Finance ecosystem.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Web3Provider>
          <ErrorBoundary>
            {children}
            <Toaster />
          </ErrorBoundary>
        </Web3Provider>
      </body>
    </html>
  )
}