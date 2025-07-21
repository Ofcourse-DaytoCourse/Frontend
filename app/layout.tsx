import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthGuard } from "@/components/auth-guard"
import { GlobalMenu } from "@/components/sidebar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "데이트 코스 추천",
  description: "AI가 추천하는 맞춤형 데이트 코스",
    generator: 'Take a looks lab'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <AuthGuard>
              <GlobalMenu>
                <div className="min-h-screen bg-background">{children}</div>
              </GlobalMenu>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
