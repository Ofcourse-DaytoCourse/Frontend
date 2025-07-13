// components/auth-guard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TokenStorage, UserStorage, clearAuthStorage } from "@/lib/storage";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [authState, setAuthState] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = TokenStorage.get();
    const user = UserStorage.get();
    const openPaths = ["/login", "/signup", "/login/callback"];

    const isOpenPath = openPaths.includes(pathname);

    // ✅ 공개 경로 처리
    if (isOpenPath) {
      if (token && user) {
        // 로그인 되어 있는데 /login 접속 시
        if (pathname === "/login") {
          if (user.nickname) {
            router.replace("/course");
            return;
          } else {
            router.replace("/signup");
            return;
          }
        }
      }

      setAuthState("authenticated");
      return;
    }

    // ✅ 비공개 경로 처리
    if (!token || !user) {
      clearAuthStorage();
      router.replace("/login");
      return;
    }

    // ✅ 닉네임 미완성 → signup 페이지로
    if (!user.nickname && pathname !== "/signup") {
      router.replace("/signup");
      return;
    }

    // ✅ 닉네임 있음 + /signup에 들어옴 → course로
    if (user.nickname && pathname === "/signup") {
      router.replace("/course");
      return;
    }

    // ✅ 홈 리디렉션
    if (pathname === "/") {
      router.replace("/course");
      return;
    }

    setAuthState("authenticated");
  }, [pathname]);

  // ✅ loading 상태
  if (authState === "loading") {
    return <div className="p-6">인증 상태 확인 중...</div>;
  }

  // ✅ 인증 후 children 노출
  return <>{children}</>;
}

export function logout() {
  clearAuthStorage();
  window.location.href = "/login";
}
