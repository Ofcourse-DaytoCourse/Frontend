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
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/mypage" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">연인 관리</h1>
        </div>

        <div className="space-y-6">
          {/* 연인이 있는 경우 */}
          {hasPartner && partnerInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  현재 연인
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-lg">{partnerInfo.partner_nickname}</p>
                    <p className="text-sm text-gray-500">커플 ID: {partnerInfo.couple_id}</p>
                    <p className="text-sm text-gray-500">
                      연결일: {new Date(partnerInfo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">연결됨</span>
                  </div>
                </div>
                <Button 
                  onClick={handleDeletePartner} 
                  variant="destructive" 
                  size="sm"
                  disabled={isLoading}
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    연인 신청
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="partner-nickname">연인 신청할 대상 닉네임</Label>
                    <div className="flex gap-2">
                      <Input
                        id="partner-nickname"
                        value={partnerNickname}
                        onChange={(e) => setPartnerNickname(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSendRequest}
                        disabled={!partnerNickname.trim() || isLoading}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        신청
                      </Button>
                    </div>
                  </div>

                  <Button 
                    onClick={handleViewRequests} 
                    variant="outline" 
                    className="w-full bg-transparent"
                    disabled={isLoading}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    연인 신청 현황 보기 (보낸: {sentRequests.length}, 받은: {receivedRequests.length})
                  </Button>
                </CardContent>
              </Card>

              {/* 요청 현황 */}
              {showRequests && (
                <>
                  {/* 받은 연인 신청 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        받은 연인 신청
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {receivedRequests.length > 0 ? (
                        <div className="space-y-3">
                          {receivedRequests.map((request) => (
                            <div
                              key={request.request_id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-red-50"
                            >
                              <div>
                                <p className="font-medium">{request.requester_nickname}</p>
                                <p className="text-sm text-gray-500">
                                  신청일: {new Date(request.requested_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleAcceptRequest(request.request_id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={isLoading}
                                >
                                  <Check className="h-4 w-4 mr-1" />수락
                                </Button>
                                <Button
                                  onClick={() => handleRejectRequest(request.request_id)}
                                  variant="destructive"
                                  size="sm"
                                  disabled={isLoading}
                                >
                                  <X className="h-4 w-4 mr-1" />거절
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">받은 연인 신청이 없습니다</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* 보낸 연인 신청 */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5 text-blue-500" />
                        보낸 연인 신청
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sentRequests.length > 0 ? (
                        <div className="space-y-3">
                          {sentRequests.map((request) => (
                            <div
                              key={request.request_id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-blue-50"
                            >
                              <div>
                                <p className="font-medium">{request.partner_nickname}</p>
                                <p className="text-sm text-gray-500">
                                  신청일: {new Date(request.requested_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {request.status === "pending" && (
                                  <>
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                    <span className="text-sm text-yellow-600">대기중</span>
                                  </>
                                )}
                                {request.status === "accepted" && (
                                  <>
                                    <Check className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-600">수락됨</span>
                                  </>
                                )}
                                {request.status === "rejected" && (
                                  <>
                                    <X className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-600">거절됨</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">보낸 연인 신청이 없습니다</p>
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
