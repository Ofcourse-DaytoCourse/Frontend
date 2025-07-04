// components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage, UserStorage, clearAuthStorage } from "@/lib/storage";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<null | boolean>(null);

  useEffect(() => {
    const token = TokenStorage.get();
    const user = UserStorage.get();
    const path = window.location.pathname;

    const openPaths = ["/login", "/signup", "/login/callback"];
    
    // 로그인 페이지들은 항상 접근 허용
    if (openPaths.includes(path)) {
      setIsAuthenticated(true);
      return;
    }

    // 로그인 상태 확인
    if (!token || !user) {
      clearAuthStorage();
      setIsAuthenticated(false);
      router.replace("/login");
    } else {
      // 이미 로그인한 사용자가 로그인 페이지에 접근하려고 하면 메인으로 리다이렉트
      if (path === "/login") {
        router.replace("/course");
        return;
      }
      
      // 닉네임이 없는 사용자는 회원가입 페이지로 리다이렉트 (새로운 사용자)
      if (!user.nickname && path !== "/signup") {
        router.replace("/signup");
        return;
      }
      
      // 닉네임이 있는 사용자가 회원가입 페이지에 접근하려고 하면 메인으로 리다이렉트
      if (user.nickname && path === "/signup") {
        router.replace("/course");
        return;
      }
      
      setIsAuthenticated(true);
    }
  }, [router]);

  if (isAuthenticated === null) {
    return <div className="p-6">인증 상태 확인 중...</div>;
  }

  if (isAuthenticated === false) {
    return null;
  }

  return <>{children}</>;
}

// 로그아웃 유틸 함수 (원하는 위치에서 호출)
export function logout() {
  clearAuthStorage();
  window.location.href = "/login";
}
