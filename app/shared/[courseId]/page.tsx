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
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">코스 상세 정보</h3>
              {course.places?.map((place: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-semibold">{idx + 1}. {place.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{place.address}</p>
                  <p className="text-sm text-gray-600">카테고리: {place.category_name}</p>
                </div>
              ))}
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
