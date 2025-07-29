"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { getCourses } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { Course } from "@/types/api";

export default function SharedCoursesPage() {
  const router = useRouter();
  const [sharedCourses, setSharedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedCourses();
  }, []);

  const fetchSharedCourses = async () => {
    try {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) {
        router.push("/login");
        return;
      }

      const response = await getCourses(user.user_id, token);
      // 공유된 코스만 필터링하고 최신순으로 정렬
      const shared = response.courses
        .filter(course => course.is_shared_with_couple)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSharedCourses(shared);
    } catch (err: any) {
      setError("공유 코스를 불러오는 중 오류가 발생했습니다.");
      console.error("Failed to fetch shared courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: number) => {
    router.push(`/shared/${courseId}`);
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">공유된 코스를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-pink to-light-purple rounded-full flex items-center justify-center">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-text-primary mb-4">오류가 발생했습니다</h3>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3"
          >
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  const hasCourses = sharedCourses.length > 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">공유된 코스</h1>
          <p className="text-lg text-text-secondary">연인과 함께 만들어가는 특별한 데이트 기록</p>
        </div>

        {/* Stats Card - 공유된 코스만 */}
        <div className="flex justify-center mb-12">
          <Card className="border border-gray-200 shadow-lg bg-white w-full max-w-2xl">
            <CardContent className="p-6 flex items-center justify-center gap-6">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-secondary-pink">
                <Users className="w-8 h-8 text-primary-pink" />
              </div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary-pink">{sharedCourses.length}개</p>
                <p className="text-sm text-text-secondary mt-1">공유된 코스</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course List */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">코스 목록</h2>
          <Button asChild variant="outline" className="rounded-full border-gray-300 bg-transparent">
            <Link href="/list">
              <ArrowLeft className="w-4 h-4 mr-2" />내 코스 목록으로 돌아가기
            </Link>
          </Button>
        </div>

        {hasCourses ? (
          <div className="space-y-6">
            {sharedCourses.map((course, index) => (
              <Card
                key={index}
                className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white cursor-pointer"
                onClick={() => handleCourseClick(course.course_id)}
              >
                <CardContent className="p-0 md:flex">
                  <div className="md:w-1/3 relative h-48 md:h-auto bg-gradient-to-br from-primary-pink/10 to-light-purple/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-primary-pink/50" />
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6 flex flex-col">
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-text-primary">{course.title}</h3>
                        <span className="text-sm text-text-secondary flex-shrink-0 ml-4">
                          공유 by {course.creator_nickname}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-3">
                        공유일: {new Date(course.created_at).toLocaleDateString('ko-KR')}
                      </p>
                      <div className="flex items-center gap-2 text-text-secondary mb-4">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <p className="truncate">
                          {course.places?.map(place => place.name).join(' → ') || '장소 정보 없음'}
                        </p>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">{course.description}</p>
                    </div>
                    <div className="flex justify-end items-end mt-6">
                      <Button className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full">
                        상세보기 <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 rounded-2xl bg-white">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-semibold text-text-primary mb-2">아직 공유된 코스가 없어요</h3>
              <p className="text-text-secondary mb-6">내 코스를 연인에게 공유하고 함께 추억을 만들어보세요.</p>
              <Button asChild size="lg" className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full">
                <Link href="/course">새 코스 만들기</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}