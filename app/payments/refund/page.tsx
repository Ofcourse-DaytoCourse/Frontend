// app/payments/refund/page.tsx
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
import { paymentsApi } from "@/lib/payments-api";
import { TokenStorage } from "@/lib/storage";
import { RefundRequest, ChargeHistory, RefundStatus } from "@/types/refund";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function RefundPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // 탭 상태
  const [currentTab, setCurrentTab] = useState<'request' | 'history'>('request');
  
  // 환불 신청 상태
  const [chargeHistories, setChargeHistories] = useState<ChargeHistory[]>([]);
  const [selectedChargeId, setSelectedChargeId] = useState<number | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [maxRefundableAmount, setMaxRefundableAmount] = useState(0);
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [contact, setContact] = useState("");
  const [reason, setReason] = useState("");
  
  // 환불 내역 상태
  const [refundHistory, setRefundHistory] = useState<RefundRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<RefundStatus | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    total_pages: 0,
  });
  
  // 공통 상태
  const [isLoading, setIsLoading] = useState(false);

  // 충전 내역 로드
  useEffect(() => {
    loadChargeHistories();
  }, []);

  // 환불 내역 로드 (탭 변경 시)
  useEffect(() => {
    if (currentTab === 'history') {
      loadRefundHistory();
    }
  }, [currentTab, statusFilter, pagination.page]);

  // 선택된 충전건의 환불 가능 금액 조회
  useEffect(() => {
    if (selectedChargeId) {
      loadRefundableAmount(selectedChargeId);
    }
  }, [selectedChargeId]);

  const loadChargeHistories = async () => {
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await paymentsApi.getRefundableHistories(token);

      setChargeHistories(response.refundable_items || []);
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "충전 내역을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const loadRefundableAmount = async (chargeHistoryId: number) => {
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await paymentsApi.getRefundableAmount(chargeHistoryId, token);
      setMaxRefundableAmount(response.refundable_amount);
      
      // 환불 가능 금액으로 기본값 설정
      setRefundAmount(response.refundable_amount.toString());
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "환불 가능 금액 조회에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const loadRefundHistory = async () => {
    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      const response = await paymentsApi.getRefundHistory(
        {
          page: pagination.page,
          size: pagination.size,
          status_filter: statusFilter || undefined,
        },
        token
      );

      setRefundHistory(response.refund_history || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total_items || 0,
        total_pages: Math.ceil((response.pagination?.total_items || 0) / (response.pagination?.size || 10)),
      }));
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "환불 내역을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefundRequest = async () => {
    if (!selectedChargeId) {
      toast({
        title: "선택 오류",
        description: "환불할 충전 내역을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!refundAmount || parseInt(refundAmount) <= 0) {
      toast({
        title: "입력 오류",
        description: "유효한 환불 금액을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(refundAmount) < 1000) {
      toast({
        title: "금액 오류",
        description: "최소 환불 금액은 1,000 day입니다.",
        variant: "destructive",
      });
      return;
    }

    if (parseInt(refundAmount) > maxRefundableAmount) {
      toast({
        title: "금액 오류",
        description: `환불 가능 금액(${maxRefundableAmount.toLocaleString()} day)을 초과할 수 없습니다.`,
        variant: "destructive",
      });
      return;
    }

    if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
      toast({
        title: "입력 오류",
        description: "은행 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!contact.trim()) {
      toast({
        title: "입력 오류",
        description: "연락처를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      toast({
        title: "입력 오류",
        description: "환불 사유를 최소 10자 이상 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = TokenStorage.get();
      if (!token) throw new Error('인증 토큰이 없습니다.');

      await paymentsApi.createRefundRequest({
        charge_history_id: selectedChargeId,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        refund_amount: parseInt(refundAmount),
        contact: contact.trim(),
        reason: reason.trim(),
      }, token);

      toast({
        title: "환불 신청 완료",
        description: "환불 신청이 접수되었습니다. 관리자 검토 후 처리됩니다.",
      });

      // 폼 초기화
      setSelectedChargeId(null);
      setRefundAmount("");
      setMaxRefundableAmount(0);
      setBankInfo({ bankName: "", accountNumber: "", accountHolder: "" });
      setContact("");
      setReason("");

      // 환불 내역 탭으로 이동
      setCurrentTab('history');
      loadRefundHistory();

    } catch (error: any) {
      let errorMessage = "환불 신청에 실패했습니다.";
      
      if (error.message?.includes('429')) {
        errorMessage = "환불 신청 제한에 걸렸습니다. 1시간에 3번만 신청 가능합니다.";
      } else if (error.message?.includes('409')) {
        errorMessage = "이미 진행 중인 환불 요청이 있습니다.";
      }

      toast({
        title: "환불 신청 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: RefundStatus) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "대기중" },
      approved: { color: "bg-blue-100 text-blue-800", label: "승인됨" },
      rejected: { color: "bg-red-100 text-red-800", label: "거부됨" },
      completed: { color: "bg-green-100 text-green-800", label: "완료됨" },
    };

    const config = statusConfig[status];
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: RefundStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/payments/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">환불 관리</h1>
          <p className="text-gray-600">day 환불 신청 및 내역을 관리하세요</p>
        </div>

        {/* 탭 UI */}
        <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'request' | 'history')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">환불 신청</TabsTrigger>
            <TabsTrigger value="history">환불 내역</TabsTrigger>
          </TabsList>

          {/* 환불 신청 탭 */}
          <TabsContent value="request" className="space-y-6">
            {/* 레이트 리미팅 안내 */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                환불 신청은 1시간에 3번까지 가능합니다. 신중하게 신청해주세요.
              </AlertDescription>
            </Alert>

            {/* 충전 내역 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  환불할 충전 내역 선택
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chargeHistories.length > 0 ? (
                  <div className="space-y-3">
                    {chargeHistories.map((history) => (
                      <div
                        key={history.charge_history_id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedChargeId === history.charge_history_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedChargeId(history.charge_history_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {history.amount?.toLocaleString() || '0'} day 충전
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(history.created_at).toLocaleDateString('ko-KR')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {history.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              환불됨: {history.refunded_amount?.toLocaleString() || '0'} day
                            </Badge>
                            <p className="text-sm text-green-600 mt-1">
                              환불가능: {((history.amount || 0) - (history.refunded_amount || 0)).toLocaleString()} day
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">환불 가능한 충전 내역이 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 환불 신청 폼 */}
            {selectedChargeId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    환불 신청 정보
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 환불 금액 */}
                  <div className="space-y-2">
                    <Label htmlFor="refundAmount">환불 금액 *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="refundAmount"
                        type="number"
                        placeholder="환불 받을 금액을 입력하세요"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        max={maxRefundableAmount}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      최소 환불 금액: 1,000 day / 최대 환불 가능 금액: {maxRefundableAmount.toLocaleString()} day
                    </p>
                  </div>

                  {/* 은행 정보 */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">은행명 *</Label>
                      <Select value={bankInfo.bankName} onValueChange={(value) => 
                        setBankInfo(prev => ({ ...prev, bankName: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="은행 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="국민은행">국민은행</SelectItem>
                          <SelectItem value="신한은행">신한은행</SelectItem>
                          <SelectItem value="우리은행">우리은행</SelectItem>
                          <SelectItem value="하나은행">하나은행</SelectItem>
                          <SelectItem value="기업은행">기업은행</SelectItem>
                          <SelectItem value="농협은행">농협은행</SelectItem>
                          <SelectItem value="카카오뱅크">카카오뱅크</SelectItem>
                          <SelectItem value="토스뱅크">토스뱅크</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">계좌번호 *</Label>
                      <Input
                        id="accountNumber"
                        placeholder="계좌번호 입력"
                        value={bankInfo.accountNumber}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, accountNumber: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountHolder">예금주 *</Label>
                      <Input
                        id="accountHolder"
                        placeholder="예금주명 입력"
                        value={bankInfo.accountHolder}
                        onChange={(e) => setBankInfo(prev => ({ ...prev, accountHolder: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* 연락처 */}
                  <div className="space-y-2">
                    <Label htmlFor="contact">연락처 *</Label>
                    <Input
                      id="contact"
                      placeholder="환불 관련 연락받을 전화번호"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>

                  {/* 환불 사유 */}
                  <div className="space-y-2">
                    <Label htmlFor="reason">환불 사유 * (최소 10자)</Label>
                    <Textarea
                      id="reason"
                      placeholder="환불 사유를 상세히 입력해주세요 (최소 10자, 예: 서비스 불만족으로 인한 환불 요청)"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-gray-500">
                      현재 {reason.length}자 / 최소 10자 필요
                    </p>
                  </div>

                  {/* 신청 버튼 */}
                  <Button
                    onClick={handleRefundRequest}
                    disabled={isLoading}
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
                        <RefreshCw className="h-4 w-4" />
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
            {/* 필터 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Label>상태 필터:</Label>
                  <Select value={statusFilter || 'all'} onValueChange={(value) => 
                    setStatusFilter(value === 'all' ? null : value as RefundStatus)
                  }>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="pending">대기중</SelectItem>
                      <SelectItem value="approved">승인됨</SelectItem>
                      <SelectItem value="rejected">거부됨</SelectItem>
                      <SelectItem value="completed">완료됨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 환불 내역 리스트 */}
            <Card>
              <CardHeader>
                <CardTitle>환불 신청 내역</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">불러오는 중...</p>
                  </div>
                ) : refundHistory && refundHistory.length > 0 ? (
                  <div className="space-y-4">
                    {refundHistory.map((refund) => (
                      <div
                        key={refund.refund_request_id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(refund.status)}
                              <span className="font-medium">
                                {refund.refund_amount.toLocaleString()} day 환불
                              </span>
                              {getStatusBadge(refund.status)}
                            </div>
                            <p className="text-sm text-gray-600">
                              신청일: {new Date(refund.created_at).toLocaleDateString('ko-KR')}
                            </p>
                            {refund.processed_at && (
                              <p className="text-sm text-gray-600">
                                처리일: {new Date(refund.processed_at).toLocaleDateString('ko-KR')}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{refund.bank_name}</p>
                            <p>{refund.account_number}</p>
                            <p>{refund.account_holder}</p>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>사유:</strong> {refund.reason}
                        </div>

                        {refund.admin_memo && (
                          <div className="bg-gray-50 p-3 rounded text-sm">
                            <strong>관리자 메모:</strong> {refund.admin_memo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <RefreshCw className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">환불 신청 내역이 없습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}