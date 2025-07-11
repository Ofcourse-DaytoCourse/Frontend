// components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TokenStorage, UserStorage, clearAuthStorage } from "@/lib/storage";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'redirect'>('loading');

  useEffect(() => {
    // 서버 사이드에서는 로딩 상태 유지
    if (typeof window === "undefined") {
      return;
    }

    console.log("=== AuthGuard Check ===");
    console.log("Current path:", pathname);

    const token = TokenStorage.get();
    const user = UserStorage.get();
    const openPaths = ["/login", "/signup", "/login/callback"];

    console.log("Token exists:", !!token);
    console.log("User exists:", !!user);
    console.log("User nickname:", user?.nickname);

    // 1. 공개 경로 체크
    if (openPaths.includes(pathname)) {
      console.log("✅ Open path, checking if redirect needed");
      
      // 로그인된 사용자가 로그인 페이지에 접근
      if (token && user && pathname === "/login") {
        if (user.nickname) {
          console.log("🔄 Redirecting to course from login");
          router.replace("/course");
          setAuthState('redirect');
          return;
        } else {
          console.log("🔄 Redirecting to signup from login");
          router.replace("/signup");
          setAuthState('redirect');
          return;
        }
      }
      
      console.log("✅ Rendering open path");
      setAuthState('authenticated');
      return;
    }

    // 2. 인증 상태 체크
    if (!token || !user) {
      console.log("❌ Not authenticated, redirecting to login");
      clearAuthStorage();
      router.replace("/login");
      setAuthState('redirect');
      return;
    }

    // 3. 홈페이지 리다이렉션
    if (pathname === "/") {
      console.log("🏠 Home page, redirecting to course");
      router.replace("/course");
      setAuthState('redirect');
      return;
    }

    // 4. 닉네임 체크
    if (!user.nickname) {
      if (pathname !== "/signup") {
        console.log("📝 No nickname, redirecting to signup");
        router.replace("/signup");
        setAuthState('redirect');
        return;
      }
    } else {
      // 닉네임이 있는데 signup 페이지에 있는 경우
      if (pathname === "/signup") {
        console.log("✅ Has nickname, redirecting to course from signup");
        router.replace("/course");
        setAuthState('redirect');
        return;
      }
    }

    // 5. 모든 체크 통과
    console.log("✅ All checks passed, rendering content");
    setAuthState('authenticated');

  }, [pathname, router]);

  console.log("AuthGuard render - authState:", authState, "pathname:", pathname);

  // 로딩 상태
  if (authState === 'loading') {
    return <div className="p-6">인증 상태 확인 중...</div>;
  }

  // 리다이렉션 상태
  if (authState === 'redirect') {
    // 홈페이지에서는 빈 화면
    if (pathname === "/") {
      return null;
    }
    return <div className="p-6">페이지 이동 중...</div>;
  }

  // 인증되지 않은 상태
  if (authState === 'unauthenticated') {
    return null;
  }

  // 인증된 상태
  return <>{children}</>;
}

export function logout() {
  clearAuthStorage();
  window.location.href = "/login";
}