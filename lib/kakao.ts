// lib/kakao.ts

export function handleKakaoLogin() {
  const REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

  if (!REST_API_KEY || !REDIRECT_URI) {
    console.error("카카오 API 키 또는 리디렉트 URI가 누락되었습니다.");
    return;
  }

  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}/callback&response_type=code`;
  window.location.href = KAKAO_AUTH_URL;
}
