// app/shared/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { getCourses } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
      // 공유된 코스만 필터링
      const shared = response.courses.filter(course => course.is_shared_with_couple);
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8 text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">공유된 코스</h1>
          <p className="text-gray-600">연인과 함께 공유한 데이트 코스들을 확인해보세요</p>
        </div>

        {sharedCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">아직 공유된 코스가 없습니다.</div>
            <Button onClick={() => router.push("/course")}>
              새 코스 만들기
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sharedCourses.map((course) => (
              <Card 
                key={course.course_id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCourseClick(course.course_id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <Badge variant="secondary">공유됨</Badge>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {course.creator_nickname}님이 만든 코스
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  
                  {course.places && course.places.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 font-medium">포함된 장소:</p>
                      <div className="space-y-1">
                        {course.places.slice(0, 3).map((place, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            {index + 1}. {place.name}
                          </p>
                        ))}
                        {course.places.length > 3 && (
                          <p className="text-xs text-gray-500">
                            외 {course.places.length - 3}곳 더...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      생성일: {new Date(course.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="text-center pt-6">
          <Button 
            variant="outline" 
            onClick={() => router.push("/list")}
          >
            내 코스 목록으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
