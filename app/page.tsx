// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = TokenStorage.get();
    const isDev = process.env.NODE_ENV === "development";

    if (!token && !isDev) {
      router.replace("/login");
    }
  }, []);

  return <div className="p-6">홈페이지 (개발자 테스트 가능)</div>;
}
