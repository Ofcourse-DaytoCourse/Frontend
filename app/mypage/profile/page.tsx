"use client";

import { useEffect, useState } from "react";
import { getMyProfile, updateProfile, checkNickname } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, User, Star, Calendar, Car, Edit } from "lucide-react";
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

const age_TYPES = [
  '19', '20', '21', '22',
  '23', '24', '25', '26', 
  '27', '28', '29', '30', '31', '32',
  '33', '34', '35', '36', 
  '37', '38', '39', '40', '41', '42'
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

  if (!user) return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto border-4 border-primary-pink border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-secondary">로딩 중...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/mypage" className="inline-flex items-center text-primary-pink hover:text-primary-pink/80 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">프로필 수정</h1>
          <p className="text-lg text-text-secondary">
            내 정보를 수정하고 AI 코스 추천을 더 정확하게 받아보세요
          </p>
        </div>

        <Card className="border border-gray-200 shadow-lg rounded-2xl bg-white">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="w-5 h-5 text-primary-pink" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 첫 번째 행: 닉네임 */}
            <div className="space-y-3">
              <Label htmlFor="nickname" className="text-sm font-medium text-text-secondary">
                닉네임
              </Label>
              <Input
                id="nickname"
                value={form.nickname}
                disabled={!editing}
                onChange={(e) => handleChange("nickname", e.target.value)}
                className={`transition-all duration-200 ${editing && form.nickname !== originalNickname ? 
                  (nicknameStatus.available ? "border-green-500 ring-2 ring-green-200" : "border-red-500 ring-2 ring-red-200") : 
                  "border-gray-200 focus:border-primary-pink focus:ring-2 focus:ring-pink-200"} ${!editing ? "bg-gray-50" : ""}`}
              />
              {editing && form.nickname !== originalNickname && (
                <p className={`text-sm ${nicknameStatus.available ? "text-green-600" : "text-red-600"}`}>
                  {nicknameStatus.message}
                </p>
              )}
            </div>

            {/* 두 번째 행: 나이와 성별 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-text-secondary">
                  나이
                </Label>
                {editing ? (
                  <Select
                    value={form.profile_detail.age_range}
                    onValueChange={(value) => handleChange("age_range", value)}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-primary-pink focus:ring-2 focus:ring-pink-200 transition-all duration-200">
                      <SelectValue placeholder="연령대 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {age_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}세
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.profile_detail.age_range ? `${form.profile_detail.age_range}세` : ""}
                    disabled
                    className="bg-gray-50 border-gray-200"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-text-secondary">
                  성별
                </Label>
                {editing ? (
                  <RadioGroup
                    value={form.profile_detail.gender}
                    onValueChange={(value) => handleChange("gender", value)}
                    className="flex gap-3"
                  >
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-primary-pink transition-colors flex-1">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="cursor-pointer text-text-primary">남성</Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:border-primary-pink transition-colors flex-1">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="cursor-pointer text-text-primary">여성</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <Input
                    value={form.profile_detail.gender === "male" ? "남성" : 
                           form.profile_detail.gender === "female" ? "여성" : ""}
                    disabled
                    className="bg-gray-50 border-gray-200"
                  />
                )}
              </div>
            </div>

            {/* 세 번째 행: MBTI와 자동차 소유 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-text-secondary">
                  MBTI
                </Label>
                {editing ? (
                  <Select
                    value={form.profile_detail.mbti}
                    onValueChange={(value) => handleChange("mbti", value)}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-primary-pink focus:ring-2 focus:ring-pink-200 transition-all duration-200">
                      <SelectValue placeholder="MBTI 선택" />
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
                    className="bg-gray-50 border-gray-200"
                  />
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-text-secondary">
                  자동차 소유
                </Label>
                {editing ? (
                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-primary-pink transition-colors h-10">
                    <Checkbox
                      id="car_owner"
                      checked={form.profile_detail.car_owner}
                      onCheckedChange={(checked) => handleChange("car_owner", checked)}
                      className="data-[state=checked]:bg-primary-pink data-[state=checked]:border-primary-pink"
                    />
                    <Label htmlFor="car_owner" className="cursor-pointer text-text-primary">소유함</Label>
                  </div>
                ) : (
                  <Input
                    value={form.profile_detail.car_owner ? "소유" : "미소유"}
                    disabled
                    className="bg-gray-50 border-gray-200"
                  />
                )}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-medium text-text-secondary">
                코스 추천 시 고려사항
              </Label>
              <p className="text-sm text-text-secondary bg-secondary-pink p-3 rounded-lg border-l-4 border-primary-pink">
                💡 데이트 코스를 추천받을 때 AI가 고려했으면 하는 내용을 자유롭게 적어주세요
              </p>
              {editing ? (
                <Textarea
                  value={form.profile_detail.preferences}
                  onChange={(e) => handleChange("preferences", e.target.value)}
                  placeholder="예: 조용하고 분위기 좋은 곳 좋아해요, 대중교통 접근 쉬운 곳으로, 비용은 5만원 이하로..."
                  className="min-h-[80px] resize-none border-gray-200 focus:border-primary-pink focus:ring-2 focus:ring-pink-200 transition-all duration-200"
                />
              ) : (
                <Textarea
                  value={form.profile_detail.preferences || "설정된 고려사항이 없습니다"}
                  disabled
                  className="bg-gray-50 min-h-[80px] resize-none border-gray-200"
                />
              )}
            </div>

            <div className="pt-6 border-t border-gray-100">
              {editing ? (
                <div className="flex gap-3">
                  <Button 
                    onClick={handleUpdate} 
                    className="bg-primary-pink hover:bg-primary-pink/90 text-white shadow-lg transition-all duration-200 flex-1"
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
                    className="border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    취소
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setEditing(true)} 
                  className="bg-primary-pink hover:bg-primary-pink/90 text-white shadow-lg transition-all duration-200 w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
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