"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bot, ChevronRight, Heart, Home, LogOut, Users, Menu, X, User, DollarSign, CreditCard, List, Share2, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useBalanceData } from "@/hooks/use-balance-data"
import { clearAuthStorage } from "@/lib/storage"

const menuItems = [
  { href: "/dashboard", label: "메인", icon: <Home className="w-5 h-5" /> },
  { href: "/course", label: "AI 코스 추천", icon: <Bot className="w-5 h-5" /> },
  { href: "/list", label: "내 코스 관리", icon: <Heart className="w-5 h-5" /> },
  { href: "/community/courses", label: "커뮤니티", icon: <Users className="w-5 h-5" /> },
  { href: "/places", label: "인기 장소", icon: <Star className="w-5 h-5" /> },
]

const quickMenuItems = [
  { href: "/payments/guide", label: "충전하기", icon: CreditCard },
  { href: "/payments/dashboard", label: "day 확인", icon: DollarSign },
  { href: "/shared", label: "공유된 코스", icon: Share2 },
  { href: "#", label: "채팅 기록", icon: List, action: "chatHistory" },
  { href: "/mypage", label: "마이페이지", icon: User },
]

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user } = useAuth()
  const { balance, isLoading: isBalanceLoading, error: balanceError } = useBalanceData(false)
  const pathname = usePathname()

  const handleChatHistoryClick = () => {
    // course 페이지일 때만 채팅 기록을 토글
    if (pathname === '/course') {
      // 전역 이벤트를 통해 course 페이지에 알림
      window.dispatchEvent(new CustomEvent('toggleChatHistory'))
    } else {
      // course 페이지가 아니면 course 페이지로 이동
      window.location.href = '/course'
    }
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      clearAuthStorage()
      window.location.href = "/login"
    }
  }

  return (
    <aside className={`hidden lg:flex flex-col border-r border-gray-200 bg-white transition-all duration-300 z-20 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Toggle Button */}
      <div className="h-16 px-4 border-b border-gray-200 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center hover:bg-secondary-pink"
        >
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </Button>
      </div>

      <div className="flex-1 p-4">
        {/* User Profile */}
        {!isCollapsed && (
          <div className="text-center mb-6">
            <Avatar className="w-16 h-16 mx-auto mb-2">
              <AvatarImage src="/placeholder.svg?width=64&height=64" />
              <AvatarFallback className="bg-primary-pink text-white">
                {user?.nickname ? user.nickname.charAt(0) : <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-primary-pink">{user?.nickname || "게스트"}</h3>
            {user ? (
              <>
                {/* 실제 day 표시 */}
                {isBalanceLoading ? (
                  <p className="text-sm text-text-secondary mt-1">day 로딩중...</p>
                ) : balanceError ? (
                  <p className="text-sm text-red-500 mt-1">day 로딩 실패</p>
                ) : balance ? (
                  <p className="text-sm text-text-secondary mt-1">보유: {balance.total_balance.toLocaleString()} day</p>
                ) : (
                  <p className="text-sm text-text-secondary mt-1">보유: 0 day</p>
                )}
              </>
            ) : (
              <p className="text-sm text-text-secondary font-semibold">로그인해주세요</p>
            )}
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex flex-col gap-2 mb-8">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              className={`justify-start text-base p-3 hover:bg-secondary-pink ${isActive(item.href) ? 'bg-secondary-pink text-primary-pink' : ''}`}
            >
              <Link href={item.href}>
                {item.icon}
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            </Button>
          ))}
        </nav>

        {/* Quick Menu */}
        {!isCollapsed && (
          <div>
            <h4 className="px-4 text-sm font-semibold text-text-secondary mb-2">빠른 메뉴</h4>
            <div className="flex flex-col gap-1">
              {quickMenuItems.map((item) => {
                const Icon = item.icon
                
                // 채팅 기록 버튼은 특별 처리
                if (item.action === 'chatHistory') {
                  return (
                    <Button
                      key={item.label}
                      variant="ghost"
                      onClick={handleChatHistoryClick}
                      className="w-full justify-between text-text-secondary hover:text-text-primary p-3"
                    >
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )
                }
                
                return (
                  <Button
                    key={item.label}
                    asChild
                    variant="ghost"
                    className="justify-between text-text-secondary hover:text-text-primary p-3"
                  >
                    <Link href={item.href}>
                      <div className="flex items-center">
                        <Icon className="w-4 h-4 mr-3" />
                        {item.label}
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Logout Button - 로그인된 사용자에게만 표시 */}
      {user && (
        <div className="p-4 border-t border-gray-200">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className={`w-full justify-start border-gray-300 bg-transparent ${isCollapsed ? 'px-2' : ''}`}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">로그아웃</span>}
          </Button>
        </div>
      )}
      
      {/* 게스트 사용자를 위한 로그인 버튼 */}
      {!user && (
        <div className="p-4 border-t border-gray-200">
          <Button 
            onClick={() => window.location.href = '/login'}
            className={`w-full justify-start bg-primary-pink hover:bg-primary-pink/90 text-white ${isCollapsed ? 'px-2' : ''}`}
          >
            <User className="w-4 h-4" />
            {!isCollapsed && <span className="ml-2">로그인</span>}
          </Button>
        </div>
      )}
    </aside>
  )
}