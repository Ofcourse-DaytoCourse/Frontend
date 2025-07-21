"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, DollarSign, Heart, MapPin, Users, Sparkles, ArrowRight, Star, Gift, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Course {
  course_id: number;
  title: string;
  description: string;
  created_at: string;
  is_shared_with_couple: boolean;
  places: number[];
  creator_nickname: string;
  is_my_course: boolean;
  is_shared_course: boolean;
}

export default function ListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = TokenStorage.get();
        const user = UserStorage.get();
        
        if (!token || !user) {
          router.replace("/login");
          return;
        }

        const data = await api(`/courses/list?user_id=${user.user_id}`, "GET", undefined, token);
        setCourses(data.courses || []);
      } catch (err: any) {
        console.error("코스 목록 조회 실패:", err);
        alert("코스를 불러오는 중 오류가 발생했습니다: " + err.message);
      }
    };
    fetchCourses();
  }, [router]);

  const handleShareToggle = async (courseId: number) => {
    try {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) return;

      await api("/courses/share", "POST", { 
        course_id: courseId, 
        user_id: user.user_id 
      }, token);
      
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === courseId ? { ...c, is_shared_with_couple: !c.is_shared_with_couple } : c
        )
      );
    } catch (err: any) {
      console.error("공유 상태 변경 실패:", err);
      alert("공유 상태 변경 중 오류가 발생했습니다: " + err.message);
    }
  };

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

      {/* 메인 컨텐츠 */}
      <div className="relative">
        <div className="container mx-auto px-4 py-8 pt-20 md:pt-24">
          {/* 헤더 섹션 */}
          <div className="text-center space-y-6 mb-12">
            {/* 로고 영역 */}
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
            </div>
            
            {/* 메인 타이틀 */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  나의 데이트 코스
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                저장한 코스와 연인이 공유해준 특별한 코스들을 확인해보세요
                <br />
                <span className="text-rose-500 font-semibold">Every course tells a love story 💕</span>
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

          {/* 통계 카드들 */}
          {courses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { 
                  icon: Heart, 
                  value: courses.filter(c => c.is_my_course).length, 
                  label: "내 코스", 
                  gradient: "from-rose-400 to-pink-500",
                  bg: "from-rose-50 to-pink-50",
                  border: "border-rose-200"
                },
                { 
                  icon: Gift, 
                  value: courses.filter(c => c.is_shared_course).length, 
                  label: "공유받은 코스", 
                  gradient: "from-purple-400 to-rose-500",
                  bg: "from-purple-50 to-rose-50",
                  border: "border-purple-200"
                },
                { 
                  icon: MapPin, 
                  value: courses.length, 
                  label: "전체 코스", 
                  gradient: "from-pink-400 to-purple-500",
                  bg: "from-pink-50 to-purple-50",
                  border: "border-pink-200"
                }
              ].map((stat, index) => (
                <div key={index} className={`bg-gradient-to-br ${stat.bg} rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl ${stat.border} border-2 backdrop-blur-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105`}>
                  <div className="flex items-center space-x-4 md:space-x-6">
                    <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${stat.gradient} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl md:text-4xl font-black text-gray-800">{stat.value}</p>
                      <p className="text-sm md:text-base text-gray-600 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 코스 카드 그리드 */}
          {courses.length > 0 ? (
            <div className="grid gap-6 md:gap-8 lg:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <Card 
                  key={course.course_id} 
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl overflow-hidden hover:-translate-y-2 transform"
                >
                  {/* 카드 헤더 그라데이션 */}
                  <div className={`h-2 md:h-3 bg-gradient-to-r ${
                    course.is_shared_course 
                      ? 'from-blue-400 via-purple-500 to-pink-500' 
                      : index % 3 === 0 
                      ? 'from-rose-400 via-pink-500 to-purple-500' 
                      : index % 3 === 1 
                      ? 'from-purple-400 via-pink-500 to-rose-500'
                      : 'from-pink-400 via-rose-500 to-purple-500'
                  }`}></div>
                  
                  <CardHeader className="pb-4 md:pb-6 pt-6 md:pt-8">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ${
                          course.is_shared_course 
                            ? 'bg-gradient-to-br from-blue-100 to-purple-200' 
                            : index % 3 === 0 
                            ? 'bg-gradient-to-br from-rose-100 to-pink-200' 
                            : index % 3 === 1 
                            ? 'bg-gradient-to-br from-purple-100 to-pink-200'
                            : 'bg-gradient-to-br from-pink-100 to-purple-200'
                        }`}>
                          {course.is_shared_course ? (
                            <Gift className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                          ) : (
                            <Heart className={`w-5 h-5 md:w-6 md:h-6 ${
                              index % 3 === 0 
                                ? 'text-rose-600' 
                                : index % 3 === 1 
                                ? 'text-purple-600'
                                : 'text-pink-600'
                            }`} />
                          )}
                        </div>
                        {course.is_shared_course && (
                          <Badge 
                            variant="secondary" 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 px-3 py-1 md:px-4 md:py-2 rounded-full shadow-lg text-xs md:text-sm"
                          >
                            💕 공유받음
                          </Badge>
                        )}
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
                      <span className="font-medium">{course.creator_nickname}님의 코스</span>
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
                              <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            </div>
                            <span className="text-sm md:text-base font-medium">예산: 5~10만원 예상</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-pink-100">
                      <div className="flex items-center space-x-2 md:space-x-3 text-gray-500">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <Calendar className="w-3 h-3 md:w-3 md:h-3" />
                        </div>
                        <span className="text-xs md:text-sm">{course.created_at?.split("T")[0]}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, starIndex) => (
                          <Star key={starIndex} className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* 액션 버튼 영역 */}
                    <div className="flex items-center justify-between gap-3 pt-4">
                      <Button asChild className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300" size="sm">
                        <Link href={course.is_shared_course ? `/shared/${course.course_id}` : `/list/${course.course_id}`}>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          상세보기
                        </Link>
                      </Button>
                      {course.is_my_course && (
                        <div className="flex items-center gap-2 bg-white/50 rounded-full px-3 py-2 backdrop-blur-sm">
                          <span className="text-xs md:text-sm text-gray-600 font-medium">공유</span>
                          <Switch
                            checked={course.is_shared_with_couple}
                            onCheckedChange={() => handleShareToggle(course.course_id)}
                            className="scale-75 md:scale-100"
                          />
                        </div>
                      )}
                      {course.is_shared_course && (
                        <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 rounded-full text-xs">
                          💝 연인 코스
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 md:py-20">
              <div className="max-w-lg mx-auto">
                <div className="relative mb-8 md:mb-10">
                  <div className="w-32 h-32 md:w-40 md:h-40 mx-auto bg-gradient-to-br from-pink-200/50 to-purple-200/50 rounded-full flex items-center justify-center backdrop-blur-lg border border-pink-200">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                      <Heart className="w-12 h-12 md:w-16 md:h-16 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute -top-2 md:-top-4 -right-2 md:-right-4 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                
                <div className="space-y-6 md:space-y-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    아직 저장된 코스가 없어요 💝
                  </h3>
                  <p className="text-gray-600 mb-6 md:mb-8 leading-relaxed text-base md:text-lg px-4">
                    AI가 추천하는 특별한 데이트 코스를 만들어보세요!<br/>
                    두 분만을 위한 완벽한 코스를 추천해드릴게요. ✨
                  </p>
                  <Button 
                    asChild
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 md:px-10 py-3 md:py-4 text-base md:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Link href="/course">
                      <PlusCircle className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                      새 코스 만들기
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 하단 액션 */}
          {courses.length > 0 && (
            <div className="text-center pt-12 md:pt-16">
              <div className="space-y-6 md:space-y-8">
                <Button 
                  asChild
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 md:px-10 py-3 md:py-4 text-base md:text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Link href="/course">
                    <PlusCircle className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                    새 코스 만들기
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                  </Link>
                </Button>
                
                <p className="text-gray-500 text-sm animate-pulse px-4">
                  더 많은 추억을 만들어보세요 💕✨
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
