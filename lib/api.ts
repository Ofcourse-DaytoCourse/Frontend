import type {
  User,
  Course,
  Comment,
  SocialLoginRequest,
  SocialLoginResponse,
  NicknameCheckRequest,
  NicknameCheckResponse,
  InitialProfileSetupRequest,
  CourseCreateRequest,
  CoupleRequestData,
  CommentCreateRequest
} from '@/types/api';

export async function api(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  token?: string
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      let errorMessage = 'API 요청에 실패했습니다.';
      
      try {
        const errorData = await res.json();
        if (errorData?.detail) {
          errorMessage = Array.isArray(errorData.detail) 
            ? errorData.detail[0]?.msg || errorMessage
            : errorData.detail;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 기본 메시지 사용
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
      
      // 인증 오류 처리
      if (res.status === 401) {
        errorMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        // 토큰 제거 및 로그인 페이지로 리디렉션은 호출하는 곳에서 처리
      } else if (res.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else if (res.status === 404) {
        errorMessage = '요청한 리소스를 찾을 수 없습니다.';
      } else if (res.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      throw error;
    }

    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }
    throw error;
  }
}

// 1. 소셜 로그인
export const socialLogin = (params: SocialLoginRequest): Promise<SocialLoginResponse> =>
  api("/auth/social-login", "POST", params);

// 2. 닉네임 중복 확인
export const checkNickname = (params: NicknameCheckRequest): Promise<NicknameCheckResponse> =>
  api("/users/nickname/check", "POST", params);

// 3. 초기 프로필 설정
export const initialProfileSetup = (params: InitialProfileSetupRequest): Promise<{ status: string; user_id: number; nickname: string }> =>
  api("/users/profile/initial-setup", "PUT", params);

// 4. 커플 상태 조회
export const getCoupleStatus = (user_id: string, token: string): Promise<{ couple_info: { partner_nickname: string } | null }> => {
  const queryParams = new URLSearchParams({ user_id: user_id });
  return api(`/users/profile/couple-status?${queryParams}`, "GET", undefined, token);
};

// 5. 마이페이지 전체 정보 조회
export const getMyProfile = (user_id: string, token: string): Promise<{ status: string; user: User }> => {
  const queryParams = new URLSearchParams({ user_id: user_id });
  return api(`/users/profile/me?${queryParams}`, "GET", undefined, token);
};

// 6. 마이페이지 수정
export const updateProfile = (user_id: string, params: any, token: string): Promise<{ status: string; message: string; user: any }> =>
  api(`/users/profile/update/${user_id}`, "PUT", params, token);

// 7. 메인페이지 정보 조회
export const getMainProfile = (user_id: string, token: string): Promise<{ status: string; user: User }> => {
  const queryParams = new URLSearchParams({ user_id: user_id });
  return api(`/users/profile/main?${queryParams}`, "GET", undefined, token);
};

// 8. 회원 탈퇴
export const deleteUser = (params: { user_id: number; nickname: string; email: string }, token: string): Promise<{ status: string; user_id: number }> =>
  api("/users/profile/delete", "DELETE", params, token);

// 9. 코스 저장 (추천 코스 저장)
export const saveCourse = (params: CourseCreateRequest, token: string): Promise<{ status: string; course_id: number }> =>
  api("/courses/recommendation", "POST", params, token);

// 10. 코스 목록 조회
export const getCourses = (user_id: number, token: string): Promise<{ courses: Course[] }> => {
  const queryParams = new URLSearchParams({ user_id: user_id.toString() });
  return api(`/courses/list?${queryParams}`, "GET", undefined, token);
};

// 11. 코스 상세 조회 (나만보는)
export const getCourseDetail = (params: { user_id: number; course_id: number }, token: string): Promise<{ course: Course }> => {
  const queryParams = new URLSearchParams({
    user_id: params.user_id.toString(),
    course_id: params.course_id.toString()
  });
  return api(`/courses/detail?${queryParams}`, "GET", undefined, token);
};

// 12. 코스 상세 + 댓글 통합 조회(연인과 공유)
export const getCourseWithComments = (params: { course_id: number; user_id: number }, token: string): Promise<{ course: Course; comments: Comment[] }> => {
  const queryParams = new URLSearchParams({
    course_id: params.course_id.toString(),
    user_id: params.user_id.toString()
  });
  return api(`/courses/comments?${queryParams}`, "GET", undefined, token);
};

// 13. 코스 삭제
export const deleteCourse = (params: { user_id: number; course_id: number }, token: string): Promise<{ status: string; course_id: number }> =>
  api("/courses/delete", "DELETE", params, token);

// 14. 코스 공유
export const shareCourse = (params: { course_id: number; user_id: number }, token: string): Promise<{ status: string }> =>
  api("/courses/share", "POST", params, token);

// 15. 코스 제목 수정
export const updateCourseTitle = (params: { course_id: number; title: string; user_id: number }, token: string): Promise<{ status: string; course_id: number; title: string }> =>
  api("/courses/title", "PUT", params, token);

// 16. 코스 설명 수정
export const updateCourseDescription = (params: { course_id: number; description: string; user_id: number }, token: string): Promise<{ status: string; course_id: number; description: string }> =>
  api("/courses/description", "PUT", params, token);

// 17. 연인 신청
export const sendCoupleRequest = (params: CoupleRequestData, token: string): Promise<{ status: string; request_id: number; message: string }> =>
  api("/couples/requests", "POST", params, token);

// 18. 연인 신청 확인
export const checkCoupleRequests = (user_id: number, token: string): Promise<{ status: string; request?: any; message?: string }> => {
  const queryParams = new URLSearchParams({ user_id: user_id.toString() });
  return api(`/couples/requests/check?${queryParams}`, "GET", undefined, token);
};

// 19. 연인 신청 응답
export const respondToRequest = (params: { action: string; nickname: string; user_id: number }, token: string): Promise<{ status: string; message: string; couple_id?: number; partner_nickname?: string }> =>
  api("/couples/response", "POST", params, token);

// 20. 연인 신청 상태 확인
export const checkCoupleStatus = (user_id: number, token: string): Promise<{ status: string; request?: any; message?: string }> => {
  const queryParams = new URLSearchParams({ user_id: user_id.toString() });
  return api(`/couples/check?${queryParams}`, "GET", undefined, token);
};

// 21. 댓글 등록
export const writeComment = (params: CommentCreateRequest, token: string): Promise<{ status: string; comment: Comment }> =>
  api("/comments/write", "POST", params, token);

// 22. 댓글 삭제
export const deleteComment = (params: Comment, token: string): Promise<{ status: string; comment: Comment }> =>
  api("/comments/delete", "DELETE", params, token);