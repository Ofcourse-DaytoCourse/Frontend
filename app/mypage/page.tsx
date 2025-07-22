"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Edit, Heart, HelpCircle, LogOut, ChevronRight, Trash2, Wallet, CreditCard, Sparkles, Users, Star, Gift, ArrowRight, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { UserStorage, TokenStorage, clearAuthStorage } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { api, deleteUser } from "@/lib/api"
import { useBalanceData } from "@/hooks/use-balance-data"
import { ThemeSelector } from "@/components/theme-selector"
import { useTheme } from "@/contexts/theme-context"

export default function MyPage() {
  const { themeConfig } = useTheme();
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    name: "",
    nickname: "",
    email: "",
    joinDate: "",
  });
  const [partnerInfo, setPartnerInfo] = useState({
    nickname: "",
    status: "미연결",
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // 잔액 정보 훅
  const { balance, isLoading: balanceLoading, error: balanceError } = useBalanceData(false, 0);

  useEffect(() => {
    const currentUser = UserStorage.get();
    const token = TokenStorage.get();
    
    if (!currentUser || !token) {
      router.replace("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        // 사용자 기본 정보 조회
        const userData = await api(`/users/profile/me?user_id=${currentUser.user_id}`, "GET", undefined, token);
        
        setUserInfo({
          name: userData.user.nickname,
          nickname: userData.user.nickname,
          email: userData.user.email || "",
          joinDate: userData.user.created_at ? new Date(userData.user.created_at).toLocaleDateString() : "",
        });

        // 커플 정보 조회
        try {
          const coupleData = await api(`/couples/status?user_id=${currentUser.user_id}`, "GET", undefined, token);
          if (coupleData.has_partner && coupleData.couple_info) {
            setPartnerInfo({
              nickname: coupleData.couple_info.partner_nickname,
              status: "연결됨",
            });
          } else {
            setPartnerInfo({ nickname: "", status: "미연결" });
          }
        } catch (coupleError) {
          console.log("커플 정보 없음");
          setPartnerInfo({ nickname: "", status: "미연결" });
        }
        
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error);
        // 로컬 스토리지의 정보로 폴백
        setUserInfo({
          name: currentUser.nickname,
          nickname: currentUser.nickname,
          email: currentUser.email || "",
          joinDate: "",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    clearAuthStorage();
    router.push("/login");
  };

  const handleDeleteUser = async () => {
    if (!confirm("정말로 회원탈퇴를 하시겠습니까? 관련된 모든 정보가 삭제되며 복구할 수 없습니다.")) {
      return;
    }
    
    const currentUser = UserStorage.get();
    const token = TokenStorage.get();

    if (!currentUser || !token) {
      alert("로그인 정보가 없습니다.");
      router.push("/login");
      return;
    }

    try {
      await deleteUser(
        {
          user_id: currentUser.user_id,
          nickname: userInfo.nickname,
          email: userInfo.email,
        },
        token
      );
      alert("회원탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.");
      clearAuthStorage();
      router.push("/login");
    } catch (error: any) {
      console.error("회원탈퇴 실패:", error);
      alert("회원탈퇴 처리 중 오류가 발생했습니다: " + error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) {
      return "0원";
    }
    return amount.toLocaleString() + "원";
  };

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
                  사용자 정보를 불러오는 중...
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
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.bgGradient} relative overflow-hidden`}>
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-300/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-gradient-to-br from-rose-300/15 to-purple-400/15 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* 하트 플로팅 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <Heart 
            key={i}
            className={`absolute w-4 h-4 text-pink-300/40 animate-bounce`}
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + (i % 2) * 20}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: '3s'
            }}
          />
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative">
        <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
          {/* 헤더 섹션 */}
          <div className="text-center space-y-6 mb-12">
            {/* 로고 영역 */}
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
            
            {/* 메인 타이틀 */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  마이페이지
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                계정 정보와 설정을 관리하고 연인과의 특별한 순간들을 확인해보세요
                <br />
                <span className="text-rose-500 font-semibold">Your love story starts here 💕</span>
              </p>
              
              {/* 데코레이션 */}
              <div className="flex items-center justify-center space-x-3 pt-4">
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-pink-500 animate-spin" />
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        <div className="max-w-4xl mx-auto space-y-8">{/* 새로운 래퍼 추가 */}

          {/* 사용자 정보 */}
          <Card className="bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="h-2 md:h-3 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-t-2xl md:rounded-t-3xl"></div>
            <CardHeader className="pb-6 pt-8">
              <CardTitle className="flex items-center gap-3 md:gap-4 text-xl md:text-2xl font-bold text-gray-800">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-pink-200 shadow-xl">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-rose-400 to-pink-500 text-white">
                      {userInfo.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{userInfo.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0 px-3 py-1 rounded-full">
                        @{userInfo.nickname}
                      </Badge>
                    </div>
                    <p className="text-sm md:text-base text-gray-500 flex items-center justify-center md:justify-start gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      가입일: {userInfo.joinDate}
                    </p>
                  </div>
                </div>
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 py-3">
                <Link href="/mypage/profile">
                  <Edit className="h-4 w-4 mr-2" />
                  프로필 수정
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 연인 정보 */}
          <Card className="bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="h-2 md:h-3 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500 rounded-t-2xl md:rounded-t-3xl"></div>
            <CardHeader className="pb-6 pt-8">
              <CardTitle className="flex items-center gap-3 md:gap-4 text-xl md:text-2xl font-bold text-gray-800">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                연인 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
                {partnerInfo.status === "연결됨" ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-xl md:text-2xl font-bold text-gray-800">{partnerInfo.nickname}</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                          <p className="text-sm md:text-base text-green-600 font-semibold">연결됨</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-2">
                        <Heart className="w-4 h-4 text-white fill-current" />
                      </div>
                      <p className="text-xs text-green-600 font-medium">커플 💕</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg">
                      <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-gray-800 mb-2">미연결</p>
                      <p className="text-sm md:text-base text-gray-500 leading-relaxed">
                        연인을 연결하고 특별한 데이트 코스를<br />
                        함께 공유해보세요 💕
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 py-3">
                <Link href="/mypage/couple">
                  <Heart className="h-4 w-4 mr-2" />
                  연인 관리
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 잔액 정보 */}
          <Card className="bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="h-2 md:h-3 bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 rounded-t-2xl md:rounded-t-3xl"></div>
            <CardHeader className="pb-6 pt-8">
              <CardTitle className="flex items-center gap-3 md:gap-4 text-xl md:text-2xl font-bold text-gray-800">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                잔액 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {balanceLoading ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-cyan-200 rounded-full flex items-center justify-center mb-4">
                    <div className="w-8 h-8 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-500 animate-pulse">잔액 정보를 불러오는 중...</p>
                </div>
              ) : balanceError ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 text-sm">{balanceError}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm md:text-base text-gray-600 mb-2">현재 잔액</p>
                        <p className="text-3xl md:text-4xl font-black text-blue-600">
                          {balance ? formatCurrency(balance.total_balance) : "0원"}
                        </p>
                      </div>
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-xl">
                        <Wallet className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 py-3">
                      <Link href="/payments/dashboard">
                        <CreditCard className="h-4 w-4 mr-2" />
                        잔액 확인
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-2 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 py-3">
                      <Link href="/payments/guide">
                        <Wallet className="h-4 w-4 mr-2" />
                        충전하기
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 메뉴 */}
          <Card className="bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <div className="h-2 md:h-3 bg-gradient-to-r from-gray-400 via-slate-500 to-gray-600 rounded-t-2xl md:rounded-t-3xl"></div>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                <Button asChild variant="ghost" className="w-full justify-between h-16 md:h-20 px-6 md:px-8 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-300 rounded-none">
                  <Link href="/my-reviews">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <span className="text-base md:text-lg font-medium">내 후기 관리</span>
                    </div>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="w-full justify-between h-16 md:h-20 px-6 md:px-8 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 rounded-none">
                  <Link href="/mypage/faq">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                        <HelpCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <span className="text-base md:text-lg font-medium">FAQ</span>
                    </div>
                    <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-gray-400" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-16 md:h-20 px-6 md:px-8 text-orange-600 hover:text-orange-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 rounded-none"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                      <LogOut className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-base md:text-lg font-medium">로그아웃</span>
                  </div>
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-orange-400" />
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-between h-16 md:h-20 px-6 md:px-8 text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 rounded-b-2xl md:rounded-b-3xl"
                  onClick={handleDeleteUser}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Trash2 className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-base md:text-lg font-medium">회원탈퇴</span>
                  </div>
                  <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-red-400" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 테마 선택 카드 */}
          <ThemeSelector />

          {/* 하단 메시지 */}
          <div className="text-center pt-8 md:pt-12">
            <div className="space-y-4">
              <p className="text-gray-500 text-sm animate-pulse px-4">
                언제나 특별한 추억을 만들어가세요 💕✨
              </p>
              <div className="flex items-center justify-center space-x-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.3}s`}} />
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}