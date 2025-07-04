"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, MapPin, MessageCircle, Save, Clock, Bot, User, Sparkles, List } from "lucide-react";
import { TokenStorage } from "@/lib/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getMyProfile } from "@/lib/api";

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
  age?: number;
  mbti?: string;
  address?: string;
  car_owned?: boolean;
  description?: string;
  relationship_stage?: string;
  general_preferences?: string[];
  profile_image_url?: string;
}

export default function CoursePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }
    loadUserSessions();
    loadFullUserProfile();
    
    // URL 파라미터에서 session ID 확인
    const sessionParam = searchParams.get('session');
    if (sessionParam) {
      loadSession(sessionParam);
    }
  }, [user, router, searchParams]);

  const loadFullUserProfile = async () => {
    if (!user?.user_id) return;
    
    try {
      const token = TokenStorage.get();
      const data = await getMyProfile(user.user_id, token);
      console.log("[DEBUG] 완전한 사용자 프로필 로드됨:", data.user);
      setFullUserProfile(data.user);
    } catch (error) {
      console.error('사용자 프로필 로드 실패:', error);
    }
  };

  const getUserProfile = (): UserProfile => {
    if (!fullUserProfile) return {};
    
    console.log("[DEBUG] fullUserProfile 객체:", fullUserProfile);
    console.log("[DEBUG] profile_detail:", fullUserProfile.profile_detail);
    
    const profile = {
      gender: fullUserProfile.profile_detail?.gender,
      age: fullUserProfile.profile_detail?.age_range ? parseInt(fullUserProfile.profile_detail.age_range) : undefined,
      mbti: fullUserProfile.profile_detail?.mbti,
      address: fullUserProfile.profile_detail?.address,
      description: fullUserProfile.profile_detail?.description,
      general_preferences: fullUserProfile.profile_detail?.preferences ? fullUserProfile.profile_detail.preferences.split(",") : []
    };
    
    console.log("[DEBUG] 생성된 프로필:", profile);
    return profile;
  };

  // 채팅 전용: 기존 getUserProfile()과 동일하게 사용
  const getChatUserProfile = (): any => {
    return getUserProfile();
  };

  const loadUserSessions = async () => {
    if (!user?.user_id) return;

    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/user/${user.user_id}?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('세션 목록 조회 실패:', error);
    }
  };

  const startNewSession = async () => {
    if (!input.trim() || !user) return;

    setIsLoading(true);
    setMessages([]);
    setCurrentSessionId(null);
    setQuickReplies([]);
    setCanRecommend(false);

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
            initial_message: input,
            user_profile: getChatUserProfile()
          }),
        }
      );

      if (!response.ok) {
        throw new Error('새 세션 시작에 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.success) {
        setCurrentSessionId(data.session_id);
        
        // 초기 메시지들 설정
        const initialMessages: ChatMessage[] = [
          {
            message_id: 1,
            message_type: "USER",
            message_content: input,
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
        setInput("");
        
        // 세션 목록 새로고침
        await loadUserSessions();
      } else {
        throw new Error(data.message || '세션 시작 실패');
      }
    } catch (error) {
      console.error('새 세션 시작 실패:', error);
      alert('새 채팅을 시작할 수 없습니다. 다시 시도해주세요.');
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
            user_profile: getChatUserProfile()
          }),
        }
      );

      if (!response.ok) {
        throw new Error('메시지 전송에 실패했습니다.');
      }

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
        
        // 추천 준비 완료 확인
        if (data.response.message.includes("추천을 시작하시려면") || 
            data.response.message.includes("추천 시작")) {
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
        message_content: "죄송합니다. 메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.",
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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: currentSessionId
          }),
        }
      );

      if (!response.ok) {
        throw new Error('코스 추천 요청에 실패했습니다.');
      }

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
        
        // 세션 목록 새로고침
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

    // 제목과 설명이 비어있는지 확인
    if (!editableTitle.trim()) {
      alert('코스 제목을 입력해주세요.');
      return;
    }

    try {
      const token = TokenStorage.get();
      
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
            places: selectedCourse.places?.map((place: any, index: number) => ({
              sequence: index + 1,
              name: place.place_info?.name || "장소명 없음",
              category_name: place.place_info?.category || "카테고리 없음",
              address: place.place_info?.address || "주소 정보 없음"
            })) || [],
            total_duration: 240, // 4시간 기본값
            estimated_cost: 100000 // 10만원 기본값
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
      const token = TokenStorage.get();
      
      // 코스 데이터에서 첫 번째 맑은 날 코스 추출
      const sunnyWeatherCourses = courseData.course?.results?.sunny_weather || [];
      const firstCourse = sunnyWeatherCourses[0];
      
      if (!firstCourse) {
        alert('저장할 코스 데이터가 없습니다.');
        return;
      }

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
            places: firstCourse.places?.map((place: any, index: number) => ({
              sequence: index + 1,
              name: place.place_info?.name || "장소명 없음",
              category_name: place.place_info?.category || "카테고리 없음",
              address: "주소 정보 없음"
            })) || [],
            total_duration: 240, // 4시간 기본값
            estimated_cost: 100000 // 10만원 기본값
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

  const loadSession = async (sessionId: string) => {
    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentSessionId(sessionId);
          setMessages(data.messages || []);
          setShowSessions(false);
          setQuickReplies([]);
          
          // 마지막 메시지에 코스 데이터가 있는지 확인
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage?.course_data) {
            setCanRecommend(false);
          } else {
            setCanRecommend(true);
          }
        }
      }
    } catch (error) {
      console.error('세션 로드 실패:', error);
    }
  };

  const handleQuickReply = (reply: string) => {
    setInput(reply);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (currentSessionId) {
        sendMessage();
      } else {
        startNewSession();
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">로그인이 필요합니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-pink-600" />
            <div>
              <h1 className="text-2xl font-bold text-pink-600">AI 데이트 코스 추천</h1>
              <p className="text-gray-600 text-sm">원하는 데이트 스타일을 알려주세요!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSessions(!showSessions)}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              채팅 기록 ({sessions.length})
            </Button>
            {currentSessionId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCurrentSessionId(null);
                  setMessages([]);
                  setQuickReplies([]);
                  setCanRecommend(false);
                }}
                className="flex items-center gap-2"
              >
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
                <div
                  key={session.session_id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => loadSession(session.session_id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{session.session_title}</p>
                    <p className="text-xs text-gray-500 truncate">{session.preview_message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                        session.session_status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {session.session_status === 'COMPLETED' ? '완료' : '진행중'}
                      </span>
                      {session.has_course && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-800">
                          <Sparkles className="h-3 w-3 mr-1" />
                          코스 완성
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(session.last_activity_at).toLocaleDateString()}
                  </div>
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
        {messages.length === 0 ? (
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
                <Card className={`max-w-[80%] ${
                  message.message_type === "USER" 
                    ? "bg-pink-600 text-white border-pink-600" 
                    : "bg-white border-gray-200"
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.message_type === "USER" 
                          ? "bg-pink-500" 
                          : "bg-gray-100"
                      }`}>
                        {message.message_type === "USER" ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="whitespace-pre-line text-sm leading-relaxed">
                          {message.message_content}
                        </p>
                        
                        {/* 코스 데이터가 있는 경우 코스 상세 정보 표시 */}
                        {message.message_type === "ASSISTANT" && message.course_data && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-4">
                              {/* 맑은 날 코스 */}
                              {message.course_data.course?.results?.sunny_weather && (
                                <div>
                                  <h4 className="font-semibold text-lg text-blue-600 mb-3">☀️ 맑은 날 추천 코스</h4>
                                  <div className="space-y-3">
                                    {message.course_data.course.results.sunny_weather.map((course: any, index: number) => (
                                      <div 
                                        key={index} 
                                        className="bg-blue-50 p-4 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border-2 border-transparent hover:border-blue-200"
                                        onClick={() => openCourseDetail(course, 'sunny', index)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <h5 className="font-medium text-blue-800 mb-2">☀️ 맑은 날 코스 {index + 1}</h5>
                                          <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">상세보기 →</span>
                                        </div>
                                        {course.places && course.places.length > 0 && (
                                          <div className="mb-2">
                                            <span className="text-sm text-gray-600">
                                              {course.places.length}개 장소: {course.places.map((p: any) => p.place_info?.name).join(' → ')}
                                            </span>
                                          </div>
                                        )}
                                        {course.recommendation_reason && (
                                          <p className="text-sm text-gray-700 bg-white p-2 rounded line-clamp-2">
                                            💡 {course.recommendation_reason.substring(0, 100)}...
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 비오는 날 코스 */}
                              {message.course_data.course?.results?.rainy_weather && (
                                <div>
                                  <h4 className="font-semibold text-lg text-gray-600 mb-3">🌧️ 비오는 날 추천 코스</h4>
                                  <div className="space-y-3">
                                    {message.course_data.course.results.rainy_weather.map((course: any, index: number) => (
                                      <div 
                                        key={index} 
                                        className="bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-gray-200"
                                        onClick={() => openCourseDetail(course, 'rainy', index)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <h5 className="font-medium text-gray-800 mb-2">🌧️ 비오는 날 코스 {index + 1}</h5>
                                          <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">상세보기 →</span>
                                        </div>
                                        {course.places && course.places.length > 0 && (
                                          <div className="mb-2">
                                            <span className="text-sm text-gray-600">
                                              {course.places.length}개 장소: {course.places.map((p: any) => p.place_info?.name).join(' → ')}
                                            </span>
                                          </div>
                                        )}
                                        {course.recommendation_reason && (
                                          <p className="text-sm text-gray-700 bg-white p-2 rounded line-clamp-2">
                                            💡 {course.recommendation_reason.substring(0, 100)}...
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 저장 버튼 */}
                              <div className="pt-2">
                                <Button
                                  size="sm"
                                  className="bg-pink-600 hover:bg-pink-700 text-white"
                                  onClick={() => saveCourse(message.course_data)}
                                >
                                  <Save className="h-4 w-4 mr-2" />
                                  이 코스 저장하기
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
            ))}
            
            {/* 빠른 답변 버튼들 */}
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
            
            {/* 추천 시작 버튼 */}
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
            placeholder={currentSessionId ? "메시지를 입력하세요..." : "데이트 스타일, 장소, 취향 등을 입력해보세요"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button
            onClick={currentSessionId ? sendMessage : startNewSession}
            disabled={isLoading || !input.trim()}
            className="bg-pink-600 hover:bg-pink-700 px-6"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 코스 상세 보기 모달 */}
      {showCourseModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  코스 상세 정보
                </h3>
                <button 
                  onClick={() => setShowCourseModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* 코스 제목 편집 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 코스 제목
                </label>
                <Input
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  placeholder="코스 제목을 입력하세요"
                  className="w-full"
                />
              </div>

              {/* 장소 목록 */}
              {selectedCourse.places && (
                <div className="mb-6">
                  <h4 className="font-semibold text-lg mb-3">📍 방문 장소</h4>
                  <div className="space-y-4">
                    {selectedCourse.places.map((place: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h5 className="font-semibold text-lg">{place.place_info?.name}</h5>
                            <p className="text-gray-600 text-sm mb-2">{place.place_info?.category}</p>
                            {place.place_info?.address && (
                              <p className="text-gray-500 text-sm mb-2">📍 {place.place_info.address}</p>
                            )}
                            {place.description && (
                              <div className="bg-white p-3 rounded border-l-4 border-pink-500">
                                <p className="text-sm text-gray-700">{place.description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 코스 설명 편집 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💡 코스 설명
                </label>
                <Textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  placeholder="코스에 대한 설명을 입력하세요"
                  className="w-full min-h-[100px]"
                />
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={saveSingleCourse}
                  className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  코스 저장하기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCourseModal(false)}
                  className="px-6"
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