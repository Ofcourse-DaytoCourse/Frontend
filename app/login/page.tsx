"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-pink-600">DayToCourse</CardTitle>
          <CardDescription>사용자 맞춤형 데이트코스 추천 서비스</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900" onClick={handleKakaoLogin}>
            카카오 소셜 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
