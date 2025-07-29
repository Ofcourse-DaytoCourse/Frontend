"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, MapPin, Edit, Copy, Trash2, Eye, ChevronDown, Plus, Filter, Search, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useRouter } from "next/navigation";

const StarRating = ({ rating = 5, className = "" }: { rating?: number; className?: string }) => (
  <div className={`flex items-center gap-0.5 ${className}`}>
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
    ))}
  </div>
)

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
  is_purchased_course: boolean;
  is_community_shared: boolean;
}

export default function ListPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

        // 1. 내 코스 목록 가져오기
        const myCoursesData = await api(`/courses/list?user_id=${user.user_id}`, "GET", undefined, token);
        // 내 코스들 - 구매한 코스 ID들을 제외하기 위해 먼저 가져옴
        const purchasedCourseIds = new Set();
        try {
          const purchasedData = await api("/shared_courses/my/purchased", "GET", undefined, token);
          for (const purchase of purchasedData || []) {
            purchasedCourseIds.add(purchase.copied_course_id);
          }
          console.log("구매한 코스 ID들:", Array.from(purchasedCourseIds));
        } catch (err) {
          console.log("구매한 코스 ID 조회 실패:", err);
        }
        
        let allCourses = (myCoursesData.courses || [])
          .filter((course: Course) => 
            !purchasedCourseIds.has(course.course_id) && // 구매한 코스 제외 (별도 처리)
            !course.is_shared_course                      // 연인이 공유한 코스 제외 (shared 페이지용)
          )
          .map((course: Course) => ({
            ...course,
            is_my_course: true,
            is_purchased_course: false,
            is_community_shared: false
          }));
        
        console.log("내 코스 (구매한 코스 제외 후):", allCourses.map(c => ({id: c.course_id, title: c.title})));

        // 2. 구매한 코스 목록 가져오기 (원래 방식)
        let purchasedCourses = [];
        try {
          const purchasedData = await api("/shared_courses/my/purchased", "GET", undefined, token);
          console.log("구매한 코스 원본 데이터:", purchasedData);
          
          for (const purchase of purchasedData || []) {
            try {
              const courseDetail = await api(`/courses/detail?user_id=${user.user_id}&course_id=${purchase.copied_course_id}`, "GET", undefined, token);
              
              if (courseDetail?.course) {
                purchasedCourses.push({
                  course_id: `purchased_${purchase.copied_course_id}`, // 유니크 ID
                  title: courseDetail.course.title,
                  description: courseDetail.course.description,
                  created_at: purchase.purchased_at,
                  places: courseDetail.course.places || [],
                  creator_nickname: "구매한 코스",
                  is_my_course: false,
                  is_shared_course: false,
                  is_purchased_course: true,
                  is_community_shared: false,
                  is_shared_with_couple: courseDetail.course.is_shared_with_couple || false
                });
              }
            } catch (detailErr) {
              console.log(`코스 상세 정보 조회 실패 (ID: ${purchase.copied_course_id}):`, detailErr);
            }
          }
          console.log("구매한 코스 최종:", purchasedCourses.map(c => ({id: c.course_id, title: c.title})));
        } catch (err) {
          console.log("구매한 코스 조회 실패:", err);
        }

        // 3. 커뮤니티에 공유한 코스 확인
        try {
          const mySharedCourses = await api("/shared_courses/my/created", "GET", undefined, token);
          console.log("내가 공유한 코스 목록:", mySharedCourses);
          console.log("내 코스 목록:", allCourses.map(c => ({id: c.course_id, title: c.title, is_my: c.is_my_course})));
          
          if (Array.isArray(mySharedCourses)) {
            // 각 공유 코스와 내 코스 비교
            mySharedCourses.forEach((shared: any) => {
              console.log(`공유된 코스: ID=${shared.id}, course_id=${shared.course_id}, title=${shared.title}`);
            });
            
            allCourses = allCourses.map(course => {
              const matchingShared = mySharedCourses.find((shared: any) => 
                shared.course_id === course.course_id  // original_course_id 대신 course_id 사용
              );
              
              if (matchingShared) {
                console.log(`매칭 발견! 코스 ${course.course_id} (제목: ${course.title}) <-> 공유코스 ${matchingShared.id}`);
              }
              
              if (course.is_my_course && !course.is_purchased_course && matchingShared) {
                console.log(`코스 ${course.course_id} (제목: ${course.title}) 커뮤니티 공유 표시!`);
                return { ...course, is_community_shared: true };
              }
              return course;
            });
          }
        } catch (err) {
          console.log("공유 코스 조회 실패:", err);
        }

        // 4. 구매한 코스를 마지막에 추가
        allCourses = [...allCourses, ...purchasedCourses];

        const sortedCourses = allCourses.sort((a: Course, b: Course) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setCourses(sortedCourses);
        setFilteredCourses(sortedCourses);
      } catch (err: any) {
        console.error("코스 목록 조회 실패:", err);
        alert("코스를 불러오는 중 오류가 발생했습니다: " + err.message);
      }
    };
    fetchCourses();
  }, [router]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

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
        prev.map((c) => {
          // 구매한 코스인 경우 purchased_ 접두사를 제거하고 비교
          const actualCourseId = c.is_purchased_course 
            ? parseInt(c.course_id.toString().replace('purchased_', ''))
            : c.course_id;
          
          return actualCourseId === courseId 
            ? { ...c, is_shared_with_couple: !c.is_shared_with_couple } 
            : c;
        })
      );
    } catch (err: any) {
      console.error("공유 상태 변경 실패:", err);
      alert("공유 상태 변경 중 오류가 발생했습니다: " + err.message);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("정말로 이 코스를 삭제하시겠습니까?")) return;
    
    try {
      const token = TokenStorage.get();
      const user = UserStorage.get();
      
      if (!token || !user) return;

      await api("/courses/delete", "DELETE", { user_id: user.user_id, course_id: courseId }, token);
      
      setCourses((prev) => prev.filter((c) => {
        // 구매한 코스인 경우 purchased_ 접두사를 제거하고 비교
        const actualCourseId = c.is_purchased_course 
          ? parseInt(c.course_id.toString().replace('purchased_', ''))
          : c.course_id;
        
        return actualCourseId !== courseId;
      }));
      alert("코스가 성공적으로 삭제되었습니다.");
    } catch (err: any) {
      console.error("코스 삭제 실패:", err);
      alert("코스 삭제 중 오류가 발생했습니다: " + err.message);
    }
  };

  const myCourses = filteredCourses.filter(c => c.is_my_course === true && c.is_purchased_course === false);
  const purchasedCoursesFiltered = filteredCourses.filter(c => c.is_purchased_course === true);
  const communitySharedCourses = filteredCourses.filter(c => c.is_community_shared === true && c.is_purchased_course === false);
  const coupleSharedCourses = filteredCourses.filter(c => c.is_shared_with_couple === true);
  
  console.log("내 코스:", myCourses.length, myCourses.map(c => ({id: c.course_id, title: c.title, is_my: c.is_my_course, is_purchased: c.is_purchased_course})));
  console.log("구매한 코스:", purchasedCoursesFiltered.length, purchasedCoursesFiltered.map(c => ({id: c.course_id, title: c.title})));
  console.log("커뮤니티 공유:", communitySharedCourses.length, communitySharedCourses.map(c => ({id: c.course_id, title: c.title})));
  console.log("연인 공유:", coupleSharedCourses.length);
  
  const stats = [
    { value: filteredCourses.length, label: "전체 코스", textColor: "text-primary-pink" },
    { value: myCourses.length, label: "내 코스", textColor: "text-light-purple" },
    { value: purchasedCoursesFiltered.length, label: "구매한 코스", textColor: "text-primary-pink" },
    { value: communitySharedCourses.length, label: "커뮤니티 공유", textColor: "text-light-purple" },
    { value: coupleSharedCourses.length, label: "연인 공유", textColor: "text-primary-pink" },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">내 코스 관리</h1>
          <p className="text-lg text-text-secondary">나만의 데이트 코스를 관리하고 수익을 확인해보세요</p>
        </div>

        {/* Stats Cards */}
        {courses.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {stats.map((stat, index) => (
              <Card key={stat.label} className="border border-gray-200 shadow-lg bg-white">
                <CardContent className="p-4">
                  <p className={`text-xl sm:text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-xs text-text-secondary mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search and Filter */}
        <Card className="mb-8 border border-gray-200 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <Input
                  placeholder="코스 제목으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-full focus-visible:ring-primary-pink border-2 border-gray-200"
                />
              </div>
              <Button asChild className="h-12 bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6">
                <Link href="/course">
                  <Plus className="w-4 h-4 mr-2" />새 코스 만들기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <div className="flex justify-between items-center mb-8">
            <TabsList className="bg-white p-1 rounded-full shadow-lg border border-gray-200">
              <TabsTrigger
                value="all"
                className="rounded-full data-[state=active]:bg-secondary-pink data-[state=active]:text-primary-pink data-[state=active]:shadow-inner px-4"
              >
                전체 ({filteredCourses.length})
              </TabsTrigger>
              <TabsTrigger
                value="my"
                className="rounded-full data-[state=active]:bg-secondary-pink data-[state=active]:text-primary-pink data-[state=active]:shadow-inner px-4"
              >
                내 코스 ({myCourses.length})
              </TabsTrigger>
              <TabsTrigger
                value="purchased"
                className="rounded-full data-[state=active]:bg-secondary-pink data-[state=active]:text-primary-pink data-[state=active]:shadow-inner px-4"
              >
                구매한 코스 ({purchasedCoursesFiltered.length})
              </TabsTrigger>
              <TabsTrigger
                value="community"
                className="rounded-full data-[state=active]:bg-secondary-pink data-[state=active]:text-primary-pink data-[state=active]:shadow-inner px-4"
              >
                커뮤니티 공유 ({communitySharedCourses.length})
              </TabsTrigger>
              <TabsTrigger
                value="couple"
                className="rounded-full data-[state=active]:bg-secondary-pink data-[state=active]:text-primary-pink data-[state=active]:shadow-inner px-4"
              >
                연인 공유 ({coupleSharedCourses.length})
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              className="rounded-full border-2 border-gray-200 hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink bg-transparent"
            >
              정렬: 최신순 <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <TabsContent value="all" className="space-y-6">
            {filteredCourses.map((course, index) => (
              <CourseCard key={course.course_id} course={course} index={index} handleShareToggle={handleShareToggle} handleDeleteCourse={handleDeleteCourse} />
            ))}
          </TabsContent>

          <TabsContent value="my" className="space-y-6">
            {myCourses.map((course, index) => (
              <CourseCard key={course.course_id} course={course} index={index} handleShareToggle={handleShareToggle} handleDeleteCourse={handleDeleteCourse} />
            ))}
          </TabsContent>

          <TabsContent value="purchased" className="space-y-6">
            {purchasedCoursesFiltered.map((course, index) => (
              <CourseCard key={course.course_id} course={course} index={index} handleShareToggle={handleShareToggle} handleDeleteCourse={handleDeleteCourse} />
            ))}
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            {communitySharedCourses.map((course, index) => (
              <CourseCard key={course.course_id} course={course} index={index} handleShareToggle={handleShareToggle} handleDeleteCourse={handleDeleteCourse} />
            ))}
          </TabsContent>

          <TabsContent value="couple" className="space-y-6">
            {coupleSharedCourses.map((course, index) => (
              <CourseCard key={course.course_id} course={course} index={index} handleShareToggle={handleShareToggle} handleDeleteCourse={handleDeleteCourse} />
            ))}
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-pink to-light-purple rounded-full flex items-center justify-center">
              <MapPin className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-text-primary mb-4">아직 저장된 코스가 없어요</h3>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              첫 번째 데이트 코스를 만들어보세요! AI가 당신만을 위한 특별한 코스를 추천해드립니다.
            </p>
            <Button asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-3">
              <Link href="/course">
                <Plus className="w-5 h-5 mr-2" />
                새 코스 만들기
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, index, handleShareToggle, handleDeleteCourse }: { 
  course: Course; 
  index: number; 
  handleShareToggle: (courseId: number) => void;
  handleDeleteCourse: (courseId: number) => void;
}) {
  return (
    <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
          {/* Image placeholder */}
          <div className="relative h-48 lg:h-auto bg-gradient-to-br from-primary-pink/10 to-light-purple/10">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-primary-pink/50" />
            </div>
            <div className="absolute top-4 left-4">
              <div
                className={`flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full ${
                  course.is_shared_course
                    ? "bg-white text-primary-pink border border-primary-pink"
                    : course.is_my_course
                    ? "bg-white text-light-purple border border-light-purple"
                    : "bg-white/90 text-text-secondary border border-gray-200"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  course.is_shared_course ? "bg-primary-pink" : 
                  course.is_my_course ? "bg-light-purple" : "bg-gray-400"
                }`}></span>
                {course.is_shared_course ? "공유받음" : course.is_my_course ? "내 코스" : "코스"}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-text-primary mb-2">{course.title}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary mb-3">
                  <span>📅 {course.created_at?.split("T")[0]} 생성</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <p className="truncate">{course.description}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="sm" asChild className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full">
                <Link href={
                  course.is_shared_course ? `/shared/${course.course_id}` : 
                  course.is_purchased_course ? `/list/${course.course_id.toString().replace('purchased_', '')}` :
                  `/list/${course.course_id}`
                }>
                  <Eye className="w-4 h-4 mr-2" />
                  상세보기
                </Link>
              </Button>
              {(course.is_my_course || course.is_purchased_course) && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareToggle(course.is_purchased_course ? parseInt(course.course_id.toString().replace('purchased_', '')) : course.course_id)}
                    className={`rounded-full border-2 ${
                      course.is_shared_with_couple 
                        ? "border-primary-pink text-primary-pink bg-secondary-pink hover:bg-primary-pink hover:text-white" 
                        : "border-gray-200 text-text-secondary hover:border-primary-pink hover:bg-pink-50 hover:text-primary-pink"
                    } bg-transparent`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${course.is_shared_with_couple ? "fill-primary-pink" : ""}`} />
                    {course.is_shared_with_couple ? "연인 공유중" : "연인과 공유"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCourse(course.is_purchased_course ? parseInt(course.course_id.toString().replace('purchased_', '')) : course.course_id)}
                    className="rounded-full border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
