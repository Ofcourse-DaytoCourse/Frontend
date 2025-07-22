// 완전 새로운 커플 테마 코스 상세 페이지 💕
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Heart, MapPin, Phone, MessageCircle, User, Sparkles, Star, Calendar, Clock, Gift, ArrowLeft, Navigation } from "lucide-react";
import { UserStorage, TokenStorage } from "@/lib/storage";
import { ReviewModal } from "@/components/ReviewModal";

export default function SharedCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    placeId: "",
    placeName: "",
  });

  useEffect(() => {
    const userData = UserStorage.get();
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const userData = UserStorage.get();
        const token = TokenStorage.get();
        
        if (userData && token) {
          // 로그인한 사용자 - 댓글과 함께 조회
          const data = await api(`/courses/comments?course_id=${courseId}&user_id=${userData.user_id}`, "GET", undefined, token);
          setCourse(data.course);
          setComments(data.comments || []);
        } else {
          // 비로그인 사용자 - 코스 정보만 조회
          const data = await api(`/courses/detail?course_id=${courseId}&user_id=0`, "GET");
          setCourse(data.course);
        }
      } catch (err: any) {
        console.error("코스 조회 실패:", err);
        setError("코스를 불러오는 중 오류가 발생했습니다.");
      }
    };

    if (courseId) fetchCourse();
  }, [courseId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const token = TokenStorage.get();
      const response = await api("/comments/write", "POST", {
        course_id: Number(courseId),
        user_id: user.user_id,
        nickname: user.nickname,
        comment: newComment
      }, token);

      setComments(prev => [...prev, response.comment]);
      setNewComment("");
    } catch (err: any) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-pink-200">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-200 rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">앗, 문제가 생겼어요! 💔</h3>
          <p className="text-red-500 mb-6 text-sm text-center">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full shadow-lg"
          >
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-300/30 to-rose-400/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 mx-auto border-4 border-pink-300 border-t-rose-500 rounded-full animate-spin"></div>
              <Heart className="absolute inset-0 m-auto w-8 h-8 text-rose-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                특별한 코스를 불러오는 중...
              </h2>
              <p className="text-rose-400 animate-pulse">💕 잠시만 기다려주세요 💕</p>
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
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-300/15 to-rose-400/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/15 to-pink-400/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gradient-to-br from-rose-300/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* 하트 플로팅 애니메이션 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <Heart 
            key={i}
            className={`absolute w-3 h-3 text-pink-300/30 animate-bounce`}
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: '4s'
            }}
          />
        ))}
      </div>

      <div className="relative pt-8 pb-12">
        {/* 헤더 섹션 */}
        <div className="container mx-auto px-4 mb-8">
          <div className="flex items-center justify-between mb-8">
            <Button 
              onClick={() => window.history.back()}
              variant="outline"
              className="border-2 border-pink-300 text-pink-600 hover:bg-pink-50 rounded-full px-6 py-3 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              돌아가기
            </Button>
            
            <div className="flex items-center space-x-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 mb-8">
            <div className="h-2 md:h-3 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-t-2xl md:rounded-t-3xl"></div>
            <CardHeader className="pb-6 pt-8">
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{course.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">공유된 특별한 코스</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-5 h-5 text-pink-500" />
                          <span className="font-semibold text-gray-800">코스 소개</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed min-h-[80px]">
                          {course.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-3">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                        <Gift className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-bold text-blue-800">공유됨</span>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">💕 연인과 함께</div>
                  </div>
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
                              
                              {/* 후기 작성 버튼 - 로그인한 사용자만 */}
                              {user && (
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
                              )}
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

          {/* 댓글 섹션 */}
          <Card className="border-0 bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="h-3 bg-gradient-to-r from-purple-400 via-pink-500 to-rose-500"></div>
            
            <CardHeader className="pb-6 pt-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-800">
                  💝 소중한 댓글들 ({comments.length})
                </CardTitle>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* 댓글 목록 */}
              <div className="space-y-6">
                {comments.map((comment: any, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl border border-pink-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-rose-300 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="font-bold text-gray-800">{comment.nickname}</span>
                          <div className="flex items-center space-x-1 text-gray-500 text-sm">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(comment.timestamp).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed bg-white p-4 rounded-xl">{comment.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-600 mb-2">아직 댓글이 없어요</h3>
                    <p className="text-gray-500">첫 번째 댓글을 남겨보세요! 💕</p>
                  </div>
                )}
              </div>

              {/* 댓글 작성 */}
              {user ? (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl border border-purple-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">💕 댓글 남기기</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <Textarea
                      placeholder="이 코스에 대한 소중한 생각을 공유해주세요... ✨"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="resize-none border-2 border-pink-200 rounded-2xl focus:border-pink-400 transition-colors min-h-[120px]"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleCommentSubmit} 
                        disabled={!newComment.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Send className="h-5 w-5 mr-2" />
                        댓글 작성
                        <Sparkles className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-gray-200">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-3">댓글을 작성하려면 로그인이 필요해요</h3>
                  <p className="text-gray-500 mb-6">로그인하고 특별한 추억을 공유해보세요! 💕</p>
                  <Button 
                    onClick={() => window.location.href = '/login'}
                    className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <User className="w-5 h-5 mr-2" />
                    로그인하기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 후기 작성 모달 */}
      {reviewModal.isOpen && user && (
        <ReviewModal
          isOpen={reviewModal.isOpen}
          onClose={() => setReviewModal(prev => ({ ...prev, isOpen: false }))}
          placeId={reviewModal.placeId}
          placeName={reviewModal.placeName}
          courseId={Number(courseId)}
          onSuccess={() => {
            // 필요시 페이지 새로고침 또는 상태 업데이트
            console.log("후기 작성 완료!");
          }}
        />
      )}
    </div>
  );
}
