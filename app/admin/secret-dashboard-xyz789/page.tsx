// app/admin/secret-dashboard-xyz789/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users,
  DollarSign,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Database,
  TrendingUp,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/admin-api";
import { TokenStorage } from "@/lib/storage";
import { 
  AdminRefundRequest, 
  UnmatchedDeposit, 
  SystemStatistics,
  CleanupStatus 
} from "@/types/admin";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  // 인증 상태
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // 메인 상태
  const [currentTab, setCurrentTab] = useState<'overview' | 'refunds' | 'deposits' | 'system' | 'manual-charge'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  
  // 통계 데이터
  const [systemStats, setSystemStats] = useState<SystemStatistics | null>(null);
  
  // 환불 관리
  const [pendingRefunds, setPendingRefunds] = useState<AdminRefundRequest[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<AdminRefundRequest | null>(null);
  const [adminMemo, setAdminMemo] = useState("");
  
  // 미매칭 입금 관리
  const [unmatchedDeposits, setUnmatchedDeposits] = useState<UnmatchedDeposit[]>([]);
  
  // 시스템 관리
  const [cleanupStatus, setCleanupStatus] = useState<CleanupStatus | null>(null);
  const [isCleanupRunning, setIsCleanupRunning] = useState(false);

  // 수동 충전
  const [manualChargeForm, setManualChargeForm] = useState({
    target_type: 'single_user' as 'all_users' | 'single_user',
    nickname: '',
    amount: '',
    is_refundable: true,
    description: ''
  });
  const [chargeResult, setChargeResult] = useState<any>(null);
  const [isCharging, setIsCharging] = useState(false);
  
  // 닉네임 검색
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // 관리자 인증 체크
  useEffect(() => {
    const checkAuthentication = () => {
      const adminAuth = sessionStorage.getItem("admin_authenticated");
      const loginTime = sessionStorage.getItem("admin_login_time");
      
      if (!adminAuth || adminAuth !== "true") {
        router.push("/admin/login");
        return;
      }
      
      // 로그인 시간 체크 (8시간 후 만료)
      if (loginTime) {
        const currentTime = Date.now();
        const timeDiff = currentTime - parseInt(loginTime);
        const eightHours = 8 * 60 * 60 * 1000; // 8시간을 밀리초로 변환
        
        if (timeDiff > eightHours) {
          sessionStorage.removeItem("admin_authenticated");
          sessionStorage.removeItem("admin_login_time");
          toast({
            title: "세션 만료",
            description: "보안을 위해 8시간 후 자동으로 로그아웃됩니다.",
            variant: "destructive",
          });
          router.push("/admin/login");
          return;
        }
      }
      
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    };

    checkAuthentication();
  }, [router, toast]);

  // 페이지 로드 시 데이터 초기화
  useEffect(() => {
    if (isAuthenticated) {
      loadOverviewData();
    }
  }, [isAuthenticated]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) return;
    
    switch (currentTab) {
      case 'overview':
        loadOverviewData();
        break;
      case 'refunds':
        loadPendingRefunds();
        break;
      case 'deposits':
        loadUnmatchedDeposits();
        break;
      case 'system':
        loadCleanupStatus();
        break;
      case 'manual-charge':
        // 수동 충전 탭은 별도 로딩 없음
        break;
    }
  }, [currentTab, isAuthenticated]);

  const loadOverviewData = async () => {
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const [statsResponse, refundsResponse] = await Promise.all([
        adminApi.getStatistics(token),
        adminApi.getRefundRequests({ status_filter: 'pending', size: 5 }, token)
      ]);

      setSystemStats(statsResponse);
      setPendingRefunds(refundsResponse.refund_history || []);
    } catch (error: any) {
      toast({
        title: "데이터 로드 실패",
        description: error.message || "개요 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingRefunds = async () => {
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await adminApi.getRefundRequests({ status_filter: 'pending' }, token);
      setPendingRefunds(response.refund_history || []);
    } catch (error: any) {
      toast({
        title: "환불 요청 로드 실패",
        description: error.message || "환불 요청을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnmatchedDeposits = async () => {
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await adminApi.getUnmatchedDeposits({ status: 'unmatched' }, token);
      setUnmatchedDeposits(response.data.unmatched_deposits);
    } catch (error: any) {
      toast({
        title: "미매칭 입금 로드 실패",
        description: error.message || "미매칭 입금을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCleanupStatus = async () => {
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await adminApi.getCleanupStatus(token);
      setCleanupStatus(response);
    } catch (error: any) {
      toast({
        title: "정리 상태 로드 실패",
        description: error.message || "정리 상태를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundAction = async (action: 'approve' | 'reject') => {
    if (!selectedRefund) return;
    
    if (!adminMemo.trim()) {
      toast({
        title: "메모 필수",
        description: "관리자 메모를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const apiCall = action === 'approve' 
        ? adminApi.approveRefund 
        : adminApi.rejectRefund;

      await apiCall(selectedRefund.refund_request_id, { admin_memo: adminMemo }, token);

      toast({
        title: `환불 ${action === 'approve' ? '승인' : '거부'} 완료`,
        description: `환불 요청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.`,
      });

      // 상태 초기화
      setSelectedRefund(null);
      setAdminMemo("");
      
      // 즉시 새로고침
      await loadPendingRefunds();
    } catch (error: any) {
      toast({
        title: `환불 ${action === 'approve' ? '승인' : '거부'} 실패`,
        description: error.message || "처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      
      // 에러가 나더라도 실제로는 처리됐을 수 있으므로 새로고침
      setSelectedRefund(null);
      setAdminMemo("");
      await loadPendingRefunds();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async (type: 'all' | 'rate_limit' | 'deposits' | 'unmatched' = 'all') => {
    setIsCleanupRunning(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await adminApi.runCleanup({ cleanup_type: type }, token);

      toast({
        title: "정리 완료",
        description: `${Object.values(response.details).reduce((a, b) => a + b, 0)}개 항목이 정리되었습니다.`,
      });

      loadCleanupStatus();
    } catch (error: any) {
      toast({
        title: "정리 실패",
        description: error.message || "정리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsCleanupRunning(false);
    }
  };

  const handleManualCharge = async () => {
    if (!manualChargeForm.amount || isNaN(Number(manualChargeForm.amount))) {
      toast({
        title: "입력 오류",
        description: "유효한 충전 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (manualChargeForm.target_type === 'single_user' && !manualChargeForm.nickname.trim()) {
      toast({
        title: "입력 오류",
        description: "충전할 사용자 닉네임을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsCharging(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await adminApi.manualCharge({
        target_type: manualChargeForm.target_type,
        nickname: manualChargeForm.target_type === 'single_user' ? manualChargeForm.nickname : undefined,
        amount: Number(manualChargeForm.amount),
        is_refundable: manualChargeForm.is_refundable,
        description: manualChargeForm.description || undefined
      }, token);

      setChargeResult(response);

      toast({
        title: "충전 완료",
        description: `${response.success_count}명에게 총 ${response.total_amount.toLocaleString()}원이 충전되었습니다.`,
      });

      // 폼 초기화
      setManualChargeForm({
        target_type: 'single_user',
        nickname: '',
        amount: '',
        is_refundable: true,
        description: ''
      });

    } catch (error: any) {
      toast({
        title: "충전 실패",
        description: error.message || "충전 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsCharging(false);
    }
  };

  // 닉네임 검색 함수
  const searchUsers = async (nickname: string) => {
    if (!nickname.trim() || nickname.length < 1) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = TokenStorage.get();
      if (!token) return;

      const response = await adminApi.getUserList({
        search_nickname: nickname,
        size: 10
      }, token);

      setSearchResults(response.users || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('사용자 검색 실패:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 닉네임 입력 핸들러 (디바운싱)
  const handleNicknameChange = (value: string) => {
    setManualChargeForm(prev => ({ ...prev, nickname: value }));
    
    // 기존 타이머 클리어
    if ((window as any).nicknameSearchTimer) {
      clearTimeout((window as any).nicknameSearchTimer);
    }
    
    // 500ms 후 검색 실행
    (window as any).nicknameSearchTimer = setTimeout(() => {
      searchUsers(value);
    }, 500);
  };

  // 사용자 선택 핸들러
  const handleUserSelect = (user: any) => {
    setManualChargeForm(prev => ({ ...prev, nickname: user.nickname }));
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + "원";
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_login_time");
    toast({
      title: "로그아웃 완료",
      description: "관리자 세션이 종료되었습니다.",
    });
    router.push("/admin/login");
  };

  // 인증 체크 중일 때 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 (이미 리다이렉트됨)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 - 관리자 대시보드임을 숨김 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">시스템 관리</h1>
          <p className="text-gray-600">전체 시스템 상태를 모니터링하고 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-red-600 border-red-600">
            관리자 전용
          </Badge>
          <Button
            variant="outline"
            onClick={loadOverviewData}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            로그아웃
          </Button>
        </div>
      </div>

      {/* 탭 UI */}
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="refunds">환불 관리</TabsTrigger>
          <TabsTrigger value="deposits">미매칭 입금</TabsTrigger>
          <TabsTrigger value="manual-charge">수동 충전</TabsTrigger>
          <TabsTrigger value="system">시스템 관리</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="space-y-6">
          {systemStats && (
            <>
              {/* 주요 통계 카드들 */}
              <div className="grid md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Users className="h-5 w-5" />
                      총 사용자
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{systemStats.total_users.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-5 w-5" />
                      총 충전액
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(systemStats.total_charged)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <DollarSign className="h-5 w-5" />
                      총 사용액
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(systemStats.total_used)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <RefreshCw className="h-5 w-5" />
                      총 환불액
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(systemStats.total_refunded)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 대기중인 작업들 */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-2 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <Clock className="h-5 w-5" />
                      대기중인 환불
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-yellow-600 mb-2">
                      {systemStats.pending_refunds}
                    </p>
                    <p className="text-sm text-gray-600">승인 대기중</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      미매칭 입금
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600 mb-2">
                      {systemStats.unmatched_deposits}
                    </p>
                    <p className="text-sm text-gray-600">처리 필요</p>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CreditCard className="h-5 w-5" />
                      활성 입금요청
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600 mb-2">
                      {systemStats.active_deposits}
                    </p>
                    <p className="text-sm text-gray-600">진행중</p>
                  </CardContent>
                </Card>
              </div>

              {/* 최근 환불 요청 */}
              <Card>
                <CardHeader>
                  <CardTitle>최근 환불 요청 (5건)</CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRefunds && pendingRefunds.length > 0 ? (
                    <div className="space-y-3">
                      {pendingRefunds.slice(0, 5).map((refund) => (
                        <div
                          key={refund.refund_request_id}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            setSelectedRefund(refund);
                            setCurrentTab('refunds');
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {refund.refund_amount.toLocaleString()}원 환불
                              </p>
                              <p className="text-sm text-gray-600">
                                {refund.user_info?.nickname || refund.user_id}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline">대기중</Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDistanceToNow(new Date(refund.created_at), { locale: ko, addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">대기중인 환불 요청이 없습니다</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 환불 관리 탭 */}
        <TabsContent value="refunds" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* 환불 요청 목록 */}
            <Card>
              <CardHeader>
                <CardTitle>대기중인 환불 요청</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRefunds && pendingRefunds.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {pendingRefunds.map((refund) => (
                      <div
                        key={refund.refund_request_id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRefund?.refund_request_id === refund.refund_request_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedRefund(refund)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {refund.refund_amount.toLocaleString()}원
                          </span>
                          <Badge variant="outline">
                            {formatDistanceToNow(new Date(refund.created_at), { locale: ko, addSuffix: true })}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          사용자: {refund.user_info?.nickname || refund.user_id}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          사유: {refund.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">대기중인 환불 요청이 없습니다</p>
                )}
              </CardContent>
            </Card>

            {/* 환불 처리 */}
            <Card>
              <CardHeader>
                <CardTitle>환불 처리</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedRefund ? (
                  <div className="space-y-4">
                    {/* 환불 정보 */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">환불 금액:</span>
                        <span className="font-medium">{selectedRefund.refund_amount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">사용자:</span>
                        <span>{selectedRefund.user_info?.nickname || selectedRefund.user_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">계좌:</span>
                        <span>{selectedRefund.bank_name} {selectedRefund.account_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">예금주:</span>
                        <span>{selectedRefund.account_holder}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">연락처:</span>
                        <span>{selectedRefund.contact}</span>
                      </div>
                    </div>

                    {/* 환불 사유 */}
                    <div>
                      <Label className="text-sm font-medium">환불 사유</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                        {selectedRefund.reason}
                      </div>
                    </div>

                    {/* 관리자 메모 */}
                    <div>
                      <Label htmlFor="adminMemo">관리자 메모 *</Label>
                      <Textarea
                        id="adminMemo"
                        placeholder="처리 사유나 메모를 입력하세요"
                        value={adminMemo}
                        onChange={(e) => setAdminMemo(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {/* 처리 버튼들 */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRefundAction('approve')}
                        disabled={isLoading || !adminMemo.trim()}
                        className="flex-1 gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        승인
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRefundAction('reject')}
                        disabled={isLoading || !adminMemo.trim()}
                        className="flex-1 gap-2 text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                        거부
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">처리할 환불 요청을 선택해주세요</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 미매칭 입금 탭 */}
        <TabsContent value="deposits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>미매칭 입금 목록</CardTitle>
            </CardHeader>
            <CardContent>
              {unmatchedDeposits.length > 0 ? (
                <div className="space-y-4">
                  {unmatchedDeposits.map((deposit) => (
                    <div
                      key={deposit.unmatched_deposit_id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">
                            {deposit.parsed_amount?.toLocaleString()}원
                          </p>
                          <p className="text-sm text-gray-600">
                            입금자: {deposit.parsed_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            시간: {new Date(deposit.parsed_time).toLocaleString('ko-KR')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          미매칭
                        </Badge>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded text-xs">
                        <strong>원본 메시지:</strong>
                        <p className="mt-1 text-gray-600">{deposit.raw_message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">미매칭 입금이 없습니다</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 수동 충전 탭 */}
        <TabsContent value="manual-charge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                관리자 수동 충전
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* 충전 대상 선택 */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">충전 대상</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="single_user"
                        checked={manualChargeForm.target_type === 'single_user'}
                        onChange={(e) => setManualChargeForm(prev => ({ 
                          ...prev, 
                          target_type: e.target.value as 'single_user',
                          nickname: ''
                        }))}
                        className="w-4 h-4"
                      />
                      <span>개별 사용자</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="all_users"
                        checked={manualChargeForm.target_type === 'all_users'}
                        onChange={(e) => setManualChargeForm(prev => ({ 
                          ...prev, 
                          target_type: e.target.value as 'all_users',
                          nickname: ''
                        }))}
                        className="w-4 h-4"
                      />
                      <span className="text-red-600 font-medium">전체 사용자</span>
                    </label>
                  </div>
                </div>

                {/* 닉네임 입력 (개별 사용자일 때만) */}
                {manualChargeForm.target_type === 'single_user' && (
                  <div className="space-y-2 relative">
                    <Label htmlFor="nickname">사용자 닉네임</Label>
                    <div className="relative">
                      <Input
                        id="nickname"
                        value={manualChargeForm.nickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        onFocus={() => {
                          if (searchResults.length > 0) {
                            setShowSearchResults(true);
                          }
                        }}
                        onBlur={() => {
                          // 약간의 지연을 두어 클릭 이벤트가 먼저 처리되도록 함
                          setTimeout(() => setShowSearchResults(false), 200);
                        }}
                        placeholder="충전할 사용자의 닉네임을 입력하세요"
                        disabled={isCharging}
                        autoComplete="off"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* 검색 결과 드롭다운 */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((user, index) => (
                          <div
                            key={user.user_id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleUserSelect(user)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{user.nickname}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                              <div className="text-xs text-gray-400">
                                {user.user_status === 'active' ? '활성' : user.user_status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 검색 결과 없음 */}
                    {showSearchResults && searchResults.length === 0 && manualChargeForm.nickname.length > 0 && !isSearching && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        <div className="px-4 py-3 text-center text-gray-500 text-sm">
                          "{manualChargeForm.nickname}" 닉네임을 가진 사용자를 찾을 수 없습니다
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 충전 금액 */}
                <div className="space-y-2">
                  <Label htmlFor="amount">충전 금액</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={manualChargeForm.amount}
                    onChange={(e) => setManualChargeForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="충전할 금액을 입력하세요"
                    disabled={isCharging}
                    min="1"
                    max="1000000"
                  />
                </div>

                {/* 환불 가능 여부 */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_refundable"
                    checked={manualChargeForm.is_refundable}
                    onChange={(e) => setManualChargeForm(prev => ({ ...prev, is_refundable: e.target.checked }))}
                    disabled={isCharging}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="is_refundable" className="cursor-pointer">
                    환불 가능한 충전 (체크 해제 시 이벤트성 충전으로 환불 불가)
                  </Label>
                </div>

                {/* 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description">충전 설명 (선택사항)</Label>
                  <Textarea
                    id="description"
                    value={manualChargeForm.description}
                    onChange={(e) => setManualChargeForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="충전 사유나 설명을 입력하세요 (예: 이벤트 보상, 서비스 보상 등)"
                    disabled={isCharging}
                    rows={3}
                  />
                </div>

                {/* 경고 메시지 */}
                {manualChargeForm.target_type === 'all_users' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>주의:</strong> 전체 사용자에게 충전됩니다. 신중하게 검토 후 실행해주세요.
                    </AlertDescription>
                  </Alert>
                )}

                {/* 충전 실행 버튼 */}
                <Button
                  onClick={handleManualCharge}
                  disabled={isCharging || !manualChargeForm.amount || 
                    (manualChargeForm.target_type === 'single_user' && !manualChargeForm.nickname.trim())}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isCharging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      충전 중...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      충전 실행
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 충전 결과 */}
          {chargeResult && (
            <Card>
              <CardHeader>
                <CardTitle>충전 결과</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">총 대상자</p>
                      <p className="text-xl font-bold text-blue-600">{chargeResult.total_users}명</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">성공</p>
                      <p className="text-xl font-bold text-green-600">{chargeResult.success_count}명</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-gray-600">실패</p>
                      <p className="text-xl font-bold text-red-600">{chargeResult.failed_count}명</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">총 충전액</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(chargeResult.total_amount)}</p>
                    </div>
                  </div>

                  {/* 상세 결과 */}
                  {chargeResult.results && chargeResult.results.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">상세 결과</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {chargeResult.results.map((result: any, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded border ${
                              result.success 
                                ? 'border-green-200 bg-green-50' 
                                : 'border-red-200 bg-red-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{result.nickname}</span>
                              <div className="flex items-center gap-2">
                                <span>{formatCurrency(result.amount)}</span>
                                {result.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                              </div>
                            </div>
                            {!result.success && result.error_message && (
                              <p className="text-sm text-red-600 mt-1">{result.error_message}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 시스템 관리 탭 */}
        <TabsContent value="system" className="space-y-6">
          {cleanupStatus && (
            <div className="space-y-6">
              {/* 정리 상태 카드들 */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className={cleanupStatus.rate_limit_logs.cleanup_needed ? 'border-red-200' : 'border-green-200'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      레이트 리미팅 로그
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-2">
                      {cleanupStatus.rate_limit_logs.total_count.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      만료: {cleanupStatus.rate_limit_logs.expired_count.toLocaleString()}
                    </p>
                    {cleanupStatus.rate_limit_logs.cleanup_needed && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        정리 필요
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className={cleanupStatus.expired_deposits.cleanup_needed ? 'border-red-200' : 'border-green-200'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      만료된 입금요청
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-2">
                      {cleanupStatus.expired_deposits.total_count.toLocaleString()}
                    </p>
                    {cleanupStatus.expired_deposits.cleanup_needed && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        정리 필요
                      </Badge>
                    )}
                  </CardContent>
                </Card>

                <Card className={cleanupStatus.old_unmatched_deposits.cleanup_needed ? 'border-red-200' : 'border-green-200'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      오래된 미매칭 입금
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold mb-2">
                      {cleanupStatus.old_unmatched_deposits.total_count.toLocaleString()}
                    </p>
                    {cleanupStatus.old_unmatched_deposits.cleanup_needed && (
                      <Badge variant="outline" className="text-red-600 border-red-600">
                        정리 필요
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 정리 실행 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    시스템 정리 실행
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      마지막 정리: {formatDistanceToNow(new Date(cleanupStatus.last_cleanup), { locale: ko, addSuffix: true })}
                    </p>
                    
                    <div className="grid md:grid-cols-4 gap-3">
                      <Button
                        onClick={() => handleCleanup('rate_limit')}
                        disabled={isCleanupRunning}
                        variant="outline"
                        className="gap-2"
                      >
                        <Database className="h-4 w-4" />
                        로그 정리
                      </Button>
                      
                      <Button
                        onClick={() => handleCleanup('deposits')}
                        disabled={isCleanupRunning}
                        variant="outline"
                        className="gap-2"
                      >
                        <Clock className="h-4 w-4" />
                        입금요청 정리
                      </Button>
                      
                      <Button
                        onClick={() => handleCleanup('unmatched')}
                        disabled={isCleanupRunning}
                        variant="outline"
                        className="gap-2"
                      >
                        <AlertTriangle className="h-4 w-4" />
                        미매칭 정리
                      </Button>
                      
                      <Button
                        onClick={() => handleCleanup('all')}
                        disabled={isCleanupRunning}
                        className="gap-2"
                      >
                        {isCleanupRunning ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        전체 정리
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}