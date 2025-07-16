"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, MapPin, MessageCircle, Save, Clock, Bot, User, Sparkles, List, UserCheck } from "lucide-react";
import { TokenStorage } from "@/lib/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getMyProfile } from "@/lib/api";

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

interface UserProfile {
  gender?: string;
  age?: number | string; // string 타입도 허용
  mbti?: string;
  address?: string;
  car_owned?: boolean;
  description?: string;
  relationship_stage?: string;
  general_preferences?: string[];
  profile_image_url?: string;
}

interface AdditionalInfo {
  initial_message: string;
  age: string;
  gender: string;
  mbti: string;
  relationship_stage: string;
  atmosphere: string;
  budget: string;
  time_slot: string;
}

// --- 상수 정의 ---
const RELATIONSHIP_STAGES = ["연인", "썸", "친구", "소개팅"];
const ATMOSPHERES = ["로맨틱", "트렌디", "조용한", "활기찬", "고급스러운", "감성적", "편안한"];
const BUDGETS = ["3만원", "5만원", "10만원", "15만원", "20만원 이상"];
const TIME_SLOTS = ["오전", "오후", "저녁", "밤"];


export default function CoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  
  // --- 새로운 상태 추가 ---
  const [isCollectingInfo, setIsCollectingInfo] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    initial_message: "",
    age: "",
    gender: "",
    mbti: "",
    relationship_stage: "",
    atmosphere: "",
    budget: "",
    time_slot: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // --- 데이터 로딩 함수 ---
  const loadFullUserProfile = async () => {
    if (!user?.user_id) return;
    try {
      const token = TokenStorage.get();
      const data = await getMyProfile(user.user_id, token);
      setFullUserProfile(data.user);
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

  /**
   * 1. 초기 메시지 입력 후 추가 정보 수집 단계로 전환하는 함수
   */
  const startNewSession = () => {
    if (!input.trim() || !user) return;

    const initialMessage = input;
    setInput("");

    // UserProfile에서 정보가 없는 필드 확인
    const missing: string[] = [];
    if (!fullUserProfile?.profile_detail?.age_range) missing.push("나이");
    if (!fullUserProfile?.profile_detail?.gender) missing.push("성별");
    if (!fullUserProfile?.profile_detail?.mbti) missing.push("mbti");
    
    setMissingFields(missing);

    // 추가 정보 상태 초기화 (기존 프로필 정보가 있으면 채워넣기)
    setAdditionalInfo({
      initial_message: initialMessage,
      age: fullUserProfile?.profile_detail?.age_range || "",
      gender: fullUserProfile?.profile_detail?.gender || "",
      mbti: fullUserProfile?.profile_detail?.mbti || "",
      relationship_stage: "",
      atmosphere: "",
      budget: "",
      time_slot: "",
    });

    // 추가 정보 수집 UI로 전환
    setIsCollectingInfo(true);
  };

  /**
   * 2. 모든 정보를 취합하여 실제 API를 호출하는 함수
   */
  const handleFullSubmit = async () => {
    setIsLoading(true);
    setMessages([]);
    setCurrentSessionId(null);
    setQuickReplies([]);
    setCanRecommend(false);

    // 사용자 프로필 객체 생성 (기존 + 추가 정보)
    const userProfilePayload = {
      ...fullUserProfile?.profile_detail,
      age: parseInt(additionalInfo.age, 10) || undefined,
      gender: additionalInfo.gender,
      mbti: additionalInfo.mbti,
      // 새로운 필드 추가
      relationship_stage: additionalInfo.relationship_stage,
      atmosphere: additionalInfo.atmosphere,
      budget: additionalInfo.budget,
      time_slot: additionalInfo.time_slot,
    };

    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/new-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            user_id: user.user_id,
            initial_message: additionalInfo.initial_message,
            user_profile: userProfilePayload,
          }),
        }
      );

      if (!response.ok) throw new Error('새 세션 시작에 실패했습니다.');

      const data = await response.json();
      
      if (data.success) {
        setCurrentSessionId(data.session_id);
        
        const initialMessages: ChatMessage[] = [
          {
            message_id: 1,
            message_type: "USER",
            message_content: additionalInfo.initial_message,
            sent_at: new Date().toISOString()
          },
          {
            message_id: 2,
            message_type: "ASSISTANT", 
            message_content: data.response.message,
            sent_at: new Date().toISOString()
          }
        ];
        
        setMessages(initialMessages);
        setQuickReplies(data.response.quick_replies || []);
        setIsCollectingInfo(false); // 채팅 UI로 복귀
        await loadUserSessions();
      } else {
        throw new Error(data.message || '세션 시작 실패');
      }
    } catch (error) {
      console.error('새 세션 시작 실패:', error);
      alert('새 채팅을 시작할 수 없습니다. 다시 시도해주세요.');
      setIsCollectingInfo(false); // 오류 발생 시에도 UI 복귀
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSessionId || !user) return;

    const userMessage: ChatMessage = {
      message_id: messages.length + 1,
      message_type: "USER",
      message_content: input,
      sent_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setQuickReplies([]);

    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/send-message`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: currentSessionId,
            message: currentInput,
            user_id: user.user_id,
            user_profile: fullUserProfile?.profile_detail || {}
          }),
        }
      );

      if (!response.ok) throw new Error('메시지 전송에 실패했습니다.');

      const data = await response.json();
      
      if (data.success) {
        const aiMessage: ChatMessage = {
          message_id: messages.length + 2,
          message_type: "ASSISTANT",
          message_content: data.response.message,
          sent_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setQuickReplies(data.response.quick_replies || []);
        
        if (data.response.message.includes("추천을 시작하시려면")) {
          setCanRecommend(true);
        }
      } else {
        throw new Error(data.message || '메시지 전송 실패');
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage: ChatMessage = {
        message_id: messages.length + 2,
        message_type: "ASSISTANT",
        message_content: "죄송합니다. 메시지 전송 중 오류가 발생했습니다.",
        sent_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecommendation = async () => {
    if (!currentSessionId) return;
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/start-recommendation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ session_id: currentSessionId }),
        }
      );
      if (!response.ok) throw new Error('코스 추천 요청에 실패했습니다.');
      const data = await response.json();
      if (data.success) {
        const recommendationMessage: ChatMessage = {
          message_id: messages.length + 1,
          message_type: "ASSISTANT",
          message_content: data.message,
          sent_at: new Date().toISOString(),
          course_data: data.course_data
        };
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
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isCollectingInfo) return; // 정보 수집 중에는 Enter로 제출 방지
      if (currentSessionId) {
        sendMessage();
      } else {
        startNewSession();
      }
    }
  };

  const handleQuickReply = (reply: string) => {
    setInput(reply);
  };

  const loadSession = async (sessionId: string) => {
    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentSessionId(sessionId);
          setMessages(data.messages || []);
          setShowSessions(false);
          setQuickReplies([]);
          setIsCollectingInfo(false); // 세션 로드 시 정보 수집 상태 해제
          
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage?.course_data) {
            setCanRecommend(false);
          } else if (data.session?.can_recommend !== undefined) {
            setCanRecommend(data.session.can_recommend);
          } else {
            setCanRecommend(false);
          }
        }
      }
    } catch (error) {
      console.error('세션 로드 실패:', error);
    }
  };

  // --- 코스 저장 및 모달 관련 함수 (기존과 동일) ---
  const openCourseDetail = (course: any, courseType: string, courseIndex: number) => {
    const weatherType = courseType === 'sunny' ? '맑은 날' : '비오는 날';
    const defaultTitle = `${weatherType} AI 추천 데이트 코스 ${courseIndex + 1}`;
    setSelectedCourse({ ...course, courseType, courseIndex: courseIndex + 1 });
    setEditableTitle(defaultTitle);
    setEditableDescription(course.recommendation_reason || "");
    setShowCourseModal(true);
  };

  const saveSingleCourse = async () => {
    if (!user || !selectedCourse || !editableTitle.trim()) {
      alert('코스 제목을 입력해주세요.');
      return;
    }
    try {
      const { convertCoordinatesToAddress } = await import('@/lib/kakao');
      const token = TokenStorage.get();
      const processedPlaces = await Promise.all(
        selectedCourse.places?.map(async (place: any, index: number) => {
          let address = place.place_info?.address || await convertCoordinatesToAddress(place.place_info.coordinates);
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
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: user.user_id,
          title: editableTitle,
          description: editableDescription || "AI가 추천한 맞춤형 데이트 코스입니다.",
          places: processedPlaces,
          total_duration: selectedCourse.total_duration || 240,
          estimated_cost: selectedCourse.estimated_cost || 100000
        }),
      });
      alert('코스가 성공적으로 저장되었습니다!');
      setShowCourseModal(false);
    } catch (error) {
      console.error('코스 저장 실패:', error);
      alert('코스 저장에 실패했습니다.');
    }
  };

  const saveCourse = async (courseData: any) => {
    if (!user || !courseData) return;
    try {
      const { convertCoordinatesToAddress } = await import('@/lib/kakao');
      const token = TokenStorage.get();
      const firstCourse = courseData.course?.results?.sunny_weather?.[0];
      if (!firstCourse) {
        alert('저장할 코스 데이터가 없습니다.');
        return;
      }
      const processedPlaces = await Promise.all(
        firstCourse.places?.map(async (place: any, index: number) => {
          let address = place.place_info?.address || await convertCoordinatesToAddress(place.place_info.coordinates);
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
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/courses/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          user_id: user.user_id,
          title: `AI 추천 데이트 코스`,
          description: firstCourse.recommendation_reason || "AI가 추천한 맞춤형 데이트 코스입니다.",
          places: processedPlaces,
          total_duration: firstCourse.total_duration || 240,
          estimated_cost: firstCourse.estimated_cost || 100000
        }),
      });
      alert('코스가 성공적으로 저장되었습니다!');
      router.push('/list');
    } catch (error) {
      console.error('코스 저장 실패:', error);
      alert('코스 저장에 실패했습니다.');
    }
  };

  // --- 렌더링 로직 ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Card><CardContent className="p-6 text-center text-gray-500">로그인이 필요합니다.</CardContent></Card>
      </div>
    );
  }

  const renderAdditionalInfoForm = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>추천을 위해 몇 가지만 더 알려주세요!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* --- 동적으로 생성되는 입력 필드 --- */}
            {missingFields.map(field => (
              <div key={field} className="space-y-2">
                <Label htmlFor={field} className="capitalize">{field}</Label>
                <Input
                  id={field}
                  value={additionalInfo[field as keyof AdditionalInfo]}
                  onChange={(e) => handleAdditionalInfoChange(field as keyof AdditionalInfo, e.target.value)}
                  placeholder={`${field.toUpperCase()} 정보를 입력해주세요`}
                />
              </div>
            ))}

            {/* --- 버튼 선택 필드 --- */}
            <div>
              <Label>누구와 함께하는 데이트인가요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {RELATIONSHIP_STAGES.map(stage => (
                  <Button key={stage} variant={additionalInfo.relationship_stage === stage ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('relationship_stage', stage)}>{stage}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>원하는 분위기는 무엇인가요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ATMOSPHERES.map(item => (
                  <Button key={item} variant={additionalInfo.atmosphere === item ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('atmosphere', item)}>{item}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>예산은 어느 정도 생각하세요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BUDGETS.map(item => (
                  <Button key={item} variant={additionalInfo.budget === item ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('budget', item)}>{item}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>원하는 시간대는 언제인가요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TIME_SLOTS.map(item => (
                  <Button key={item} variant={additionalInfo.time_slot === item ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('time_slot', item)}>{item}</Button>
                ))}
              </div>
            </div>

            {/* --- 제출 버튼 --- */}
            <div className="pt-4 flex justify-end">
              <Button onClick={() => setIsCollectingInfo(false)} variant="ghost">취소</Button>
              <Button onClick={handleFullSubmit} disabled={isLoading} className="bg-pink-600 hover:bg-pink-700">
                <UserCheck className="h-4 w-4 mr-2" />
                {isLoading ? "요청 중..." : "AI 추천 요청"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="p-6 pl-20 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-2xl font-bold text-pink-600">AI 데이트 코스 추천</h1>
              <p className="text-gray-600 text-sm">원하는 데이트 스타일을 알려주세요!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSessions(!showSessions)} className="flex items-center gap-2">
              <List className="h-4 w-4" />
              채팅 기록 ({sessions.length})
            </Button>
            {currentSessionId && (
              <Button variant="outline" size="sm" onClick={() => {
                  setCurrentSessionId(null);
                  setMessages([]);
                  setQuickReplies([]);
                  setCanRecommend(false);
                  setIsCollectingInfo(false);
                }} className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                새 채팅
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 세션 목록 */}
      {showSessions && (
        <div className="bg-white border-b border-gray-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">채팅 기록</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <div key={session.session_id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => loadSession(session.session_id)}>
                  {/* ... 세션 목록 UI ... */}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">아직 채팅 기록이 없습니다.</p>
            )}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 p-6 overflow-auto">
        {isCollectingInfo ? (
          renderAdditionalInfoForm()
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <MapPin className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <h2 className="text-2xl font-semibold mb-4">어떤 데이트를 원하시나요?</h2>
            <div className="space-y-2 text-sm max-w-lg mx-auto">
              <p>💕 <strong>예시:</strong></p>
              <p className="bg-gray-100 p-3 rounded-lg">"홍대에서 25살 여자친구랑 로맨틱한 저녁 데이트하고 싶어. 예산은 10만원 정도로 생각하고 있어"</p>
              <p className="bg-gray-100 p-3 rounded-lg">"강남에서 썸타는 사람이랑 오후에 조용한 분위기로 데이트할 계획이야"</p>
              <p className="text-gray-400 mt-4">지역, 시간, 예산, 취향 등을 자유롭게 말씀해주세요!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((message) => (
              <div key={message.message_id} className={`flex ${message.message_type === "USER" ? "justify-end" : "justify-start"}`}>
                <Card className={`max-w-[80%] ${message.message_type === "USER" ? "bg-pink-600 text-white" : "bg-white"}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.message_type === "USER" ? "bg-pink-500" : "bg-gray-100"}`}>
                        {message.message_type === "USER" ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="whitespace-pre-line text-sm leading-relaxed">{message.message_content}</p>
                        {message.message_type === "ASSISTANT" && message.course_data && (
                          <div className="mt-4 pt-4 border-t">
                            {/* ... 코스 데이터 렌더링 ... */}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {quickReplies.map((reply, index) => (
                  <Button key={index} variant="outline" size="sm" onClick={() => handleQuickReply(reply)}>{reply}</Button>
                ))}
              </div>
            )}
            {canRecommend && currentSessionId && (
              <div className="text-center">
                <Button onClick={startRecommendation} disabled={isLoading} className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
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
      <div className="p-6 border-t bg-white">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Textarea
            className="flex-1 min-h-[60px] resize-none"
            placeholder={currentSessionId ? "메시지를 입력하세요..." : "데이트 스타일, 장소, 취향 등을 입력해보세요"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isCollectingInfo}
          />
          <Button
            onClick={currentSessionId ? sendMessage : startNewSession}
            disabled={isLoading || !input.trim() || isCollectingInfo}
            className="bg-pink-600 hover:bg-pink-700 px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 코스 상세 보기 모달 */}
      {showCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {/* ... 모달 내용 ... */}
        </div>
      )}
    </div>
  );
}
