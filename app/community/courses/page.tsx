'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSharedCourses } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Eye, ShoppingCart, Heart, Users, ArrowLeft, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface SharedCourse {
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
  preview_image_url?: string;
  shared_at: string;
}

export default function CommunityCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<SharedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadCourses();
  }, [sortBy, page]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const response = await getSharedCourses({
        skip,
        limit: ITEMS_PER_PAGE,
        sort_by: sortBy
      });
      
      if (response && response.courses) {
        // 백엔드 응답에 없는 필드들 기본값 설정
        const coursesWithDefaults = response.courses.map((course: any) => ({
          ...course,
          creator_name: course.creator_name || '익명',
          overall_rating: course.overall_rating || 0,
          creator_rating: course.creator_rating || 0,
          avg_buyer_rating: course.avg_buyer_rating || null,
          buyer_review_count: course.buyer_review_count || 0
        }));
        
        setCourses(coursesWithDefaults);
        setTotalCount(response.total_count || 0);
      }
    } catch (error) {
      console.error('공유 코스 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
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
      day: 'numeric'
    });
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">커뮤니티 코스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Users className="w-8 h-8 mr-3 text-pink-500" />
                커뮤니티 코스
              </h1>
              <p className="text-gray-600 mt-1">다른 사용자들이 공유한 멋진 데이트 코스를 둘러보세요</p>
            </div>
          </div>
          
          {/* 정렬 옵션 */}
          <div className="flex items-center space-x-4">
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">최신순</SelectItem>
                <SelectItem value="popular">인기순</SelectItem>
                <SelectItem value="rating">평점순</SelectItem>
                <SelectItem value="purchases">구매순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-pink-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-pink-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 공유된 코스</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCount}개</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">이번 달 구매</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.purchase_count, 0)}건
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">평균 평점</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.length > 0 
                      ? (courses.reduce((sum, course) => sum + course.overall_rating, 0) / courses.length).toFixed(1)
                      : '0.0'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 코스 목록 */}
        {courses.length === 0 && !loading ? (
          <Card className="bg-white/80 backdrop-blur-sm text-center py-12">
            <CardContent>
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">아직 공유된 코스가 없습니다</h3>
              <p className="text-gray-500 mb-6">첫 번째로 멋진 데이트 코스를 공유해보세요!</p>
              <Link href="/list">
                <Button className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600">
                  내 코스 보러가기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow cursor-pointer border-pink-100 hover:border-pink-200"
                  onClick={() => router.push(`/community/courses/${course.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                        {course.creator_name}
                      </Badge>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        {course.price.toLocaleString()}원
                      </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight line-clamp-2">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* 평점 */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center mr-2">
                        {renderStars(course.overall_rating)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {course.overall_rating.toFixed(1)}
                      </span>
                      {course.buyer_review_count > 0 && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({course.buyer_review_count}개 후기)
                        </span>
                      )}
                    </div>

                    {/* 통계 */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {course.view_count}
                      </div>
                      <div className="flex items-center">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {course.purchase_count}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {course.save_count}
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 border-t pt-2">
                      {formatDate(course.shared_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalCount > ITEMS_PER_PAGE && (
              <div className="flex justify-center mt-8">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="bg-white"
                  >
                    이전
                  </Button>
                  
                  <div className="flex items-center px-4 py-2 bg-white rounded-md border">
                    <span className="text-sm text-gray-600">
                      {page} / {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    className="bg-white"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {loading && courses.length > 0 && (
              <div className="text-center mt-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}