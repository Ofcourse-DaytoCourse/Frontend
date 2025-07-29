"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Plus, MessageCircle, User, List, Share2, Home, Trash2, CreditCard, DollarSign, Heart, Sparkles, Star, Gift } from "lucide-react"
import { TokenStorage, clearAuthStorage } from "@/lib/storage"
import { useAuth } from "@/contexts/auth-context"
import { useBalanceData } from "@/hooks/use-balance-data"


interface GlobalMenuProps {
  children?: React.ReactNode
}

export function GlobalMenu({ children }: GlobalMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState({ name: "", nickname: "", user_id: "" })
  const pathname = usePathname()
  
  // 잔액 데이터 훅 - 로그인된 사용자만 자동 새로고침 비활성화 (페이지 새로고침 시에만 업데이트)
  const { balance, isLoading: isBalanceLoading, error: balanceError, refreshBalance } = useBalanceData(false)

  // 사이드바를 숨길 페이지들 (로그인/회원가입 페이지만)
  const hideSidebarPages = ["/login", "/signup"]
  const shouldHideSidebar = hideSidebarPages.some((page) => pathname.startsWith(page))

  // 사용자 정보 로드 (AuthContext에서)
  useEffect(() => {
    if (user && user.nickname) {
      setUserInfo({
        name: user.nickname,
        nickname: user.nickname,
        user_id: user.user_id.toString() || "",
      });
    }
  }, [user]);

  // 사이드바가 열릴 때 잔액 새로고침
  useEffect(() => {
    if (isOpen && userInfo.user_id) {
      // 포인트 새로고침
      refreshBalance();
    }
  }, [isOpen, userInfo.user_id, refreshBalance]);

  const menuItems = [
    { href: "/payments/guide", label: "충전하기", icon: CreditCard },
    { href: "/payments/dashboard", label: "day 확인", icon: DollarSign },
    { href: "/shared", label: "공유된 코스", icon: Share2 },
    { href: "/mypage", label: "마이페이지", icon: User },
  ]


  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  // 로그인/회원가입 페이지에서만 사이드바 숨김
  if (shouldHideSidebar) {
    return <>{children}</>
  }

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      clearAuthStorage();
      window.location.href = "/login"
    }
  }

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-white/80 backdrop-blur-lg border-2 border-pink-200 hover:border-pink-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          <Menu className="h-5 w-5 text-pink-600" />
        </Button>
      </div>

      {/* 오버레이 - 검정 배경 제거하고 투명 + 블러로 변경 */}
      {isOpen && <div className="fixed inset-0 bg-white/10 backdrop-blur-md z-40" onClick={() => setIsOpen(false)} />}

      {/* 슬라이드 메뉴 */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-white via-pink-50/50 to-purple-50/50 backdrop-blur-lg border-r-2 border-pink-200/50 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-300/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -right-10 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          {/* 헤더 */}
          <div className="relative p-6 border-b border-pink-200/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-0 transition-transform duration-300">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">데이트 코스 추천</h2>
                  <p className="text-xs text-pink-500 font-medium">Love is in the details ✨</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-pink-100 transition-colors duration-300"
              >
                <X className="h-4 w-4 text-pink-600" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-2xl border border-pink-200 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-pink-200 shadow-lg">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-to-br from-rose-400 to-pink-500 text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{userInfo.nickname}님</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">VIP 회원</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 잔액 표시 - 로그인된 사용자만 */}
              {user && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-bold text-blue-800">보유</span>
                  </div>
                  <div>
                    {isBalanceLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-sm text-gray-500">로딩중...</span>
                      </div>
                    ) : balanceError ? (
                      null // 에러 시에는 표시하지 않기
                    ) : balance ? (
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-blue-900">
                          {balance.total_balance.toLocaleString()} day
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">로딩중...</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 채팅 관련 버튼들 */}
          <div className="relative p-6 border-b border-pink-200/50 space-y-4">
            {/* 새 채팅 생성 버튼 */}
            <Button
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                setIsOpen(false)
                window.location.href = "/course"
              }}
            >
              <Plus className="h-5 w-5 mr-3" />
              새로운 채팅 생성
              <Sparkles className="h-4 w-4 ml-3 animate-pulse" />
            </Button>
            
            {/* 채팅 기록 보기 버튼 */}
            <Button
              variant="outline"
              className="w-full border-2 border-pink-300 text-pink-600 hover:bg-pink-50 py-3 rounded-2xl shadow-lg transition-all duration-300"
              onClick={() => {
                setIsOpen(false)
                window.location.href = "/course"
              }}
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              채팅 기록 보기
            </Button>
          </div>

          {/* 항상 표시되는 메뉴 */}
          <div className="relative bg-gradient-to-b from-purple-50/50 to-pink-50/50">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                  <Gift className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-gray-800">빠른 메뉴</span>
              </div>
              
              <div className="space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                        isActive(item.href) 
                          ? "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 font-bold border-2 border-pink-200 shadow-lg" 
                          : "text-gray-700 hover:bg-white/80 hover:shadow-lg"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isActive(item.href)
                          ? "bg-gradient-to-br from-pink-400 to-rose-500"
                          : `bg-gradient-to-br ${
                              index % 4 === 0 ? 'from-blue-400 to-indigo-500' :
                              index % 4 === 1 ? 'from-green-400 to-emerald-500' :
                              index % 4 === 2 ? 'from-purple-400 to-pink-500' :
                              'from-orange-400 to-red-500'
                            } group-hover:scale-110`
                      }`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                      {isActive(item.href) && (
                        <div className="ml-auto flex items-center gap-1">
                          {[...Array(3)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-80" : "ml-0"}`}>{children}</div>
    </>
  )
}

// 기존 컴포넌트들은 호환성을 위해 유지
export function Sidebar() {
  return null
}

export function MobileSidebar() {
  return null
}