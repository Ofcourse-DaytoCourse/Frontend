"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Edit, Heart, HelpCircle, LogOut, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { UserStorage, TokenStorage, clearAuthStorage } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

export default function MyPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({
    name: "",
    nickname: "",
    email: "",
    joinDate: "",
  });
  const [partnerInfo, setPartnerInfo] = useState({
    nickname: "연결된 연인이 없습니다",
    status: "미연결",
  });
  const [isLoading, setIsLoading] = useState(true);

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
          const coupleData = await api(`/users/profile/couple-status?user_id=${currentUser.user_id}`, "GET", undefined, token);
          if (coupleData.couple_info) {
            setPartnerInfo({
              nickname: coupleData.couple_info.partner_nickname,
              status: "연결됨",
            });
          }
        } catch (coupleError) {
          // 커플 정보가 없는 경우 기본 상태 유지
          console.log("커플 정보 없음");
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center py-20">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">마이페이지</h1>
          <p className="text-gray-600">계정 정보와 설정을 관리하세요</p>
        </div>

        <div className="space-y-6">
          {/* 사용자 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                사용자 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-lg">{userInfo.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{userInfo.name}</h3>
                  <p className="text-gray-600">@{userInfo.nickname}</p>
                  <p className="text-sm text-gray-500">가입일: {userInfo.joinDate}</p>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/mypage/profile">
                  <Edit className="h-4 w-4 mr-2" />
                  프로필 수정
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 연인 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                연인 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">{partnerInfo.nickname}</p>
                  <p className="text-sm text-green-600">{partnerInfo.status}</p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/mypage/couple">
                  연인 관리
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 메뉴 */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200">
                <Button asChild variant="ghost" className="w-full justify-between h-14 px-6">
                  <Link href="/mypage/faq">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5" />
                      FAQ
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-between h-14 px-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLogout}
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="h-5 w-5" />
                    로그아웃
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
