'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCourseDetail, createSharedCourse } from '@/lib/api';
import { TokenStorage, UserStorage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
      toast.success('🎉 코스가 성공적으로 공유되었습니다!\n300원이 지급되었습니다.');

      // 3초 후 메인으로 이동
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error: any) {
      console.error('공유 실패:', error);
      
      if (error.message?.includes('이미 공유된')) {
        toast.error('이미 공유된 코스입니다.');
      } else if (error.message?.includes('권한')) {
        toast.error('이 코스를 공유할 권한이 없습니다.');
      } else {
        toast.error('코스 공유에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setSharing(false);
    }
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
          <p className="text-red-500 mb-4">코스를 찾을 수 없습니다.</p>
          <Link href="/list">
            <Button>내 코스 목록으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (shared) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6 flex items-center justify-center">
        <Card className="max-w-md mx-auto text-center border-2 border-green-200 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-green-700">공유 완료!</CardTitle>
            <CardDescription>
              코스가 성공적으로 커뮤니티에 공유되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <p>✨ 공유 보상: <span className="font-semibold text-green-600">300원</span></p>
              <p>💰 추가 보상: 다른 사용자가 저장할 때마다 <span className="font-semibold">100원</span></p>
            </div>
            <p className="text-sm text-gray-500 mb-4">3초 후 메인 페이지로 이동합니다...</p>
            <Button onClick={() => router.push('/')}>메인으로 이동</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Share2 className="w-6 h-6 mr-2 text-pink-500" />
              커뮤니티에 코스 공유하기
            </h1>
            <p className="text-gray-600 mt-1">다른 사용자들과 멋진 데이트 코스를 공유해보세요!</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* 코스 미리보기 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">코스 미리보기</h2>
            <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
              <CardHeader>
                <CardTitle className="text-pink-700">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.places.map((place) => (
                    <div key={place.sequence} className="border-l-4 border-pink-200 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Badge variant="secondary" className="mr-2">
                              {place.sequence}
                            </Badge>
                            <h3 className="font-medium text-gray-800">{place.name}</h3>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
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
                                  {place.estimated_cost.toLocaleString()}원
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-pink-100 text-pink-700 border-pink-200">
                          {place.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 공유 설정 폼 */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">공유 설정</h2>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium mb-2">공유 제목</label>
                  <Textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="공유할 코스의 제목을 입력하세요"
                    className="min-h-[60px]"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium mb-2">코스 설명</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="다른 사용자들에게 이 코스를 소개해주세요"
                    className="min-h-[80px]"
                  />
                </div>

                {/* 평점 */}
                <div>
                  <label className="block text-sm font-medium mb-3">이 코스를 평가해주세요</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-1 transition-colors ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <Star className="w-8 h-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* 후기 */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    후기 작성 <span className="text-red-500">*</span>
                    <span className="text-sm text-gray-500 ml-2">(최소 15자)</span>
                  </label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="실제 데이트에서 경험한 솔직한 후기를 작성해주세요. (예: 분위기, 음식, 서비스, 접근성 등)"
                    className="min-h-[120px]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {reviewText.length}/15자 이상
                  </p>
                </div>

                {/* 태그 */}
                <div>
                  <label className="block text-sm font-medium mb-3">태그 선택 (선택사항)</label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-pink-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 크레딧 안내 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">🎁 공유 보상</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• 코스 공유 시: <span className="font-semibold">300원 지급</span></p>
                    <p>• 다른 사용자가 저장할 때마다: <span className="font-semibold">100원 추가 지급</span></p>
                    <p className="text-xs text-green-600 mt-2">
                      * 지급된 크레딧은 환불이 불가능하며, 앱 내에서만 사용 가능합니다.
                    </p>
                  </div>
                </div>

                <Button 
                  onClick={handleShare}
                  disabled={sharing || reviewText.length < 15 || !title.trim() || !description.trim()}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                  size="lg"
                >
                  {sharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      공유하는 중...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
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