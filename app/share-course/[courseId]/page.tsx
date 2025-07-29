'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseDetail, createSharedCourse } from '@/lib/api';
import { TokenStorage, UserStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, MapPin, Phone, Clock, DollarSign, ArrowLeft, Share2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Course {
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
  }>;
}

export default function ShareCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.courseId as string);
  
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  
  // 공유 폼 상태
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 확인사항 체크 상태
  const [agreedToAll, setAgreedToAll] = useState(false);

  const predefinedTags = [
    '로맨틱', '인스타감성', '힐링', '액티비티', '맛집투어',
    '도심', '자연', '실내', '야외', '저예산', '고급'
  ];

  useEffect(() => {
    const userData = UserStorage.get();
    const userToken = TokenStorage.get();
    
    if (!userData || !userToken) {
      router.push('/login');
      return;
    }
    
    setUser(userData);
    setToken(userToken);
  }, [router]);

  useEffect(() => {
    if (user && token) {
      loadCourse();
    }
  }, [user, token, courseId]);

  const loadCourse = async () => {
    if (!token) {
      toast.error('로그인이 필요합니다.');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const data = await getCourseDetail({ 
        user_id: user.user_id, 
        course_id: courseId 
      }, token!);
      setCourse(data.course);
      
      // 기본값 설정
      setTitle(data.course.title);
      setDescription(data.course.description);
    } catch (error) {
      console.error('코스 로드 실패:', error);
      toast.error('코스 정보를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleShare = async () => {
    if (!course) return;

    if (reviewText.length < 15) {
      toast.error('후기는 15자 이상 작성해주세요.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('제목과 설명을 모두 입력해주세요.');
      return;
    }

    try {
      setSharing(true);

      const shareData = {
        shared_course_data: {
          course_id: courseId,
          title: title.trim(),
          description: description.trim()
        },
        review_data: {
          rating,
          review_text: reviewText.trim(),
          tags: selectedTags
        }
      };

      await createSharedCourse(shareData, token!);
      
      setShared(true);
      toast.success('🎉 코스가 성공적으로 공유되었습니다!\n300 day가 지급되었습니다.');

      // 3초 후 메인으로 이동
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error: any) {
      console.error('공유 실패:', error);
      
      // 장소별 후기처럼 alert으로 표시 (테스트용)
      alert(`코스 공유 실패: ${error.message}`);
      
      // 기존 toast 처리도 유지
      if (error.message?.includes('이미 공유된')) {
        toast.error('이미 공유된 코스입니다.');
      } else if (error.message?.includes('권한')) {
        toast.error('이 코스를 공유할 권한이 없습니다.');
      } else if (error.message?.includes('후기 작성이 거부되었습니다')) {
        // GPT 검증 실패 메시지 처리
        toast.error(error.message);
      } else if (error.message?.includes('1분 내에 이미 부적절한')) {
        // Rate Limit 메시지 처리
        toast.error(error.message);
      } else {
        // 기타 에러는 백엔드 메시지 그대로 표시하되, 없으면 기본 메시지
        toast.error(error.message || '코스 공유에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-pink mx-auto mb-6"></div>
          <p className="text-xl font-bold text-text-primary">코스 정보를 불러오는 중...</p>
          <p className="text-text-secondary mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-red-500 text-4xl">😞</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-4">코스를 찾을 수 없습니다</h2>
          <p className="text-text-secondary mb-6">요청하신 코스가 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/list">
            <Button className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3 font-bold">
              내 코스 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (shared) {
    return (
      <div className="min-h-screen bg-white p-6 flex items-center justify-center">
        <Card className="max-w-lg mx-auto text-center bg-white rounded-3xl shadow-xl border-none">
          <CardHeader className="pb-6">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-700 mb-2">공유 완료!</CardTitle>
            <CardDescription className="text-lg text-text-secondary">
              코스가 성공적으로 커뮤니티에 공유되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-8">
              <div className="bg-secondary-pink rounded-2xl p-6 text-center">
                <div className="text-4xl font-bold text-primary-pink mb-2">300 day</div>
                <div className="text-text-primary">공유 보상이 지급되었습니다!</div>
              </div>
              <p className="text-sm text-text-secondary bg-gray-50 p-3 rounded-xl">
                💡 감사합니다! 다른 커플들이 여러분의 멋진 코스를 즐길 수 있게 되었어요!
              </p>
            </div>
            <p className="text-sm text-text-secondary mb-6">3초 후 메인 페이지로 이동합니다...</p>
            <Button 
              onClick={() => router.push('/')}
              className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3 font-bold"
            >
              메인으로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mr-6 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            돌아가기
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary flex items-center justify-center">
              <Share2 className="w-8 h-8 mr-3 text-primary-pink" />
              커뮤니티에 코스 공유하기
            </h1>
            <p className="text-lg text-text-secondary mt-2">다른 커플들과 멋진 데이트 코스를 공유하고 day를 받아보세요!</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* 코스 미리보기 */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-text-primary flex items-center">
              <MapPin className="w-6 h-6 mr-2 text-primary-pink" />
              코스 미리보기
            </h2>
            <Card className="bg-white rounded-3xl shadow-xl border-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-primary-pink">{course.title}</CardTitle>
                <CardDescription className="text-text-secondary">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {course.places.map((place, index) => (
                    <div key={place.sequence} className="relative">
                      {index < course.places.length - 1 && (
                        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200"></div>
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary-pink rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            {place.sequence}
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-2xl p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-text-primary">{place.name}</h3>
                            <Badge className="bg-secondary-pink text-primary-pink rounded-full border-none">
                              {place.category}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-text-secondary">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              {place.address}
                            </div>
                            <div className="flex items-center space-x-4">
                              {place.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {place.phone}
                                </div>
                              )}
                              {place.estimated_duration && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {place.estimated_duration}분
                                </div>
                              )}
                              {place.estimated_cost && (
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  {place.estimated_cost.toLocaleString()} day
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 공유 설정 폼 */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-text-primary flex items-center">
              <Share2 className="w-6 h-6 mr-2 text-primary-pink" />
              공유 설정
            </h2>
            <Card className="bg-white rounded-3xl shadow-xl border-none">
              <CardContent className="pt-8 space-y-8">
                {/* 제목 */}
                <div>
                  <label className="block text-lg font-bold text-text-primary mb-3">공유 제목</label>
                  <Textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="공유할 코스의 제목을 입력하세요"
                    className="min-h-[60px] rounded-2xl border-gray-200 focus:border-primary-pink focus:ring-primary-pink"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-lg font-bold text-text-primary mb-3">코스 설명</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="다른 사용자들에게 이 코스를 소개해주세요"
                    className="min-h-[80px] rounded-2xl border-gray-200 focus:border-primary-pink focus:ring-primary-pink"
                  />
                </div>

                {/* 평점 */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <label className="block text-lg font-bold text-text-primary mb-4">이 코스를 평가해주세요</label>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-2 transition-all duration-200 hover:scale-110 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-10 h-10 fill-current" />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-text-secondary mt-2">현재 평점: {rating}점</p>
                </div>

                {/* 후기 */}
                <div>
                  <label className="block text-lg font-bold text-text-primary mb-3">
                    후기 작성 <span className="text-primary-pink">*</span>
                    <span className="text-sm text-text-secondary ml-2">(최소 15자)</span>
                  </label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="실제 데이트에서 경험한 솔직한 후기를 작성해주세요. (예: 분위기, 음식, 서비스, 접근성 등)"
                    className="min-h-[120px] rounded-2xl border-gray-200 focus:border-primary-pink focus:ring-primary-pink"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-text-secondary">
                      {reviewText.length}/15자 이상
                    </p>
                    {reviewText.length >= 15 && (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ 조건 충족
                      </div>
                    )}
                  </div>
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-lg font-bold text-text-primary mb-4">태그 선택 (선택사항)</label>
                  <div className="flex flex-wrap gap-3">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
                    <p className="text-sm text-text-secondary mt-3">
                      선택된 태그: {selectedTags.length}개
                    </p>
                  )}
                </div>

                {/* 공유 전 확인사항 체크 */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-lg">⚠</span>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800">공유 전 확인사항</h3>
                  </div>
                  <div className="text-sm text-amber-700 space-y-3 mb-6">
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <p>공유된 코스와 후기는 <span className="font-bold">수정 및 삭제가 불가능</span>합니다</p>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <p>작성한 후기가 홍보 목적으로 사용될 수 있습니다</p>
                    </div>
                    <div className="flex items-start">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <p>부적절한 내용의 후기는 AI가 자동으로 차단할 수 있습니다</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="agree-all" 
                      checked={agreedToAll}
                      onCheckedChange={(checked) => setAgreedToAll(checked as boolean)}
                      className="mt-1 border-amber-300 data-[state=checked]:bg-amber-500"
                    />
                    <label htmlFor="agree-all" className="text-sm text-amber-800 font-bold cursor-pointer">
                      위 모든 사항을 확인했으며 동의합니다
                    </label>
                  </div>
                </div>

                <div className="bg-secondary-pink border-2 border-primary-pink/20 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-lg">🎁</span>
                    </div>
                    <h3 className="text-lg font-bold text-primary-pink">공유 보상</h3>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-3xl font-bold text-primary-pink mb-2">300 day</div>
                    <div className="text-text-primary">코스 공유 완료 시 지급</div>
                  </div>
                  <p className="text-xs text-text-secondary text-center mt-4 bg-white/50 p-2 rounded-lg">
                    * 지급된 크레딧은 환불이 불가능하며, 앱 내에서만 사용 가능합니다.
                  </p>
                </div>

                <Button 
                  onClick={handleShare}
                  disabled={
                    sharing || 
                    reviewText.length < 15 || 
                    !title.trim() || 
                    !description.trim() ||
                    !agreedToAll
                  }
                  className="w-full bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full font-bold py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  {sharing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      공유하는 중...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5 mr-3" />
                      커뮤니티에 공유하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}