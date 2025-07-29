"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Bot, CreditCard, Heart, MessageSquare, Star, Users, FileText, Settings } from "lucide-react"
import Link from "next/link"
import { useBalanceData } from "@/hooks/use-balance-data"
import { useState, useEffect } from "react"

const dashboardItems = [
  {
    title: "AI 코스 추천",
    description: "AI와 함께 완벽한 데이트를 설계하세요.",
    href: "/course",
    icon: <Bot className="w-8 h-8 text-primary-pink" />,
  },
  {
    title: "내 코스 관리",
    description: "내가 만들고 저장한 코스를 확인하세요.",
    href: "/list",
    icon: <Heart className="w-8 h-8 text-light-purple" />,
  },
  {
    title: "공유된 코스",
    description: "연인과 함께 공유하고 있는 코스 목록입니다.",
    href: "/shared",
    icon: <Users className="w-8 h-8 text-primary-pink" />,
  },
  {
    title: "커뮤니티 코스",
    description: "다른 커플들의 검증된 코스를 둘러보세요.",
    href: "/community/courses",
    icon: <MessageSquare className="w-8 h-8 text-light-purple" />,
    badge: "HOT",
  },
  {
    title: "인기 장소",
    description: "지금 가장 핫한 데이트 장소를 찾아보세요.",
    href: "/places",
    icon: <Star className="w-8 h-8 text-primary-pink" />,
    badge: "NEW",
  },
  {
    title: "내 후기 관리",
    description: "내가 작성한 후기들을 관리합니다.",
    href: "/my-reviews",
    icon: <FileText className="w-8 h-8 text-light-purple" />,
  },
]

export default function DashboardPage() {
  // day 정보 훅
  const { balance, recentTransactions, isLoading: balanceLoading } = useBalanceData(false, 0);
  
  // 이번 달 사용량 계산
  const getMonthlyUsage = () => {
    if (!recentTransactions || recentTransactions.length === 0) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return recentTransactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        return transaction.type === 'usage' && 
               transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((total, transaction) => total + transaction.amount, 0);
  };
  
  const monthlyUsage = getMonthlyUsage();
  
  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Main Dashboard Cards */}
        {dashboardItems.map((item) => (
          <Card
            key={item.title}
            className="flex flex-col border-gray-200 shadow-sm hover:shadow-lg transition-shadow rounded-2xl"
          >
            <CardHeader className="flex-row items-center gap-4 pb-4">
              <div className="w-16 h-16 bg-secondary-pink rounded-xl flex items-center justify-center">{item.icon}</div>
              <div>
                <CardTitle className="text-xl font-bold text-text-primary">{item.title}</CardTitle>
                {item.badge && (
                  <span
                    className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full ${
                      item.badge === "HOT" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-text-secondary">{item.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <span className="text-lg font-bold text-primary-pink">{item.price || ""}</span>
              <Button asChild variant="ghost" className="text-primary-pink hover:bg-secondary-pink">
                <Link href={item.href}>
                  바로가기 <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}

        {/* My Page and Credit Cards */}
        <Card className="md:col-span-2 lg:col-span-1 flex flex-col border-gray-200 shadow-sm hover:shadow-lg transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-text-primary">마이페이지</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-text-secondary">내 정보, 설정, 결제 내역을 관리하세요.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-primary-pink text-white hover:bg-primary-pink/90">
              <Link href="/mypage">
                <Settings className="w-4 h-4 mr-2" />
                마이페이지로 이동
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 lg:col-span-2 flex flex-col border-gray-200 shadow-sm hover:shadow-lg transition-shadow rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-text-primary">day 관리</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-secondary">현재 day</p>
              {balanceLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-primary-pink">
                  {balance ? balance.total_balance.toLocaleString() : "0"} day
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-text-secondary">이번 달 사용량</p>
              {balanceLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-primary-pink">
                  {monthlyUsage.toLocaleString()} day
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/payments/dashboard">
                <CreditCard className="w-4 h-4 mr-2" />
                자세한 day 관리
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}