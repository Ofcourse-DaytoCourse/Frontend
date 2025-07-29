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
    
    // 로그인이 필요한 페이지로 변경
    if (!userData || !userToken) {
      router.replace('/login');
      return;
    }
    
    setUser(userData);
    setToken(userToken);
  }, [courseId, router]);

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
      
      // 백엔드 데이터를 그대로 사용
      setCourse(data);
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
      
      toast.success('🎉 코스를 성공적으로 구매했습니다!\n300 day가 차감되었습니다.');
      
      // 구매 후 강제 새로고침으로 최신 상태 확실히 로드
      window.location.reload();
      
    } catch (error: any) {
      console.error('구매 실패:', error);
      
      if (error.message?.includes('day')) {
        toast.error('day가 부족합니다. day를 충전해주세요.');
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
      
      toast.success('✅ 내 코스에 저장되었습니다!\n창작자에게 100 day가 지급됩니다.');
      
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
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">코스 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-pink to-light-purple rounded-full flex items-center justify-center">
            <AlertCircle className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-4">코스를 찾을 수 없습니다</h3>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">삭제되었거나 존재하지 않는 코스입니다.</p>
          <Button asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3">
            <Link href="/community/courses">
              커뮤니티로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤더 */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-6 hover:bg-pink-50 rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">{course.title}</h1>
            <div className="flex items-center justify-center gap-6 text-sm text-text-secondary">
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
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white mb-6">
              <CardHeader className="border-b border-gray-100">
                <div>
                  <CardDescription className="text-text-secondary mb-2">{course.description}</CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* 평점 정보 */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl">
                  <div className="flex items-center">
                    <div className="flex items-center mr-3">
                      {renderStars(course.overall_rating)}
                    </div>
                    <span className="text-lg font-semibold text-text-primary">
                      {course.overall_rating ? course.overall_rating.toFixed(1) : '0.0'}
                    </span>
                    <span className="text-sm text-text-secondary ml-2">
                      (전체 평점)
                    </span>
                  </div>
                  
                  <div className="text-sm text-text-secondary space-y-1">
                    <div>창작자: ⭐ {course.creator_rating ? course.creator_rating.toFixed(1) : '0.0'}</div>
                    {course.avg_buyer_rating && (
                      <div>구매자: ⭐ {course.avg_buyer_rating ? course.avg_buyer_rating.toFixed(1) : '0.0'} ({course.buyer_review_count || 0}개)</div>
                    )}
                  </div>
                </div>

                {/* 장소 목록 - 구매한 사용자 또는 자신이 올린 코스인 경우 볼 수 있음 */}
                {(course.purchase_status.is_purchased || !course.purchase_status.can_purchase) ? (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                      <MapPin className="w-6 h-6 mr-2 text-primary-pink" />
                      코스 일정
                    </h3>
                    {(course.course.places || []).map((place, index) => (
                    <div key={index} className="relative">
                      {index < (course.course.places || []).length - 1 && (
                        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary-pink rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {place.sequence}
                          </div>
                        </div>
                        <div className="flex-1 bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-lg font-bold text-text-primary">{place.name}</h4>
                            <Badge className="bg-secondary-pink text-primary-pink rounded-full">
                              {place.category}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center text-sm text-text-secondary mb-4">
                            <MapPin className="w-4 h-4 mr-1" />
                            {place.address}
                          </div>
                            
                          {/* 장소 설명들 */}
                          {place.summary && (
                            <div className="bg-gray-50 p-4 rounded-xl mb-3">
                              <p className="text-sm text-text-secondary leading-relaxed">{place.summary}</p>
                            </div>
                          )}
                          
                          {place.description && place.description.trim() && (
                            <div className="bg-secondary-pink p-4 rounded-xl mb-3">
                              <p className="text-sm text-primary-pink leading-relaxed">{place.description}</p>
                            </div>
                          )}
                          
                          {/* 카카오맵 링크 */}
                          {place.kakao_url && (
                            <a 
                              href={place.kakao_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-pink hover:bg-primary-pink/90 rounded-full transition-colors"
                            >
                              <MapPin className="w-4 h-4 mr-1" />
                              카카오맵으로 보기
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center">
                      <MapPin className="w-6 h-6 mr-2 text-primary-pink" />
                      코스 일정
                    </h3>
                    <div className="bg-gray-100 rounded-2xl p-8 text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-gray-500" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-700 mb-2">구매 후 이용 가능</h4>
                      <p className="text-gray-600">
                        코스 일정은 구매한 후에 확인할 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}
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
            <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white sticky top-6 mb-6">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-text-primary">구매 정보</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary-pink mb-2">
                    {course.price.toLocaleString()} day
                  </div>
                  <p className="text-sm text-text-secondary">
                    구매 후 후기 작성 시 300 day 환급
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  {/* 구매 상태에 따른 버튼 */}
                  {!course.purchase_status.is_purchased ? (
                    <Button 
                      className="w-full bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                      onClick={handlePurchase}
                      disabled={purchasing || !course.purchase_status.can_purchase}
                    >
                      {purchasing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          구매하는 중...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          {course.purchase_status.can_purchase ? '지금 구매하기' : '구매 불가'}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center text-primary-pink font-bold text-lg p-4 bg-green-50 rounded-full">
                        <CheckCircle className="w-6 h-6 mr-2" />
                        구매 완료
                      </div>
                      
                      {!course.purchase_status.is_saved ? (
                        <Button 
                          className="w-full bg-light-purple hover:bg-light-purple/90 text-white rounded-full py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                          size="lg"
                          onClick={handleSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              저장하는 중...
                            </>
                          ) : (
                            <>
                              <Heart className="w-5 h-5 mr-2" />
                              내 코스에 저장하기
                            </>
                          )}
                        </Button>
                      ) : (
                        <div className="flex items-center justify-center text-primary-pink font-bold text-lg p-4 bg-pink-50 rounded-full">
                          <Heart className="w-6 h-6 mr-2 fill-current" />
                          저장 완료
                        </div>
                      )}
                    </div>
                  )}
                </div>

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
                    <span className="font-medium">{course.view_count}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShoppingCart className="w-4 h-4 mr-2 text-green-500" />
                      구매수
                    </div>
                    <span className="font-medium">{course.purchase_count}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-2 text-pink-500" />
                      저장수
                    </div>
                    <span className="font-medium">{course.save_count}</span>
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