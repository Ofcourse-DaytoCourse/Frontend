'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSharedCourseDetail, purchaseCourse, savePurchasedCourse } from '@/lib/api';
import { TokenStorage, UserStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  DollarSign, 
  ArrowLeft, 
  ShoppingCart, 
  Heart,
  Eye,
  User,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SharedCourseDetail {
  id: number;
  title: string;
  description: string;
  creator_name: string;
  price: number;
  overall_rating: number;
  creator_rating: number;
  avg_buyer_rating: number | null;
  buyer_review_count: number;
  view_count: number;
  purchase_count: number;
  save_count: number;
  shared_at: string;
  
  // 코스 정보
  course: {
    course_id: number;
    title: string;
    description: string;
    places: Array<{
      sequence: number;
      name: string;
      address: string;
      category: string;
      phone?: string;
      estimated_duration?: number;
      estimated_cost?: number;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    }>;
  };
  
  // 공유자 후기
  creator_review: {
    rating: number;
    review_text: string;
    tags: string[];
    created_at: string;
  };
  
  // 구매자 후기들
  buyer_reviews: Array<{
    id: number;
    buyer_name: string;
    rating: number;
    review_text: string;
    created_at: string;
  }>;
  
  // 구매 상태
  purchase_status: {
    is_purchased: boolean;
    is_saved: boolean;
    can_purchase: boolean;
  };
}

export default function SharedCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);
  
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [course, setCourse] = useState<SharedCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const userData = UserStorage.get();
    const userToken = TokenStorage.get();
    
    // 로그인하지 않아도 조회 가능하도록 설정
    setUser(userData);
    setToken(userToken);
  }, [courseId]);

  useEffect(() => {
    // token이 설정된 후에 API 호출 (token이 null이어도 조회 가능)
    if (token !== null) {
      loadCourseDetail();
    }
  }, [token, courseId]);

  const loadCourseDetail = async () => {
    try {
      setLoading(true);
      const data = await getSharedCourseDetail(courseId, token || undefined);
      
      // 백엔드 응답에 없는 필드들 기본값 설정
      const courseWithDefaults = {
        ...data,
        creator_name: data.creator_name || '익명',
        overall_rating: data.overall_rating || 0,
        creator_rating: data.creator_rating || 0,
        avg_buyer_rating: data.avg_buyer_rating || null,
        buyer_review_count: data.buyer_review_count || 0,
        course: data.course || { places: [] },
        creator_review: data.creator_review || {
          rating: 0,
          review_text: '',
          tags: [],
          created_at: new Date().toISOString()
        },
        buyer_reviews: data.buyer_reviews || [],
        purchase_status: data.purchase_status || {
          is_purchased: false,
          is_saved: false,
          can_purchase: true
        }
      };
      
      setCourse(courseWithDefaults);
    } catch (error) {
      console.error('공유 코스 상세 조회 실패:', error);
      toast.error('코스 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user || !token) {
      toast.error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!course || !course.purchase_status.can_purchase) {
      toast.error('구매할 수 없는 코스입니다.');
      return;
    }

    try {
      setPurchasing(true);
      await purchaseCourse(courseId, token);
      
      toast.success('🎉 코스를 성공적으로 구매했습니다!\n300원이 차감되었습니다.');
      
      // 구매 후 강제 새로고침으로 최신 상태 확실히 로드
      window.location.reload();
      
    } catch (error: any) {
      console.error('구매 실패:', error);
      
      if (error.message?.includes('잔액')) {
        toast.error('잔액이 부족합니다. 크레딧을 충전해주세요.');
      } else if (error.message?.includes('이미 구매')) {
        toast.error('이미 구매한 코스입니다.');
        // 이미 구매된 경우에도 새로고침
        window.location.reload();
      } else if (error.message?.includes('자신의 코스')) {
        toast.error('자신의 코스는 구매할 수 없습니다.');
      } else {
        toast.error('구매에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleSave = async () => {
    if (!user || !token) {
      toast.error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    if (!course || !course.purchase_status.is_purchased) {
      toast.error('구매한 코스만 저장할 수 있습니다.');
      return;
    }

    try {
      setSaving(true);
      await savePurchasedCourse(courseId, token);
      
      toast.success('✅ 내 코스에 저장되었습니다!\n창작자에게 100원이 지급됩니다.');
      
      // 저장 후 상태 업데이트
      setCourse(prev => prev ? {
        ...prev,
        save_count: prev.save_count + 1,
        purchase_status: {
          ...prev.purchase_status,
          is_saved: true
        }
      } : null);
      
    } catch (error: any) {
      console.error('저장 실패:', error);
      
      if (error.message?.includes('이미 저장')) {
        toast.error('이미 저장된 코스입니다.');
      } else {
        toast.error('저장에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : index < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">코스 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-600 mb-2">코스를 찾을 수 없습니다</h3>
          <p className="text-gray-500 mb-6">삭제되었거나 존재하지 않는 코스입니다.</p>
          <Link href="/community/courses">
            <Button>커뮤니티로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{course.title}</h1>
            <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                {course.creator_name}
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(course.shared_at)}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                조회 {course.view_count}회
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-2">
            {/* 코스 정보 */}
            <Card className="bg-white/80 backdrop-blur-sm mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{course.course.title}</CardTitle>
                    <CardDescription className="mt-2">{course.description}</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-200 text-lg px-3 py-1">
                    {course.price.toLocaleString()}원
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* 평점 정보 */}
                <div className="flex items-center justify-between mb-6 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex items-center mr-3">
                      {renderStars(course.overall_rating)}
                    </div>
                    <span className="text-lg font-semibold text-gray-800">
                      {course.overall_rating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">
                      (전체 평점)
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>창작자: ⭐ {course.creator_rating.toFixed(1)}</div>
                    {course.avg_buyer_rating && (
                      <div>구매자: ⭐ {course.avg_buyer_rating.toFixed(1)} ({course.buyer_review_count}개)</div>
                    )}
                  </div>
                </div>

                {/* 장소 목록 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">📍 코스 일정</h3>
                  {course.course.places.map((place, index) => (
                    <div key={index} className="border-l-4 border-pink-200 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Badge variant="secondary" className="mr-2 bg-pink-100 text-pink-700">
                              {place.sequence}
                            </Badge>
                            <h4 className="font-medium text-gray-800">{place.name}</h4>
                          </div>
                          
                          <div className="space-y-1 text-sm text-gray-600 ml-8">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {place.address}
                            </div>
                            
                            {/* 장소 설명들 */}
                            <div className="space-y-3 mt-3">
                              {place.summary && (
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-100">
                                  <p className="font-semibold text-blue-800 text-sm mb-1">장소 소개</p>
                                  <p className="text-blue-700 text-sm leading-relaxed">{place.summary}</p>
                                </div>
                              )}
                              
                              {place.description && place.description.trim() && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                                  <p className="font-semibold text-green-800 text-sm mb-1">상세 정보</p>
                                  <p className="text-green-700 text-sm leading-relaxed">{place.description}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* 카카오맵 링크 */}
                            <div className="mt-3">
                              {place.kakao_url && (
                                <a 
                                  href={place.kakao_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors"
                                >
                                  <MapPin className="w-4 h-4 mr-1" />
                                  카카오맵으로 보기
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          {place.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 창작자 후기 */}
            <Card className="bg-white/80 backdrop-blur-sm mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-pink-500" />
                  창작자 후기
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    {renderStars(course.creator_review.rating)}
                    <span className="ml-2 font-medium">{course.creator_review.rating}.0</span>
                  </div>
                  <p className="text-gray-700">{course.creator_review.review_text}</p>
                </div>
                
                {course.creator_review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {course.creator_review.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-3">
                  {formatDate(course.creator_review.created_at)}
                </div>
              </CardContent>
            </Card>

            {/* 구매자 후기 */}
            {course.buyer_reviews.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2 text-green-500" />
                    구매자 후기 ({course.buyer_reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.buyer_reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{review.buyer_name}</span>
                            <div className="flex items-center ml-3">
                              {renderStars(review.rating)}
                              <span className="ml-1 text-sm">{review.rating}.0</span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(review.created_at)}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.review_text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1">
            {/* 구매/저장 카드 */}
            <Card className="bg-white/80 backdrop-blur-sm sticky top-6 mb-6">
              <CardHeader>
                <CardTitle className="text-lg">구매 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {course.price.toLocaleString()}원
                  </div>
                  <p className="text-sm text-gray-600">
                    구매 후 후기 작성 시 300원 환급
                  </p>
                </div>

                <Separator />

                {/* 구매 상태에 따른 버튼 */}
                {!course.purchase_status.is_purchased ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing || !course.purchase_status.can_purchase}
                  >
                    {purchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        구매하는 중...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {course.purchase_status.can_purchase ? '구매하기' : '구매 불가'}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center text-green-600 font-medium">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      구매 완료
                    </div>
                    
                    {!course.purchase_status.is_saved ? (
                      <Button 
                        className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                        size="lg"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            저장하는 중...
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            내 코스에 저장하기
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center text-pink-600 font-medium">
                        <Heart className="w-5 h-5 mr-2" />
                        저장 완료
                      </div>
                    )}
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center pt-2">
                  * 구매한 코스는 내 코스 목록에서 확인 가능합니다
                </div>
              </CardContent>
            </Card>

            {/* 통계 카드 */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">코스 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-2 text-gray-500" />
                      조회수
                    </div>
                    <span className="font-medium">{course.view_count.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2 text-green-500" />
                      구매수
                    </div>
                    <span className="font-medium">{course.purchase_count.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-pink-500" />
                      저장수
                    </div>
                    <span className="font-medium">{course.save_count.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}