"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "@/components/ui/rating";
import { createReview, ReviewCreateRequest } from "@/lib/reviews-api";
import { updateReview } from "@/lib/api";
import { TokenStorage } from "@/lib/storage";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  placeId: string;
  placeName: string;
  courseId: number;
  onSuccess: () => void;
  editMode?: boolean;
  existingReview?: {
    id: number;
    rating: number;
    review_text: string;
  };
}

export function ReviewModal({ 
  isOpen, 
  onClose, 
  placeId, 
  placeName, 
  courseId, 
  onSuccess, 
  editMode = false, 
  existingReview 
}: ReviewModalProps) {
  const [rating, setRating] = useState(editMode && existingReview ? existingReview.rating : 5);
  const [reviewText, setReviewText] = useState(editMode && existingReview ? existingReview.review_text || "" : "");
  const [textError, setTextError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = (text: string) => {
    setReviewText(text);
    
    // 15자 검증
    if (text.trim().length > 0 && text.trim().length < 15) {
      setTextError("후기는 15자 이상 작성해주세요");
    } else {
      setTextError("");
    }
  };

  const handleSubmit = async () => {
    // 검증
    if (reviewText.trim().length > 0 && reviewText.trim().length < 15) {
      setTextError("후기는 15자 이상 작성해주세요");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = TokenStorage.get();
      if (!token) throw new Error("로그인이 필요합니다");

      if (editMode && existingReview) {
        // 수정 모드
        const reviewData = {
          rating,
          review_text: reviewText.trim() || undefined,
          tags: [],
          photo_urls: []
        };

        await updateReview(existingReview.id, reviewData, token);
        alert(`후기가 수정되었습니다! 🎉`);
      } else {
        // 작성 모드
        console.log("🔍 후기 작성 데이터:", {
          place_id: placeId,
          course_id: courseId,
          rating,
          review_text: reviewText.trim() || undefined
        });

        const reviewData: ReviewCreateRequest = {
          place_id: placeId,
          course_id: courseId,
          rating,
          review_text: reviewText.trim() || undefined,
          tags: [],
          photo_urls: []
        };

        const result = await createReview(reviewData, token);
        
        // 디버깅용 로그
        console.log("🔍 백엔드 응답:", result);
        console.log("🔍 is_reactivated 값:", result.is_reactivated);
        
        // 백엔드 응답에 따라 다른 메시지 표시
        if (result.is_reactivated === true) {
          alert(`후기가 등록되었습니다! 🎉\n\n💡 이전에 작성했던 장소라 크레딧 지급은 제외됩니다.`);
        } else {
          alert(`후기가 작성되었습니다! 🎉\n\n💰 크레딧 300원이 지급되었습니다!`);
        }
      }
      
      onSuccess();
      onClose();
      
      // 모달 리셋
      setRating(editMode && existingReview ? existingReview.rating : 5);
      setReviewText(editMode && existingReview ? existingReview.review_text || "" : "");
      setTextError("");
      
    } catch (error: any) {
      alert(`후기 ${editMode ? '수정' : '작성'} 실패: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExpectedCredit = () => {
    if (reviewText.trim().length >= 15) {
      return 300; // 평점 + 텍스트
    }
    return 100; // 평점만
  };

  const handleClose = () => {
    setRating(editMode && existingReview ? existingReview.rating : 5);
    setReviewText(editMode && existingReview ? existingReview.review_text || "" : "");
    setTextError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            💕 {placeName} 후기 {editMode ? '수정' : '작성'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 평점 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              평점을 선택해주세요
            </label>
            <div className="flex items-center gap-3">
              <Rating value={rating} onChange={setRating} showNumber />
            </div>
          </div>

          {/* 후기 텍스트 */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              후기 작성 (선택사항)
            </label>
            <div className="text-xs text-gray-500 mb-2 p-2 bg-pink-50 rounded-lg border border-pink-200">
              💰 <strong>크레딧 지급 안내</strong><br/>
              • 평점만 작성: <span className="text-pink-600 font-semibold">100원</span><br/>
              • 평점 + 15자 이상 후기: <span className="text-pink-600 font-semibold">300원</span>
            </div>
            <Textarea
              value={reviewText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="이 장소에 대한 솔직한 후기를 남겨주세요! (15자 이상 작성 시 추가 크레딧)"
              rows={4}
              className="resize-none"
            />
            {textError && <p className="text-red-500 text-xs mt-1">{textError}</p>}
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                현재 {reviewText.length}자
              </p>
              {!editMode && (
                <p className="text-xs font-medium text-pink-600">
                  예상 크레딧: {getExpectedCredit()}원
                </p>
              )}
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !!textError}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isSubmitting 
                ? (editMode ? "수정 중..." : "작성 중...") 
                : (editMode ? "후기 수정" : "후기 작성")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}