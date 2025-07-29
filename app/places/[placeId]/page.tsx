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
  MessageCircle,
  Car,
  Globe,
  ChefHat,
  Tag
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <Skeleton className="h-6 w-20 mb-4" />
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="grid gap-6">
            <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
            </Card>
            
            <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl">
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">😕</div>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              {error || "장소를 찾을 수 없습니다"}
            </h3>
            <p className="text-text-secondary mb-6">잠시 후 다시 시도해주세요</p>
            <Button 
              onClick={() => router.push('/places')}
              variant="outline"
              className="rounded-full border-gray-200 hover:border-primary-pink hover:bg-secondary-pink"
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/places')}
            className="mb-6 rounded-full border-gray-300 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            장소 목록으로
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">{place.name}</h1>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {place.major_category && (
                <Badge variant="secondary" className="bg-primary-pink text-white px-4 py-2 rounded-full">
                  <Tag className="w-3 h-3 mr-1" />
                  {place.major_category}
                </Badge>
              )}
              {place.middle_category && (
                <Badge variant="secondary" className="bg-secondary-pink text-primary-pink px-4 py-2 rounded-full">
                  {place.middle_category}
                </Badge>
              )}
              {place.minor_category && (
                <Badge variant="outline" className="px-4 py-2 rounded-full border-primary-pink text-primary-pink">
                  {place.minor_category}
                </Badge>
              )}
              {place.category_name && !place.major_category && (
                <Badge variant="secondary" className="bg-secondary-pink text-primary-pink px-4 py-2 rounded-full">
                  {place.category_name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* 장소 기본 정보 */}
          <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary-pink/30 to-soft-purple/30 border-b-2 border-primary-pink/20">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/40">
                <CardTitle className="text-2xl font-bold text-text-primary flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary-pink" />
                  장소 정보
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              {place.address && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary-pink mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-text-secondary font-medium">주소</p>
                      <p className="text-text-primary">{place.address}</p>
                    </div>
                  </div>
                </div>
              )}

              {place.phone && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-primary-pink mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-text-secondary font-medium">전화번호</p>
                      <p className="text-text-primary">{place.phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {place.open_hours && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-pink mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-text-secondary font-medium">기본 운영시간</p>
                      <p className="text-text-primary">{place.open_hours}</p>
                    </div>
                  </div>
                </div>
              )}

              {place.business_hours && Object.keys(place.business_hours).length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary-pink mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="text-sm text-text-secondary font-medium mb-2">상세 영업시간</p>
                      <div className="space-y-1">
                        {Object.entries(place.business_hours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">{day}</span>
                            <span className="text-sm text-text-primary">{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-primary-pink mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-text-secondary font-medium">주차 가능 여부</p>
                    <p className="text-text-primary">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        place.is_parking 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {place.is_parking ? '✓ 주차 가능' : '✗ 주차 불가'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {place.homepage_url && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-primary-pink mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-text-secondary font-medium mb-2">홈페이지</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(place.homepage_url, '_blank')}
                        className="text-primary-pink border-primary-pink hover:bg-secondary-pink rounded-full"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        홈페이지 방문
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {place.summary && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <p className="text-sm text-text-secondary font-medium mb-3 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-primary-pink" />
                    소개
                  </p>
                  <p className="text-text-primary leading-relaxed">{place.summary}</p>
                </div>
              )}

              {place.kakao_url && (
                <div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(place.kakao_url, '_blank')}
                    className="w-full rounded-xl border-gray-200 hover:border-primary-pink hover:bg-secondary-pink text-primary-pink h-12"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    카카오맵에서 보기
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 대표 메뉴 섹션 */}
          {place.menu_info && place.menu_info.length > 0 && (
            <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-secondary-pink/30 to-soft-purple/30 border-b-2 border-primary-pink/20">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/40">
                  <CardTitle className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <ChefHat className="w-6 h-6 text-primary-pink" />
                    대표 메뉴
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid gap-4">
                  {place.menu_info.slice(0, 10).map((menu, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-primary mb-1">{menu.name}</h4>
                          {menu.description && (
                            <p className="text-sm text-text-secondary mb-2">{menu.description}</p>
                          )}
                        </div>
                        <div className="ml-4 text-right">
                          <span className="text-lg font-bold text-primary-pink">{menu.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {place.menu_info.length > 10 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-text-secondary">
                        외 {place.menu_info.length - 10}개 메뉴 더 있음
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 후기 섹션 */}
          <Card className="border border-gray-200 shadow-lg bg-white rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-secondary-pink/30 to-soft-purple/30 border-b-2 border-primary-pink/20">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Star className="w-6 h-6 text-primary-pink" />
                    후기
                  </CardTitle>
                  {reviews.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Rating value={averageRating} readonly size="sm" />
                      <span className="text-sm font-medium text-text-primary">
                        {averageRating} ({reviews.length}개 후기)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
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
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <MessageCircle className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-text-secondary mb-2">아직 후기가 없습니다</p>
                  <p className="text-sm text-gray-400">첫 번째 후기를 남겨주세요!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((review, index) => (
                    <div key={review.id} className={`${index !== reviews.length - 1 ? 'border-b border-gray-100 pb-6' : ''}`}>
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-pink to-light-purple rounded-2xl flex items-center justify-center shadow-lg">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Rating value={review.rating} readonly size="sm" />
                                <span className="text-sm font-medium text-text-primary">
                                  {review.rating}/5
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-text-secondary">
                                <Calendar className="w-3 h-3" />
                                {formatDate(review.created_at)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {review.review_text && (
                          <p className="text-text-primary leading-relaxed mb-4">
                            {review.review_text}
                          </p>
                        )}
                        
                        {review.tags && review.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {review.tags.map((tag, tagIndex) => (
                              <Badge 
                                key={tagIndex} 
                                variant="outline" 
                                className="text-xs px-3 py-1 bg-secondary-pink text-primary-pink border-primary-pink/30 rounded-full"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
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