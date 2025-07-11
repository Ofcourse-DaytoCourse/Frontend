// app/shared/[courseId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send } from "lucide-react";
import { UserStorage, TokenStorage } from "@/lib/storage";

export default function SharedCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = UserStorage.get();
    if (userData) {
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const userData = UserStorage.get();
        const token = TokenStorage.get();
        
        if (userData && token) {
          // 로그인한 사용자 - 댓글과 함께 조회
          const data = await api(`/courses/comments?course_id=${courseId}&user_id=${userData.user_id}`, "GET", undefined, token);
          setCourse(data.course);
          setComments(data.comments || []);
        } else {
          // 비로그인 사용자 - 코스 정보만 조회
          const data = await api(`/courses/detail?course_id=${courseId}&user_id=0`, "GET");
          setCourse(data.course);
        }
      } catch (err: any) {
        console.error("코스 조회 실패:", err);
        setError("코스를 불러오는 중 오류가 발생했습니다.");
      }
    };

    if (courseId) fetchCourse();
  }, [courseId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) return;

    try {
      const token = TokenStorage.get();
      const response = await api("/comments/write", "POST", {
        course_id: Number(courseId),
        user_id: user.user_id,
        nickname: user.nickname,
        comment: newComment
      }, token);

      setComments(prev => [...prev, response.comment]);
      setNewComment("");
    } catch (err: any) {
      console.error("댓글 작성 실패:", err);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!course) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-4xl mx-auto p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">{course.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-6">{course.description}</p>
            
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

        {/* 댓글 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>댓글 ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* 댓글 목록 */}
            <div className="space-y-4 mb-6">
              {comments.map((comment: any, idx: number) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">{comment.nickname}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.comment}</p>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-gray-500 text-center py-8">아직 댓글이 없습니다.</p>
              )}
            </div>

            {/* 댓글 작성 */}
            {user ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="댓글을 작성해보세요..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleCommentSubmit} 
                    disabled={!newComment.trim()}
                    className="bg-pink-600 hover:bg-pink-700"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    댓글 작성
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">댓글을 작성하려면 로그인이 필요합니다.</p>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                >
                  로그인하기
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
