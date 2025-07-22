"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Calendar, MapPin, Edit } from "lucide-react";
import { TokenStorage } from "@/lib/storage";
import { getMyReviews, deleteReview } from "@/lib/api";
import { ReviewModal } from "@/components/ReviewModal";

interface Review {
  id: number;
  place_id: string;
  course_id: number;
  rating: number;
  review_text: string;
  tags: string[];
  photo_urls: string[];
  created_at: string;
  updated_at: string;
  place_name?: string;
}

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    const currentToken = TokenStorage.get();
    if (currentToken) {
      setToken(currentToken);
      fetchMyReviews(currentToken);
    } else {
      setError("로그인이 필요합니다.");
      setLoading(false);
    }
  }, []);

  const fetchMyReviews = async (authToken: string) => {
    try {
      setLoading(true);
      const data = await getMyReviews(authToken);
      setReviews(data);
    } catch (error: any) {
      setError(error.message || "후기 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("정말로 이 후기를 삭제하시겠습니까?")) {
      return;
    }

    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      await deleteReview(reviewId, token);
      alert("후기가 삭제되었습니다.");
      // 목록에서 삭제된 후기 제거
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error: any) {
      alert(`후기 삭제 실패: ${error.message}`);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    // 후기 목록 새로고침
    if (token) {
      fetchMyReviews(token);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">내가 쓴 후기</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">내가 쓴 후기</h1>
          <div className="text-center text-red-500 p-8">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">내가 쓴 후기</h1>
        
        {reviews.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">작성한 후기가 없습니다</h3>
            <p className="text-gray-500 mb-6">데이트 코스를 방문한 후 후기를 작성해보세요!</p>
            <Button 
              onClick={() => window.location.href = '/course'}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              데이트 코스 만들기
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{review.place_name || review.place_id}</span>
                      <span>•</span>
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditReview(review)}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex space-x-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {review.rating}/5
                    </span>
                  </div>
                  
                  {review.review_text && (
                    <div className="mb-4">
                      <p className="text-gray-800 leading-relaxed">
                        {review.review_text}
                      </p>
                    </div>
                  )}
                  
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {review.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {review.photo_urls && review.photo_urls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {review.photo_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`후기 사진 ${index + 1}`}
                          className="w-full h-20 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 수정 모달 */}
        {editingReview && (
          <ReviewModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setEditingReview(null);
            }}
            placeId={editingReview.place_id}
            placeName={editingReview.place_name || editingReview.place_id}
            courseId={editingReview.course_id}
            onSuccess={handleEditSuccess}
            editMode={true}
            existingReview={{
              id: editingReview.id,
              rating: editingReview.rating,
              review_text: editingReview.review_text
            }}
          />
        )}
      </div>
    </div>
  );
}