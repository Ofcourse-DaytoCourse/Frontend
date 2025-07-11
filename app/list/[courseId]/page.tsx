"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit3, Trash2, Share2 } from "lucide-react";

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = UserStorage.get();
    const token = TokenStorage.get();
    
    if (!userData || !token) {
      router.replace("/login");
      return;
    }
    
    setUser(userData);
  }, [router]);

  useEffect(() => {
    if (!user || !courseId) return;

    const fetchData = async () => {
      try {
        const token = TokenStorage.get();
        const data = await api(`/courses/detail?course_id=${courseId}&user_id=${user.user_id}`, "GET", undefined, token);
        setCourse(data.course);
        setTitle(data.course.title);
        setDescription(data.course.description);
      } catch (err: any) {
        console.error("코스 상세 정보 조회 실패:", err);
        alert("코스 상세 정보를 불러오는 데 실패했습니다: " + err.message);
      }
    };
    fetchData();
  }, [courseId, user]);

  const handleDelete = async () => {
    if (!confirm("정말로 이 코스를 삭제하시겠습니까?") || !user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/delete", "DELETE", { user_id: user.user_id, course_id: Number(courseId) }, token);
      alert("코스가 삭제되었습니다.");
      router.push("/list");
    } catch (err: any) {
      console.error("코스 삭제 실패:", err);
      alert("삭제 실패: " + err.message);
    }
  };

  const handleShare = async () => {
    if (!user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/share", "POST", { course_id: Number(courseId), user_id: user.user_id }, token);
      alert("코스가 공유되었습니다!");
    } catch (err: any) {
      console.error("코스 공유 실패:", err);
      alert("공유 실패: " + err.message);
    }
  };

  const handleTitleSave = async () => {
    if (!user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/title", "PUT", { course_id: Number(courseId), title, user_id: user.user_id }, token);
      setIsEditingTitle(false);
    } catch (err: any) {
      console.error("제목 저장 실패:", err);
      alert("제목 저장 실패: " + err.message);
    }
  };

  const handleDescriptionSave = async () => {
    if (!user) return;
    try {
      const token = TokenStorage.get();
      await api("/courses/description", "PUT", { course_id: Number(courseId), description, user_id: user.user_id }, token);
      setIsEditingDescription(false);
    } catch (err: any) {
      console.error("설명 저장 실패:", err);
      alert("설명 저장 실패: " + err.message);
    }
  };


  if (!course) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/list" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            목록으로 돌아가기
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                {isEditingTitle ? (
                  <div className="flex gap-2">
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-xl font-bold" />
                    <Button onClick={handleTitleSave} size="sm">저장</Button>
                    <Button onClick={() => setIsEditingTitle(false)} variant="outline" size="sm">취소</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{title}</CardTitle>
                    <Button onClick={() => setIsEditingTitle(true)} variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-sm min-h-[120px]"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleDescriptionSave} size="sm">저장</Button>
                      <Button onClick={() => setIsEditingDescription(false)} variant="outline" size="sm">취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-700 flex-1 leading-relaxed min-h-[80px]">
                        {description}
                      </p>
                      <Button onClick={() => setIsEditingDescription(true)} variant="ghost" size="sm" className="ml-2">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <Button onClick={handleShare} variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />공유
                </Button>
                <Button onClick={handleDelete} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />삭제
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-4">코스 상세 정보</h3>
              <div className="space-y-6">
                {course.places?.map((place: any, index: number) => (
                  <div key={index} className="bg-white p-5 rounded-lg shadow-sm border">
                    <div className="flex items-start gap-4">
                      <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-lg font-bold text-gray-900">{place.name}</h4>
                          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {place.category || '기타'}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 flex items-center">
                          📍 {place.address}
                        </p>
                        
                        {place.summary && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              💡 <strong>장소 소개:</strong> {place.summary}
                            </p>
                          </div>
                        )}
                        
                        {place.description && place.description.trim() && (
                          <div className="bg-green-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              📝 <strong>상세 정보:</strong> {place.description}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex gap-3 mt-3">
                          {place.kakao_url && (
                            <a 
                              href={place.kakao_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              🗺️ 카카오맵에서 보기
                            </a>
                          )}
                          
                          {place.phone && (
                            <a 
                              href={`tel:${place.phone}`}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              📞 {place.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
