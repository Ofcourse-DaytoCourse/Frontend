"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

interface Course {
  course_id: number;
  title: string;
  description: string;
  created_at: string;
  is_shared_with_couple: boolean;
  places: number[];
  creator_nickname: string;
  is_my_course: boolean;
  is_shared_course: boolean;
}

export default function ListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = TokenStorage.get();
        const user = UserStorage.get();
        
        if (!token || !user) {
          router.replace("/login");
          return;
        }

        const data = await api(`/courses/list?user_id=${user.user_id}`, "GET", undefined, token);
        setCourses(data.courses || []);
      } catch (err: any) {
        console.error("코스 목록 조회 실패:", err);
        alert("코스를 불러오는 중 오류가 발생했습니다: " + err.message);
      }
    };
    fetchCourses();
  }, [router]);

  const handleShareToggle = async (courseId: number) => {
    try {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) return;

      await api("/courses/share", "POST", { 
        course_id: courseId, 
        user_id: user.user_id 
      }, token);
      
      setCourses((prev) =>
        prev.map((c) =>
          c.course_id === courseId ? { ...c, is_shared_with_couple: !c.is_shared_with_couple } : c
        )
      );
    } catch (err: any) {
      console.error("공유 상태 변경 실패:", err);
      alert("공유 상태 변경 중 오류가 발생했습니다: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">저장된 코스</h1>
          <p className="text-gray-600">내가 저장한 코스와 공유받은 코스 목록입니다</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.course_id} className={`hover:shadow-lg transition-shadow ${
              course.is_shared_course ? 'border-blue-200 bg-blue-50' : ''
            }`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  {course.is_shared_course && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      💕 공유받음
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  {course.created_at?.split("T")[0]}
                  <span className="ml-2 text-gray-400">• {course.creator_nickname}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{course.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />예상 시간: 약 3~6시간
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-4 w-4" />예산: 5~10만원 예상
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Button asChild className="flex-1 mr-2 bg-transparent" variant="outline">
                    <Link href={course.is_shared_course ? `/shared/${course.course_id}` : `/list/${course.course_id}`}>상세보기</Link>
                  </Button>
                  {course.is_my_course && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">공유</span>
                      <Switch
                        checked={course.is_shared_with_couple}
                        onCheckedChange={() => handleShareToggle(course.course_id)}
                      />
                    </div>
                  )}
                  {course.is_shared_course && (
                    <span className="text-sm text-blue-600 font-medium">💝 상대방 코스</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">저장된 코스가 없습니다</p>
            <Button asChild className="bg-pink-600 hover:bg-pink-700">
              <Link href="/course">새 코스 만들기</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
