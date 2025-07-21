// 완전 새로운 로맨틱 메인 페이지 💕
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, Sparkles, Users, Calendar, ArrowRight, Star, Gift, Zap, PlusCircle, List } from "lucide-react";
import { TokenStorage, UserStorage } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // AuthGuard에서 모든 리다이렉트를 처리
    const timer = setTimeout(() => {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) {
        router.push("/login");
        return;
      }
      
      // 로그인된 사용자는 메인 페이지 표시
      setIsLoading(false);
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
          {/* 헤더 섹션 */}
          <div className="text-center space-y-8 mb-16">
            {/* 로고 영역 */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 hover:rotate-0 transition-transform duration-500">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform -rotate-12 hover:rotate-0 transition-transform duration-500">
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            
            {/* 메인 타이틀 */}
            <div className="space-y-6">
              <h1 className="text-6xl md:text-8xl font-black mb-6">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  특별한 데이트
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                  코스 추천 💕
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                AI가 두 분만을 위한 완벽한 데이트 코스를 추천해드립니다
                <br />
                <span className="text-rose-500 font-semibold">Love is in the details ✨</span>
              </p>
              
              {/* 데코레이션 */}
              <div className="flex items-center justify-center space-x-4 pt-6">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
                <Sparkles className="w-8 h-8 text-pink-500 animate-spin" />
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA 버튼들 */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-20">
            <Button
              onClick={() => router.push("/course")}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-12 py-6 text-xl rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            >
              <PlusCircle className="w-7 h-7 mr-3" />
              새 코스 만들기
              <Sparkles className="w-6 h-6 ml-3" />
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push("/list")}
              className="border-3 border-pink-300 text-pink-600 hover:bg-pink-50 px-12 py-6 text-xl rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <List className="w-6 h-6 mr-3" />
              내 코스 보기
              <ArrowRight className="w-5 h-5 ml-3" />
            </Button>
          </div>

          {/* 피처 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                icon: Heart,
                title: "AI 맞춤 추천",
                description: "MBTI, 취향, 예산을 분석해 완벽한 코스를 추천",
                gradient: "from-rose-400 to-pink-500",
                bg: "from-rose-50 to-pink-50",
                border: "border-rose-200"
              },
              {
                icon: Users,
                title: "연인과 공유",
                description: "만든 코스를 연인과 함께 공유하고 추억 만들기",
                gradient: "from-purple-400 to-rose-500",
                bg: "from-purple-50 to-rose-50",
                border: "border-purple-200"
              },
              {
                icon: MapPin,
                title: "실시간 장소 정보",
                description: "카카오맵 연동으로 정확한 위치와 상세 정보 제공",
                gradient: "from-pink-400 to-purple-500",
                bg: "from-pink-50 to-purple-50",
                border: "border-pink-200"
              }
            ].map((feature, index) => (
              <Card key={index} className={`bg-gradient-to-br ${feature.bg} rounded-3xl shadow-2xl ${feature.border} border-2 backdrop-blur-lg hover:shadow-3xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2`}>
                <CardHeader className="pb-6 pt-10">
                  <div className="flex justify-center mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center shadow-xl`}>
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-800 text-center mb-4">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-10">
                  <CardDescription className="text-gray-600 text-center text-lg leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 하단 섹션 */}
          <div className="text-center pt-20">
            <div className="space-y-8">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-4xl font-bold text-gray-800 mb-6">
                  완벽한 데이트를 위한 첫 걸음 💝
                </h3>
                <p className="text-xl text-gray-600 leading-relaxed">
                  지금 바로 시작해서 두 분만의 특별한 추억을 만들어보세요!
                </p>
              </div>
              
              <Button
                onClick={() => router.push("/shared")}
                variant="outline"
                className="border-3 border-purple-300 text-purple-600 hover:bg-purple-50 px-10 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Gift className="w-6 h-6 mr-3" />
                공유된 코스 구경하기
                <Sparkles className="w-5 h-5 ml-3" />
              </Button>
              
              <p className="text-gray-500 text-sm animate-pulse">
                사랑은 세상에서 가장 아름다운 모험입니다 💕✨
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}