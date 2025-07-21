"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MapPin, MessageCircle, Save, Clock, Bot, User, Sparkles, List, UserCheck, Wallet, Heart, Star, ArrowRight, Gift, X, Navigation } from "lucide-react";
import { TokenStorage } from "@/lib/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getMyProfile } from "@/lib/api";
import { useBalanceData } from "@/hooks/use-balance-data";
import { paymentsApi } from "@/lib/payments-api";

// --- 타입 정의 ---
interface ChatMessage {
  message_id: number;
  message_type: "USER" | "ASSISTANT";
  message_content: string;
  sent_at: string;
  course_data?: any;
}

interface ChatSession {
  session_id: string;
  session_title: string;
  session_status: string;
  created_at: string;
  last_activity_at: string;
  message_count: number;
  has_course: boolean;
  preview_message: string;
}

interface AdditionalInfo {
  initial_message: string;
  age: number;
  gender: string;
  mbti: string;
  relationship_stage: string;
  atmosphere: string;
  budget: string;
  time_slot: string;
}

// --- 상수 정의 ---
const RELATIONSHIP_STAGES = ["연인", "썸", "소개팅"];
const ATMOSPHERES = ["로맨틱", "트렌디", "조용한", "활기찬", "고급스러운", "감성적", "편안한"];
const BUDGETS = ["3만원", "5만원", "10만원", "15만원", "20만원 이상"];
const TIME_SLOTS = ["오전", "오후", "저녁", "밤"];
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP', 
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

export default function CoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 잔액 정보 훅 
  const { balance, isLoading: balanceLoading, refreshBalance } = useBalanceData(false, 0);
  
  // --- 상태 관리 ---
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [canRecommend, setCanRecommend] = useState(false);
  const [fullUserProfile, setFullUserProfile] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    initial_message: "start",
    age: 25,
    gender: "",
    mbti: "",
    relationship_stage: "",
    atmosphere: "",
    budget: "",
    time_slot: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 잔액 포맷팅 함수
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) {
      return "0원";
    }
    return amount.toLocaleString() + "원";
  };

  // --- useEffect 훅 ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    loadUserSessions();
    loadFullUserProfile();
    
    const sessionParam = searchParams.get('session');
    if (sessionParam) {
      loadSession(sessionParam);
    }
  }, [user, router, searchParams]);

  // --- 데이터 로딩 및 초기화 함수 ---
  const prepareNewSessionForm = (profile: any) => {
    const missing: string[] = [];
    if (!profile?.profile_detail?.age_range) missing.push("age");
    if (!profile?.profile_detail?.gender) missing.push("gender");
    if (!profile?.profile_detail?.mbti) missing.push("mbti");

    setMissingFields(missing);

    setAdditionalInfo({
      initial_message: "start",
      age: parseInt(profile?.profile_detail?.age_range) || 25,
      gender: profile?.profile_detail?.gender || "",
      mbti: profile?.profile_detail?.mbti || "",
      relationship_stage: "",
      atmosphere: "",
      budget: "",
      time_slot: "",
    });

    setIsCollectingInfo(true);
  };

  const loadFullUserProfile = async () => {
    if (!user?.user_id) return;
    try {
      const token = TokenStorage.get();
      const data = await getMyProfile(user.user_id, token);
      setFullUserProfile(data.user);

      const sessionParam = searchParams.get('session');
      if (!sessionParam && !currentSessionId && messages.length === 0 && !isCollectingInfo) {
        prepareNewSessionForm(data.user);
      }
    } catch (error) {
      console.error('사용자 프로필 로드 실패:', error);
    }
  };

  const loadUserSessions = async () => {
    if (!user?.user_id) return;
    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/user/${user.user_id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('세션 목록 조회 실패:', error);
    }
  };

  // --- 핵심 로직: 채팅 및 추천 ---
  // 잔액 차감 및 AI 추천 요청 
  const handleFullSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessages([]);
    setQuickReplies([]);
    setCanRecommend(false);

    try {
      const token = TokenStorage.get();
      
      // 1단계: 1000원 차감 시도
      console.log("💰 [PAYMENT] AI 추천 서비스 1000원 차감 시도");
      const deductResult = await paymentsApi.deductBalance({
        amount: 1000,
        service_type: 'course_generation',
        service_id: `ai_recommendation_${Date.now()}`,
        description: 'AI 데이트 코스 추천 서비스 이용'
      }, token);

      if (!deductResult.success) {
        throw new Error(deductResult.message || '잔액이 부족합니다');
      }

      console.log("✅ [PAYMENT] 1000원 차감 성공, 남은 잔액:", deductResult.remaining_balance);
      
      // 잔액 정보 실시간 업데이트
      await refreshBalance();

      // 2단계: AI 세션 생성
      const userProfilePayload = {
        ...fullUserProfile?.profile_detail,
        age: additionalInfo.age || 25,
        gender: additionalInfo.gender,
        mbti: additionalInfo.mbti,
        relationship_stage: additionalInfo.relationship_stage,
        atmosphere: additionalInfo.atmosphere,
        budget: additionalInfo.budget,
        time_slot: additionalInfo.time_slot,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/new-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            user_id: user.user_id,
            initial_message: "start",
            user_profile: userProfilePayload,
          }),
        }
      );

      if (!response.ok) throw new Error('새 세션 시작에 실패했습니다.');

      const data = await response.json();
      
      if (data.success) {
        console.log("✅ [SUCCESS] 세션 생성 성공, session_id:", data.session_id);
        setCurrentSessionId(data.session_id);
        const initialMessages: ChatMessage[] = [
          { message_id: Date.now(), message_type: "ASSISTANT", message_content: data.response.message, sent_at: new Date().toISOString() }
        ];
        setMessages(initialMessages);
        setQuickReplies(data.response.quick_replies || []);
        setIsCollectingInfo(false);
        await loadUserSessions();
      } else {
        console.error("❌ [ERROR] 세션 생성 실패:", data.message);
        throw new Error(data.message || '세션 시작 실패');
      }
    } catch (error: any) {
      console.error('AI 추천 요청 실패:', error);
      
      // 잔액 부족 에러 처리
      if (error.message?.includes('잔액') || error.message?.includes('부족')) {
        const insufficientBalanceMessage: ChatMessage = {
          message_id: Date.now(),
          message_type: "ASSISTANT",
          message_content: `💳 잔액이 부족합니다!\n\nAI 데이트 코스 추천 서비스 이용을 위해서는 1,000원이 필요합니다.\n현재 잔액: ${balance ? formatCurrency(balance.total_balance) : '0원'}\n\n먼저 크레딧을 충전해주세요! 💰`,
          sent_at: new Date().toISOString()
        };
        setMessages([insufficientBalanceMessage]);
        setQuickReplies(['충전하러 가기', '나중에 하기']);
      } else {
        alert('AI 추천 요청에 실패했습니다. 다시 시도해주세요.');
      }
      setIsCollectingInfo(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || !currentSessionId || !user) return;

    const userMessage: ChatMessage = { message_id: Date.now(), message_type: "USER", message_content: textToSend, sent_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    if (!messageText) setInput("");
    setIsLoading(true);
    setQuickReplies([]);

    try {
      const token = TokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: currentSessionId, message: textToSend, user_id: user.user_id, user_profile: fullUserProfile?.profile_detail || {} }),
      });

      if (!response.ok) throw new Error('메시지 전송에 실패했습니다.');

      const data = await response.json();
      if (data.success) {
        const aiMessage: ChatMessage = { message_id: Date.now() + 1, message_type: "ASSISTANT", message_content: data.response.message, sent_at: new Date().toISOString() };
        setMessages(prev => [...prev, aiMessage]);
        setQuickReplies(data.response.quick_replies || []);
        if (typeof data.response.message === 'string' && data.response.message.includes("추천을 시작하시려면")) setCanRecommend(true);
      } else {
        throw new Error(data.message || '메시지 전송 실패');
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage: ChatMessage = { message_id: Date.now() + 2, message_type: "ASSISTANT", message_content: "죄송합니다. 메시지 전송 중 오류가 발생했습니다.", sent_at: new Date().toISOString() };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecommendation = async () => {
    console.log("🔍 [DEBUG] startRecommendation 호출됨, currentSessionId:", currentSessionId);
    if (!currentSessionId) {
      console.error("❌ [ERROR] currentSessionId가 null입니다!");
      return;
    }
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/start-recommendation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: currentSessionId }),
      });
      if (!response.ok) throw new Error('코스 추천 요청에 실패했습니다.');
      const data = await response.json();
      if (data.success) {
        const recommendationMessage: ChatMessage = { message_id: messages.length + 1, message_type: "ASSISTANT", message_content: data.message, sent_at: new Date().toISOString(), course_data: data.course_data };
        setMessages(prev => [...prev, recommendationMessage]);
        setCanRecommend(false);
        setQuickReplies([]);
        await loadUserSessions();
      } else {
        throw new Error(data.message || '코스 추천 실패');
      }
    } catch (error) {
      console.error('코스 추천 실패:', error);
      alert('코스 추천에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 핸들러 함수 ---
  const handleAdditionalInfoChange = (field: keyof AdditionalInfo, value: string) => {
    setAdditionalInfo(prev => ({ 
      ...prev, 
      [field]: field === 'age' ? parseInt(value) || 0 : value 
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentSessionId) sendMessage();
    }
  };

  const handleQuickReply = (reply: string) => {
    if (reply === '충전하러 가기') {
      router.push('/payments/guide');
      return;
    }
    if (reply === '나중에 하기') {
      setMessages([]);
      setQuickReplies([]);
      setIsCollectingInfo(true);
      return;
    }
    setInput(reply);
  };

  const loadSession = async (sessionId: string) => {
    try {
      const token = TokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentSessionId(sessionId);
          setMessages(data.messages || []);
          setShowSessions(false);
          setQuickReplies([]);
          setIsCollectingInfo(false);
          
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage?.course_data) setCanRecommend(false);
          else if (data.session?.can_recommend !== undefined) setCanRecommend(data.session.can_recommend);
          else setCanRecommend(false);
        }
      }
    } catch (error) {
      console.error('세션 로드 실패:', error);
    }
  };

  // --- 코스 저장 및 모달 관련 함수 ---
  const openCourseDetail = (course: any, courseType: string, courseIndex: number) => {
    const weatherType = courseType === 'sunny' ? '맑은 날' : '비오는 날';
    const defaultTitle = `${weatherType} AI 추천 데이트 코스 ${courseIndex + 1}`;
    
    setSelectedCourse({
      ...course,
      courseType,
      courseIndex: courseIndex + 1
    });
    setEditableTitle(defaultTitle);
    setEditableDescription(course.recommendation_reason || "");
    setShowCourseModal(true);
  };

  const saveSingleCourse = async () => {
    if (!user || !selectedCourse) return;

    if (!editableTitle.trim()) {
      alert('코스 제목을 입력해주세요.');
      return;
    }

    try {
      const { convertCoordinatesToAddress } = await import('@/lib/kakao');
      const token = TokenStorage.get();
      
      const processedPlaces = await Promise.all(
        selectedCourse.places?.map(async (place: any, index: number) => {
          let address = place.place_info?.address;
          
          if (!address && place.place_info?.coordinates) {
            address = await convertCoordinatesToAddress(place.place_info.coordinates);
          }
          
          return {
            sequence: index + 1,
            place_id: place.place_info?.place_id,
            name: place.place_info?.name || "장소명 없음",
            category_name: place.place_info?.category || "카테고리 없음",
            address: address || "위치 정보 없음",
            coordinates: place.place_info?.coordinates || {},
            description: place.description || ""
          };
        }) || []
      );
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            title: editableTitle,
            description: editableDescription || "AI가 추천한 맞춤형 데이트 코스입니다.",
            places: processedPlaces,
            total_duration: selectedCourse.total_duration || 240,
            estimated_cost: selectedCourse.estimated_cost || 100000
          }),
        }
      );

      if (!response.ok) {
        throw new Error('코스 저장에 실패했습니다.');
      }

      alert('코스가 성공적으로 저장되었습니다!');
      setShowCourseModal(false);
    } catch (error) {
      console.error('코스 저장 실패:', error);
      alert('코스 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const saveCourse = async (courseData: any) => {
    if (!user || !courseData) return;

    try {
      const { convertCoordinatesToAddress } = await import('@/lib/kakao');
      const token = TokenStorage.get();
      
      const sunnyWeatherCourses = courseData.course?.results?.sunny_weather || [];
      const firstCourse = sunnyWeatherCourses[0];
      
      if (!firstCourse) {
        alert('저장할 코스 데이터가 없습니다.');
        return;
      }

      const processedPlaces = await Promise.all(
        firstCourse.places?.map(async (place: any, index: number) => {
          let address = place.place_info?.address;
          
          if (!address && place.place_info?.coordinates) {
            address = await convertCoordinatesToAddress(place.place_info.coordinates);
          }
          
          return {
            sequence: index + 1,
            place_id: place.place_info?.place_id,
            name: place.place_info?.name || "장소명 없음",
            category_name: place.place_info?.category || "카테고리 없음",
            address: address || "위치 정보 없음",
            coordinates: place.place_info?.coordinates || {},
            description: place.description || ""
          };
        }) || []
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/save`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            title: `AI 추천 데이트 코스`,
            description: firstCourse.recommendation_reason || "AI가 추천한 맞춤형 데이트 코스입니다.",
            places: processedPlaces,
            total_duration: firstCourse.total_duration || 240,
            estimated_cost: firstCourse.estimated_cost || 100000
          }),
        }
      );

      if (!response.ok) {
        throw new Error('코스 저장에 실패했습니다.');
      }

      alert('코스가 성공적으로 저장되었습니다!');
      router.push('/list');
    } catch (error) {
      console.error('코스 저장 실패:', error);
      alert('코스 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // --- 렌더링 로직 ---
  if (!user) {
    return <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center"><Card><CardContent className="p-6 text-center text-gray-500">로그인이 필요합니다.</CardContent></Card></div>;
  }

  const renderAdditionalInfoForm = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6 bg-white/80 backdrop-blur-lg rounded-2xl md:rounded-3xl border-0 shadow-2xl">
        <div className="h-2 md:h-3 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500 rounded-t-2xl md:rounded-t-3xl"></div>
        <CardHeader className="pb-6 pt-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-4">
            새로운 데이트 코스 추천받기
          </CardTitle>
          <p className="text-gray-600 text-base md:text-lg">
            AI가 두 분만을 위한 완벽한 데이트 코스를 추천해드릴게요! 💕
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-6 md:space-y-8">
            {missingFields.includes('age') && (
              <div className="space-y-3">
                <Label className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  나이
                </Label>
                <Select onValueChange={(value) => handleAdditionalInfoChange('age', value)} value={String(additionalInfo.age)}>
                  <SelectTrigger className="rounded-xl border-pink-200 focus:border-pink-400 py-3">
                    <SelectValue placeholder="나이를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Array.from({ length: 63 }, (_, i) => i + 18).map(age => (
                      <SelectItem key={age} value={String(age)}>{age}세</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {missingFields.includes('gender') && (
              <div className="space-y-3">
                <Label className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  성별
                </Label>
                <RadioGroup
                  value={additionalInfo.gender}
                  onValueChange={(value) => handleAdditionalInfoChange('gender', value)}
                  className="flex gap-4 md:gap-6"
                >
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 rounded-xl border border-blue-200">
                    <RadioGroupItem value="male" id="male" className="border-blue-400" />
                    <Label htmlFor="male" className="font-medium">남성</Label>
                  </div>
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-3 rounded-xl border border-pink-200">
                    <RadioGroupItem value="female" id="female" className="border-pink-400" />
                    <Label htmlFor="female" className="font-medium">여성</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
            {missingFields.includes('mbti') && (
              <div className="space-y-3">
                <Label className="text-base md:text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  MBTI
                </Label>
                <Select onValueChange={(value) => handleAdditionalInfoChange('mbti', value)} value={additionalInfo.mbti}>
                  <SelectTrigger className="rounded-xl border-pink-200 focus:border-pink-400 py-3">
                    <SelectValue placeholder="MBTI를 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {MBTI_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-4">
              <Label className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                1. 누구와 함께하는 데이트인가요?
              </Label>
              <div className="flex flex-wrap gap-3">
                {RELATIONSHIP_STAGES.map(stage => (
                  <Button 
                    key={stage} 
                    variant={additionalInfo.relationship_stage === stage ? "default" : "outline"} 
                    onClick={() => handleAdditionalInfoChange('relationship_stage', stage)}
                    className={`rounded-full px-6 py-3 transition-all duration-300 ${
                      additionalInfo.relationship_stage === stage 
                        ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg" 
                        : "border-pink-200 text-gray-700 hover:bg-pink-50 hover:border-pink-300"
                    }`}
                  >
                    {stage}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                2. 원하는 분위기는 무엇인가요?
              </Label>
              <div className="flex flex-wrap gap-3">
                {ATMOSPHERES.map(item => (
                  <Button 
                    key={item} 
                    variant={additionalInfo.atmosphere === item ? "default" : "outline"} 
                    onClick={() => handleAdditionalInfoChange('atmosphere', item)}
                    className={`rounded-full px-6 py-3 transition-all duration-300 ${
                      additionalInfo.atmosphere === item 
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg" 
                        : "border-purple-200 text-gray-700 hover:bg-purple-50 hover:border-purple-300"
                    }`}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-500" />
                3. 예산은 어느 정도 생각하세요?
              </Label>
              <div className="flex flex-wrap gap-3">
                {BUDGETS.map(item => (
                  <Button 
                    key={item} 
                    variant={additionalInfo.budget === item ? "default" : "outline"} 
                    onClick={() => handleAdditionalInfoChange('budget', item)}
                    className={`rounded-full px-6 py-3 transition-all duration-300 ${
                      additionalInfo.budget === item 
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg" 
                        : "border-green-200 text-gray-700 hover:bg-green-50 hover:border-green-300"
                    }`}
                  >
                    {item}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-rose-500" />
                4. 원하는 시간대는 언제인가요?
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {TIME_SLOTS.map((item, index) => (
                  <Button 
                    key={item} 
                    variant={additionalInfo.time_slot === item ? "default" : "outline"} 
                    onClick={() => handleAdditionalInfoChange('time_slot', item)}
                    className={`relative overflow-hidden rounded-2xl px-4 py-4 transition-all duration-300 transform hover:scale-105 ${
                      additionalInfo.time_slot === item 
                        ? "bg-gradient-to-br from-rose-400 via-pink-500 to-purple-500 hover:from-rose-500 hover:via-pink-600 hover:to-purple-600 text-white shadow-xl border-0" 
                        : "border-2 border-pink-200 text-gray-700 hover:bg-gradient-to-br hover:from-pink-50 hover:to-rose-50 hover:border-pink-300 hover:shadow-lg bg-white/50 backdrop-blur-sm"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        additionalInfo.time_slot === item 
                          ? "bg-white/20" 
                          : "bg-gradient-to-br from-pink-100 to-rose-200"
                      }`}>
                        <Clock className={`w-4 h-4 ${
                          additionalInfo.time_slot === item ? "text-white" : "text-rose-500"
                        }`} />
                      </div>
                      <span className="text-sm font-medium text-center leading-tight">{item}</span>
                    </div>
                    {additionalInfo.time_slot === item && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
            <div className="pt-6 flex flex-col md:flex-row justify-end gap-3">
              <Button 
                onClick={() => { setIsCollectingInfo(false); setMessages([]); }} 
                variant="ghost"
                className="rounded-full px-6 py-3 text-gray-600 hover:bg-gray-100"
              >
                취소
              </Button>
              <Button 
                onClick={handleFullSubmit} 
                disabled={isLoading} 
                className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-full px-8 py-3 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                {isLoading ? "결제 처리 중..." : "AI 추천 요청 (1,000원)"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ButtonMessage = ({ message, onButtonClick }) => {
    if (!message || message.message_type !== 'buttons') return null;
    
    return (
      <div className="bg-gradient-to-br from-white/90 to-pink-50/90 backdrop-blur-lg p-6 rounded-3xl shadow-xl border-2 border-pink-200/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <p className="text-lg font-semibold text-gray-800 whitespace-pre-line">{message.question}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {message.buttons?.map((button, index) => (
            <button
              key={index}
              onClick={() => onButtonClick(button.value)}
              className="group relative overflow-hidden bg-white/80 hover:bg-gradient-to-br hover:from-rose-400 hover:via-pink-500 hover:to-purple-500 border-2 border-pink-200 hover:border-transparent text-gray-700 hover:text-white rounded-2xl px-4 py-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl backdrop-blur-sm"
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-rose-200 group-hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300">
                  <Heart className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors duration-300" />
                </div>
                <span className="text-sm font-medium text-center leading-tight">{button.text}</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 relative overflow-hidden">
      {/* 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-gradient-to-br from-pink-300/20 to-rose-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-gradient-to-br from-purple-300/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* 헤더 */}
      <div className="relative p-4 md:p-6 pl-4 md:pl-20 border-b border-pink-200/50 bg-white/80 backdrop-blur-lg shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-12 hover:rotate-0 transition-transform duration-300">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                AI 데이트 코스 추천
              </h1>
              <p className="text-gray-600 text-sm md:text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-500" />
                원하는 데이트 스타일을 알려주세요! 💕
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-auto">
            {/* 잔액 정보 - 채팅 기록이 없거나 현재 세션이 없을 때 표시 */}
            {(sessions.length === 0 || !currentSessionId) && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 rounded-full border border-blue-200 shadow-lg backdrop-blur-sm">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  현재 잔액: {balanceLoading ? "로딩중..." : balance ? formatCurrency(balance.total_balance) : "0원"}
                </span>
              </div>
            )}
            
            <div className="flex gap-2 md:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSessions(!showSessions)}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full shadow-lg transition-all duration-300"
              >
                <List className="h-4 w-4" />
                <span className="hidden md:inline">채팅 기록</span> ({sessions.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentSessionId(null);
                  setMessages([]);
                  setQuickReplies([]);
                  setCanRecommend(false);
                  prepareNewSessionForm(fullUserProfile);
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0 rounded-full shadow-lg transition-all duration-300"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden md:inline">새 채팅</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 세션 목록 */}
      {showSessions && (
        <div className="relative bg-white/90 backdrop-blur-lg border-b border-pink-200/50 p-4 md:p-6 shadow-lg">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            채팅 기록
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50/80 to-rose-50/80 backdrop-blur-sm border border-pink-100 rounded-2xl cursor-pointer hover:shadow-lg hover:from-pink-100/80 hover:to-rose-100/80 transition-all duration-300 transform hover:scale-[1.02]"
                  onClick={() => loadSession(session.session_id)}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{session.session_title}</p>
                    <p className="text-xs text-gray-600 truncate mt-1">{session.preview_message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        session.session_status === 'COMPLETED' 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                          : 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'
                      }`}>
                        {session.session_status === 'COMPLETED' ? '완료' : '진행중'}
                      </span>
                      {session.has_course && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-400 to-rose-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          코스 완성
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(session.last_activity_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-100 to-purple-200 rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-pink-500" />
                </div>
                <p className="text-gray-500">아직 채팅 기록이 없습니다 💕</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="relative flex-1 p-4 md:p-6 overflow-auto">
        {isCollectingInfo || (messages.length === 0 && !currentSessionId) ? (
          renderAdditionalInfoForm()
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div key={message.message_id} className={`flex ${message.message_type === "USER" ? "justify-end" : "justify-start"} mb-6`}>
                <div className={`max-w-[85%] md:max-w-[80%] ${message.message_type === "USER" ? "order-1" : "order-2"}`}>
                  <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                    message.message_type === "USER" 
                      ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-3xl rounded-br-lg" 
                      : "bg-white/90 backdrop-blur-lg rounded-3xl rounded-bl-lg"
                  }`}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg ${
                          message.message_type === "USER" 
                            ? "bg-white/20 backdrop-blur-sm" 
                            : "bg-gradient-to-br from-purple-400 to-pink-500"
                        }`}>
                          {message.message_type === "USER" ? (
                            <User className="h-5 h-5 md:h-6 md:w-6 text-white" />
                          ) : (
                            <Bot className="h-5 h-5 md:h-6 md:w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`mb-2 text-xs md:text-sm font-medium ${
                            message.message_type === "USER" 
                              ? "text-white/80" 
                              : "text-gray-600"
                          }`}>
                            {message.message_type === "USER" ? "나" : "AI 어시스턴트"}
                          </div>
                          {message.message_type === "ASSISTANT" && typeof message.message_content === 'object' && message.message_content.message_type === 'buttons' ? (
                            <ButtonMessage 
                              message={message.message_content} 
                              onButtonClick={(value) => {
                                if (currentSessionId) {
                                  sendMessage(value);
                                } else {
                                  setInput(value);
                                  setTimeout(() => {
                                    handleFullSubmit();
                                  }, 100);
                                }
                              }} 
                            />
                          ) : (
                            <div className={`whitespace-pre-line text-sm md:text-base leading-relaxed ${
                              message.message_type === "USER" 
                                ? "text-white" 
                                : "text-gray-800"
                            }`}>
                              {typeof message.message_content === 'object' ? JSON.stringify(message.message_content) : message.message_content}
                            </div>
                          )}
                        
                          {message.message_type === "ASSISTANT" && message.course_data && (
                            <div className="mt-8 pt-8 border-t-2 border-gradient-to-r from-pink-200 to-purple-200">
                              <div className="space-y-8">
                                {message.course_data.course?.results?.sunny_weather && (
                                  <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-8 rounded-3xl border-2 border-yellow-200/50 shadow-xl backdrop-blur-lg">
                                    <div className="text-center mb-8">
                                      <div className="flex items-center justify-center space-x-3 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                                          <span className="text-white text-2xl">☀️</span>
                                        </div>
                                      </div>
                                      <h4 className="text-3xl font-black bg-gradient-to-r from-yellow-600 via-orange-600 to-amber-600 bg-clip-text text-transparent mb-2">
                                        맑은 날 추천 코스
                                      </h4>
                                      <p className="text-orange-600 font-medium">햇살이 내리쬐는 완벽한 데이트를 위해 💕</p>
                                    </div>
                                    <div className="grid gap-6">
                                      {message.course_data.course.results.sunny_weather.map((course: any, index: number) => (
                                        <div 
                                          key={index} 
                                          className="group bg-white/80 backdrop-blur-lg rounded-2xl cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 border-yellow-200/50 hover:border-orange-300 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                                          onClick={() => openCourseDetail(course, 'sunny', index)}
                                        >
                                          <div className={`h-2 bg-gradient-to-r ${
                                            index % 3 === 0 ? 'from-yellow-400 to-orange-500' :
                                            index % 3 === 1 ? 'from-orange-400 to-amber-500' :
                                            'from-amber-400 to-yellow-500'
                                          }`}></div>
                                          
                                          <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                              <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 bg-gradient-to-br ${
                                                  index % 3 === 0 ? 'from-yellow-400 to-orange-500' :
                                                  index % 3 === 1 ? 'from-orange-400 to-amber-500' :
                                                  'from-amber-400 to-yellow-500'
                                                } rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                  {index + 1}
                                                </div>
                                                <div>
                                                  <h5 className="text-xl font-bold text-gray-800 mb-1">맑은 날 코스 {index + 1}</h5>
                                                  <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-full font-medium transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                                <span className="text-sm">상세보기</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                              </div>
                                            </div>
                                            
                                            {course.places && course.places.length > 0 && (
                                              <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-yellow-200 rounded-full flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-orange-600" />
                                                  </div>
                                                  <span className="font-semibold text-gray-800">
                                                    {course.places.length}개의 특별한 장소
                                                  </span>
                                                </div>
                                                <div className="bg-gradient-to-r from-white to-orange-50 p-4 rounded-xl border border-orange-100 shadow-inner">
                                                  <div className="text-gray-700 font-medium text-center">
                                                    {course.places.map((p: any) => p.place_info?.name).join(' → ')}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {course.recommendation_reason && (
                                              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-5 rounded-xl border border-yellow-200 shadow-inner">
                                                <div className="flex items-start gap-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                  </div>
                                                  <div>
                                                    <p className="font-semibold text-orange-800 mb-2">추천 이유</p>
                                                    <p className="text-gray-700 leading-relaxed text-sm">
                                                      {course.recommendation_reason.substring(0, 150)}...
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {message.course_data.course?.results?.rainy_weather && (
                                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-3xl border-2 border-blue-200/50 shadow-xl backdrop-blur-lg">
                                    <div className="text-center mb-8">
                                      <div className="flex items-center justify-center space-x-3 mb-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl transform rotate-12 hover:rotate-0 transition-transform duration-300">
                                          <span className="text-white text-2xl">🌧️</span>
                                        </div>
                                      </div>
                                      <h4 className="text-3xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                        비오는 날 추천 코스
                                      </h4>
                                      <p className="text-indigo-600 font-medium">아늑한 실내에서 로맨틱한 시간을 💕</p>
                                    </div>
                                    <div className="grid gap-6">
                                      {message.course_data.course.results.rainy_weather.map((course: any, index: number) => (
                                        <div 
                                          key={index} 
                                          className="group bg-white/80 backdrop-blur-lg rounded-2xl cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 border-blue-200/50 hover:border-indigo-300 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                                          onClick={() => openCourseDetail(course, 'rainy', index)}
                                        >
                                          <div className={`h-2 bg-gradient-to-r ${
                                            index % 3 === 0 ? 'from-blue-400 to-indigo-500' :
                                            index % 3 === 1 ? 'from-indigo-400 to-purple-500' :
                                            'from-purple-400 to-blue-500'
                                          }`}></div>
                                          
                                          <div className="p-6">
                                            <div className="flex items-center justify-between mb-6">
                                              <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 bg-gradient-to-br ${
                                                  index % 3 === 0 ? 'from-blue-400 to-indigo-500' :
                                                  index % 3 === 1 ? 'from-indigo-400 to-purple-500' :
                                                  'from-purple-400 to-blue-500'
                                                } rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                  {index + 1}
                                                </div>
                                                <div>
                                                  <h5 className="text-xl font-bold text-gray-800 mb-1">비오는 날 코스 {index + 1}</h5>
                                                  <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                      <Star key={i} className="w-3 h-3 text-blue-400 fill-current" />
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-full font-medium transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                                <span className="text-sm">상세보기</span>
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                                              </div>
                                            </div>
                                            
                                            {course.places && course.places.length > 0 && (
                                              <div className="mb-6">
                                                <div className="flex items-center gap-3 mb-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-blue-600" />
                                                  </div>
                                                  <span className="font-semibold text-gray-800">
                                                    {course.places.length}개의 특별한 장소
                                                  </span>
                                                </div>
                                                <div className="bg-gradient-to-r from-white to-blue-50 p-4 rounded-xl border border-blue-100 shadow-inner">
                                                  <div className="text-gray-700 font-medium text-center">
                                                    {course.places.map((p: any) => p.place_info?.name).join(' → ')}
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {course.recommendation_reason && (
                                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 shadow-inner">
                                                <div className="flex items-start gap-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                  </div>
                                                  <div>
                                                    <p className="font-semibold text-blue-800 mb-2">추천 이유</p>
                                                    <p className="text-gray-700 leading-relaxed text-sm">
                                                      {course.recommendation_reason.substring(0, 150)}...
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-8 text-center">
                                  <Button
                                    className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                                    onClick={() => saveCourse(message.course_data)}
                                  >
                                    <Save className="h-5 w-5 mr-3" />
                                    이 코스 저장하기
                                    <Heart className="h-4 w-4 ml-3 animate-pulse" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
            
            {quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {quickReplies.map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickReply(reply)}
                    className="text-sm"
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
            
            {canRecommend && currentSessionId && (
              <div className="text-center">
                <Button
                  onClick={startRecommendation}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  {isLoading ? "추천 생성 중..." : "💕 데이트 코스 추천 받기"}
                </Button>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Textarea
            className="flex-1 min-h-[60px] resize-none"
            placeholder={(() => {
              // 마지막 메시지가 버튼인지만 확인
              const lastMessage = messages[messages.length - 1];
              const hasButtons = lastMessage && 
                lastMessage.message_type === "ASSISTANT" &&
                typeof lastMessage.message_content === 'object' &&
                lastMessage.message_content?.message_type === 'buttons';
              return hasButtons ? "위 버튼을 선택해주세요" : currentSessionId ? "메시지를 입력하세요..." : "새 추천을 받으려면 '새 채팅' 버튼을 눌러주세요.";
            })()}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !currentSessionId || (() => {
              // 마지막 메시지가 버튼인지만 확인
              const lastMessage = messages[messages.length - 1];
              return lastMessage && 
                lastMessage.message_type === "ASSISTANT" &&
                typeof lastMessage.message_content === 'object' &&
                lastMessage.message_content?.message_type === 'buttons';
            })()}
          />
          <Button
            onClick={currentSessionId ? () => sendMessage() : handleFullSubmit}
            disabled={isLoading || !input.trim() || (() => {
              // 마지막 메시지가 버튼인지만 확인
              const lastMessage = messages[messages.length - 1];
              return lastMessage && 
                lastMessage.message_type === "ASSISTANT" &&
                typeof lastMessage.message_content === 'object' &&
                lastMessage.message_content?.message_type === 'buttons';
            })()}
            className="bg-pink-600 hover:bg-pink-700 px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 코스 상세 보기 모달 */}
      {showCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-gradient-to-br from-white via-pink-50/50 to-purple-50/50 backdrop-blur-lg rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-pink-200/50">
            {/* 헤더 그라데이션 */}
            <div className="h-3 bg-gradient-to-r from-rose-400 via-pink-500 to-purple-500"></div>
            
            {/* 스크롤 가능한 컨텐츠 */}
            <div className="overflow-y-auto max-h-[calc(90vh-3rem)] p-8">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                      코스 상세 정보
                    </h3>
                    <p className="text-pink-600 font-medium">완벽한 데이트를 위한 특별한 코스</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCourseModal(false)}
                  className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-red-100 hover:to-pink-100 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 코스 제목 */}
              <div className="mb-8">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">📝</span>
                  </div>
                  코스 제목
                </label>
                <Input
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  placeholder="코스 제목을 입력하세요"
                  className="w-full text-lg font-semibold rounded-xl border-pink-200 focus:border-pink-400 bg-white/80 backdrop-blur-sm py-4"
                />
              </div>

              {/* 방문 장소들 */}
              {selectedCourse.places && (
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">방문 장소</h4>
                    <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent"></div>
                  </div>
                  
                  <div className="space-y-6">
                    {selectedCourse.places.map((place: any, index: number) => (
                      <div key={index} className="group">
                        {/* 연결선 (마지막 장소가 아닌 경우) */}
                        {index < selectedCourse.places.length - 1 && (
                          <div className="flex justify-center my-4">
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-0.5 h-6 bg-gradient-to-b from-pink-300 to-purple-300 rounded-full"></div>
                              <ArrowRight className="w-4 h-4 text-pink-400 transform rotate-90" />
                              <div className="w-0.5 h-6 bg-gradient-to-b from-purple-300 to-pink-300 rounded-full"></div>
                            </div>
                          </div>
                        )}

                        <div className="bg-white/70 backdrop-blur-lg rounded-2xl border border-pink-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                          <div className={`h-1 bg-gradient-to-r ${
                            index % 3 === 0 ? 'from-rose-400 to-pink-500' :
                            index % 3 === 1 ? 'from-purple-400 to-pink-500' :
                            'from-pink-400 to-rose-500'
                          }`}></div>
                          
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              {/* 순서 번호 */}
                              <div className={`w-12 h-12 bg-gradient-to-br ${
                                index % 3 === 0 ? 'from-rose-400 to-pink-500' :
                                index % 3 === 1 ? 'from-purple-400 to-pink-500' :
                                'from-pink-400 to-rose-500'
                              } rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg flex-shrink-0`}>
                                {index + 1}
                              </div>
                              
                              <div className="flex-1 space-y-4">
                                {/* 장소 정보 */}
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h5 className="text-xl font-bold text-gray-900">{place.place_info?.name}</h5>
                                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      index % 3 === 0 ? 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700' :
                                      index % 3 === 1 ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700' :
                                      'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700'
                                    }`}>
                                      {place.place_info?.category || '특별한 장소'}
                                    </div>
                                  </div>
                                  
                                  {place.place_info?.address && (
                                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                                      <div className="w-6 h-6 bg-gradient-to-br from-pink-100 to-rose-200 rounded-full flex items-center justify-center">
                                        <MapPin className="w-3 h-3 text-rose-500" />
                                      </div>
                                      <span className="text-sm">{place.place_info.address}</span>
                                    </div>
                                  )}
                                </div>

                                {/* 장소 설명 */}
                                {place.description && (
                                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
                                    <p className="text-gray-700 leading-relaxed text-sm">{place.description}</p>
                                  </div>
                                )}

                                {/* 카카오맵 링크 */}
                                {place.urls?.kakao_map && (
                                  <div>
                                    <a 
                                      href={place.urls.kakao_map} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white px-4 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                    >
                                      <MapPin className="w-4 h-4" />
                                      카카오맵에서 보기
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 코스 설명 */}
              <div className="mb-8">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  코스 설명
                </label>
                <Textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  placeholder="코스에 대한 설명을 입력하세요"
                  className="w-full min-h-[120px] rounded-xl border-pink-200 focus:border-pink-400 bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* 액션 버튼들 */}
              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-pink-200">
                <Button
                  onClick={saveSingleCourse}
                  className="flex-1 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 hover:from-rose-600 hover:via-pink-600 hover:to-purple-600 text-white py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Save className="h-5 w-5 mr-3" />
                  코스 저장하기
                  <Heart className="h-4 w-4 ml-3 animate-pulse" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCourseModal(false)}
                  className="px-8 py-4 border-2 border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
