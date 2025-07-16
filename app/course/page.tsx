"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  // --- 데이터 로딩 및 초기화 함수 ---
  const prepareNewSessionForm = (profile: any) => {
    const missing: string[] = [];
    if (!profile?.profile_detail?.age_range) missing.push("age");
    if (!profile?.profile_detail?.gender) missing.push("gender");
    if (!profile?.profile_detail?.mbti) missing.push("mbti");

    setMissingFields(missing);

    setAdditionalInfo({
      initial_message: "start",
      age: profile?.profile_detail?.age_range || "",
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
  const handleFullSubmit = async () => {
    setIsLoading(true);
    setMessages([]);
    setCurrentSessionId(null);
    setQuickReplies([]);
    setCanRecommend(false);

    const userProfilePayload = {
      ...fullUserProfile?.profile_detail,
      age: parseInt(additionalInfo.age, 10) || undefined,
      gender: additionalInfo.gender,
      mbti: additionalInfo.mbti,
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
        setCurrentSessionId(data.session_id);
        const initialMessages: ChatMessage[] = [
          { message_id: Date.now(), message_type: "ASSISTANT", message_content: data.response.message, sent_at: new Date().toISOString() }
        ];
        setMessages(initialMessages);
        setQuickReplies(data.response.quick_replies || []);
        setIsCollectingInfo(false);
        await loadUserSessions();
      } else {
        throw new Error(data.message || '세션 시작 실패');
      }
    } catch (error) {
      console.error('새 세션 시작 실패:', error);
      alert('새 채팅을 시작할 수 없습니다. 다시 시도해주세요.');
      setIsCollectingInfo(false);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentSessionId || !user) return;

    const userMessage: ChatMessage = { message_id: Date.now(), message_type: "USER", message_content: input, sent_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);
    setQuickReplies([]);

    try {
      const token = TokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ session_id: currentSessionId, message: currentInput, user_id: user.user_id, user_profile: fullUserProfile?.profile_detail || {} }),
      });

      if (!response.ok) throw new Error('메시지 전송에 실패했습니다.');

      const data = await response.json();
      if (data.success) {
        const aiMessage: ChatMessage = { message_id: Date.now() + 1, message_type: "ASSISTANT", message_content: data.response.message, sent_at: new Date().toISOString() };
        setMessages(prev => [...prev, aiMessage]);
        setQuickReplies(data.response.quick_replies || []);
        if (data.response.message.includes("추천을 시작하시려면")) setCanRecommend(true);
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
    if (!currentSessionId) return;
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
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentSessionId) sendMessage();
    }
  };

  const handleQuickReply = (reply: string) => setInput(reply);

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

  // --- 코스 저장 및 모달 관련 함수 (기존과 동일) ---
  const openCourseDetail = (course: any, courseType: string, courseIndex: number) => { /* ... */ };
  const saveSingleCourse = async () => { /* ... */ };
  const saveCourse = async (courseData: any) => { /* ... */ };

  // --- 렌더링 로직 ---
  if (!user) {
    return <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center"><Card><CardContent className="p-6 text-center text-gray-500">로그인이 필요합니다.</CardContent></Card></div>;
  }

  const renderAdditionalInfoForm = () => (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>새로운 데이트 코스 추천받기</CardTitle>
          <p className="text-muted-foreground pt-2">AI 추천을 위해 아래 정보를 입력해주세요!</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {missingFields.includes('age') && (
              <div className="space-y-2">
                <Label htmlFor="age">나이</Label>
                <Input id="age" value={additionalInfo.age} onChange={(e) => handleAdditionalInfoChange('age', e.target.value)} placeholder="나이를 입력해주세요" />
              </div>
            )}
            {missingFields.includes('gender') && (
              <div className="space-y-2">
                <Label>성별</Label>
                <RadioGroup
                  value={additionalInfo.gender}
                  onValueChange={(value) => handleAdditionalInfoChange('gender', value)}
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
              </div>
            )}
            {missingFields.includes('mbti') && (
              <div className="space-y-2">
                <Label>MBTI</Label>
                <Select onValueChange={(value) => handleAdditionalInfoChange('mbti', value)} value={additionalInfo.mbti}>
                  <SelectTrigger>
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
            <div>
              <Label>1. 누구와 함께하는 데이트인가요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {RELATIONSHIP_STAGES.map(stage => <Button key={stage} variant={additionalInfo.relationship_stage === stage ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('relationship_stage', stage)}>{stage}</Button>)}
              </div>
            </div>
            <div>
              <Label>2. 원하는 분위기는 무엇인가요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ATMOSPHERES.map(item => <Button key={item} variant={additionalInfo.atmosphere === item ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('atmosphere', item)}>{item}</Button>)}
              </div>
            </div>
            <div>
              <Label>3. 예산은 어느 정도 생각하세요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {BUDGETS.map(item => <Button key={item} variant={additionalInfo.budget === item ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('budget', item)}>{item}</Button>)}
              </div>
            </div>
            <div>
              <Label>4. 원하는 시간대는 언제인가요?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {TIME_SLOTS.map(item => <Button key={item} variant={additionalInfo.time_slot === item ? "default" : "outline"} onClick={() => handleAdditionalInfoChange('time_slot', item)}>{item}</Button>)}
              </div>
            </div>
            <div className="pt-4 flex justify-end">
              <Button onClick={() => { setIsCollectingInfo(false); setMessages([]); }} variant="ghost">취소</Button>
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
      <div className="p-6 pl-20 border-b border-gray-200 bg-white shadow-sm">{/* ... */}
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
                <Button variant="outline" size="sm" onClick={() => { setCurrentSessionId(null); setMessages([]); setQuickReplies([]); setCanRecommend(false); setIsCollectingInfo(true); prepareNewSessionForm(fullUserProfile); }} className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    새 채팅
                </Button>
            </div>
        </div>
      </div>

      {/* 세션 목록 */}
      {showSessions && (
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">채팅 기록</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <Card
                  key={session.session_id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => loadSession(session.session_id)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base truncate">{session.session_title || "제목 없음"}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground truncate h-10">{session.preview_message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(session.last_activity_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">채팅 기록이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 p-6 overflow-auto">
        {isCollectingInfo || (messages.length === 0 && !currentSessionId) ? (
          renderAdditionalInfoForm()
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
                        {message.message_type === "ASSISTANT" && message.course_data && ( <div className="mt-4 pt-4 border-t">{/* ... */}</div> )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
            {quickReplies.length > 0 && ( <div className="flex flex-wrap gap-2 justify-center">{/* ... */}</div> )}
            {canRecommend && currentSessionId && ( <div className="text-center">{/* ... */}</div> )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="p-6 border-t bg-white">
        <div className="flex gap-3 max-w-4xl mx-auto">
          <Textarea
            className="flex-1 min-h-[60px] resize-none"
            placeholder={currentSessionId ? "메시지를 입력하세요..." : "새 추천을 받으려면 '새 채팅' 버튼을 눌러주세요."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || !currentSessionId}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim() || !currentSessionId} className="bg-pink-600 hover:bg-pink-700 px-6">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 코스 상세 보기 모달 */}
      {showCourseModal && selectedCourse && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">{/* ... */}</div> )}
    </div>
  );
}