// app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context"; 

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth(); 
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<"unchecked" | "checking" | "available" | "duplicated">(
    "unchecked"
  );

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setNicknameStatus("unchecked");
  };

  const handleCheckNickname = async () => {
    if (!nickname.trim()) return;
    setNicknameStatus("checking");
    try {
      const res = await api("/users/nickname/check", "POST", { nickname });
      if (res.status === "available") {
        setNicknameStatus("available");
      } else {
        setNicknameStatus("duplicated");
      }
    } catch (err) {
      setNicknameStatus("duplicated");
    }
  };

  const handleSubmit = async () => {
    if (nicknameStatus !== "available") {
      alert("닉네임 중복 확인이 필요합니다.");
      return;
    }
    
    try {
      const currentUser = UserStorage.get();
      if (!currentUser) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        router.push("/login");
        return;
      }

      // 닉네임 업데이트 API 호출
      const res = await api("/users/nickname/update", "PUT", {
        user_id: currentUser.user_id,
        nickname: nickname
      });

      // 업데이트된 사용자 정보 객체 생성
      const updatedUser = {
        ...currentUser,
        nickname: nickname
      };

      // 3. localStorage와 AuthContext 상태를 모두 업데이트
      UserStorage.set(updatedUser);
      login(updatedUser); // AuthContext의 상태를 최신 정보로 업데이트

      
      alert("닉네임 설정이 완료되었습니다!");
      router.push("/course");
    } catch (err: any) {
      alert("닉네임 설정 실패: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-xl font-bold text-center">회원가입 정보 입력</h1>

        <div className="space-y-4">
          <div>
            <Label>닉네임</Label>
            <div className="flex gap-2">
              <Input
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="사용할 닉네임을 입력하세요"
              />
              <Button type="button" onClick={handleCheckNickname} variant="outline">
                중복 확인
              </Button>
            </div>
            {nicknameStatus === "available" && <p className="text-green-600 text-sm">사용 가능한 닉네임입니다.</p>}
            {nicknameStatus === "duplicated" && <p className="text-red-600 text-sm">이미 사용 중인 닉네임입니다.</p>}
            {nicknameStatus === "checking" && <p className="text-gray-600 text-sm">확인 중...</p>}
          </div>
        </div>

        <Button
          className="w-full bg-pink-600 hover:bg-pink-700"
          onClick={handleSubmit}
          disabled={nicknameStatus !== "available"}
        >
          닉네임 설정 완료
        </Button>
      </div>
    </div>
  );
}
