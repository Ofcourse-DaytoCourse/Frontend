"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Users, Sparkles, Star, Gift, ArrowRight, Zap, MapPin } from "lucide-react"

export default function LoginPage() {
  const handleKakaoLogin = () => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
    window.location.href = kakaoAuthUrl;
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
        {[...Array(12)].map((_, i) => (
          <Heart 
            key={i}
            className={`absolute w-4 h-4 text-pink-300/30 animate-bounce`}
            style={{
              left: `${10 + i * 8}%`,
              top: `${15 + (i % 4) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: '5s'
            }}
          />
        ))}
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* 로고 섹션 */}
          <div className="text-center space-y-6">
            {/* 로고 아이콘 */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            
            {/* 메인 타이틀 */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  DayToCourse
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                AI가 만드는 특별한 데이트 코스
                <br />
                <span className="text-rose-500 font-semibold">Love starts here ✨</span>
              </p>
              
              {/* 데코레이션 */}
              <div className="flex items-center justify-center space-x-4 pt-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
                <Sparkles className="w-6 h-6 text-pink-500 animate-spin" />
              </div>
            </div>
          </div>

          {/* 로그인 카드 */}
          <Card className="bg-white/80 backdrop-blur-lg rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
            <div className="h-2 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-t-3xl"></div>
            <CardHeader className="text-center pt-8 pb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-3">
                환영합니다! 💕
              </CardTitle>
              <CardDescription className="text-gray-600 text-base leading-relaxed">
                로맨틱한 데이트 코스 추천을 받아보세요
                <br />
                <span className="text-pink-500 font-medium">간편한 소셜 로그인으로 시작하기</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              {/* 카카오 로그인 버튼 */}
              <Button 
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 hover:from-yellow-500 hover:via-orange-500 hover:to-yellow-600 text-gray-900 py-4 text-lg font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-0"
                onClick={handleKakaoLogin}
              >
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-300 rounded-full flex items-center justify-center">
                    <span className="text-sm">💬</span>
                  </div>
                  <span>카카오로 시작하기</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </Button>
              
              {/* 추가 정보 */}
              <div className="text-center space-y-4 pt-4">
                <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span>안전한 로그인</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⚡</span>
                    </div>
                    <span>간편 가입</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 서비스 특징 미리보기 */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Heart, title: "AI 맞춤 추천", color: "from-rose-400 to-pink-500" },
              { icon: MapPin, title: "실시간 정보", color: "from-purple-400 to-rose-500" },
              { icon: Gift, title: "연인과 공유", color: "from-pink-400 to-purple-500" }
            ].map((feature, index) => (
              <Card key={index} className="bg-white/60 backdrop-blur-lg rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 p-4">
                <div className="text-center space-y-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mx-auto shadow-lg`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700 leading-tight">{feature.title}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* 하단 메시지 */}
          <div className="text-center">
            <p className="text-gray-500 text-sm animate-pulse">
              💕 사랑스러운 순간이 기다리고 있어요 💕
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
