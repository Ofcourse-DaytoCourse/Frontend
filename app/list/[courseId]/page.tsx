"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit3, Trash2, Share2, Heart, MapPin, Phone, Star, Sparkles, Clock, Navigation, Gift } from "lucide-react";
import { ReviewModal } from "@/components/ReviewModal";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    placeId: "",
    placeName: "",
  });
  const [reviewPermissions, setReviewPermissions] = useState<{[key: string]: {can_write: boolean, reason: string}}>({});

  useEffect(() => {
    const userData = UserStorage.get();
    const token = TokenStorage.get();
    
    if (!userData || !token) {
      router.replace("/login");
      return;
    }
    
    setUser(userData);
  }, [router]);

  useEffect(() => {
    if (!user || !courseId) return;

    const fetchData = async () => {
      try {
        const token = TokenStorage.get();
        const data = await api(`/courses/detail?course_id=${courseId}&user_id=${user.user_id}`, "GET", undefined, token);
        setCourse(data.course);
        setTitle(data.course.title);
        setDescription(data.course.description);

        // 각 장소별 후기 작성 권한 확인
        if (data.course.places && token) {
          console.log("🔍 코스 데이터:", data.course.places);
          
          const { checkReviewPermission } = await import("@/lib/reviews-api");
          const permissions: {[key: string]: {can_write: boolean, reason: string}} = {};
          
          for (const place of data.course.places) {
            const placeId = place.place_info?.place_id || place.place_id;
            console.log("🔍 장소 처리 중:", { 
              place_name: place.place_info?.name || place.name,
              place_id: placeId,
              course_id: Number(courseId)
            });
            
            if (placeId) {
              try {
                console.log("🔍 권한 확인 API 호출:", placeId);
                const permission = await checkReviewPermission(placeId, Number(courseId), token);
                console.log("🔍 권한 확인 결과:", permission);
                permissions[placeId] = permission;
              } catch (err) {
                console.error("🚨 권한 확인 오류:", err);
                permissions[placeId] = { can_write: false, reason: "권한 확인 실패" };
              }
            } else {
              console.error("🚨 place_id가 없음:", place);
              permissions[placeId || "unknown"] = { can_write: false, reason: "장소 ID 없음" };
            }
          }
          console.log("🔍 최종 권한 목록:", permissions);
          setReviewPermissions(permissions);
        }
      } catch (err: any) {
        console.error("코스 상세 정보 조회 실패:", err);
        alert("코스 상세 정보를 불러오는 데 실패했습니다: " + err.message);
      }
    };
    fetchData();
  }, [courseId, user]);

  const handleDelete = async () => {
    if (!confirm("정말로 이 코스를 삭제하시겠습니까?") || !user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/delete", "DELETE", { user_id: user.user_id, course_id: Number(courseId) }, token);
      alert("코스가 삭제되었습니다.");
      router.push("/list");
    } catch (err: any) {
      console.error("코스 삭제 실패:", err);
      alert("삭제 실패: " + err.message);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/share", "POST", { course_id: Number(courseId), user_id: user.user_id }, token);
      alert("코스가 공유되었습니다!");
    } catch (err: any) {
      console.error("코스 공유 실패:", err);
      alert("공유 실패: " + err.message);
    }
  };

  const handleTitleSave = async () => {
    if (!user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/title", "PUT", { course_id: Number(courseId), title, user_id: user.user_id }, token);
      setIsEditingTitle(false);
    } catch (err: any) {
      console.error("제목 저장 실패:", err);
      alert("제목 저장 실패: " + err.message);
    }
  };

  const handleDescriptionSave = async () => {
    if (!user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/description", "PUT", { course_id: Number(courseId), description, user_id: user.user_id }, token);
      setIsEditingDescription(false);
    } catch (err: any) {
      console.error("설명 저장 실패:", err);
      alert("설명 저장 실패: " + err.message);
    }
  };


  if (!course) {
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
                  사랑스러운 코스를 불러오는 중...
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
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link href="/list" className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-6 group transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 mr-3">
                  <ArrowLeft className="h-5 w-5 text-white group-hover:-translate-x-1 transition-transform duration-300" />
                </div>
                <span className="text-lg font-semibold">목록으로 돌아가기</span>
              </Link>
            </div>

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
                    데이트 코스 상세
                  </span>
                </h1>
                
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  두 분만을 위한 특별한 코스를 확인해보세요
                  <br />
                  <span className="text-rose-500 font-semibold">Every moment is precious 💕</span>
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

            <Card className="bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 mb-8">
              <div className="h-2 md:h-3 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-t-2xl md:rounded-t-3xl"></div>
              <CardHeader className="pb-6 pt-8">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex-1 space-y-6">
                    {isEditingTitle ? (
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          className="text-xl font-bold rounded-xl border-pink-200 focus:border-pink-400 bg-white/80" 
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleTitleSave} className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full">
                            저장
                          </Button>
                          <Button onClick={() => setIsEditingTitle(false)} variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full">
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Heart className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{title}</CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">완벽한 데이트 코스</span>
                          </div>
                        </div>
                        <Button onClick={() => setIsEditingTitle(true)} variant="ghost" className="w-10 h-10 rounded-full hover:bg-pink-50">
                          <Edit3 className="h-4 w-4 text-pink-500" />
                        </Button>
                      </div>
                    )}

                    {isEditingDescription ? (
                      <div className="space-y-4">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="text-sm min-h-[120px] rounded-xl border-pink-200 focus:border-pink-400 bg-white/80"
                          placeholder="이 데이트 코스에 대한 설명을 적어주세요..."
                        />
                        <div className="flex gap-3">
                          <Button onClick={handleDescriptionSave} className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full">
                            저장
                          </Button>
                          <Button onClick={() => setIsEditingDescription(false)} variant="outline" className="border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full">
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-5 h-5 text-pink-500" />
                              <span className="font-semibold text-gray-800">코스 소개</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed min-h-[80px]">
                              {description}
                            </p>
                          </div>
                          <Button onClick={() => setIsEditingDescription(true)} variant="ghost" className="w-10 h-10 rounded-full hover:bg-pink-100 ml-3">
                            <Edit3 className="h-4 w-4 text-pink-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-3">
                    <Button onClick={handleShare} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-lg">
                      <Share2 className="h-4 w-4 mr-2" />
                      공유하기
                    </Button>
                    <Button onClick={handleDelete} className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white rounded-full px-6 py-3 shadow-lg">
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제하기
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-8">
                <div className="text-center space-y-4 mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <MapPin className="w-8 h-8 text-rose-500" />
                    데이트 코스 일정
                  </h3>
                  <p className="text-gray-600 text-lg">순서대로 방문하며 특별한 하루를 만들어보세요 💕</p>
                </div>

                <div className="space-y-8">
                  {course.places?.map((place: any, index: number) => (
                    <div key={index} className="group">
                      {/* 연결선 (마지막 장소가 아닌 경우) */}
                      {index < course.places.length - 1 && (
                        <div className="flex justify-center my-6">
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-1 h-8 bg-gradient-to-b from-pink-300 to-purple-300 rounded-full animate-pulse"></div>
                            <Navigation className="w-6 h-6 text-pink-400 transform rotate-180 animate-bounce" />
                            <div className="w-1 h-8 bg-gradient-to-b from-purple-300 to-pink-300 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      )}

                      <Card className="bg-white/90 backdrop-blur-lg rounded-3xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] group-hover:-translate-y-1">
                        <div className={`h-2 bg-gradient-to-r ${
                          index % 4 === 0 ? 'from-rose-400 to-pink-500' :
                          index % 4 === 1 ? 'from-purple-400 to-pink-500' :
                          index % 4 === 2 ? 'from-pink-400 to-rose-500' :
                          'from-rose-500 to-purple-500'
                        } rounded-t-3xl`}></div>
                        
                        <div className="p-8">
                          <div className="flex items-start gap-6">
                            {/* 순서 번호 */}
                            <div className="flex-shrink-0">
                              <div className={`w-16 h-16 bg-gradient-to-br ${
                                index % 4 === 0 ? 'from-rose-400 to-pink-500' :
                                index % 4 === 1 ? 'from-purple-400 to-pink-500' :
                                index % 4 === 2 ? 'from-pink-400 to-rose-500' :
                                'from-rose-500 to-purple-500'
                              } rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300`}>
                                <span className="text-white text-xl font-black">{index + 1}</span>
                              </div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              {/* 장소 헤더 */}
                              <div className="space-y-3">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <h4 className="text-2xl md:text-3xl font-bold text-gray-900">{place.name}</h4>
                                  <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                                    index % 4 === 0 ? 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700' :
                                    index % 4 === 1 ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' :
                                    index % 4 === 2 ? 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700' :
                                    'bg-gradient-to-r from-rose-100 to-purple-100 text-rose-700'
                                  }`}>
                                    {place.category || '특별한 장소'}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 text-gray-600">
                                  <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-rose-200 rounded-full flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-rose-500" />
                                  </div>
                                  <span className="text-base">{place.address}</span>
                                </div>
                              </div>

                              {/* 장소 설명들 */}
                              <div className="space-y-4">
                                {place.summary && (
                                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-2xl border border-blue-100">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Sparkles className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-blue-800 mb-2">장소 소개</p>
                                        <p className="text-blue-700 leading-relaxed">{place.summary}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {place.description && place.description.trim() && (
                                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-2xl border border-green-100">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                        <Heart className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-green-800 mb-2">상세 정보</p>
                                        <p className="text-green-700 leading-relaxed">{place.description}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* 액션 버튼들 */}
                              <div className="flex flex-wrap gap-3 pt-4">
                                {place.kakao_url && (
                                  <a 
                                    href={place.kakao_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                  >
                                    <MapPin className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                                    카카오맵에서 보기
                                  </a>
                                )}
                                
                                {place.phone && (
                                  <a 
                                    href={`tel:${place.phone}`}
                                    className="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                  >
                                    <Phone className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                                    {place.phone}
                                  </a>
                                )}
                                
                                {/* 후기 작성 버튼 */}
                                {(() => {
                                  const placeId = place.place_info?.place_id || place.place_id;
                                  const permission = reviewPermissions[placeId];
                                  
                                  if (!permission) {
                                    return (
                                      <Button
                                        disabled
                                        className="group/btn inline-flex items-center gap-2 bg-gray-400 text-white px-6 py-3 rounded-full font-medium opacity-50"
                                      >
                                        <Star className="w-4 h-4" />
                                        권한 확인 중...
                                      </Button>
                                    );
                                  }
                                  
                                  if (!permission.can_write) {
                                    return (
                                      <Button
                                        disabled
                                        className="group/btn inline-flex items-center gap-2 bg-gray-400 text-white px-6 py-3 rounded-full font-medium opacity-50"
                                        title={permission.reason}
                                      >
                                        <Star className="w-4 h-4" />
                                        {permission.reason.includes("이미") ? "후기 작성완료 ✓" : "후기 작성불가"}
                                      </Button>
                                    );
                                  }
                                  
                                  return (
                                    <Button
                                      onClick={() => setReviewModal({
                                        isOpen: true,
                                        placeId: place.place_info?.place_id || place.place_id,
                                        placeName: place.place_info?.name || place.name,
                                      })}
                                      className="group/btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                    >
                                      <Star className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" />
                                      후기 작성하기
                                    </Button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>

                {/* 하단 메시지 */}
                <div className="text-center pt-12">
                  <div className="space-y-4">
                    <p className="text-gray-500 text-lg animate-pulse">
                      완벽한 데이트 코스로 특별한 추억을 만들어보세요 💕✨
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.3}s`}} />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 후기 작성 모달 */}
      {reviewModal.isOpen && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
          placeId={reviewModal.placeId}
          placeName={reviewModal.placeName}
          courseId={Number(courseId)}
          onSuccess={async () => {
            // 후기 작성 완료 후 권한 상태 업데이트
            const token = TokenStorage.get();
            if (token) {
              try {
                const { checkReviewPermission } = await import("@/lib/reviews-api");
                const permission = await checkReviewPermission(reviewModal.placeId, Number(courseId), token);
                setReviewPermissions(prev => ({
                  ...prev,
                  [reviewModal.placeId]: permission
                }));
              } catch (err) {
                console.error("권한 재확인 실패:", err);
              }
            }
          }}
        />
      )}
    </div>
  );
}
