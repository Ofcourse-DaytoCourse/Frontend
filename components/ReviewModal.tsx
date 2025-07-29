"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Rating } from "@/components/ui/rating";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [agreementChecked, setAgreementChecked] = useState(false);

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
    // 검증 - 텍스트 작성 필수
    if (reviewText.trim().length < 15) {
      setTextError("후기는 15자 이상 작성해주세요");
      return;
    }

    if (!editMode && !agreementChecked) {
      alert("day 지급에 따른 수정/삭제 불가 안내에 동의해주세요.");
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
          review_text: reviewText.trim(),
          tags: [],
          photo_urls: []
        };

        const result = await createReview(reviewData, token);
        
        // 디버깅용 로그
        console.log("🔍 백엔드 응답:", result);
        console.log("🔍 is_reactivated 값:", result.is_reactivated);
        
        // 백엔드 응답에 따라 다른 메시지 표시
        if (result.is_reactivated === true) {
          alert(`후기가 등록되었습니다! 🎉\n\n💡 이전에 작성했던 장소라 day 지급은 제외됩니다.`);
        } else {
          alert(`후기가 작성되었습니다! 🎉\n\n💰 300 day가 지급되었습니다!`);
        }
      }
      
      onSuccess();
      onClose();
      
      // 모달 리셋
      setRating(editMode && existingReview ? existingReview.rating : 5);
      setReviewText(editMode && existingReview ? existingReview.review_text || "" : "");
      setTextError("");
      setAgreementChecked(false);
      
    } catch (error: any) {
      alert(`후기 ${editMode ? '수정' : '작성'} 실패: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleClose = () => {
    setRating(editMode && existingReview ? existingReview.rating : 5);
    setReviewText(editMode && existingReview ? existingReview.review_text || "" : "");
    setTextError("");
    setAgreementChecked(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl border-none p-0 overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-primary-pink p-6 text-center text-white">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">💕</span>
          </div>
          <DialogTitle className="text-xl font-bold mb-2">
            {placeName}
          </DialogTitle>
          <p className="text-white/90 text-sm">후기 {editMode ? '수정' : '작성'}하고 day를 받아보세요!</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* 평점 */}
          <div className="text-center">
            <label className="text-lg font-bold text-text-primary block mb-4">
              이 장소는 어떠셨나요?
            </label>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rating value={rating} onChange={setRating} showNumber />
            </div>
            <p className="text-text-secondary text-sm">현재 평점: {rating}점</p>
          </div>

          {/* 크레딧 안내 */}
          <div className="bg-secondary-pink rounded-2xl p-4 text-center border border-primary-pink/20">
            <div className="flex items-center justify-center mb-2">
              <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-lg">💰</span>
              </div>
              <span className="text-lg font-bold text-primary-pink">day 보상</span>
            </div>
            <div className="text-3xl font-bold text-primary-pink mb-1">300 day</div>
            <div className="text-text-primary text-sm font-medium mb-2">15자 이상 후기 작성 시 즉시 지급</div>
            <div className="text-xs text-text-secondary bg-white/50 p-2 rounded-lg">
              * 지급된 day는 환불이 불가능하며, 앱 내에서만 사용 가능합니다.
            </div>
          </div>

          {/* 후기 텍스트 */}
          <div>
            <label className="text-lg font-bold text-text-primary block mb-3">
              솔직한 후기를 들려주세요 <span className="text-primary-pink">*</span>
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="분위기, 음식, 서비스, 접근성 등 실제 경험했던 것들을 자세히 알려주세요!"
              rows={4}
              className="resize-none rounded-2xl border-2 border-gray-200 focus:border-primary-pink focus:ring-primary-pink text-sm"
            />
            {textError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2 mt-2">
                <p className="text-red-600 text-xs font-medium flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center mr-2">!</span>
                  {textError}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center mt-3">
              <p className="text-text-secondary text-sm">
                현재 {reviewText.length}/15자
              </p>
              {reviewText.length >= 15 ? (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full text-white text-xs flex items-center justify-center mr-1">✓</span>
                  조건 충족!
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs">
                  {15 - reviewText.length}자 더 필요
                </div>
              )}
            </div>
          </div>

          {/* 동의 체크박스 (작성 모드에만 표시) */}
          {!editMode && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
              <div className="flex items-center mb-3">
                <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-white text-sm">⚠</span>
                </div>
                <h3 className="text-sm font-bold text-amber-800">작성 전 확인사항</h3>
              </div>
              <div className="bg-white rounded-xl p-3 mb-3">
                <div className="text-xs text-amber-700 space-y-1">
                  <p>• day 지급에 따라 <strong>후기 작성 후 수정 및 삭제가 불가능</strong>합니다</p>
                  <p>• 작성된 후기는 <strong>홍보 목적으로 활용</strong>될 수 있습니다</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="agreement" 
                  checked={agreementChecked}
                  onCheckedChange={setAgreementChecked}
                  className="mt-0.5 border-amber-400 data-[state=checked]:bg-amber-500"
                />
                <label htmlFor="agreement" className="text-xs text-amber-800 font-bold cursor-pointer leading-relaxed">
                  위 사항을 모두 확인했으며 동의합니다
                </label>
              </div>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 rounded-full border-2 border-gray-300 text-text-secondary hover:bg-gray-50 hover:text-text-primary font-bold py-3"
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !!textError || reviewText.trim().length < 15 || (!editMode && !agreementChecked)}
              className="flex-1 bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full font-bold py-3 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {isSubmitting 
                ? (
                  <div className="flex items-center text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editMode ? "수정 중..." : "작성 중..."}
                  </div>
                ) : (
                  <div className="flex items-center text-sm">
                    <span className="mr-1">✨</span>
                    {editMode ? "후기 수정하기" : "후기 작성하기"}
                  </div>
                )
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}