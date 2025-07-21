// app/payments/refund-new/page.tsx
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
  ArrowLeft,
  RefreshCw, 
  DollarSign, 
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getRefundAvailable, 
  createRefundRequest, 
  getRefundHistory,
  RefundRequestCreateNew,
  RefundRequestResponseNew,
  RefundAvailableResponse
} from "@/lib/refund-api-new";
import { TokenStorage } from "@/lib/storage";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행",
  "기업은행", "SC제일은행", "씨티은행", "대구은행", "부산은행",
  "경남은행", "광주은행", "전북은행", "제주은행", "케이뱅크",
  "카카오뱅크", "토스뱅크"
];

export default function RefundNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // 탭 상태
  const [currentTab, setCurrentTab] = useState<'request' | 'history'>('request');
  
  // 환불 가능 금액 정보
  const [refundAvailable, setRefundAvailable] = useState<RefundAvailableResponse | null>(null);
  
  // 환불 신청 폼
  const [refundForm, setRefundForm] = useState<RefundRequestCreateNew>({
    bank_name: "",
    account_number: "",
    account_holder: "",
    refund_amount: 0,
    contact: "",
    reason: ""
  });
  
  // 환불 내역
  const [refundHistory, setRefundHistory] = useState<RefundRequestResponseNew[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0
  });
  
  // 공통 상태
  const [isLoading, setIsLoading] = useState(false);
  
  // 초기 로드
  useEffect(() => {
    loadRefundAvailable();
  }, []);
  
  // 탭 변경 시 환불 내역 로드
  useEffect(() => {
    if (currentTab === 'history') {
      loadRefundHistory();
    }
  }, [currentTab, statusFilter, pagination.page]);

  // ================================================================
  // API 호출 함수들
  // ================================================================

  const loadRefundAvailable = async () => {
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await getRefundAvailable(token);
      setRefundAvailable(response.data);
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "환불 가능 금액을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const loadRefundHistory = async () => {
    try {
      setIsLoading(true);
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await getRefundHistory({
        page: pagination.page,
        size: pagination.size,
        status_filter: statusFilter === "all" ? undefined : statusFilter
      }, token);

      setRefundHistory(response.data.refund_history);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: error.message || "환불 내역을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundSubmit = async () => {
    try {
      if (!refundAvailable?.can_request_refund) {
        toast({
          title: "환불 신청 불가",
          description: refundAvailable?.message || "현재 환불 신청이 불가능합니다.",
          variant: "destructive",
        });
        return;
      }

      if (refundForm.refund_amount > refundAvailable.refundable_amount) {
        toast({
          title: "금액 초과",
          description: `환불 가능 금액(${refundAvailable.refundable_amount.toLocaleString()}원)을 초과했습니다.`,
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      await createRefundRequest(refundForm, token);

      toast({
        title: "환불 신청 완료",
        description: "환불 신청이 성공적으로 접수되었습니다.",
      });

      // 폼 초기화 및 데이터 새로고침
      setRefundForm({
        bank_name: "",
        account_number: "",
        account_holder: "",
        refund_amount: 0,
        contact: "",
        reason: ""
      });
      
      await loadRefundAvailable();
      setCurrentTab('history');

    } catch (error: any) {
      toast({
        title: "환불 신청 실패",
        description: error.message || "환불 신청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ================================================================
  // 유틸리티 함수들
  // ================================================================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">대기중</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">승인됨</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">거부됨</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">완료됨</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <div>
          <h1 className="text-2xl font-bold">크레딧 환불</h1>
          <p className="text-gray-600">환불 신청 및 내역을 관리하세요</p>
        </div>
      </div>

      {/* 탭 UI */}
      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="request">환불 신청</TabsTrigger>
          <TabsTrigger value="history">환불 내역</TabsTrigger>
        </TabsList>

        {/* 환불 신청 탭 */}
        <TabsContent value="request" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              환불 신청은 사용자당 1개씩만 가능합니다. 신중하게 신청해주세요.
            </AlertDescription>
          </Alert>

          {/* 환불 가능 금액 표시 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                환불 가능 금액
              </CardTitle>
            </CardHeader>
            <CardContent>
              {refundAvailable ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>환불 가능 금액:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {refundAvailable.refundable_amount.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>전체 잔액:</span>
                    <span>{refundAvailable.total_balance.toLocaleString()}원</span>
                  </div>
                  {!refundAvailable.can_request_refund && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {refundAvailable.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">환불 가능 금액 조회 중...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 환불 신청 폼 */}
          {refundAvailable?.can_request_refund && (
            <Card>
              <CardHeader>
                <CardTitle>환불 신청 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 환불 금액 */}
                <div>
                  <Label htmlFor="refundAmount">환불 금액 *</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    value={refundForm.refund_amount || ''}
                    onChange={(e) => setRefundForm(prev => ({ 
                      ...prev, 
                      refund_amount: parseInt(e.target.value) || 0 
                    }))}
                    placeholder="환불받을 금액을 입력하세요"
                    min="1000"
                    max={refundAvailable.refundable_amount}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    최소 환불 금액: 1,000원 / 최대 환불 가능 금액: {refundAvailable.refundable_amount.toLocaleString()}원
                  </p>
                </div>

                {/* 계좌 정보 - 한 줄로 배치 */}
                <div>
                  <Label className="text-base font-medium mb-3 block">계좌 정보 *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 은행명 */}
                    <div>
                      <Label htmlFor="bankName" className="text-sm text-gray-600">은행명</Label>
                      <Select 
                        value={refundForm.bank_name} 
                        onValueChange={(value) => setRefundForm(prev => ({ ...prev, bank_name: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="은행 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          {BANKS.map((bank) => (
                            <SelectItem key={bank} value={bank}>
                              {bank}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 계좌번호 */}
                    <div>
                      <Label htmlFor="accountNumber" className="text-sm text-gray-600">계좌번호</Label>
                      <Input
                        id="accountNumber"
                        value={refundForm.account_number}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, account_number: e.target.value }))}
                        placeholder="계좌번호 입력"
                      />
                    </div>

                    {/* 예금주 */}
                    <div>
                      <Label htmlFor="accountHolder" className="text-sm text-gray-600">예금주</Label>
                      <Input
                        id="accountHolder"
                        value={refundForm.account_holder}
                        onChange={(e) => setRefundForm(prev => ({ ...prev, account_holder: e.target.value }))}
                        placeholder="예금주명 입력"
                      />
                    </div>
                  </div>
                </div>

                {/* 연락처 */}
                <div>
                  <Label htmlFor="contact">연락처 *</Label>
                  <Input
                    id="contact"
                    value={refundForm.contact}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="환불 관련 연락받을 전화번호"
                  />
                </div>

                {/* 환불 사유 */}
                <div>
                  <Label htmlFor="reason">환불 사유 * (최소 10자)</Label>
                  <Textarea
                    id="reason"
                    value={refundForm.reason}
                    onChange={(e) => setRefundForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="환불 사유를 상세히 입력해주세요 (최소 10자, 예: 서비스 불만족으로 인한 환불 요청)"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    현재 {refundForm.reason.length}자 / 최소 10자 필요
                  </p>
                </div>

                {/* 환불 신청 버튼 */}
                <Button
                  onClick={handleRefundSubmit}
                  disabled={
                    isLoading || 
                    !refundForm.refund_amount || 
                    refundForm.refund_amount < 1000 ||
                    !refundForm.bank_name || 
                    !refundForm.account_number || 
                    !refundForm.account_holder || 
                    !refundForm.contact || 
                    refundForm.reason.length < 10
                  }
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      환불 신청 중...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      환불 신청하기
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 환불 내역 탭 */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">환불 내역</h3>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="전체" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">거부됨</SelectItem>
                  <SelectItem value="completed">완료됨</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={loadRefundHistory}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </div>

          {refundHistory.length > 0 ? (
            <div className="space-y-4">
              {refundHistory.map((request) => (
                <Card key={request.refund_request_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">
                          {request.refund_amount.toLocaleString()}원 환불
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.bank_name} {request.account_number}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(request.created_at), { locale: ko, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>사유:</strong> {request.reason}</p>
                      {request.admin_memo && (
                        <p><strong>관리자 메모:</strong> {request.admin_memo}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">환불 내역이 없습니다</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}