"use client"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Menu, X, UserCircle, ChevronDown, Bot, Users, User, HelpCircle, Heart } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useBalanceData } from "@/hooks/use-balance-data"

export const Header = () => {
  const { user } = useAuth()
  const { balance } = useBalanceData(false)
  const [showMegaMenu, setShowMegaMenu] = useState(false)
  
  const menuItems = [
    {
      name: "AI 코스",
      icon: <Bot className="w-4 h-4" />,
      items: [
        { name: "AI 코스 추천", href: "/course" },
        { name: "내 코스 관리", href: "/list" },
      ]
    },
    {
      name: "커뮤니티",
      icon: <Users className="w-4 h-4" />,
      items: [
        { name: "코스 둘러보기", href: "/community/courses" },
        { name: "인기 장소", href: "/places" },
      ]
    },
    {
      name: "연인",
      icon: <Heart className="w-4 h-4" />,
      items: [
        { name: "커플 정보", href: "/mypage/couple" },
        { name: "연인과 공유된 코스", href: "/shared" },
      ]
    },
    {
      name: "내 정보",
      icon: <User className="w-4 h-4" />,
      items: [
        { name: "마이페이지", href: "/mypage" },
        { name: "내 후기 관리", href: "/my-reviews" },
        { name: "결제/충전", href: "/payments/guide" },
        { name: "잔액 확인", href: "/payments/dashboard" },
      ]
    },
    {
      name: "고객지원",
      icon: <HelpCircle className="w-4 h-4" />,
      items: [
        { name: "기능 소개", href: "#features" },
        { name: "FAQ", href: "/mypage/faq" },
      ]
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-text-primary">
            Day<span className="text-primary-pink">ToCourse</span>
          </Link>
          <nav 
            className="hidden lg:flex items-center gap-2 relative"
            onMouseEnter={() => setShowMegaMenu(true)}
            onMouseLeave={() => setShowMegaMenu(false)}
          >
            {menuItems.map((menu) => (
              <button 
                key={menu.name}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary-pink transition-colors rounded-md hover:bg-secondary-pink/50"
              >
                {menu.icon}
                {menu.name}
              </button>
            ))}
            
            {/* 메가 메뉴 - 모든 카테고리 한번에 표시 */}
            <div className={`absolute top-full left-0 mt-1 w-[800px] bg-white rounded-lg shadow-xl border border-gray-200 p-6 transition-all duration-200 ${
              showMegaMenu ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'
            }`}>
              <div className="grid grid-cols-5 gap-6">
                {menuItems.map((menu) => (
                  <div key={menu.name} className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-primary border-b border-gray-100 pb-2">
                      {menu.icon}
                      {menu.name}
                    </div>
                    <div className="space-y-2">
                      {menu.items.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block text-sm text-text-secondary hover:text-primary-pink hover:bg-secondary-pink/30 p-2 rounded-md transition-colors"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link 
                href="/mypage" 
                className="text-sm text-text-secondary hover:text-primary-pink transition-colors cursor-pointer"
              >
                {user.nickname}님
              </Link>
              <span className="text-text-secondary">|</span>
              <Link 
                href="/payments/dashboard" 
                className="text-sm text-text-secondary hover:text-primary-pink transition-colors cursor-pointer"
              >
                {balance?.total_balance?.toLocaleString() || 0} day
              </Link>
            </div>
          ) : (
            <Button
              asChild
              variant="outline"
              className="rounded-full border-primary-pink text-primary-pink hover:bg-secondary-pink hover:text-primary-pink bg-transparent"
            >
              <Link href="/login">카카오 로그인</Link>
            </Button>
          )}
        </div>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs bg-white p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-brand-border">
                  <Link href="/" className="flex items-center gap-2 text-xl font-bold text-text-primary">
                    Day<span className="text-primary-pink">ToCourse</span>
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetClose>
                </div>
                <nav className="flex flex-col gap-2 p-4">
                  {menuItems.map((menu) => (
                    <div key={menu.name} className="border-b border-gray-100 pb-3 mb-3 last:border-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-2">
                        {menu.icon}
                        {menu.name}
                      </div>
                      <div className="flex flex-col gap-1 ml-6">
                        {menu.items.map((item) => (
                          <SheetClose asChild key={item.name}>
                            <Link
                              href={item.href}
                              className="text-text-secondary hover:text-primary-pink transition-colors py-1"
                            >
                              {item.name}
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
                <div className="mt-auto p-4 border-t border-brand-border">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle className="w-5 h-5 text-text-secondary" />
                    <span className="font-semibold">{user?.nickname || "게스트"}</span>
                    <span className="font-bold text-primary-pink">{balance?.total_balance?.toLocaleString() || 0} day</span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}