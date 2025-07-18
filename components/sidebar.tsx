"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Plus, MessageCircle, User, List, Share2, Home, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { TokenStorage, clearAuthStorage } from "@/lib/storage"
import { useAuth } from "@/contexts/auth-context"

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

interface GlobalMenuProps {
  children?: React.ReactNode
}

export function GlobalMenu({ children }: GlobalMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMenuExpanded, setIsMenuExpanded] = useState(false)
  const { user } = useAuth();
  const [userInfo, setUserInfo] = useState({ name: "", nickname: "", user_id: "" })
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [isLoadingChats, setIsLoadingChats] = useState(false)
  const pathname = usePathname()

  // 사이드바를 숨길 페이지들 (로그인/회원가입 페이지만)
  const hideSidebarPages = ["/login", "/signup"]
  const shouldHideSidebar = hideSidebarPages.some((page) => pathname.startsWith(page))

  // 사용자 정보 로드 (AuthContext에서)
  useEffect(() => {
    if (user && user.nickname) {
      setUserInfo({
        name: user.nickname,
        nickname: user.nickname,
        user_id: user.user_id.toString() || "",
      });
    }
  }, [user]);

  // 채팅 기록 로드
  const loadChatHistory = async () => {
    if (!userInfo.user_id) return;

    setIsLoadingChats(true);
    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/user/${userInfo.user_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.sessions || []);
      } else {
        // 401 Unauthorized 등의 에러 처리
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (error) {
      console.error('채팅 기록 로드 실패:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // 사이드바가 열릴 때마다 채팅 기록 새로고침
  useEffect(() => {
    if (isOpen && userInfo.user_id) {
      loadChatHistory();
    }
  }, [isOpen, userInfo.user_id]);

  const menuItems = [
    { href: "/list", label: "저장된 코스", icon: List },
    { href: "/shared", label: "공유된 코스", icon: Share2 },
    { href: "/mypage", label: "마이페이지", icon: User },
  ]

  // 채팅 세션을 클릭했을 때 해당 세션으로 이동
  const handleChatClick = (sessionId: string) => {
    setIsOpen(false);
    window.location.href = `/course?session=${sessionId}`;
  };

  // 채팅 세션 삭제
  const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    
    if (!confirm("정말로 이 채팅을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = TokenStorage.get();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/sessions/${sessionId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // 목록에서 해당 세션 제거
        setChatHistory(prev => prev.filter(chat => chat.session_id !== sessionId));
      } else {
        alert('채팅 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('채팅 삭제 실패:', error);
      alert('채팅 삭제 중 오류가 발생했습니다.');
    }
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  // 로그인/회원가입 페이지에서만 사이드바 숨김
  if (shouldHideSidebar) {
    return <>{children}</>
  }

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      clearAuthStorage();
      window.location.href = "/login"
    }
  }

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="bg-white shadow-md hover:shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* 오버레이 */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />}

      {/* 슬라이드 메뉴 */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-pink-600">데이트 코스 추천</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{userInfo.nickname}님</p>
              </div>
            </div>
          </div>

          {/* 새 채팅 생성 버튼 */}
          <div className="p-4 border-b border-gray-200">
            <Button
              className="w-full bg-pink-600 hover:bg-pink-700"
              onClick={() => {
                setIsOpen(false)
                window.location.href = "/course"
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              새로운 채팅 생성
            </Button>
          </div>

          {/* 채팅 기록 */}
          <div className="flex-1 p-4 overflow-auto border-b border-gray-200">
            <h3 className="font-medium mb-3 text-gray-700">채팅 기록</h3>
            
            {isLoadingChats ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">로딩 중...</p>
              </div>
            ) : chatHistory.length > 0 ? (
              <div className="space-y-2">
                {chatHistory.map((chat) => (
                  <div
                    key={chat.session_id}
                    className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100 transition-colors relative group"
                    onClick={() => handleChatClick(chat.session_id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-sm truncate">{chat.session_title}</span>
                      {chat.has_course && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="코스 완성됨"></div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto hover:bg-red-100"
                        onClick={(e) => handleDeleteChat(chat.session_id, e)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate">{chat.preview_message}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        chat.session_status === 'COMPLETED' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {chat.session_status === 'COMPLETED' ? '완료' : '진행중'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(chat.last_activity_at).toLocaleDateString('ko-KR')} • {chat.message_count}개 메시지
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">아직 채팅 기록이 없습니다</p>
                <p className="text-xs text-gray-400">새로운 채팅을 시작해보세요!</p>
              </div>
            )}
          </div>

          {/* 슬라이드 팝업 메뉴 */}
          <div className="bg-gray-50">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 h-auto text-left hover:bg-gray-100"
              onClick={() => setIsMenuExpanded(!isMenuExpanded)}
            >
              <span className="font-medium text-gray-700">메뉴</span>
              {isMenuExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </Button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isMenuExpanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 pb-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.href) ? "bg-pink-100 text-pink-700 font-medium" : "text-gray-700 hover:bg-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )
                })}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className={`transition-all duration-300 ${isOpen ? "ml-80" : "ml-0"}`}>{children}</div>
    </>
  )
}

// 기존 컴포넌트들은 호환성을 위해 유지
export function Sidebar() {
  return null
}

export function MobileSidebar() {
  return null
}