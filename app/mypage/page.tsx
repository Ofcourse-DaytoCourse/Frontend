"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Edit, LogOut, Trash2, HelpCircle, FileText, Heart, Settings, CreditCard, Bell, ArrowUp, ArrowDown } from "lucide-react"
import { useEffect, useState } from "react"
import { UserStorage, TokenStorage, clearAuthStorage } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { api, deleteUser, getCourses, getMyPurchasedCourses } from "@/lib/api"
import { useBalanceData } from "@/hooks/use-balance-data"

export default function MyPage() {
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
  const [activityStats, setActivityStats] = useState({
    createdCount: 0,
    purchasedCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // day 정보 훅  
  const { balance, recentTransactions, isLoading: balanceLoading, error: balanceError } = useBalanceData(false, 0);

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

        // 활동 통계 조회
        try {
          // 생성한 코스 개수
          const coursesData = await getCourses(currentUser.user_id, token);
          const createdCount = coursesData.courses.filter(c => c.is_my_course).length;
          
          // 구매한 코스 개수
          let purchasedCount = 0;
          try {
            const purchasedData = await getMyPurchasedCourses(token);
            purchasedCount = purchasedData.length || 0;
          } catch (purchaseError) {
            console.log("구매한 코스 정보 없음");
          }

          setActivityStats({ createdCount, purchasedCount });
        } catch (statsError) {
          console.error("활동 통계 조회 실패:", statsError);
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
      return "0 day";
    }
    return amount.toLocaleString() + " day";
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">마이페이지</h1>
          <p className="text-lg text-text-secondary">
            계정 정보와 설정을 관리하고 연인과의 특별한 순간들을 확인해보세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Profile */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
              <CardContent className="p-8 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src="/placeholder.svg?width=96&height=96" />
                  <AvatarFallback className="text-2xl bg-primary-pink text-white">
                    {userInfo.name ? userInfo.name.charAt(0) : "게"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold text-text-primary mb-4">{userInfo.name || "게스트"}</h2>
                <Button asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6">
                  <Link href="/mypage/profile">
                    <Edit className="w-4 h-4 mr-2" />
                    프로필 수정
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Couple Info */}
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary-pink" />
                  연인 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-text-primary">
                  <div className="flex justify-between">
                    <span>연결상태:</span>
                    <span className={`font-semibold ${
                      partnerInfo.status === "연결됨" ? "text-primary-pink" : "text-text-secondary"
                    }`}>
                      {partnerInfo.status}
                    </span>
                  </div>
                  {partnerInfo.status === "연결됨" && (
                    <div className="flex justify-between">
                      <span>파트너:</span>
                      <span className="font-semibold">{partnerInfo.nickname}</span>
                    </div>
                  )}
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-4 rounded-full border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                >
                  <Link href="/mypage/couple">
                    연인 관리 <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4 text-text-primary">나의 활동</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-text-primary">
                    <span>생성한 코스</span>
                    <span className="font-bold text-primary-pink">{activityStats.createdCount}개</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>구매한 코스</span>
                    <span className="font-bold text-light-purple">{activityStats.purchasedCount}개</span>
                  </div>
                  <div className="flex justify-between text-text-primary">
                    <span>현재 day</span>
                    <span className="font-bold text-primary-pink">
                      {balance ? balance.total_balance.toLocaleString() : "0"} day
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* 결제 정보 */}
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-pink" />
                  결제 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary">day 정보를 불러오는 중...</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-primary-pink mb-2">
                      {balance ? balance.total_balance.toLocaleString() : "0"} day
                    </div>
                    <p className="text-text-secondary mb-6">현재 day</p>
                    <div className="flex gap-4 justify-center">
                      <Button asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6">
                        <Link href="/payments/guide">
                          충전하기
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-full border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                      >
                        <Link href="/payments/dashboard">
                          상세 관리
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 최근 활동 */}
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl">최근 활동</CardTitle>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary">활동 내역을 불러오는 중...</p>
                  </div>
                ) : recentTransactions && recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 5).map((transaction) => (
                      <div
                        key={`${transaction.type}-${transaction.id}`}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {transaction.type === 'charge' ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-text-secondary">
                              {new Date(transaction.created_at).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === 'charge' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'charge' ? '+' : '-'}
                            {transaction.amount.toLocaleString()} day
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="text-center pt-4">
                      <Button asChild variant="outline" className="rounded-full">
                        <Link href="/payments/dashboard">
                          전체 내역 보기
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-text-secondary mb-4">최근 활동이 없습니다</p>
                    <Button asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6">
                      <Link href="/course">
                        첫 코스 만들기
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 설정 */}
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary-pink" />
                  설정
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  asChild
                  variant="outline"
                  className="justify-start h-16 text-base rounded-xl border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                >
                  <Link href="/my-reviews">
                    <FileText className="w-5 h-5 mr-3 text-light-purple" />
                    내 후기 관리
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="justify-start h-16 text-base rounded-xl border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                >
                  <Link href="/mypage/faq">
                    <HelpCircle className="w-5 h-5 mr-3 text-light-purple" />
                    FAQ
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="justify-start h-16 text-base rounded-xl border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                >
                  <LogOut className="w-5 h-5 mr-3 text-light-purple" />
                  로그아웃
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  className="justify-start h-16 text-base rounded-xl"
                >
                  <Trash2 className="w-5 h-5 mr-3" />
                  회원탈퇴
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

  )
}