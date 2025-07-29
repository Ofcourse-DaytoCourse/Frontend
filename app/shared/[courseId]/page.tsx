"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, MapPin, Phone, MessageCircle, User, ArrowLeft, Star } from "lucide-react";
import { UserStorage, TokenStorage } from "@/lib/storage";
import { ReviewModal } from "@/components/ReviewModal";

export default function SharedCoursePage() {
  const { courseId } = useParams();
  const router = useRouter();
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
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-pink to-light-purple rounded-full flex items-center justify-center">
            <MapPin className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-4">오류가 발생했습니다</h3>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3"
          >
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">코스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="rounded-full border-gray-300 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>

        {/* Course Details */}
        <div className="mb-8">
          <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary-pink/30 to-soft-purple/30 border-b-2 border-primary-pink/20">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/40">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">{course.title}</CardTitle>
                <p className="text-base sm:text-lg text-text-secondary leading-relaxed">{course.description}</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary-pink" />
                코스 일정
              </h3>
              
              <div className="grid gap-4 md:gap-6">
                {course.places?.map((place: any, index: number) => (
                  <div key={index} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-pink rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-base md:text-lg font-bold text-text-primary truncate">{place.name}</h4>
                          <span className="px-2 py-1 bg-secondary-pink text-primary-pink text-xs rounded-full flex-shrink-0 ml-2">
                            {place.category || '특별한 장소'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-xs md:text-sm text-text-secondary mb-3">
                          <MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{place.address}</span>
                        </div>
                          
                        {/* 장소 설명들 */}
                        {place.summary && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-xs md:text-sm text-text-secondary leading-relaxed">{place.summary}</p>
                          </div>
                        )}
                        
                        {place.description && place.description.trim() && (
                          <div className="bg-secondary-pink p-3 rounded-lg mb-3">
                            <p className="text-xs md:text-sm text-primary-pink leading-relaxed">{place.description}</p>
                          </div>
                        )}
                        
                        {/* 액션 버튼들 */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {place.kakao_url && (
                            <a 
                              href={place.kakao_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-pink hover:bg-primary-pink/90 rounded-lg transition-colors"
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              카카오맵
                            </a>
                          )}
                          
                          {place.phone && (
                            <a 
                              href={`tel:${place.phone}`}
                              className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-light-purple hover:bg-light-purple/90 rounded-lg transition-colors"
                            >
                              <Phone className="w-3 h-3 mr-1" />
                              전화하기
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments Section */}
        <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-primary-pink" />
              댓글 ({comments.length})
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.map((comment: any, idx: number) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-text-primary">{comment.nickname}</span>
                        <span className="text-sm text-text-secondary">
                          {new Date(comment.timestamp).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-text-secondary leading-relaxed">{comment.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">아직 댓글이 없어요</h3>
                  <p className="text-text-secondary">첫 번째 댓글을 남겨보세요!</p>
                </div>
              )}
            </div>

            {/* 댓글 작성 */}
            {user ? (
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                <h4 className="text-lg font-medium text-text-primary mb-4">댓글 남기기</h4>
                <div className="space-y-4">
                  <Textarea
                    placeholder="이 코스에 대한 생각을 공유해주세요..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="resize-none border-gray-200 rounded-xl focus:border-primary-pink min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCommentSubmit} 
                      disabled={!newComment.trim()}
                      className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      댓글 작성
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">댓글을 작성하려면 로그인이 필요해요</h3>
                <p className="text-text-secondary mb-4">로그인하고 특별한 추억을 공유해보세요!</p>
                <Button 
                  onClick={() => router.push('/login')}
                  className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6"
                >
                  <User className="w-4 h-4 mr-2" />
                  로그인하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
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
            console.log("후기 작성 완료!");
          }}
        />
      )}
    </div>
  );
}