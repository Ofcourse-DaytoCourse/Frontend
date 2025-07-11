// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TokenStorage } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = TokenStorage.get();

    if (token) {
      router.replace("/course");
    } else {
      window.location.href = "/login";
    }
  }, []);

  return <div className="p-6"></div>;
}