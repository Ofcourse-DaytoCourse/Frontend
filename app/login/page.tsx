"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ArrowRight, Sparkles, MapPin, Bot } from "lucide-react"

export default function LoginPage() {
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* 로고 섹션 */}
        <div className="text-center space-y-6">
          {/* 로고 아이콘 */}
          <div className="w-20 h-20 bg-primary-pink rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Heart className="w-10 h-10 text-white" />
          </div>
          
          {/* 메인 타이틀 */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary">
              DayToCourse
            </h1>
            
            <p className="text-lg text-text-secondary leading-relaxed">
              나만의 데이트 코스,
              <br />
              <span className="text-primary-pink font-semibold">AI가 다 짜줄게요</span>
            </p>
          </div>
        </div>

        {/* 로그인 카드 */}
        <Card className="bg-white rounded-3xl shadow-2xl border border-gray-100 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
          <CardHeader className="text-center pt-8 pb-6">
            <CardTitle className="text-2xl font-bold text-text-primary mb-3">
              환영합니다! 💕
            </CardTitle>
            <CardDescription className="text-text-secondary text-base leading-relaxed">
              AI가 추천하는 특별한 데이트 코스를
              <br />
              <span className="text-primary-pink font-medium">지금 바로 시작해보세요</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            {/* 카카오 로그인 버튼 */}
            <Button 
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 py-4 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleKakaoLogin}
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 bg-yellow-300 rounded-full flex items-center justify-center">
                  <span className="text-sm">💬</span>
                </div>
                <span>카카오로 시작하기</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </Button>

            {/* 가입 혜택 */}
            <div className="bg-secondary-pink rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-lg">🎁</span>
                </div>
                <span className="text-lg font-bold text-primary-pink">회원가입 혜택</span>
              </div>
              <div className="text-2xl font-bold text-primary-pink mb-1">3,000 day</div>
              <div className="text-text-primary text-sm font-medium">가입 즉시 day 지급</div>
            </div>
            
            {/* 추가 정보 */}
            <div className="text-center">
              <p className="text-xs text-text-secondary">
                간편한 소셜 로그인으로 안전하고 빠르게 시작하세요
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 서비스 특징 미리보기 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Bot, title: "AI 맞춤 추천" },
            { icon: MapPin, title: "실시간 정보" },
            { icon: Sparkles, title: "커뮤니티 공유" }
          ].map((feature, index) => (
            <Card key={index} className="bg-gray-50 rounded-2xl border-none shadow-sm p-4 text-center">
              <div className="w-10 h-10 bg-primary-pink rounded-xl flex items-center justify-center mx-auto mb-3">
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-medium text-text-primary leading-tight">{feature.title}</p>
            </Card>
          ))}
        </div>

        {/* 하단 메시지 */}
        <div className="text-center">
          <p className="text-text-secondary text-sm">
            💕 감성은 살리고, 고민은 줄이고 💕
          </p>
        </div>
      </div>
    </div>
  )
}
