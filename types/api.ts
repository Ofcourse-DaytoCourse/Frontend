// API 응답 타입 정의
export interface User {
  user_id: number;
  nickname: string;
  email?: string;
  name?: string;
  login_info?: string;
  provider_type?: string;
  provider_user_id?: string;
  profile_detail?: {
    age_range?: string;
    gender?: string;
    mbti?: string;
    car_owner?: boolean;
    preferences?: string;
    address?: string;
    description?: string;
  };
  couple_info?: {
    partner_nickname: string;
    couple_id: number;
  } | null;
}

export interface Course {
  course_id: number;
  title: string;
  description: string;
  places: Array<{
    place_id: number;
    name: string;
    address?: string;
    category_name?: string;
    sequence_order: number;
    estimated_duration: number;
  }>;
  creator_nickname: string;
  is_shared_with_couple: boolean;
  created_at: string;
}

export interface Comment {
  comment_id: number;
  course_id: number;
  user_id: number;
  nickname: string;
  comment: string;
  timestamp: string;
}

// API 요청 타입 정의
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface SocialLoginRequest {
  provider: string;
  code: string;
}

export interface SocialLoginResponse {
  status: string;
  message: string;
  accessToken: string;
  is_new_user: boolean;
  user: {
    user_id: number;
    nickname: string;
  };
}

export interface NicknameCheckRequest {
  nickname: string;
}

export interface NicknameCheckResponse {
  status: "available" | "duplicated";
  message: string;
}

export interface InitialProfileSetupRequest {
  nickname: string;
  provider_type: string;
  provider_user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
}

export interface CourseCreateRequest {
  title: string;
  description: string;
  is_shared_with_couple: boolean;
  places: Array<{
    place_id: number;
    sequence_order: number;
    estimated_duration: number;
  }>;
}

export interface CoupleRequestData {
  user_id: number;
  partner_nickname: string;
}

export interface CommentCreateRequest {
  course_id: number;
  user_id: number;
  nickname: string;
  comment: string;
  timestamp: string;
}