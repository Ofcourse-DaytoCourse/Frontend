// 완전 새로운 로맨틱 메인 페이지 💕
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Sparkles, Users, Calendar, ArrowRight, Star, Gift, Zap, PlusCircle, List, Wallet, TrendingUp, Clock, FileText } from "lucide-react";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { getMyProfile, getCourses } from "@/lib/api";
import { paymentsApi } from "@/lib/payments-api";
import type { User } from "@/types/api";

interface DashboardData {
  currentBalance: number;
  monthlyUsage: number;
  savedCourses: number;
  user: User | null;
}

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    currentBalance: 0,
    monthlyUsage: 0,
    savedCourses: 0,
    user: null
  });
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // 대시보드 데이터 로드 함수
  const loadDashboardData = async (token: string, userId: string) => {
    try {
      setDataLoading(true);
      setDataError(null);

      // 병렬로 API 호출
      const [balanceRes, coursesRes, profileRes, historyRes] = await Promise.allSettled([
        paymentsApi.getBalanceSummary(token),
        getCourses(parseInt(userId), token),
        getMyProfile(userId, token),
        paymentsApi.getPaymentHistory({ page: 1, size: 50, history_type: 'usage' }, token)
      ]);

      const newData: DashboardData = {
        currentBalance: 0,
        monthlyUsage: 0,
        savedCourses: 0,
        user: null
      };

      // 잔액 정보
      if (balanceRes.status === 'fulfilled') {
        newData.currentBalance = balanceRes.value.total_balance;
      }

      // 코스 개수
      if (coursesRes.status === 'fulfilled') {
        console.log('Courses API result:', coursesRes.value);
        newData.savedCourses = coursesRes.value.courses?.length || 0;
      } else {
        console.error('Courses API failed:', coursesRes.reason);
      }

      // 사용자 정보
      if (profileRes.status === 'fulfilled') {
        newData.user = profileRes.value.user;
      }

      // 이번 달 사용량 계산
      if (historyRes.status === 'fulfilled') {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyUsage = historyRes.value.usage_histories?.reduce((total, history) => {
          const historyDate = new Date(history.created_at);
          if (historyDate.getMonth() === currentMonth && historyDate.getFullYear() === currentYear) {
            return total + history.amount;
          }
          return total;
        }, 0) || 0;
        
        newData.monthlyUsage = monthlyUsage;
      }

      setDashboardData(newData);
    } catch (error) {
      setDataError("대시보드 정보를 불러오는 중 오류가 발생했습니다.");
      console.error("Dashboard data loading error:", error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    // AuthGuard에서 모든 리다이렉트를 처리
    const timer = setTimeout(async () => {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) {
        router.push("/login");
        return;
      }
      
      // 로그인된 사용자는 메인 페이지 표시
      setIsLoading(false);
      
      // 대시보드 데이터 로드
      await loadDashboardData(token, user.user_id.toString());
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-300/30 to-rose-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto border-4 border-pink-300 border-t-rose-500 rounded-full animate-spin"></div>
                <Heart className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  사랑스러운 순간을 준비하는 중...
                </h2>
                <p className="text-rose-400 animate-pulse">💕 잠시만 기다려주세요 💕</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 relative overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-300/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-br from-rose-300/15 to-purple-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* 하트 플로팅 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <Heart 
            key={i}
            className={`absolute w-4 h-4 text-pink-300/40 animate-bounce`}
            style={{
              left: `${15 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: '4s'
            }}
          />
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative">
        <div className="container mx-auto px-4 py-16">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                {!isLoading && dashboardData.user?.nickname ? `${dashboardData.user.nickname}님의 ` : ""}데이트 코스 추천
              </span>
            </h1>
            <p className="text-lg text-gray-600">
              AI가 맞춤형 데이트 코스를 추천해드립니다 ✨
            </p>
          </div>

          {/* 메인 메뉴 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-20 max-w-7xl mx-auto">
            {/* AI 코스 추천 카드 */}
            <Card 
              className="bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push("/course")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-rose-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                    1,000원
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-rose-600 transition-colors duration-300">
                  AI 코스 추천
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  맞춤형 데이트 코스를 AI가 추천해드립니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-rose-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span>시작하기</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* 내 코스 관리 카드 */}
            <Card 
              className="bg-gradient-to-br from-purple-50 to-rose-50 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push("/list")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <List className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors duration-300">
                  내 코스 관리
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  저장된 코스를 확인하고 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-purple-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span>확인하기</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* 공유된 코스 카드 */}
            <Card 
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push("/shared")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                  공유된 코스
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  다른 사용자들의 데이트 코스를 둘러보세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-blue-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span>구경하기</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* 인기 장소 둘러보기 카드 */}
            <Card 
              className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push("/places")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-teal-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                    NEW
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors duration-300">
                  인기 장소 둘러보기
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  다른 사용자들이 추천하는 핫플을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-teal-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span>탐색하기</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* 내 후기 관리 카드 */}
            <Card 
              className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push("/my-reviews")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors duration-300">
                  내 후기 관리
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  작성한 후기를 확인하고 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-amber-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span>확인하기</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>

            {/* 마이페이지 카드 */}
            <Card 
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
              onClick={() => router.push("/mypage")}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                  마이페이지
                </CardTitle>
                <CardDescription className="text-gray-600 leading-relaxed">
                  프로필 및 계정 설정을 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-green-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  <span>설정하기</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 크레딧 관리 섹션 */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">크레딧 관리</h3>
            
            {/* 잔액 및 사용량 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 현재 잔액 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">현재 잔액</h4>
                    <p className="text-sm text-gray-600">사용 가능한 크레딧</p>
                  </div>
                </div>
                {dataLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : dataError ? (
                  <p className="text-rose-500 text-sm">로딩 오류</p>
                ) : (
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-rose-600">
                      {dashboardData.currentBalance.toLocaleString()}
                    </span>
                    <span className="text-gray-500">원</span>
                  </div>
                )}
              </div>

              {/* 이번 달 사용량 */}
              <div className="bg-white rounded-xl p-6 shadow-md">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">이번 달 사용량</h4>
                    <p className="text-sm text-gray-600">크레딧 사용 내역</p>
                  </div>
                </div>
                {dataLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : dataError ? (
                  <p className="text-pink-500 text-sm">로딩 오류</p>
                ) : (
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-pink-600">
                      {dashboardData.monthlyUsage.toLocaleString()}
                    </span>
                    <span className="text-gray-500">원</span>
                  </div>
                )}
              </div>
            </div>

            {/* 관리 버튼 */}
            <div className="text-center">
              <Button
                onClick={() => router.push("/payments/dashboard")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Wallet className="w-5 h-5 mr-2" />
                자세한 크레딧 관리
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}