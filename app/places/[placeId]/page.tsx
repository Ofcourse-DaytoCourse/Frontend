"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Rating } from "@/components/ui/rating";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star,
  ArrowLeft,
  ExternalLink,
  Calendar,
  User,
  MessageCircle
} from "lucide-react";
import { getPlaceDetail, getPlaceReviews } from "@/lib/places-api";
import type { Place } from "@/types/places";
import type { ReviewResponse } from "@/lib/reviews-api";

export default function PlaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const placeId = params?.placeId as string;
  
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (placeId) {
      loadPlaceData();
    }
  }, [placeId]);

  const loadPlaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 병렬로 장소 정보와 후기 로드
      const [placeData, reviewsData] = await Promise.allSettled([
        getPlaceDetail(placeId),
        getPlaceReviews(placeId)
      ]);

      if (placeData.status === 'fulfilled') {
        setPlace(placeData.value);
      } else {
        console.error("장소 정보 로드 실패:", placeData.reason);
        setError("장소 정보를 불러올 수 없습니다.");
      }

      if (reviewsData.status === 'fulfilled') {
        setReviews(reviewsData.value);
      } else {
        console.error("후기 로드 실패:", reviewsData.reason);
      }

    } catch (error) {
      console.error("장소 데이터 로드 실패:", error);
      setError("장소 정보를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setReviewsLoading(false);
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

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-6">
            <Skeleton className="h-6 w-20 mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border-b pb-4">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {error || "장소를 찾을 수 없습니다"}
            </h3>
            <p className="text-gray-500 mb-6">잠시 후 다시 시도해주세요</p>
            <Button 
              onClick={() => router.push('/places')}
              variant="outline"
            >
              장소 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const averageRating = calculateAverageRating();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/places')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            장소 목록으로
          </Button>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{place.name}</h1>
              {place.category_name && (
                <Badge variant="secondary" className="mb-2">
                  {place.category_name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* 장소 기본 정보 */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">장소 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {place.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">주소</p>
                    <p className="text-gray-900">{place.address}</p>
                  </div>
                </div>
              )}

              {place.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">전화번호</p>
                    <p className="text-gray-900">{place.phone}</p>
                  </div>
                </div>
              )}

              {place.open_hours && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600 font-medium">운영시간</p>
                    <p className="text-gray-900">{place.open_hours}</p>
                  </div>
                </div>
              )}

              {place.summary && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 font-medium mb-2">소개</p>
                  <p className="text-gray-700 leading-relaxed">{place.summary}</p>
                </div>
              )}

              {place.kakao_url && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.open(place.kakao_url, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    카카오맵에서 보기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 후기 섹션 */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-gray-900">후기</CardTitle>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Rating value={averageRating} readonly size="sm" />
                    <span className="text-sm font-medium text-gray-700">
                      {averageRating} ({reviews.length}개 후기)
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border-b pb-4">
                      <Skeleton className="h-4 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">아직 후기가 없습니다</p>
                  <p className="text-sm text-gray-400">첫 번째 후기를 남겨주세요!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={review.id} className={`${index !== reviews.length - 1 ? 'border-b pb-6' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Rating value={review.rating} readonly size="sm" />
                              <span className="text-sm font-medium text-gray-700">
                                {review.rating}/5
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              {formatDate(review.created_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {review.review_text && (
                        <p className="text-gray-700 leading-relaxed mb-3">
                          {review.review_text}
                        </p>
                      )}
                      
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {review.tags.map((tag, tagIndex) => (
                            <Badge 
                              key={tagIndex} 
                              variant="outline" 
                              className="text-xs px-2 py-1"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}