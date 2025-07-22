import { api } from './api';

// 타입 정의
export interface ReviewCreateRequest {
  place_id: string;
  course_id: number;
  rating: number;
  review_text?: string;
  tags?: string[];
  photo_urls?: string[];
}

export interface ReviewResponse {
  id: number;
  user_id: string;
  place_id: string;
  course_id: number;
  rating: number;
  review_text?: string;
  tags: string[];
  photo_urls: string[];
  created_at: string;
  is_reactivated?: boolean;
}

// API 함수들
export const createReview = (review: ReviewCreateRequest, token: string): Promise<ReviewResponse> =>
  api("/reviews/", "POST", review, token);

export const getPlaceReviews = (placeId: string): Promise<ReviewResponse[]> =>
  api(`/reviews/place/${placeId}`, "GET");

export const updateReview = (reviewId: number, reviewData: any, token: string): Promise<ReviewResponse> =>
  api(`/reviews/${reviewId}`, "PUT", reviewData, token);

export const deleteReview = (reviewId: number, token: string): Promise<{status: string}> =>
  api(`/reviews/${reviewId}`, "DELETE", undefined, token);

export const checkReviewPermission = (placeId: string, courseId: number, token: string): Promise<{can_write: boolean, reason: string}> =>
  api(`/reviews/check/${placeId}/${courseId}`, "GET", undefined, token);