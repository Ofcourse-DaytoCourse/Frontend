// 장소 관련 타입 정의

export interface Place {
  place_id: string;
  name: string;
  address?: string;
  phone?: string;
  description?: string;
  summary?: string;
  is_parking: boolean;
  is_open: boolean;
  open_hours?: string;
  latitude?: number;
  longitude?: number;
  price?: Array<Record<string, any>>;
  info_urls?: string[];
  kakao_url?: string;
  category_id?: number;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
  average_rating?: number;  // 평균 평점
  review_count?: number;    // 리뷰 개수
}

export interface PlaceCategory {
  category_id: number;
  name: string;
  description?: string;
}

export interface PlaceListResponse {
  places: Place[];
  total_count: number;
  skip: number;
  limit: number;
}

export interface PlaceSearchParams {
  skip?: number;
  limit?: number;
  category_id?: number;
  search?: string;
  region?: string;
  sort_by?: string;
  min_rating?: number;
  has_parking?: boolean;
  has_phone?: boolean;
}

export interface PlaceFilters {
  category: string;
  region: string;
  search: string;
  sortBy: string;
  minRating: number;
  hasParking: boolean;
  hasPhone: boolean;
}

// 정렬 옵션 타입
export type SortOption = 'name' | 'rating_desc' | 'review_count_desc' | 'latest';

// 서울 25개 구 리스트
export const SEOUL_DISTRICTS = [
  '강남구', '강동구', '강북구', '강서구', '관악구',
  '광진구', '구로구', '금천구', '노원구', '도봉구',
  '동대문구', '동작구', '마포구', '서대문구', '서초구',
  '성동구', '성북구', '송파구', '양천구', '영등포구',
  '용산구', '은평구', '종로구', '중구', '중랑구'
] as const;

// 후기가 포함된 장소 정보 (장소 상세 페이지용)
export interface PlaceWithReviews extends Place {
  reviews?: Array<{
    id: number;
    user_id: string;
    rating: number;
    review_text?: string;
    tags: string[];
    photo_urls: string[];
    created_at: string;
  }>;
  average_rating?: number;
  review_count?: number;
}