"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, MapPin, MessageCircle, Save, Clock, Bot, User, Sparkles, List, UserCheck, Wallet, Heart, Star, ArrowRight, Gift, X, Navigation, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
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
const RELATIONSHIP_STAGES = ["연애 초기", "연인", "썸", "소개팅"];
const ATMOSPHERES = ["로맨틱", "트렌디", "조용한", "활기찬", "고급스러운", "감성적", "편안한", "힐링"];
const BUDGETS = ["3만원", "5만원", "7만원", "10만원", "15만원", "20만원 이상"];
const TIME_SLOTS = ["오전", "오후", "저녁", "밤"];
const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP', 
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

// StepCard 컴포넌트 추가
const StepCard = ({
  children,
  onClick,
  isSelected,
}: { children: React.ReactNode; onClick: () => void; isSelected: boolean }) => (
  <Card
    onClick={onClick}
    className={cn(
      "text-center p-6 cursor-pointer transition-all border-2 rounded-2xl hover:shadow-lg",
      isSelected
        ? "border-primary-pink shadow-lg bg-secondary-pink"
        : "border-brand-border hover:border-primary-pink hover:shadow-md bg-white",
    )}
  >
    {children}
  </Card>
);

export default function CoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // day 정보 훅 
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
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState<any[]>([]);
  const [chatInputDisabled, setChatInputDisabled] = useState(false);
  
  // 오류 상태 관리
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryRecommendation, setRetryRecommendation] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<'sendMessage' | 'recommendation' | null>(null);
  
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

  // 단계별 진행을 위한 state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showAIChat, setShowAIChat] = useState(false);

  // 단계 정의
  const steps = useMemo(() => {
    const dynamicSteps = [];
    if (!fullUserProfile?.profile_detail?.age_range) dynamicSteps.push("age");
    if (!fullUserProfile?.profile_detail?.gender) dynamicSteps.push("gender");
    if (!fullUserProfile?.profile_detail?.mbti) dynamicSteps.push("mbti");
    return [...dynamicSteps, "relationship_stage", "atmosphere", "budget", "time_slot", "chat"];
  }, [fullUserProfile]);

  const isLastStep = currentStepIndex === steps.length - 2;
  const isChatStep = steps[currentStepIndex] === "chat";
  const progress = isChatStep ? 100 : (currentStepIndex / (steps.length - 1)) * 100;

  const stepTitles: { [key: string]: string } = {
    age: "나이를 알려주세요",
    gender: "성별을 선택해주세요",
    mbti: "MBTI를 선택해주세요",
    relationship_stage: "두 분은 어떤 사이신가요?",
    atmosphere: "원하는 데이트 분위기는?",
    budget: "예산은 어느 정도로 생각하세요?",
    time_slot: "언제 데이트 하실 예정인가요?",
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // day 포맷팅 함수
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null) {
      return "0 day";
    }
    return amount.toLocaleString() + " day";
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

  // 사이드바에서 채팅 기록 토글 이벤트 수신
  useEffect(() => {
    const handleToggleChatHistory = () => {
      setShowChatHistory(prev => !prev);
    };

    window.addEventListener('toggleChatHistory', handleToggleChatHistory);
    return () => {
      window.removeEventListener('toggleChatHistory', handleToggleChatHistory);
    };
  }, []);

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

    setCurrentStepIndex(0);
    setShowAIChat(false);
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
        // 채팅 기록용으로도 저장
        setChatSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('세션 목록 조회 실패:', error);
    }
  };

  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    
    if (!confirm('채팅 기록을 삭제하시겠습니까?')) return;
    
    try {
      const token = TokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('세션 삭제 실패');
      
      // 현재 세션이 삭제된 세션이면 초기화
      if (currentSessionId === sessionId) {
        setCurrentSessionId("");
        setMessages([]);
        setShowAIChat(false);
        setIsCollectingInfo(true);
        setCurrentStepIndex(0);
      }
      
      // 세션 목록 새로고침
      loadUserSessions();
      
    } catch (error) {
      console.error('세션 삭제 실패:', error);
      alert('채팅 기록 삭제에 실패했습니다.');
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    console.log('[DEBUG] loadSessionMessages 시작:', sessionId);
    try {
      const token = TokenStorage.get();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('세션 로딩 실패');
      
      const data = await response.json();
      console.log('[DEBUG] 세션 데이터 로드 성공:', data);
      if (data.success) {
        setMessages(data.messages || []);
        setCurrentSessionId(sessionId);
        setShowChatHistory(false);
        setQuickReplies([]);
        
        // 채팅 단계로 전환
        setIsCollectingInfo(false);
        setShowAIChat(true);
        setCurrentStepIndex(steps.length - 1); // 채팅 단계로 이동
        
        // 세션 상태 분석 결과 처리
        const sessionAnalysis = data.session_analysis;
        console.log('[DEBUG] sessionAnalysis:', sessionAnalysis);
        if (sessionAnalysis) {
          if (sessionAnalysis.is_completed) {
            // 완료된 세션: 채팅창 비활성화
            setChatInputDisabled(true);
            setCanRecommend(false);
            setErrorMessage(null);
            setErrorType(null);
            console.log('✅ 완료된 세션 - 채팅 비활성화');
          } else if (sessionAnalysis.status === 'error') {
            // 오류 세션: 재시도 가능
            setChatInputDisabled(false);
            setCanRecommend(false);
            setErrorMessage(sessionAnalysis.error_info?.error_message || '알 수 없는 오류가 발생했습니다.');
            setErrorType('sendMessage'); // 기본적으로 sendMessage 오류로 처리
            console.log('⚠️ 오류 세션 - 재시도 가능');
          } else {
            // 진행 중 세션: 마지막 메시지 체크 후 채팅창 상태 결정
            setCanRecommend(true);
            setErrorMessage(null);
            setErrorType(null);
            
            // 마지막 메시지가 버튼/선택지인지 체크
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage && lastMessage.message_type === 'ASSISTANT') {
              const messageContent = lastMessage.message_content;
              
              console.log('[DEBUG] 마지막 메시지 타입:', typeof messageContent);
              console.log('[DEBUG] 마지막 메시지 내용:', messageContent);
              if (typeof messageContent === 'object') {
                console.log('[DEBUG] message_type:', messageContent?.message_type);
              }
              
              // 버튼/선택지 메시지인 경우
              if (typeof messageContent === 'object' && (
                  messageContent?.message_type === 'buttons' || 
                  messageContent?.message_type === 'category_checkbox'
              )) {
                setChatInputDisabled(true);
                console.log('🔴 버튼/선택지 메시지 감지 - 채팅창 비활성화');
                
                // 이어서 하기: 사용자 메시지만 추출해서 AI 서버에 재전송
                const userMessages = data.messages.filter(m => m.message_type === 'USER');
                if (userMessages.length > 0) {
                  const lastUserMessage = userMessages[userMessages.length - 1];
                  console.log('🔄 이어서 하기: 마지막 사용자 메시지 재전송');
                  await sendMessage(lastUserMessage.message_content);
                }
              } else if (typeof messageContent === 'string' && (
                  messageContent.includes("데이트 시간은 얼마나") || 
                  messageContent.includes("몷 개의 장소를 방문하고")
              )) {
                // 특정 텍스트 패턴도 채팅창 비활성화
                setChatInputDisabled(true);
                console.log('🔴 특정 패턴 메시지 감지 - 채팅창 비활성화');
              } else {
                // 일반 메시지는 채팅창 활성화
                setChatInputDisabled(false);
                console.log('🟢 일반 메시지 - 채팅창 활성화');
              }
            }
          }
        } else {
          // sessionAnalysis가 없으면 직접 메시지 분석
          console.log('[DEBUG] sessionAnalysis가 없음 - 직접 메시지 분석');
          const lastMessage = data.messages[data.messages.length - 1];
          
          if (lastMessage?.course_data) {
            // 코스 데이터가 있으면 완료
            setChatInputDisabled(true);
            setCanRecommend(false);
            console.log('✅ 코스 데이터 감지 - 완료 상태');
          } else if (lastMessage && lastMessage.message_type === 'ASSISTANT') {
            const messageContent = lastMessage.message_content;
            
            console.log('[DEBUG] 마지막 메시지 타입:', typeof messageContent);
            console.log('[DEBUG] 마지막 메시지 내용:', messageContent);
            if (typeof messageContent === 'object') {
              console.log('[DEBUG] message_type:', messageContent?.message_type);
            }
            
            // 버튼/선택지 메시지인 경우
            if (typeof messageContent === 'object' && (
                messageContent?.message_type === 'buttons' || 
                messageContent?.message_type === 'category_checkbox'
            )) {
              setChatInputDisabled(true);
              setCanRecommend(false);
              console.log('🔴 버튼/선택지 메시지 감지 - 채팅창 비활성화');
              
              // 이어서 하기: 사용자 메시지만 추출해서 AI 서버에 재전송
              const userMessages = data.messages.filter(m => m.message_type === 'USER');
              if (userMessages.length > 0) {
                const lastUserMessage = userMessages[userMessages.length - 1];
                console.log('🔄 이어서 하기: 마지막 사용자 메시지 재전송');
                await sendMessage(lastUserMessage.message_content);
              }
            } else {
              // 일반 메시지
              setChatInputDisabled(false);
              setCanRecommend(true);
              console.log('🟢 일반 메시지 - 채팅창 활성화');
            }
          } else {
            setChatInputDisabled(false);
            setCanRecommend(true);
          }
        }
      }
    } catch (error) {
      console.error('세션 로딩 실패:', error);
    }
  };

  // --- 핵심 로직: 채팅 및 추천 ---
  // day 차감 및 AI 추천 요청 
  const handleFullSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessages([]);
    setQuickReplies([]);
    setCanRecommend(false);

    try {
      const token = TokenStorage.get();
      
      // 1단계: 1000 day 차감 시도
      console.log("💰 [PAYMENT] AI 추천 서비스 1000 day 차감 시도");
      const deductResult = await paymentsApi.deductBalance({
        amount: 1000,
        service_type: 'course_generation',
        service_id: `ai_recommendation_${Date.now()}`,
        description: 'AI 데이트 코스 추천 서비스 이용'
      }, token);

      if (!deductResult.success) {
        throw new Error(deductResult.message || 'day가 부족합니다');
      }

      console.log("✅ [PAYMENT] 1000 day 차감 성공, 남은 day:", deductResult.remaining_balance);
      
      // day 정보 실시간 업데이트
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
        setShowAIChat(true);
        setCurrentStepIndex(steps.length - 1); // 채팅 단계로 이동
        await loadUserSessions();
      } else {
        console.error("❌ [ERROR] 세션 생성 실패:", data.message);
        throw new Error(data.message || '세션 시작 실패');
      }
    } catch (error: any) {
      console.error('AI 추천 요청 실패:', error);
      
      // day 부족 에러 처리
      if (error.message?.includes('day') || error.message?.includes('부족')) {
        const insufficientBalanceMessage: ChatMessage = {
          message_id: Date.now(),
          message_type: "ASSISTANT",
          message_content: `💳 day가 부족합니다!\n\nAI 데이트 코스 추천 서비스 이용을 위해서는 1,000 day가 필요합니다.\n현재 day: ${balance ? formatCurrency(balance.total_balance) : '0 day'}\n\n먼저 day를 충전해주세요! 💰`,
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
      console.log('[DEBUG] Response data:', data);
      if (data.success) {
        const aiMessage: ChatMessage = { 
          message_id: Date.now() + 1, 
          message_type: "ASSISTANT", 
          message_content: data.response.message, 
          sent_at: new Date().toISOString(),
          course_data: data.response.course_data
        };
        console.log('[DEBUG] Created aiMessage:', aiMessage);
        setMessages(prev => [...prev, aiMessage]);
        setQuickReplies(data.response.quick_replies || []);
        if (typeof data.response.message === 'string' && data.response.message.includes("추천을 시작하시려면")) setCanRecommend(true);
        
        // 채팅 입력창 비활성화 조건 체크
        const messageContent = data.response.message;
        if (typeof messageContent === 'string') {
          // 데이트 시간 질문 또는 장소 개수 질문일 때 입력창 비활성화
          if (messageContent.includes("데이트 시간은 얼마나") || 
              messageContent.includes("몇 개의 장소를 방문하고")) {
            setChatInputDisabled(true);
          }
        }
        
        // 카테고리 체크박스나 버튼 메시지일 때도 입력창 비활성화
        if (typeof messageContent === 'object' && (
            messageContent?.message_type === 'buttons' || 
            messageContent?.message_type === 'category_checkbox'
        )) {
          setChatInputDisabled(true);
        }
        
        // 코스 데이터가 있으면 (최종 추천 완료) 입력창 완전 비활성화
        if (data.response.course_data) {
          setChatInputDisabled(true);
        }
      } else {
        throw new Error(data.message || '메시지 전송 실패');
      }
    } catch (error: any) {
      console.error('메시지 전송 실패:', error);
      setErrorMessage(error.message || '메시지 전송 중 오류가 발생했습니다.');
      setErrorType('sendMessage');
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
        
        // 최종 코스 추천 완료 시 채팅 입력창 비활성화
        if (data.course_data) {
          setChatInputDisabled(true);
        }
        
        await loadUserSessions();
      } else {
        throw new Error(data.message || '코스 추천 실패');
      }
    } catch (error: any) {
      console.error('코스 추천 실패:', error);
      setErrorMessage(error.message || '코스 추천에 실패했습니다. 다시 시도해주세요.');
      setErrorType('recommendation');
      setRetryRecommendation(true);
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

  // 단계별 진행 함수들
  const handleNext = () => {
    if (isLastStep) {
      // 마지막 단계에서는 AI 추천 요청
      handleFullSubmit();
    } else {
      setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };

  // 현재 단계의 값이 입력되었는지 확인
  const isCurrentStepValid = () => {
    const currentStepId = steps[currentStepIndex];
    switch (currentStepId) {
      case "age":
        return additionalInfo.age > 0;
      case "gender":
        return !!additionalInfo.gender;
      case "mbti":
        return !!additionalInfo.mbti;
      case "relationship_stage":
        return !!additionalInfo.relationship_stage;
      case "atmosphere":
        return !!additionalInfo.atmosphere;
      case "budget":
        return !!additionalInfo.budget;
      case "time_slot":
        return !!additionalInfo.time_slot;
      default:
        return true;
    }
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
    
    // 버튼 클릭 시 입력창 활성화 (다음 단계로 넘어가면서)
    setChatInputDisabled(false);
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
      
      const sunnyWeatherCourses = courseData.results?.sunny_weather || [];
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

  const renderStepContent = () => {
    const currentStepId = steps[currentStepIndex];

    if (showAIChat || isChatStep) {
      // AI 채팅 인터페이스 (전체 화면 활용)
      return (
        <div className="w-full h-full flex flex-col">
            {/* 메시지 영역 - 입력창을 위한 공간 확보 */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50 pb-32">
            {messages.filter(m => m.course_data).length > 0 && 
              console.log('[DEBUG] Messages with course_data:', messages.filter(m => m.course_data))}
            {messages.map((message) => (
              <div key={message.message_id} className={`flex items-start gap-3 ${message.message_type === "USER" ? "justify-end" : ""}`}>
                {message.message_type === "ASSISTANT" && (
                  <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`rounded-2xl p-4 max-w-2xl shadow-sm ${
                    message.message_type === "ASSISTANT"
                      ? "bg-white text-text-primary border border-brand-border"
                      : "bg-primary-pink text-white"
                  }`}
                >
                  {message.message_type === "ASSISTANT" && typeof message.message_content === 'object' && (message.message_content?.message_type === 'buttons' || message.message_content?.message_type === 'category_checkbox') ? (
                    <ButtonMessage 
                      message={message.message_content} 
                      onButtonClick={(value) => {
                        if (currentSessionId) {
                          sendMessage(value);
                        }
                      }} 
                    />
                  ) : (
                    <div className="whitespace-pre-line leading-relaxed">
                      {typeof message.message_content === 'object' ? JSON.stringify(message.message_content) : 
                        message.message_content?.split('\n').map((line, index) => (
                          <div key={index} className="mb-2 last:mb-0">
                            {line.trim() || <br />}
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {(() => {
                    if ((message.message_type === "ASSISTANT" || message.message_type === "COURSE_RECOMMENDATION") && message.course_data) {
                      console.log('[DEBUG] Course data found:', {
                        type: message.message_type,
                        hasResults: !!message.course_data.results,
                        hasSunny: !!message.course_data.results?.sunny_weather,
                        sunnyCount: message.course_data.results?.sunny_weather?.length
                      });
                      return true;
                    }
                    return false;
                  })() && (
                    <div className="mt-8 pt-8 border-t-2 border-gradient-to-r from-pink-200 to-purple-200">
                      <div className="space-y-8">
                        {message.course_data.results?.sunny_weather && (
                          <div className="bg-white border border-brand-border rounded-3xl shadow-lg p-6">
                            <div className="text-center mb-6">
                              <div className="w-12 h-12 bg-secondary-pink rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">☀️</span>
                              </div>
                              <h4 className="text-2xl font-bold text-text-primary mb-2">
                                맑은 날 추천 코스
                              </h4>
                              <p className="text-text-secondary">완벽한 야외 데이트를 위한 추천</p>
                            </div>
                            <div className="grid gap-6">
                              {message.course_data.results.sunny_weather.map((course: any, index: number) => (
                                <div 
                                  key={index} 
                                  className="bg-white border border-brand-border rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary-pink"
                                  onClick={() => openCourseDetail(course, 'sunny', index)}
                                >
                                  <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-pink rounded-full flex items-center justify-center text-white font-bold">
                                          {index + 1}
                                        </div>
                                        <div>
                                          <h5 className="text-lg font-bold text-text-primary">코스 {index + 1}</h5>
                                          <p className="text-sm text-text-secondary">맑은 날 추천</p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white"
                                      >
                                        상세보기
                                      </Button>
                                    </div>
                                    
                                    {course.places && course.places.length > 0 && (
                                      <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <MapPin className="w-4 h-4 text-primary-pink" />
                                          <span className="font-medium text-text-primary">
                                            {course.places.length}개 장소
                                          </span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                          <div className="text-text-secondary text-sm">
                                            {course.places.map((p: any) => p.place_info?.name).join(' → ')}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {course.recommendation_reason && (
                                      <div className="bg-secondary-pink p-4 rounded-xl">
                                        <div className="flex items-start gap-3">
                                          <Sparkles className="w-4 h-4 text-primary-pink mt-0.5" />
                                          <div>
                                            <p className="font-medium text-text-primary mb-1">추천 이유</p>
                                            <p className="text-text-secondary text-sm leading-relaxed">
                                              {course.recommendation_reason.substring(0, 120)}...
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

                        {message.course_data.results?.rainy_weather && (
                          <div className="bg-white border border-brand-border rounded-3xl shadow-lg p-6">
                            <div className="text-center mb-6">
                              <div className="w-12 h-12 bg-soft-purple rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">🌧️</span>
                              </div>
                              <h4 className="text-2xl font-bold text-text-primary mb-2">
                                비오는 날 추천 코스
                              </h4>
                              <p className="text-text-secondary">아늑한 실내 데이트를 위한 추천</p>
                            </div>
                            <div className="grid gap-6">
                              {message.course_data.results.rainy_weather.map((course: any, index: number) => (
                                <div 
                                  key={index} 
                                  className="bg-white border border-brand-border rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-light-purple"
                                  onClick={() => openCourseDetail(course, 'rainy', index)}
                                >
                                  <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-light-purple rounded-full flex items-center justify-center text-white font-bold">
                                          {index + 1}
                                        </div>
                                        <div>
                                          <h5 className="text-lg font-bold text-text-primary">코스 {index + 1}</h5>
                                          <p className="text-sm text-text-secondary">비오는 날 추천</p>
                                        </div>
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-light-purple text-light-purple hover:bg-light-purple hover:text-white"
                                      >
                                        상세보기
                                      </Button>
                                    </div>
                                    
                                    {course.places && course.places.length > 0 && (
                                      <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                          <MapPin className="w-4 h-4 text-light-purple" />
                                          <span className="font-medium text-text-primary">
                                            {course.places.length}개 장소
                                          </span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl">
                                          <div className="text-text-secondary text-sm">
                                            {course.places.map((p: any) => p.place_info?.name).join(' → ')}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    {course.recommendation_reason && (
                                      <div className="bg-soft-purple p-4 rounded-xl">
                                        <div className="flex items-start gap-3">
                                          <Sparkles className="w-4 h-4 text-light-purple mt-0.5" />
                                          <div>
                                            <p className="font-medium text-text-primary mb-1">추천 이유</p>
                                            <p className="text-text-secondary text-sm leading-relaxed">
                                              {course.recommendation_reason.substring(0, 120)}...
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

                        <div className="pt-6 text-center">
                          <Button
                            className="bg-primary-pink hover:bg-primary-pink/90 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={() => saveCourse(message.course_data)}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            코스 저장하기
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {message.message_type === "USER" && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
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
            
            {canRecommend && currentSessionId && !showAIChat && !isCollectingInfo && messages.length === 10000 && (
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

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-pink rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl p-4 border border-brand-border">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 오류 메시지 표시 */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">⚠️</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 mb-2">오류가 발생했습니다</h3>
                    <p className="text-red-700 mb-4">{errorMessage}</p>
                    <div className="flex gap-3">
                      {errorType === 'sendMessage' && (
                        <Button
                          onClick={() => {
                            setErrorMessage(null);
                            setErrorType(null);
                            // 마지막 사용자 메시지 다시 전송
                            const lastUserMessage = messages.filter(m => m.message_type === 'USER').pop();
                            if (lastUserMessage) {
                              sendMessage(lastUserMessage.message_content);
                            }
                          }}
                          className="bg-primary-pink hover:bg-primary-pink/90 text-white"
                        >
                          메시지 다시 전송
                        </Button>
                      )}
                      {(errorType === 'recommendation' || (!errorType && errorMessage)) && (
                        <Button
                          onClick={() => {
                            setErrorMessage(null);
                            setErrorType(null);
                            setRetryRecommendation(false);
                            // 새로운 세션 시작 또는 마지막 상태에서 다시 시도
                            if (currentSessionId) {
                              const lastMessage = messages[messages.length - 1];
                              if (lastMessage?.message_type === 'USER') {
                                sendMessage(lastMessage.message_content);
                              }
                            }
                          }}
                          className="bg-primary-pink hover:bg-primary-pink/90 text-white"
                        >
                          다시 시도
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => {
                          setErrorMessage(null);
                          setErrorType(null);
                          setRetryRecommendation(false);
                        }}
                        className="border-primary-pink text-primary-pink hover:bg-secondary-pink"
                      >
                        닫기
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 자동 스크롤을 위한 참조 */}
            <div ref={messagesEndRef} />
            </div>
          
          {/* 채팅 입력 영역 또는 완료 메시지 */}
          {chatInputDisabled && messages.some(m => m.course_data) ? (
            /* 완료된 세션 - 완료 메시지 표시 */
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-secondary-pink shadow-lg z-10">
              <div className="max-w-4xl mx-auto">
                <div className="w-full justify-start bg-white border border-primary-pink rounded-md h-10 px-4 py-2 flex items-center gap-3">
                  <div className="w-6 h-6 bg-primary-pink rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-primary-pink font-bold">데이트 코스 추천이 완료되었습니다!</span>
                </div>
              </div>
            </div>
          ) : !chatInputDisabled ? (
            /* 진행 중인 세션 - 정상 채팅창 */
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white shadow-lg z-10">
              <div className="flex gap-3 max-w-4xl mx-auto">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="채팅에 메시지를 입력하세요..."
                  className="flex-1 focus-visible:ring-primary-pink rounded-full px-6 py-3 border-2 border-brand-border"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button
                  className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-6 shadow-lg"
                  onClick={() => sendMessage()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">{stepTitles[currentStepId]}</h2>
          <p className="text-lg text-text-secondary">정확한 추천을 위해 몇 가지만 알려주세요</p>
        </div>

        <div className="mt-10">
          {
            {
              age: (
                <div className="w-full max-w-md mx-auto space-y-8">
                  <div className="text-center">
                    <p className="text-6xl font-bold text-primary-pink mb-4">{additionalInfo.age}세</p>
                    <p className="text-text-secondary">슬라이더를 움직여 나이를 선택해주세요</p>
                  </div>
                  <div className="px-4">
                    <Slider
                      defaultValue={[additionalInfo.age]}
                      min={18}
                      max={80}
                      step={1}
                      onValueChange={(v) => handleAdditionalInfoChange('age', String(v[0]))}
                      className="[&>*]:bg-primary-pink"
                    />
                    <div className="flex justify-between text-sm text-text-secondary mt-2">
                      <span>18세</span>
                      <span>80세</span>
                    </div>
                  </div>
                </div>
              ),
              gender: (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
                  <StepCard isSelected={additionalInfo.gender === "male"} onClick={() => handleAdditionalInfoChange('gender', 'male')}>
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                        <span className="text-2xl">👨</span>
                      </div>
                      <span className="text-xl font-semibold">남성</span>
                    </div>
                  </StepCard>
                  <StepCard isSelected={additionalInfo.gender === "female"} onClick={() => handleAdditionalInfoChange('gender', 'female')}>
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-secondary-pink rounded-full mx-auto flex items-center justify-center">
                        <span className="text-2xl">👩</span>
                      </div>
                      <span className="text-xl font-semibold">여성</span>
                    </div>
                  </StepCard>
                </div>
              ),
              mbti: (
                <div className="max-w-md mx-auto">
                  <Select value={additionalInfo.mbti} onValueChange={(value) => handleAdditionalInfoChange('mbti', value)}>
                    <SelectTrigger className="h-14 text-lg rounded-2xl border-2 border-brand-border focus:border-primary-pink">
                      <SelectValue placeholder="MBTI를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {MBTI_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className="text-lg py-3">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ),
              relationship_stage: (
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {RELATIONSHIP_STAGES.map((s) => (
                    <StepCard key={s} isSelected={additionalInfo.relationship_stage === s} onClick={() => handleAdditionalInfoChange('relationship_stage', s)}>
                      <div className="space-y-2">
                        <div className="text-2xl mb-2">
                          {s === "연애 초기" && "💗"}
                          {s === "연인" && "💕"}
                          {s === "썸" && "😊"}
                          {s === "소개팅" && "🤝"}
                        </div>
                        <span className="font-semibold text-lg">{s}</span>
                      </div>
                    </StepCard>
                  ))}
                </div>
              ),
              atmosphere: (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {ATMOSPHERES.map((a) => (
                    <StepCard key={a} isSelected={additionalInfo.atmosphere === a} onClick={() => handleAdditionalInfoChange('atmosphere', a)}>
                      <div className="space-y-2">
                        <div className="text-2xl mb-2">
                          {a === "로맨틱" && "💖"}
                          {a === "트렌디" && "✨"}
                          {a === "조용한" && "🤫"}
                          {a === "활기찬" && "🎉"}
                          {a === "고급스러운" && "👑"}
                          {a === "감성적" && "🌙"}
                          {a === "편안한" && "☕"}
                          {a === "힐링" && "🌿"}
                        </div>
                        <span className="font-semibold">{a}</span>
                      </div>
                    </StepCard>
                  ))}
                </div>
              ),
              budget: (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                    {BUDGETS.map((b) => (
                      <StepCard key={b} isSelected={additionalInfo.budget === b} onClick={() => handleAdditionalInfoChange('budget', b)}>
                        <div className="space-y-2">
                          <div className="text-2xl mb-2">💰</div>
                          <span className="font-semibold text-lg">{b}</span>
                        </div>
                      </StepCard>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 text-center mt-4">
                    ⚠️ 현재 예산 기능은 작동하지 않습니다. 추후 업데이트 예정입니다.
                  </p>
                </div>
              ),
              time_slot: (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {TIME_SLOTS.map((t) => (
                    <StepCard key={t} isSelected={additionalInfo.time_slot === t} onClick={() => handleAdditionalInfoChange('time_slot', t)}>
                      <div className="space-y-2">
                        <div className="text-2xl mb-2">
                          {t === "오전" && "🌅"}
                          {t === "오후" && "☀️"}
                          {t === "저녁" && "🌆"}
                          {t === "밤" && "🌙"}
                        </div>
                        <span className="font-semibold">{t}</span>
                      </div>
                    </StepCard>
                  ))}
                </div>
              ),
            }[currentStepId]
          }
        </div>
      </div>
    );
  };

  const renderAdditionalInfoForm = () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">새로운 데이트 코스 추천받기</h2>
        <p className="text-lg text-text-secondary">정확한 추천을 위해 몇 가지만 알려주세요</p>
      </div>
      <div className="mt-10 space-y-8">
        {missingFields.includes('age') && (
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="text-center">
              <p className="text-6xl font-bold text-primary-pink mb-4">{additionalInfo.age}세</p>
              <p className="text-text-secondary">슬라이더를 움직여 나이를 선택해주세요</p>
            </div>
            <div className="px-4">
              <Slider
                defaultValue={[additionalInfo.age]}
                min={18}
                max={80}
                step={1}
                onValueChange={(v) => handleAdditionalInfoChange('age', String(v[0]))}
                className="[&>*]:bg-primary-pink"
              />
              <div className="flex justify-between text-sm text-text-secondary mt-2">
                <span>18세</span>
                <span>80세</span>
              </div>
            </div>
          </div>
        )}
        {missingFields.includes('gender') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg mx-auto">
            <StepCard isSelected={additionalInfo.gender === "male"} onClick={() => handleAdditionalInfoChange('gender', 'male')}>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">👨</span>
                </div>
                <span className="text-xl font-semibold">남성</span>
              </div>
            </StepCard>
            <StepCard isSelected={additionalInfo.gender === "female"} onClick={() => handleAdditionalInfoChange('gender', 'female')}>
              <div className="space-y-3">
                <div className="w-16 h-16 bg-secondary-pink rounded-full mx-auto flex items-center justify-center">
                  <span className="text-2xl">👩</span>
                </div>
                <span className="text-xl font-semibold">여성</span>
              </div>
            </StepCard>
          </div>
        )}
        {missingFields.includes('mbti') && (
          <div className="max-w-md mx-auto">
            <Select value={additionalInfo.mbti} onValueChange={(value) => handleAdditionalInfoChange('mbti', value)}>
              <SelectTrigger className="h-14 text-lg rounded-2xl border-2 border-brand-border focus:border-primary-pink">
                <SelectValue placeholder="MBTI를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {MBTI_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="text-lg py-3">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
          {RELATIONSHIP_STAGES.map((s) => (
            <StepCard key={s} isSelected={additionalInfo.relationship_stage === s} onClick={() => handleAdditionalInfoChange('relationship_stage', s)}>
              <div className="space-y-2">
                <div className="text-2xl mb-2">
                  {s === "연애 초기" && "💗"}
                  {s === "연인" && "💕"}
                  {s === "썸" && "😊"}
                  {s === "소개팅" && "🤝"}
                </div>
                <span className="font-semibold text-lg">{s}</span>
              </div>
            </StepCard>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {ATMOSPHERES.map((a) => (
            <StepCard key={a} isSelected={additionalInfo.atmosphere === a} onClick={() => handleAdditionalInfoChange('atmosphere', a)}>
              <div className="space-y-2">
                <div className="text-2xl mb-2">
                  {a === "로맨틱" && "💖"}
                  {a === "트렌디" && "✨"}
                  {a === "조용한" && "🤫"}
                  {a === "활기찬" && "🎉"}
                  {a === "고급스러운" && "👑"}
                  {a === "감성적" && "🌙"}
                  {a === "편안한" && "☕"}
                  {a === "힐링" && "🌿"}
                </div>
                <span className="font-semibold">{a}</span>
              </div>
            </StepCard>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {BUDGETS.map((b) => (
            <StepCard key={b} isSelected={additionalInfo.budget === b} onClick={() => handleAdditionalInfoChange('budget', b)}>
              <div className="space-y-2">
                <div className="text-2xl mb-2">💰</div>
                <span className="font-semibold text-lg">{b}</span>
              </div>
            </StepCard>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {TIME_SLOTS.map((t) => (
            <StepCard key={t} isSelected={additionalInfo.time_slot === t} onClick={() => handleAdditionalInfoChange('time_slot', t)}>
              <div className="space-y-2">
                <div className="text-2xl mb-2">
                  {t === "오전" && "🌅"}
                  {t === "오후" && "☀️"}
                  {t === "저녁" && "🌆"}
                  {t === "밤" && "🌙"}
                </div>
                <span className="font-semibold">{t}</span>
              </div>
            </StepCard>
          ))}
        </div>
      </div>
    </div>
  );

  const ButtonMessage = ({ message, onButtonClick }) => {
    const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!message) return null;
    
    // 이미 응답이 있는 메시지인지 확인 (다음 메시지가 있으면 이미 제출된 것)
    const messageIndex = messages.findIndex(m => m.message_content === message);
    const hasResponse = messageIndex >= 0 && messageIndex < messages.length - 1;
    const isAlreadySubmitted = isSubmitted || hasResponse;
    
    // 기존 버튼 메시지 처리
    if (message.message_type === 'buttons') {
      return (
        <div className="bg-white p-4 rounded-2xl border border-brand-border">
          <p className="text-text-primary mb-4 font-medium">{message.question}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {message.buttons?.map((button, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isAlreadySubmitted) {
                    setIsSubmitted(true);
                    onButtonClick(button.value);
                  }
                }}
                disabled={isAlreadySubmitted}
                className={`p-3 text-center border border-brand-border rounded-xl transition-all duration-200 text-sm font-medium ${
                  isAlreadySubmitted 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-secondary-pink hover:bg-primary-pink hover:text-white'
                }`}
              >
                {button.text}
              </button>
            ))}
          </div>
        </div>
      );
    }
    
    // 체크박스 카테고리 선택 UI
    if (message.message_type === 'category_checkbox') {
      const handleCategoryToggle = (category: string) => {
        if (isAlreadySubmitted) return; // 제출 후 수정 불가
        
        const newSelected = new Set(selectedCategories);
        if (newSelected.has(category)) {
          newSelected.delete(category);
        } else {
          newSelected.add(category);
        }
        setSelectedCategories(newSelected);
      };

      // 각 대카테고리에서 최소 1개가 남아있는지 확인
      const isValidSelection = () => {
        if (isAlreadySubmitted) return false;
        
        for (const [majorCategory, minorCategories] of Object.entries(message.categories)) {
          const selectedInMajor = minorCategories.filter(cat => selectedCategories.has(cat));
          const unselectedInMajor = minorCategories.filter(cat => !selectedCategories.has(cat));
          
          // 해당 대카테고리에서 선택되지 않은 것이 0개면 (모두 제외하면) 유효하지 않음
          if (unselectedInMajor.length === 0) {
            return false;
          }
        }
        return true;
      };

      const handleConfirm = () => {
        if (isAlreadySubmitted) return; // 중복 클릭 방지
        
        setIsSubmitted(true);
        const excludedList = Array.from(selectedCategories);
        if (excludedList.length === 0) {
          onButtonClick("그대로 진행");
        } else {
          onButtonClick(`제외: ${excludedList.join(", ")}`);
        }
      };

      return (
        <div className="bg-white p-6 rounded-2xl border border-brand-border">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-text-primary mb-2">{message.title}</h3>
            <p className="text-text-secondary mb-4">{message.subtitle}</p>
            <p className="text-sm text-text-secondary">{message.instruction}</p>
          </div>
          
          <div className="space-y-6 mb-6">
            {Object.entries(message.categories).map(([majorCategory, minorCategories]) => (
              <div key={majorCategory} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{message.emoji_map[majorCategory] || "📍"}</span>
                  <h4 className="font-semibold text-text-primary">{majorCategory}</h4>
                  <span className="text-sm text-text-secondary">({minorCategories.length}개)</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {minorCategories.map((category) => {
                    const isSelected = selectedCategories.has(category);
                    
                    return (
                      <label
                        key={category}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-red-50 border-red-300 text-red-700' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleCategoryToggle(category)}
                          disabled={isAlreadySubmitted}
                          className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-sm">{category}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={isAlreadySubmitted || !isValidSelection()}
              className={`flex-1 py-3 px-6 rounded-xl font-medium transition-colors ${
                isAlreadySubmitted 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : !isValidSelection()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary-pink hover:bg-primary-pink/90 text-white'
              }`}
            >
              {isAlreadySubmitted ? '✅ 제출됨' : `✅ 선택 완료 (${selectedCategories.size}개 제외)`}
            </button>
            <button
              onClick={() => {
                if (!isAlreadySubmitted) {
                  setIsSubmitted(true);
                  onButtonClick("그대로 진행");
                }
              }}
              disabled={isAlreadySubmitted || !isValidSelection()}
              className={`py-3 px-6 rounded-xl font-medium transition-colors ${
                isAlreadySubmitted 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : !isValidSelection()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              ▶️ 그대로 진행
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex h-screen">
      {/* 채팅 기록 사이드바 - 채팅 입력창 위까지만 */}
      {showChatHistory && (
        <div className="w-80 bg-white border-r border-brand-border flex flex-col z-30" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="p-4 border-b border-brand-border">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary">채팅 기록</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChatHistory(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chatSessions.map((session) => (
              <div
                key={session.session_id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  session.session_id === currentSessionId
                    ? 'bg-secondary-pink border border-primary-pink'
                    : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                }`}
                onClick={() => loadSessionMessages(session.session_id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary mb-1">
                      {session.session_title || "AI 데이트 코스 추천"}
                    </div>
                    <div className="text-xs text-text-secondary truncate mb-2">
                      {session.preview_message || "채팅을 시작했습니다"}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-text-secondary">
                        {new Date(session.created_at).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {session.has_course && (
                        <span className="px-2 py-0.5 bg-primary-pink text-white text-xs rounded-full">
                          완료
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 p-1 h-auto w-auto text-gray-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => deleteSession(session.session_id, e)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {chatSessions.length === 0 && (
              <div className="text-center text-text-secondary text-sm py-8">
                저장된 채팅 기록이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 채팅 단계일 때는 전체 화면 사용 */}
        {isChatStep ? (
          <div className="h-screen bg-white">
            {renderStepContent()}
          </div>
        ) : (
          /* 일반 단계들은 기존 레이아웃 유지 */
          <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
              <Card className="bg-white border border-brand-border shadow-xl p-8 sm:p-12 rounded-3xl">
                <CardContent className="p-0">
                {/* Progress Bar */}
                {(isCollectingInfo || (messages.length === 0 && !currentSessionId)) && !showAIChat && (
                  <div className="flex items-center gap-6 mb-12">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleBack}
                      disabled={currentStepIndex === 0}
                      className="rounded-full border-2 border-brand-border hover:border-primary-pink bg-transparent"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-secondary">
                          {currentStepIndex + 1} / {steps.length - 1}
                        </span>
                        <span className="text-sm font-medium text-primary-pink">{Math.round(progress)}% 완료</span>
                      </div>
                      <Progress value={progress} className="h-3 [&>*]:bg-primary-pink" />
                    </div>
                  </div>
                )}

                {/* 메인 컨텐츠 영역 */}
                {renderStepContent()}

                {/* 다음 단계 버튼 */}
                {(isCollectingInfo || (messages.length === 0 && !currentSessionId)) && !showAIChat && (
                  <div className="mt-16 text-center">
                    <Button
                      size="lg"
                      className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-12 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleNext}
                      disabled={isLoading || !isCurrentStepValid()}
                    >
                      {isLastStep ? (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          {isLoading ? "결제 처리 중..." : "AI 추천 받기 (1,000 day)"}
                        </>
                      ) : (
                        "다음 단계"
                      )}
                    </Button>
                  </div>
                )}

                {/* 기존 채팅 메시지들 (채팅 모드가 아닐 때) */}
                {!isCollectingInfo && currentSessionId && !showAIChat && (
                  <div className="space-y-6 max-w-4xl mx-auto">{/* 기존 채팅 컴포넌트들 */}</div>
                )}

                {/* 빠른 답변 및 기타 UI 요소들 (채팅 모드일 때만) */}
                {showAIChat && (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 코스 상세 보기 모달 */}

      {showCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl border border-brand-border">
            {/* 스크롤 가능한 컨텐츠 */}
            <div className="overflow-y-auto max-h-[90vh] p-6">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-pink rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">
                      코스 상세 정보
                    </h3>
                    <p className="text-text-secondary text-sm">데이트 코스 세부 내용</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCourseModal(false)}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 코스 제목 */}
              <div className="mb-6">
                <Label className="text-base font-medium text-text-primary mb-2 block">
                  코스 제목
                </Label>
                <Input
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  placeholder="코스 제목을 입력하세요"
                  className="w-full border-brand-border focus:border-primary-pink rounded-xl"
                />
              </div>

              {/* 방문 장소들 */}
              {selectedCourse.places && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-primary-pink" />
                    <h4 className="text-base font-medium text-text-primary">방문 장소</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedCourse.places.map((place: any, index: number) => (
                      <div key={index} className="bg-white rounded-xl p-5 border border-brand-border shadow-sm">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-primary-pink rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            {/* 장소 제목 및 카테고리 */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="text-lg font-semibold text-text-primary">{place.place_info?.name}</h5>
                                <span className="px-2 py-1 bg-secondary-pink text-primary-pink text-xs rounded-full font-medium">
                                  {place.place_info?.category || '장소'}
                                </span>
                              </div>
                              {place.place_info?.address && (
                                <p className="text-text-secondary text-sm">{place.place_info.address}</p>
                              )}
                            </div>

                            {/* 장소 설명 */}
                            {place.description && (
                              <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-primary-pink">
                                <p className="text-text-primary text-sm leading-relaxed">{place.description}</p>
                              </div>
                            )}

                            {/* 지도 버튼 */}
                            {place.urls?.kakao_map && (
                              <div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white"
                                >
                                  <a href={place.urls.kakao_map} target="_blank" rel="noopener noreferrer">
                                    <Navigation className="w-3 h-3 mr-2" />
                                    카카오맵에서 보기
                                  </a>
                                </Button>
                              </div>
                            )}
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
              <div className="flex gap-3 pt-6 border-t border-brand-border">
                <Button
                  onClick={saveSingleCourse}
                  className="flex-1 bg-primary-pink hover:bg-primary-pink/90 text-white rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  코스 저장하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCourseModal(false)}
                  className="border-brand-border hover:bg-gray-50 rounded-xl"
                >
                  닫기
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
