import { api } from './api';
import type { PlaceListResponse, Place, PlaceCategory, PlaceSearchParams, PlaceFilters } from '@/types/places';
import { ReviewResponse } from './reviews-api';

// AI 검색 관련 타입 정의
export interface AISearchRequest {
  description: string;
  district: string;
  category?: string;
}

export interface AISearchResponse {
  places: Place[];
  cost: number;
  search_time: number;
  total_results: number;
}

// 장소 목록 조회
export const getPlaces = async (params: PlaceSearchParams = {}): Promise<PlaceListResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params.limit !== undefined) searchParams.append('limit', params.limit.toString());
  if (params.category_id !== undefined) searchParams.append('category_id', params.category_id.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.region) searchParams.append('region', params.region);
  if (params.sort_by) searchParams.append('sort_by', params.sort_by);
  if (params.min_rating !== undefined) searchParams.append('min_rating', params.min_rating.toString());
  if (params.has_parking !== undefined) searchParams.append('has_parking', params.has_parking.toString());
  if (params.has_phone !== undefined) searchParams.append('has_phone', params.has_phone.toString());

  const queryString = searchParams.toString();
  const url = `/places/${queryString ? `?${queryString}` : ''}`;
  
  return api(url, 'GET');
};

// 장소 상세 정보 조회
export const getPlaceDetail = async (placeId: string): Promise<Place> => {
  return api(`/places/${placeId}`, 'GET');
};

// 장소 검색
export const searchPlaces = async (
  searchTerm: string, 
  skip: number = 0, 
  limit: number = 20
): Promise<PlaceListResponse> => {
  const searchParams = new URLSearchParams({
    q: searchTerm,
    skip: skip.toString(),
    limit: limit.toString()
  });

  return api(`/places/search/?${searchParams.toString()}`, 'GET');
};

// 장소 카테고리 목록 조회
export const getPlaceCategories = async (): Promise<PlaceCategory[]> => {
  return api('/places/categories/', 'GET');
};

// 장소별 후기 조회 (기존 reviews-api에서 재사용)
export const getPlaceReviews = async (placeId: string): Promise<ReviewResponse[]> => {
  return api(`/reviews/place/${placeId}`, 'GET');
};

// 인기 장소 조회 (평점 기준 정렬)
export const getPopularPlaces = async (limit: number = 20): Promise<PlaceListResponse> => {
  return getPlaces({ limit, skip: 0 });
};

// 카테고리별 장소 조회
export const getPlacesByCategory = async (
  categoryId: number, 
  skip: number = 0, 
  limit: number = 20
): Promise<PlaceListResponse> => {
  return getPlaces({ category_id: categoryId, skip, limit });
};

// 지역별 장소 조회  
export const getPlacesByRegion = async (
  region: string,
  skip: number = 0,
  limit: number = 20
): Promise<PlaceListResponse> => {
  return getPlaces({ region, skip, limit });
};

// AI 장소 검색
export const aiSearchPlaces = async (params: AISearchRequest, token: string): Promise<AISearchResponse> => {
  return api("/places/ai-search", "POST", params, token);
};

// 사용자 잔액 조회 (AI 검색 비용 확인용)  
export const getUserBalance = async (token: string): Promise<{ balance: number }> => {
  return api("/api/v1/payments/balance", "GET", undefined, token);
};