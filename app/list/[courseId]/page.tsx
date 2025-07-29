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
import { Badge } from "@/components/ui/badge";
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
  const [isPurchasedCourse, setIsPurchasedCourse] = useState(false);
  const [purchaseInfo, setPurchaseInfo] = useState<any>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    placeId: "",
    placeName: "",
  });
  const [courseReviewModal, setCourseReviewModal] = useState({
    isOpen: false,
    sharedCourseId: 0,
    purchaseId: 0,
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
        setIsPurchasedCourse(data.is_purchased_course || false);
        
        // 구매한 코스라면 구매 정보 가져오기
        if (data.is_purchased_course) {
          const purchasedCourses = await api(`/shared_courses/my/purchased`, "GET", undefined, token);
          const purchase = purchasedCourses.find((p: any) => p.copied_course_id === parseInt(courseId));
          if (purchase) {
            setPurchaseInfo(purchase);
            
            // 후기 작성 여부 확인
            try {
              const reviewsResponse = await api(`/shared_courses/reviews/buyer/course/${purchase.shared_course_id}`, "GET", undefined, token);
              const userReview = reviewsResponse.find((review: any) => review.buyer_user_id === user.user_id);
              setHasReviewed(!!userReview);
            } catch (error) {
              console.log('후기 확인 중 오류:', error);
              setHasReviewed(false);
            }
          }
        }

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
      
      // 새로운 공유 상태로 업데이트
      const wasShared = course?.is_shared_with_couple || false;
      if (wasShared) {
        alert("코스 공유가 취소되었습니다!");
      } else {
        alert("코스가 공유되었습니다!");
      }
      
      // 페이지 새로고침하여 최신 데이터 반영
      window.location.reload();
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
          <Button asChild variant="outline" className="rounded-full border-gray-300 bg-transparent">
            <Link href="/list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Link>
          </Button>
        </div>

        {/* Course Details */}
        <div className="mb-8">
          <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary-pink/30 to-soft-purple/30 border-b-2 border-primary-pink/20">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/40">
                <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                  <div className="flex-1 space-y-6">
                    {isEditingTitle ? (
                      <div className="flex flex-col md:flex-row gap-3">
                        <Input 
                          value={title} 
                          onChange={(e) => setTitle(e.target.value)} 
                          className="text-xl font-bold rounded-xl border-gray-200 focus:border-primary-pink bg-white" 
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleTitleSave} className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full">
                            저장
                          </Button>
                          <Button onClick={() => setIsEditingTitle(false)} variant="outline" className="border-gray-200 text-text-secondary hover:bg-gray-50 rounded-full">
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">{title}</CardTitle>
                        </div>
                        <Button onClick={() => setIsEditingTitle(true)} variant="ghost" className="w-10 h-10 rounded-full hover:bg-gray-100">
                          <Edit3 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    )}

                    {isEditingDescription ? (
                      <div className="space-y-4">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="text-sm min-h-[120px] rounded-xl border-gray-200 focus:border-primary-pink bg-white"
                          placeholder="이 데이트 코스에 대한 설명을 적어주세요..."
                        />
                        <div className="flex gap-3">
                          <Button onClick={handleDescriptionSave} className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full">
                            저장
                          </Button>
                          <Button onClick={() => setIsEditingDescription(false)} variant="outline" className="border-gray-200 text-text-secondary hover:bg-gray-50 rounded-full">
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-base sm:text-lg text-text-secondary leading-relaxed min-h-[60px]">
                              {description}
                            </p>
                          </div>
                          <Button onClick={() => setIsEditingDescription(true)} variant="ghost" className="w-10 h-10 rounded-full hover:bg-gray-100 ml-3">
                            <Edit3 className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-row lg:flex-col gap-3">
                    <Button 
                      onClick={handleShare} 
                      className={`rounded-full px-6 py-3 ${
                        course?.is_shared_with_couple 
                          ? "bg-green-500 hover:bg-green-600 text-white" 
                          : "bg-primary-pink hover:bg-primary-pink/90 text-white"
                      }`}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      {course?.is_shared_with_couple ? "연인과 공유중" : "연인에게 공유"}
                    </Button>
                    
                    {isPurchasedCourse ? (
                      // 구매한 코스인 경우: 후기 작성 여부에 따라 버튼 표시
                      !hasReviewed ? (
                        <Button 
                          onClick={() => {
                            if (purchaseInfo) {
                              setCourseReviewModal({
                                isOpen: true,
                                sharedCourseId: purchaseInfo.shared_course_id,
                                purchaseId: purchaseInfo.id,
                              });
                            } else {
                              alert('구매 정보를 찾을 수 없습니다.');
                            }
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full px-6 py-3"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          후기 작성하기
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center text-green-600 font-medium bg-green-50 rounded-full px-6 py-3">
                          <Star className="h-4 w-4 mr-2" />
                          후기 작성 완료
                        </div>
                      )
                    ) : (
                      // 내가 만든 코스인 경우: 커뮤니티 공유 버튼
                      <Button 
                        onClick={() => router.push(`/share-course/${courseId}`)} 
                        disabled={course?.is_shared_to_community}
                        className={`rounded-full px-6 py-3 ${
                          course?.is_shared_to_community
                            ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        <Gift className="h-4 w-4 mr-2" />
                        {course?.is_shared_to_community ? "이미 공유됨" : "커뮤니티에 공유"}
                      </Button>
                    )}
                    
                    <Button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-3">
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제하기
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Course Places */}
        <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary-pink" />
              코스 일정
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6">
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
                        
                        {/* 후기 작성 버튼 */}
                        {(() => {
                          const placeId = place.place_info?.place_id || place.place_id;
                          const permission = reviewPermissions[placeId];
                          
                          if (!permission) {
                            return (
                              <Button
                                disabled
                                className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-400 text-white rounded-lg opacity-50"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                권한 확인 중...
                              </Button>
                            );
                          }
                          
                          if (!permission.can_write) {
                            return (
                              <Button
                                disabled
                                className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium bg-gray-400 text-white rounded-lg opacity-50"
                                title={permission.reason}
                              >
                                <Star className="w-3 h-3 mr-1" />
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
                              className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                            >
                              <Star className="w-3 h-3 mr-1" />
                              후기 작성하기
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

      {/* 코스 후기 작성 모달 */}
      {courseReviewModal.isOpen && (
        <CourseReviewModal
          isOpen={courseReviewModal.isOpen}
          onClose={() => setCourseReviewModal(prev => ({ ...prev, isOpen: false }))}
          sharedCourseId={courseReviewModal.sharedCourseId}
          purchaseId={courseReviewModal.purchaseId}
          courseTitle={title}
          onSuccess={() => {
            alert('후기가 작성되었습니다!');
            setCourseReviewModal(prev => ({ ...prev, isOpen: false }));
            setHasReviewed(true); // 후기 작성 완료 상태로 변경
          }}
        />
      )}
    </div>
  );
}

// 코스 후기 작성 모달 컴포넌트
function CourseReviewModal({ 
  isOpen, 
  onClose, 
  sharedCourseId, 
  purchaseId, 
  courseTitle,
  onSuccess 
}: {
  isOpen: boolean;
  onClose: () => void;
  sharedCourseId: number;
  purchaseId: number;
  courseTitle: string;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToAll, setAgreedToAll] = useState(false);

  const predefinedTags = [
    '완벽해요', '추천해요', '로맨틱해요', '재미있어요', '힐링돼요',
    '인스타감성', '맛집투어', '액티비티', '저예산', '고급스러워요'
  ];

  const handleSubmit = async () => {
    if (reviewText.trim().length < 15) {
      alert('후기는 최소 15자 이상 작성해주세요.');
      return;
    }

    if (!agreedToAll) {
      alert('후기 작성 전 확인사항에 동의해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = TokenStorage.get();
      const reviewData = {
        shared_course_id: sharedCourseId,
        purchase_id: purchaseId,
        rating,
        review_text: reviewText.trim(),
        tags: selectedTags,
        photo_urls: [] // TODO: 사진 업로드 기능 추가 시
      };

      await api('/shared_courses/reviews/buyer', 'POST', reviewData, token);
      onSuccess();
    } catch (error: any) {
      console.error('후기 작성 실패:', error);
      
      // 백엔드에서 보내는 상세한 에러 메시지 표시 (공유 코스와 동일한 처리)
      if (error.message?.includes('후기 작성이 거부되었습니다')) {
        // GPT 검증 실패 메시지 처리
        alert(`구매 후기 작성 실패: ${error.message}`);
      } else if (error.message?.includes('1분 내에 이미 부적절한')) {
        // Rate Limit 메시지 처리
        alert(`구매 후기 작성 실패: ${error.message}`);
      } else if (error.message?.includes('이미 후기를 작성')) {
        alert('이미 후기를 작성하셨습니다.');
      } else {
        // 기타 에러는 백엔드 메시지 그대로 표시하되, 없으면 기본 메시지
        alert(`구매 후기 작성 실패: ${error.message || '후기 작성에 실패했습니다. 다시 시도해주세요.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* 헤더 */}
        <div className="bg-primary-pink p-6 text-center text-white rounded-t-3xl">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⭐</span>
          </div>
          <h2 className="text-xl font-bold mb-2">코스 후기 작성</h2>
          <p className="text-white/90 text-sm">300 day를 받아보세요!</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
          >
            ✕
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 코스 제목 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-sm text-text-secondary mb-1">구매한 코스</p>
            <p className="font-bold text-text-primary text-lg">{courseTitle}</p>
          </div>

          {/* day 안내 */}
          <div className="bg-secondary-pink rounded-2xl p-4 text-center border border-primary-pink/20">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-lg">💰</span>
              </div>
              <span className="text-lg font-bold text-primary-pink">day 보상</span>
            </div>
            <div className="text-3xl font-bold text-primary-pink mb-1">300 day</div>
            <div className="text-text-primary text-sm font-medium mb-2">15자 이상 후기 작성 시 즉시 지급</div>
            <div className="text-xs text-text-secondary bg-white/50 p-2 rounded-lg">
              * 지급된 day는 환불이 불가능하며, 앱 내에서만 사용 가능합니다.
            </div>
          </div>

          {/* 평점 */}
          <div className="text-center">
            <label className="text-lg font-bold text-text-primary block mb-4">
              이 코스는 어떠셨나요?
            </label>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all duration-200 hover:scale-110 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-text-secondary text-sm">현재 평점: {rating}점</p>
          </div>

          {/* 후기 텍스트 */}
          <div>
            <label className="text-lg font-bold text-text-primary block mb-3">
              솔직한 후기를 들려주세요 <span className="text-primary-pink">*</span>
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="전체적인 코스는 어떠셨나요? 다른 커플들에게 도움이 될 솔직한 후기를 남겨주세요!"
              rows={4}
              className="resize-none rounded-2xl border-2 border-gray-200 focus:border-primary-pink focus:ring-primary-pink text-sm"
            />
            <div className="flex justify-between items-center mt-3">
              <p className="text-text-secondary text-sm">
                현재 {reviewText.length}/15자
              </p>
              {reviewText.length >= 15 ? (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full text-white text-xs flex items-center justify-center mr-1">✓</span>
                  조건 충족!
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs">
                  {15 - reviewText.length}자 더 필요
                </div>
              )}
            </div>
          </div>

          {/* 태그 */}
          <div>
            <label className="text-lg font-bold text-text-primary block mb-3">태그 선택 (선택사항)</label>
            <div className="flex flex-wrap gap-2">
              {predefinedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-pink text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200 hover:scale-105'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-sm text-text-secondary mt-2">
                선택된 태그: {selectedTags.length}개
              </p>
            )}
          </div>

          {/* 후기 작성 전 확인사항 체크 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <div className="flex items-center mb-3">
              <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-sm">⚠</span>
              </div>
              <h3 className="text-sm font-bold text-amber-800">작성 전 확인사항</h3>
            </div>
            <div className="bg-white rounded-xl p-3 mb-3">
              <div className="text-xs text-amber-700 space-y-1">
                <p>• day 지급에 따라 <strong>후기 작성 후 수정 및 삭제가 불가능</strong>합니다</p>
                <p>• 작성된 후기는 <strong>홍보 목적으로 활용</strong>될 수 있습니다</p>
                <p>• 부적절한 내용의 후기는 AI가 자동으로 차단할 수 있습니다</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="agree-all"
                checked={agreedToAll}
                onChange={(e) => setAgreedToAll(e.target.checked)}
                className="mt-0.5 rounded border-amber-400"
              />
              <label htmlFor="agree-all" className="text-xs text-amber-800 font-bold cursor-pointer leading-relaxed">
                위 모든 사항을 확인했으며 동의합니다
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full border-2 border-gray-300 text-text-secondary hover:bg-gray-50 hover:text-text-primary font-bold py-3"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              disabled={isSubmitting || reviewText.trim().length < 15 || !agreedToAll}
            >
              {isSubmitting ? (
                <div className="flex items-center text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  작성 중...
                </div>
              ) : (
                <div className="flex items-center text-sm">
                  <span className="mr-1">✨</span>
                  후기 작성하기
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}