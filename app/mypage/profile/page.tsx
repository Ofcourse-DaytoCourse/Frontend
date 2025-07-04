"use client";

import { useEffect, useState } from "react";
import { getMyProfile, updateProfile, checkNickname } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

// MBTI 16가지 타입
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP', 
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];


export default function MyProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [originalNickname, setOriginalNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<{
    checking: boolean;
    available: boolean;
    message: string;
  }>({ checking: false, available: true, message: "" });
  const [form, setForm] = useState({
    nickname: "",
    profile_detail: {
      age_range: "",
      gender: "",
      mbti: "",
      car_owner: false,
      preferences: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const currentUser = UserStorage.get();
        const token = TokenStorage.get();
        
        if (!currentUser || !token) {
          alert("로그인 정보가 없습니다.");
          return;
        }
        
        const data = await getMyProfile(currentUser.user_id, token);
        setUser(data.user);
        setOriginalNickname(data.user.nickname);
        setForm({
          nickname: data.user.nickname,
          profile_detail: {
            ...data.user.profile_detail,
            preferences: data.user.profile_detail.preferences || "",
          },
        });
      } catch (err: any) {
        alert("사용자 정보를 불러올 수 없습니다: " + err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    try {
      const currentUser = UserStorage.get();
      const token = TokenStorage.get();
      
      if (!currentUser || !token) {
        alert("로그인 정보가 없습니다.");
        return;
      }

      const updateData = {
        nickname: form.nickname,
        profile_detail: {
          age_range: form.profile_detail.age_range,
          gender: form.profile_detail.gender,
          mbti: form.profile_detail.mbti,
          car_owner: form.profile_detail.car_owner,
          preferences: form.profile_detail.preferences
        }
      };

      const response = await updateProfile(currentUser.user_id, updateData, token);
      
      if (response.status === "success") {
        // 로컬 스토리지의 사용자 정보도 업데이트
        UserStorage.set({
          ...currentUser,
          nickname: response.user.nickname
        });
        
        setUser(response.user);
        setOriginalNickname(response.user.nickname);
        setNicknameStatus({ checking: false, available: true, message: "" });
        alert("정보가 업데이트되었습니다.");
        setEditing(false);
      } else {
        alert(response.message || "업데이트에 실패했습니다.");
      }
    } catch (err: any) {
      console.error("업데이트 실패:", err);
      alert("업데이트 실패: " + (err.message || "알 수 없는 오류"));
    }
  };

  // 닉네임 중복 체크 함수
  const handleNicknameCheck = async (nickname: string) => {
    if (!nickname.trim()) {
      setNicknameStatus({ checking: false, available: false, message: "닉네임을 입력해주세요." });
      return;
    }

    if (nickname === originalNickname) {
      setNicknameStatus({ checking: false, available: true, message: "현재 사용 중인 닉네임입니다." });
      return;
    }

    setNicknameStatus({ checking: true, available: false, message: "확인 중..." });

    try {
      const result = await checkNickname({ nickname });
      if (result.status === "available") {
        setNicknameStatus({ checking: false, available: true, message: "사용 가능한 닉네임입니다." });
      } else {
        setNicknameStatus({ checking: false, available: false, message: result.message });
      }
    } catch (err: any) {
      setNicknameStatus({ checking: false, available: false, message: "중복 확인 실패" });
    }
  };

  const handleChange = (field: string, value: any) => {
    if (field === "nickname") {
      setForm({ ...form, [field]: value });
      // 닉네임 변경 시 실시간 중복 체크 (500ms 딜레이)
      if (editing) {
        setTimeout(() => handleNicknameCheck(value), 500);
      }
    } else if (field in form.profile_detail) {
      setForm({
        ...form,
        profile_detail: { ...form.profile_detail, [field]: value },
      });
    } else {
      setForm({ ...form, [field]: value });
    }
  };

  if (!user) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/mypage" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">내 정보</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>프로필</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                value={form.nickname}
                disabled={!editing}
                onChange={(e) => handleChange("nickname", e.target.value)}
                className={editing && form.nickname !== originalNickname ? 
                  (nicknameStatus.available ? "border-green-500" : "border-red-500") : ""}
              />
              {editing && form.nickname !== originalNickname && (
                <p className={`text-sm ${nicknameStatus.available ? "text-green-600" : "text-red-600"}`}>
                  {nicknameStatus.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="age_range">연령대</Label>
              <Input
                id="age_range"
                value={form.profile_detail.age_range}
                disabled={!editing}
                onChange={(e) => handleChange("age_range", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              {editing ? (
                <RadioGroup
                  value={form.profile_detail.gender}
                  onValueChange={(value) => handleChange("gender", value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">남성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">여성</Label>
                  </div>
                </RadioGroup>
              ) : (
                <Input
                  value={form.profile_detail.gender === "male" ? "남성" : 
                         form.profile_detail.gender === "female" ? "여성" : ""}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>MBTI</Label>
              {editing ? (
                <Select
                  value={form.profile_detail.mbti}
                  onValueChange={(value) => handleChange("mbti", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MBTI를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {MBTI_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.profile_detail.mbti}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>자동차 소유 여부</Label>
              {editing ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="car_owner"
                    checked={form.profile_detail.car_owner}
                    onCheckedChange={(checked) => handleChange("car_owner", checked)}
                  />
                  <Label htmlFor="car_owner">자동차를 소유하고 있습니다</Label>
                </div>
              ) : (
                <Input
                  value={form.profile_detail.car_owner ? "소유" : "미소유"}
                  disabled
                  className="bg-gray-50"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>코스 추천 시 고려사항</Label>
              <p className="text-sm text-gray-500">
                데이트 코스를 추천받을 때 AI가 고려했으면 하는 내용을 자유롭게 적어주세요
              </p>
              {editing ? (
                <Textarea
                  value={form.profile_detail.preferences}
                  onChange={(e) => handleChange("preferences", e.target.value)}
                  placeholder="예: 조용하고 분위기 좋은 곳 좋아해요, 대중교통 접근 쉬운 곳으로, 비용은 5만원 이하로..."
                  className="min-h-[80px] resize-none"
                />
              ) : (
                <Textarea
                  value={form.profile_detail.preferences || "설정된 고려사항이 없습니다"}
                  disabled
                  className="bg-gray-50 min-h-[80px] resize-none"
                />
              )}
            </div>

            <div className="pt-4">
              {editing ? (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdate} 
                    className="bg-pink-600 hover:bg-pink-700"
                    disabled={!nicknameStatus.available && form.nickname !== originalNickname}
                  >
                    저장
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        nickname: user.nickname,
                        profile_detail: {
                          ...user.profile_detail,
                          preferences: user.profile_detail.preferences || "",
                        },
                      });
                      setNicknameStatus({ checking: false, available: true, message: "" });
                    }} 
                    variant="outline"
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} className="bg-pink-600 hover:bg-pink-700">
                  수정
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
