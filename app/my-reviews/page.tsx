"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Calendar, MapPin, Users, Share2 } from "lucide-react";
import { TokenStorage } from "@/lib/storage";
import { getMyReviews, getMyCourseReviews, api } from "@/lib/api";

interface PlaceReview {
  id: number;
  place_id: string;
  course_id: number;
  rating: number;
  review_text: string;
  tags: string[];
  photo_urls: string[];
  created_at: string;
  updated_at: string;
  place_name?: string;
}

interface CourseReview {
  id: number;
  buyer_user_id: string;
  shared_course_id: number;
  purchase_id: number;
  rating: number;
  review_text: string;
  tags: string[];
  photo_urls: string[];
  created_at: string;
  course_title?: string;
}

interface SharedCourseReview {
  id: number;
  shared_course_id: number;
  rating: number;
  review_text: string;
  tags: string[];
  photo_urls: string[];
  created_at: string;
  course_title?: string;
}

export default function MyReviewsPage() {
  const router = useRouter();
  
  // 장소별 후기 상태
  const [placeReviews, setPlaceReviews] = useState<PlaceReview[]>([]);
  const [placeLoading, setPlaceLoading] = useState(true);
  const [placeError, setPlaceError] = useState("");
  
  // 구매한 코스 후기 상태
  const [courseReviews, setCourseReviews] = useState<CourseReview[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState("");
  
  // 내가 공유한 코스 후기 상태
  const [sharedReviews, setSharedReviews] = useState<SharedCourseReview[]>([]);
  const [sharedLoading, setSharedLoading] = useState(true);
  const [sharedError, setSharedError] = useState("");
  
  // 공통 상태
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const currentToken = TokenStorage.get();
    if (currentToken) {
      setToken(currentToken);
      fetchMyPlaceReviews(currentToken);
      fetchMyCourseReviews(currentToken);
      fetchMySharedReviews(currentToken);
    } else {
      setPlaceError("로그인이 필요합니다.");
      setCourseError("로그인이 필요합니다.");
      setSharedError("로그인이 필요합니다.");
      setPlaceLoading(false);
      setCourseLoading(false);
      setSharedLoading(false);
    }
  }, []);

  const fetchMyPlaceReviews = async (authToken: string) => {
    try {
      setPlaceLoading(true);
      const data = await getMyReviews(authToken);
      setPlaceReviews(data);
    } catch (error: any) {
      setPlaceError(error.message || "장소별 후기 조회 중 오류가 발생했습니다.");
    } finally {
      setPlaceLoading(false);
    }
  };

  const fetchMyCourseReviews = async (authToken: string) => {
    try {
      setCourseLoading(true);
      const data = await getMyCourseReviews(authToken);
      setCourseReviews(data);
    } catch (error: any) {
      setCourseError(error.message || "구매 코스 후기 조회 중 오류가 발생했습니다.");
    } finally {
      setCourseLoading(false);
    }
  };

  const fetchMySharedReviews = async (authToken: string) => {
    try {
      setSharedLoading(true);
      // 내가 공유한 코스 목록 조회 - 올바른 API 사용
      const sharedCourses = await api("/shared_courses/my/created", "GET", undefined, authToken);
      
      // 공유 코스 응답에서 후기 정보 추출
      const reviews: SharedCourseReview[] = [];
      if (Array.isArray(sharedCourses)) {
        for (const course of sharedCourses) {
          // SharedCourseResponse에는 reviews 정보가 없으므로 각각 상세 조회
          try {
            const detailResponse = await api(`/shared_courses/${course.id}`, "GET", undefined, authToken);
            if (detailResponse.creator_review) {
              reviews.push({
                id: detailResponse.creator_review.rating, // 임시 ID
                shared_course_id: course.id,
                rating: detailResponse.creator_review.rating,
                review_text: detailResponse.creator_review.review_text,
                tags: detailResponse.creator_review.tags || [],
                photo_urls: [],
                created_at: detailResponse.creator_review.created_at,
                course_title: course.title
              });
            }
          } catch (detailError) {
            console.error(`공유 코스 ${course.id} 상세 정보 조회 실패:`, detailError);
          }
        }
      }
      setSharedReviews(reviews);
    } catch (error: any) {
      console.error("공유 코스 후기 조회 오류:", error);
      setSharedError(error.message || "공유 코스 후기 조회 중 오류가 발생했습니다.");
    } finally {
      setSharedLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const handlePlaceClick = (review: PlaceReview) => {
    // 장소 페이지로 이동
    router.push(`/places/${review.place_id}`);
  };

  const handleCourseClick = (review: CourseReview) => {
    // 커뮤니티 코스 페이지로 이동
    router.push(`/community/courses/${review.shared_course_id}`);
  };

  const handleSharedCourseClick = (review: SharedCourseReview) => {
    // 공유한 코스 페이지로 이동
    router.push(`/community/courses/${review.shared_course_id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">내가 쓴 후기</h1>
        
        <Tabs defaultValue="place" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="place" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              장소별 후기
            </TabsTrigger>
            <TabsTrigger value="course" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              구매 코스 후기
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              공유 코스 후기
            </TabsTrigger>
          </TabsList>

          {/* 장소별 후기 탭 */}
          <TabsContent value="place">
            {placeLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : placeError ? (
              <div className="text-center text-red-500 p-8">
                {placeError}
              </div>
            ) : placeReviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">📍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">작성한 장소별 후기가 없습니다</h3>
                <p className="text-gray-500 mb-6">데이트 코스를 방문한 후 장소별 후기를 작성해보세요!</p>
                <Button 
                  onClick={() => router.push('/course')}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  데이트 코스 만들기
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 mt-4">
                {placeReviews.map((review) => (
                  <Card 
                    key={review.id} 
                    className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handlePlaceClick(review)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{review.place_name || review.place_id}</span>
                          <span>•</span>
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      {review.review_text && (
                        <div className="mb-4">
                          <p className="text-gray-800 leading-relaxed line-clamp-3">
                            {review.review_text}
                          </p>
                        </div>
                      )}
                      
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {review.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{review.tags.length - 3}개 더</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 구매한 코스 후기 탭 */}
          <TabsContent value="course">
            {courseLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : courseError ? (
              <div className="text-center text-red-500 p-8">
                {courseError}
              </div>
            ) : courseReviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">💰</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">작성한 구매 코스 후기가 없습니다</h3>
                <p className="text-gray-500 mb-6">커뮤니티에서 코스를 구매한 후 후기를 작성해보세요!</p>
                <Button 
                  onClick={() => router.push('/community/courses')}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  커뮤니티 코스 둘러보기
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 mt-4">
                {courseReviews.map((review) => (
                  <Card 
                    key={review.id} 
                    className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCourseClick(review)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <span className="font-medium">{review.course_title || `코스 ID: ${review.shared_course_id}`}</span>
                          <span>•</span>
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      {review.review_text && (
                        <div className="mb-4">
                          <p className="text-gray-800 leading-relaxed line-clamp-3">
                            {review.review_text}
                          </p>
                        </div>
                      )}
                      
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {review.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{review.tags.length - 3}개 더</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 공유한 코스 후기 탭 */}
          <TabsContent value="shared">
            {sharedLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : sharedError ? (
              <div className="text-center text-red-500 p-8">
                {sharedError}
              </div>
            ) : sharedReviews.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-400 text-6xl mb-4">🚀</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">공유한 코스 후기가 없습니다</h3>
                <p className="text-gray-500 mb-6">내가 만든 코스를 커뮤니티에 공유해보세요!</p>
                <Button 
                  onClick={() => router.push('/list')}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  내 코스 보기
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 mt-4">
                {sharedReviews.map((review) => (
                  <Card 
                    key={review.id} 
                    className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSharedCourseClick(review)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Share2 className="w-4 h-4" />
                          <span className="font-medium">{review.course_title || `공유 코스 ID: ${review.shared_course_id}`}</span>
                          <span>•</span>
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(review.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="flex space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>
                      
                      {review.review_text && (
                        <div className="mb-4">
                          <p className="text-gray-800 leading-relaxed line-clamp-3">
                            {review.review_text}
                          </p>
                        </div>
                      )}
                      
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          {review.tags.length > 3 && (
                            <span className="text-xs text-gray-500">+{review.tags.length - 3}개 더</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}