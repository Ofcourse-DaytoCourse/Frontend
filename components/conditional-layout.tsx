"use client"

import { usePathname } from "next/navigation"
import { GlobalMenu } from "@/components/sidebar"
import { Header } from "@/components/header"
import { AppSidebar } from "@/components/app-sidebar"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // 로그인 관련 페이지만 예외로 처리 (새 디자인 적용 안함)
  const authPages = ['/login', '/signup', '/login/callback']
  if (authPages.some(page => pathname.startsWith(page))) {
    return <div className="min-h-screen bg-background">{children}</div>
  }
  
  // 나머지 모든 페이지는 새 디자인 적용
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}