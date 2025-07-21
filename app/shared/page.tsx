// 완전 새로운 커플 테마 공유 코스 페이지 💕
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { getCourses } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Clock, Users, Sparkles, Calendar, ArrowRight, Star, Gift, Zap } from "lucide-react";
import type { Course } from "@/types/api";

export default function SharedCoursesPage() {
  const router = useRouter();
  const [sharedCourses, setSharedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedCourses();
  }, []);

  const fetchSharedCourses = async () => {
    try {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const response = await getCourses(user.user_id, token);
      // 공유된 코스만 필터링
      const shared = response.courses.filter(course => course.is_shared_with_couple);
      setSharedCourses(shared);
    } catch (err: any) {
      setError("공유 코스를 불러오는 중 오류가 발생했습니다.");
      console.error("Failed to fetch shared courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: number) => {
    router.push(`/shared/${courseId}`);
  };

  if (loading) {
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
                  사랑스러운 코스들을 불러오는 중...
                </h2>
                <p className="text-rose-400 animate-pulse">💕 잠시만 기다려주세요 💕</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="max-w-md mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-pink-200">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">앗, 문제가 생겼어요! 💔</h3>
              <p className="text-red-500 mb-6 text-sm">{error}</p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                다시 시도하기
              </Button>
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

      {/* 헤더 섹션 */}
      <div className="relative">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-8">
            {/* 로고 영역 */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* 메인 타이틀 */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-black mb-6">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  우리의 특별한
                </span>
                <br />
                <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">
                  데이트 코스 💕
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                연인과 함께 만들어가는 소중한 추억들을 확인해보세요
                <br />
                <span className="text-rose-500 font-semibold">Love is in the details ✨</span>
              </p>
              
              {/* 데코레이션 */}
              <div className="flex items-center justify-center space-x-4 pt-4">
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
                <Sparkles className="w-6 h-6 text-pink-500 animate-spin" />
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="relative container mx-auto px-4 pb-12">
        {sharedCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="relative mb-10">
                <div className="w-40 h-40 mx-auto bg-gradient-to-br from-pink-200/50 to-purple-200/50 rounded-full flex items-center justify-center backdrop-blur-lg border border-pink-200">
                  <div className="w-32 h-32 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                    <Heart className="w-16 h-16 text-white animate-pulse" />
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce delay-500">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-4">
                  아직 공유된 코스가 없어요 💝
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                  연인과 함께 특별한 데이트 코스를 만들어보세요!<br/>
                  AI가 두 분만을 위한 완벽한 코스를 추천해드릴게요. ✨
                </p>
                <Button 
                  onClick={() => router.push("/course")}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-10 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Heart className="w-6 h-6 mr-3" />
                  새 코스 만들기
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 통계 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: Heart, 
                  value: sharedCourses.length, 
                  label: "공유된 코스", 
                  gradient: "from-rose-400 to-pink-500",
                  bg: "from-rose-50 to-pink-50",
                  border: "border-rose-200"
                },
                { 
                  icon: MapPin, 
                  value: sharedCourses.reduce((acc, course) => acc + (course.places?.length || 0), 0), 
                  label: "방문 장소", 
                  gradient: "from-purple-400 to-rose-500",
                  bg: "from-purple-50 to-rose-50",
                  border: "border-purple-200"
                },
                { 
                  icon: Gift, 
                  value: "∞", 
                  label: "소중한 추억", 
                  gradient: "from-pink-400 to-purple-500",
                  bg: "from-pink-50 to-purple-50",
                  border: "border-pink-200"
                }
              ].map((stat, index) => (
                <div key={index} className={`bg-gradient-to-br ${stat.bg} rounded-3xl p-8 shadow-xl ${stat.border} border-2 backdrop-blur-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
                  <div className="flex items-center space-x-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-4xl font-black text-gray-800">{stat.value}</p>
                      <p className="text-gray-600 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 코스 카드 그리드 */}
            <div className="grid gap-6 md:gap-8 lg:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {sharedCourses.map((course, index) => (
                <Card 
                  key={course.course_id} 
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl overflow-hidden hover:-translate-y-2 transform"
                  onClick={() => handleCourseClick(course.course_id)}
                >
                  {/* 카드 헤더 그라데이션 */}
                  <div className={`h-2 md:h-3 bg-gradient-to-r ${
                    index % 3 === 0 
                      ? 'from-rose-400 via-pink-500 to-purple-500' 
                      : index % 3 === 1 
                      ? 'from-purple-400 via-pink-500 to-rose-500'
                      : 'from-pink-400 via-rose-500 to-purple-500'
                  }`}></div>
                  
                  <CardHeader className="pb-4 md:pb-6 pt-6 md:pt-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${
                          index % 3 === 0 
                            ? 'bg-gradient-to-br from-rose-100 to-pink-200' 
                            : index % 3 === 1 
                            ? 'bg-gradient-to-br from-purple-100 to-pink-200'
                            : 'bg-gradient-to-br from-pink-100 to-purple-200'
                        }`}>
                          <Heart className={`w-5 h-5 md:w-6 md:h-6 ${
                            index % 3 === 0 
                              ? 'text-rose-600' 
                              : index % 3 === 1 
                              ? 'text-purple-600'
                              : 'text-pink-600'
                          }`} />
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg text-xs md:text-sm"
                        >
                          💕 공유됨
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 md:group-hover:translate-x-2 transition-all duration-300" />
                      </div>
                    </div>
                    
                    <CardTitle className="text-lg md:text-2xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors line-clamp-2 mb-3">
                      {course.title}
                    </CardTitle>
                    
                    <div className="flex items-center space-x-2 md:space-x-3 text-sm md:text-base text-gray-500">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-pink-100 to-rose-200 rounded-full flex items-center justify-center">
                        <Users className="w-3 h-3 md:w-4 md:h-4 text-pink-600" />
                      </div>
                      <span className="font-medium">{course.creator_nickname}님의 특별한 코스</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4 md:space-y-6 px-4 md:px-6">
                    <p className="text-gray-700 leading-relaxed line-clamp-3 text-sm md:text-base">
                      {course.description}
                    </p>
                    
                    <div className="space-y-3 md:space-y-4">
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-pink-100">
                        <div className="space-y-2 md:space-y-3">
                          <div className="flex items-center space-x-2 md:space-x-3 text-gray-600">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center">
                              <Clock className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            </div>
                            <span className="text-sm md:text-base font-medium">예상 시간: 약 3~6시간</span>
                          </div>
                          <div className="flex items-center space-x-2 md:space-x-3 text-gray-600">
                            <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                              <MapPin className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            </div>
                            <span className="text-sm md:text-base font-medium">
                              {course.places?.length || 0}개의 특별한 장소
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-pink-100">
                      <div className="flex items-center space-x-2 md:space-x-3 text-gray-500">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-3 h-3 md:w-3 md:h-3" />
                        </div>
                        <span className="text-xs md:text-sm">{new Date(course.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, starIndex) => (
                          <Star key={starIndex} className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* 액션 버튼 영역 */}
                    <div className="flex items-center justify-between gap-3 pt-4">
                      <Button className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300" size="sm">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        상세보기
                      </Button>
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 rounded-full text-xs">
                        💝 연인 코스
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="text-center pt-16">
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={() => router.push("/list")}
              className="border-3 border-pink-300 text-pink-600 hover:bg-pink-50 px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Heart className="w-5 h-5 mr-3" />
              내 코스 목록으로 돌아가기
            </Button>
            
            <p className="text-gray-500 text-sm animate-pulse">
              더 많은 추억을 만들어보세요 💕✨
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
