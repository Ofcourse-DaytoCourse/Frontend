// app/login/callback/page.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { socialLogin } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();
  const code = searchParams.get("code");
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleKakaoLogin = async () => {
      // 이미 처리했거나 코드가 없으면 return
      if (hasProcessed.current || !code) {
        if (!code) {
          alert("인증 코드가 없습니다.");
          router.push("/login");
        }
        return;
      }

      // 처리 시작 표시
      hasProcessed.current = true;

      try {
        const response = await socialLogin({
          provider: "kakao",
          code,
        });

        const userData = {
          user_id: response.user.user_id,
          nickname: response.user.nickname,
          email: "", // 백엔드에서 제공하지 않으므로 빈 값
        };
        
        // 스토리지와 앱의 전역 상태를 함께 업데이트
        setAuthData(response.accessToken, userData);

        // 신규 사용자면 회원가입 페이지로, 기존 사용자면 메인으로
        // setTimeout을 사용해 React가 상태를 업데이트할 시간을 확보한 후 페이지 이동
        if (response.is_new_user) {
          setTimeout(() => router.push("/signup"), 0);
        } else {
          setTimeout(() => router.push("/course"), 0);
        }
        
      } catch (err: any) {
        console.error("카카오 로그인 실패:", err);
        alert("로그인에 실패했습니다: " + (err.message || "알 수 없는 오류"));
        router.push("/login");
        // 에러 시 다시 시도할 수 있도록 초기화
        hasProcessed.current = false;
      }
    };

    handleKakaoLogin();
  }, [code, router, setAuthData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">카카오 로그인 처리 중...</p>
      </div>
    </div>
  );
}
