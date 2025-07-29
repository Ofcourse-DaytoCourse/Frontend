'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSharedCourses } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Eye, ShoppingCart, Heart, Users, ArrowLeft, TrendingUp, DollarSign, Crown, Flame, MessageSquare, Search, MapPin, Clock, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input"
import Link from 'next/link';
import Image from "next/image"

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
  const [filteredCourses, setFilteredCourses] = useState<SharedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('purchase_count_desc');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [bestCourse, setBestCourse] = useState<SharedCourse | null>(null);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    loadCourses();
  }, [sortBy, page]);

  useEffect(() => {
    // 컴포넌트 마운트시 베스트 코스 로드
    loadBestCourse();
  }, []);

  // 검색어가 변경될 때 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => 
        (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.creator_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  const loadBestCourse = async () => {
    try {
      const response = await getSharedCourses({
        skip: 0,
        limit: 1,
        sort_by: 'purchase_count_desc'
      });
      
      if (response && response.courses && response.courses.length > 0) {
        setBestCourse(response.courses[0]);
      }
    } catch (error) {
      console.error('베스트 코스 로드 실패:', error);
    }
  };

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
        // 백엔드 응답에 없는 필드들 기본값 설정 (조회수/구매수는 건드리지 않음)
        const coursesWithDefaults = response.courses.map((course: any) => ({
          ...course,
          creator_name: course.creator_name || '익명',
          overall_rating: course.overall_rating || 0,
          creator_rating: course.creator_rating || 0,
          avg_buyer_rating: course.avg_buyer_rating || null,
          buyer_review_count: course.buyer_review_count || 0
        }));
        
        setCourses(coursesWithDefaults);
        setFilteredCourses(coursesWithDefaults);
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
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">커뮤니티 코스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* 헤더 */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">커뮤니티 코스 마켓</h1>
          <p className="text-lg text-text-secondary">
            실제 커플들이 검증한 베스트 데이트 코스를 둘러보고 구매해보세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary-pink" />
              <p className="text-2xl font-bold text-primary-pink">{totalCount}</p>
              <p className="text-sm text-text-secondary">공유된 코스</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardContent className="p-6 text-center">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-primary-pink" />
              <p className="text-2xl font-bold text-primary-pink">
                {filteredCourses.reduce((sum, course) => sum + course.purchase_count, 0)}
              </p>
              <p className="text-sm text-text-secondary">총 구매 수</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200 shadow-lg bg-white">
            <CardContent className="p-6 text-center">
              <Crown className="w-8 h-8 mx-auto mb-2 text-light-purple" />
              <p className="text-2xl font-bold text-light-purple">
                {filteredCourses.length > 0 
                  ? (filteredCourses.reduce((sum, course) => sum + (course.overall_rating || 0), 0) / filteredCourses.length).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-sm text-text-secondary">평균 평점</p>
            </CardContent>
          </Card>
        </div>

        {/* 검색 및 정렬 */}
        <Card className="mb-8 border border-gray-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <Input
                  placeholder="원하는 코스를 검색해보세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-full focus-visible:ring-primary-pink border-2 border-gray-200"
                />
              </div>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-12 rounded-full border-2 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase_count_desc">구매 많은 순</SelectItem>
                  <SelectItem value="rating">평점 높은 순</SelectItem>
                  <SelectItem value="popular">조회 많은 순</SelectItem>
                  <SelectItem value="latest">최신순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Featured Course - 베스트 코스 */}
        {bestCourse && (
          <Card className="mb-8 border-2 border-primary-pink shadow-xl bg-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4 text-primary-pink">
                <Crown className="w-6 h-6" />
                <span className="font-bold">이주의 베스트 코스</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-text-primary">{bestCourse.title}</h3>
                  <p className="text-lg text-text-secondary mb-4">{bestCourse.description}</p>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      {renderStars(bestCourse?.overall_rating || 0)}
                      <span className="font-semibold text-text-primary ml-2">{bestCourse?.overall_rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <span className="text-2xl font-bold text-primary-pink">{bestCourse.price.toLocaleString()} day</span>
                  </div>
                  <Button 
                    size="lg" 
                    className="bg-primary-pink text-white hover:bg-primary-pink/90 rounded-full px-8"
                    onClick={() => router.push(`/community/courses/${bestCourse.id}`)}
                  >
                    지금 구매하기
                  </Button>
                </div>
                <div className="relative h-64 lg:h-80 bg-gradient-to-br from-primary-pink/10 to-light-purple/10 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-24 h-24 text-primary-pink/30" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 코스 목록 */}
        {filteredCourses.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-pink to-light-purple rounded-full flex items-center justify-center">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">
              {searchTerm ? '검색 결과가 없어요' : '아직 공유된 코스가 없어요'}
            </h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              {searchTerm ? '다른 검색어로 시도해보세요!' : '첫 번째로 멋진 데이트 코스를 공유해보세요!'}
            </p>
            <Button asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3">
              <Link href="/list">
                내 코스 보러가기
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course, index) => (
                <Card
                  key={course.id}
                  className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white cursor-pointer"
                  onClick={() => router.push(`/community/courses/${course.id}`)}
                >
                  <div className="relative h-48 bg-gradient-to-br from-primary-pink/10 to-light-purple/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary-pink/50" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="text-primary-pink font-bold text-lg bg-white/80 px-2 py-1 rounded-md">
                        #{(page - 1) * ITEMS_PER_PAGE + index + 1}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-text-primary mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-text-secondary mb-3 line-clamp-2">{course.description}</p>

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {renderStars(course.overall_rating)}
                        <span className="text-sm font-semibold ml-1">{course.overall_rating ? course.overall_rating.toFixed(1) : '0.0'}</span>
                        <span className="text-sm text-text-secondary">({course.buyer_review_count})</span>
                      </div>
                      <span className="font-bold text-primary-pink text-lg">{course.price.toLocaleString()} day</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{course.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.purchase_count}명 구매</span>
                      </div>
                    </div>


                    <div className="flex items-center justify-end">
                      <Button 
                        size="sm"
                        className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/community/courses/${course.id}`);
                        }}
                      >
                        구매하기
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalCount > ITEMS_PER_PAGE && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-full border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                  >
                    이전
                  </Button>
                  
                  <div className="flex items-center px-6 py-2 bg-white rounded-full border-2 border-gray-200">
                    <span className="text-sm font-medium text-text-primary">
                      {page} / {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    className="rounded-full border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}

            {loading && filteredCourses.length > 0 && (
              <div className="text-center mt-8">
                <div className="w-8 h-8 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}