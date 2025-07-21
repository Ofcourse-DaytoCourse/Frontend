"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { TokenStorage, UserStorage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Heart, UserPlus, Check, X, Trash2, Eye, Send, Clock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";

interface CoupleInfo {
  couple_id: number;
  partner_id: string;
  partner_nickname: string;
  created_at: string;
}

interface SentRequest {
  request_id: number;
  partner_nickname: string;
  status: string;
  requested_at: string;
}

interface ReceivedRequest {
  request_id: number;
  requester_id: string;
  requester_nickname: string;
  requested_at: string;
}

export default function CouplePage() {
  const { user } = useAuth();
  const { themeConfig } = useTheme();
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<CoupleInfo | null>(null);
  const [partnerNickname, setPartnerNickname] = useState("");
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<ReceivedRequest[]>([]);
  const [showRequests, setShowRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = typeof window !== "undefined" ? TokenStorage.get() || "" : "";

  // 연인 상태 조회
  const fetchCoupleStatus = async () => {
    if (!user?.user_id) return;
    
    try {
      const data = await api(`/couples/status?user_id=${user.user_id}`, "GET", undefined, token);
      if (data.has_partner && data.couple_info) {
        setHasPartner(true);
        setPartnerInfo(data.couple_info);
      } else {
        setHasPartner(false);
        setPartnerInfo(null);
      }
    } catch (err: any) {
      console.error("연인 상태 조회 실패:", err.message);
    }
  };

  // 모든 요청 상태 조회
  const fetchAllRequests = async () => {
    if (!user?.user_id || !user?.nickname) return;
    
    try {
      const data = await api(
        `/couples/requests/all?user_id=${user.user_id}&user_nickname=${user.nickname}`,
        "GET",
        undefined,
        token
      );
      setSentRequests(data.sent_requests || []);
      setReceivedRequests(data.received_requests || []);
    } catch (err: any) {
      console.error("요청 조회 실패:", err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCoupleStatus();
      fetchAllRequests();
    }
  }, [user]);

  const handleSendRequest = async () => {
    if (!partnerNickname.trim() || !user?.user_id) return;
    
    setIsLoading(true);
    try {
      await api("/couples/requests", "POST", {
        requester_id: user.user_id,
        partner_nickname: partnerNickname
      }, token);
      alert("연인 신청이 전송되었습니다.");
      setPartnerNickname("");
      await fetchAllRequests(); // 요청 목록 새로고침
    } catch (err: any) {
      alert("신청 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRequests = async () => {
    await fetchAllRequests();
    setShowRequests(!showRequests);
  };

  const handleAcceptRequest = async (requestId: number) => {
    if (!user?.nickname) return;
    
    setIsLoading(true);
    try {
      const res = await api(
        `/couples/requests/${requestId}/response?action=accept&user_nickname=${user.nickname}`,
        "POST",
        {},
        token
      );
      alert(res.message);
      await fetchCoupleStatus(); // 연인 상태 새로고침
      await fetchAllRequests(); // 요청 목록 새로고침
      setShowRequests(false);
    } catch (err: any) {
      alert("수락 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    if (!user?.nickname) return;
    
    setIsLoading(true);
    try {
      const res = await api(
        `/couples/requests/${requestId}/response?action=reject&user_nickname=${user.nickname}`,
        "POST",
        {},
        token
      );
      alert(res.message);
      await fetchAllRequests(); // 요청 목록 새로고침
    } catch (err: any) {
      alert("거절 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePartner = async () => {
    if (!confirm("정말로 연인 관계를 해제하시겠습니까?") || !partnerInfo || !user?.user_id) return;
    
    setIsLoading(true);
    try {
      const res = await api(
        `/couples/${partnerInfo.couple_id}?user_id=${user.user_id}`,
        "DELETE",
        {},
        token
      );
      alert(res.message);
      await fetchCoupleStatus(); // 연인 상태 새로고침
    } catch (err: any) {
      alert("삭제 실패: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-2xl mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">로그인이 필요합니다.</p>
              <div className="text-center mt-4">
                <Link href="/login">
                  <Button>로그인하기</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeConfig.bgGradient} pt-16`}>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/mypage" className={`inline-flex items-center text-${themeConfig.accent} hover:opacity-80 mb-4 transition-colors`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            마이페이지로 돌아가기
          </Link>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-gradient-to-r ${themeConfig.primary} rounded-full`}>
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h1 className={`text-3xl font-bold bg-gradient-to-r ${themeConfig.gradientFrom} ${themeConfig.gradientTo} bg-clip-text text-transparent`}>연인 관리</h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* 연인이 있는 경우 */}
          {hasPartner && partnerInfo && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-pink-500 to-red-500 text-white">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Heart className="h-6 w-6 animate-pulse" />
                  현재 연인
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                        <Heart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-gray-800">{partnerInfo.partner_nickname}</p>
                        <p className="text-sm text-gray-500">커플 ID: #{partnerInfo.couple_id}</p>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-pink-50 to-red-50 p-3 rounded-lg border-l-4 border-pink-400">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-pink-500" />
                        연결일: {new Date(partnerInfo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">연결됨</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleDeletePartner} 
                  variant="destructive" 
                  size="sm"
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />연인 관계 해제
                </Button>
              </CardContent>
            </Card>
          )}

          {/* 연인이 없는 경우 */}
          {!hasPartner && (
            <>
              {/* 연인 신청 보내기 */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <UserPlus className="h-6 w-6" />
                    연인 신청
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <Label htmlFor="partner-nickname" className="text-gray-700 font-medium flex items-center gap-2">
                      <Heart className="h-4 w-4 text-pink-500" />
                      연인 신청할 대상 닉네임
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        id="partner-nickname"
                        value={partnerNickname}
                        onChange={(e) => setPartnerNickname(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        disabled={isLoading}
                        className="border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all duration-200"
                      />
                      <Button
                        onClick={handleSendRequest}
                        disabled={!partnerNickname.trim() || isLoading}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg transition-all duration-200"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        신청
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                    <Button 
                      onClick={handleViewRequests} 
                      variant="outline" 
                      className="w-full bg-white/50 border-pink-300 hover:bg-pink-50 transition-all duration-200"
                      disabled={isLoading}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      연인 신청 현황 보기 (보낸: {sentRequests.length}, 받은: {receivedRequests.length})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 요청 현황 */}
              {showRequests && (
                <>
                  {/* 받은 연인 신청 */}
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-red-500 to-pink-500 text-white">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Heart className="h-6 w-6 animate-pulse" />
                        받은 연인 신청
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {receivedRequests.length > 0 ? (
                        <div className="space-y-4">
                          {receivedRequests.map((request) => (
                            <div
                              key={request.request_id}
                              className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-gradient-to-r from-red-50 to-pink-50 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center">
                                  <Heart className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg text-gray-800">{request.requester_nickname}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    신청일: {new Date(request.requested_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleAcceptRequest(request.request_id)}
                                  size="sm"
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-200"
                                  disabled={isLoading}
                                >
                                  <Check className="h-4 w-4 mr-1" />수락
                                </Button>
                                <Button
                                  onClick={() => handleRejectRequest(request.request_id)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLoading}
                                  className="bg-red-500 hover:bg-red-600 transition-all duration-200"
                                >
                                  <X className="h-4 w-4 mr-1" />거절
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Heart className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">받은 연인 신청이 없습니다</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* 보낸 연인 신청 */}
                  <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Send className="h-6 w-6" />
                        보낸 연인 신청
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      {sentRequests.length > 0 ? (
                        <div className="space-y-4">
                          {sentRequests.map((request) => (
                            <div
                              key={request.request_id}
                              className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                                  <Send className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-bold text-lg text-gray-800">{request.partner_nickname}</p>
                                  <p className="text-sm text-gray-600 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    신청일: {new Date(request.requested_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {request.status === "pending" && (
                                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                                    <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
                                    <span className="text-sm font-medium text-yellow-700">대기중</span>
                                  </div>
                                )}
                                {request.status === "accepted" && (
                                  <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-sm font-medium text-green-700">수락됨</span>
                                  </div>
                                )}
                                {request.status === "rejected" && (
                                  <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                                    <X className="h-4 w-4 text-red-500" />
                                    <span className="text-sm font-medium text-red-700">거절됨</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Send className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500">보낸 연인 신청이 없습니다</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
