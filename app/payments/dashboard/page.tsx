// app/payments/dashboard/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wallet, 
  History, 
  AlertTriangle, 
  RefreshCw, 
  CreditCard,
  ArrowUp,
  ArrowDown,
  Clock
} from "lucide-react";
import { useBalanceData } from "@/hooks/use-balance-data";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

export default function PaymentDashboardPage() {
  const router = useRouter();
  const {
    balance,
    recentTransactions,
    isLoading,
    lastUpdateTime,
    error,
    refreshBalance,
  } = useBalanceData(false, 0); // 자동 새로고침 비활성화

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDepositError = () => {
    router.push("/payments/deposit-error");
  };

  const handleRefund = () => {
    router.push("/payments/refund-new");
  };

  const handleNewCharge = () => {
    router.push("/payments/guide");
  };

  const formatCurrency = (amount: number) => {
    console.log('DEBUG formatCurrency amount:', amount, typeof amount);
    if (amount === undefined || amount === null) {
      return "0원";
    }
    return amount.toLocaleString() + "원";
  };

  const getTransactionIcon = (type: 'charge' | 'usage') => {
    return type === 'charge' ? (
      <ArrowUp className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionColor = (type: 'charge' | 'usage') => {
    return type === 'charge' ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading && !balance) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">잔액 정보를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={handleRefresh}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">잔액 대시보드</h1>
          <p className="text-gray-600">
            현재 잔액과 거래 내역을 확인하세요
            {lastUpdateTime && (
              <span className="text-sm text-gray-500 ml-2">
                (마지막 업데이트: {formatDistanceToNow(lastUpdateTime, { locale: ko, addSuffix: true })})
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 잔액 카드들 */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* 총 잔액 */}
        <Card className="border-2 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Wallet className="h-5 w-5" />
              총 잔액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {balance ? formatCurrency(balance.total_balance) : "0원"}
            </p>
            <p className="text-sm text-gray-600">
              사용 가능한 크레딧
            </p>
          </CardContent>
        </Card>

        {/* 환불 가능 잔액 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CreditCard className="h-5 w-5" />
              환불 가능
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 mb-2">
              {balance ? formatCurrency(balance.refundable_balance) : "0원"}
            </p>
            <p className="text-sm text-gray-600">
              환불 신청 가능한 금액
            </p>
          </CardContent>
        </Card>

        {/* 환불 불가 잔액 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-gray-600">
              <Clock className="h-5 w-5" />
              환불 불가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600 mb-2">
              {balance ? formatCurrency(balance.non_refundable_balance) : "0원"}
            </p>
            <p className="text-sm text-gray-600">
              보너스 및 사용된 크레딧
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 통계 카드 */}
      {balance && (
        <Card>
          <CardHeader>
            <CardTitle>누적 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">총 충전 금액</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatCurrency(balance.total_charged)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">총 사용 금액</p>
                <p className="text-xl font-bold text-red-600">
                  {formatCurrency(balance.total_used)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">총 환불 금액</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(balance.total_refunded)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 최근 거래 내역 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            거래 내역
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentTransactions.map((transaction) => (
                <div
                  key={`${transaction.type}-${transaction.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'charge' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    {transaction.status && (
                      <Badge variant="outline" className="text-xs">
                        {transaction.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">거래 내역이 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 액션 버튼들 */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button onClick={handleNewCharge} className="gap-2">
          <CreditCard className="h-4 w-4" />
          추가 충전
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleDepositError}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          입금자명 잘못 입력
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleRefund}
          className="gap-2"
          disabled={!balance || balance.refundable_balance <= 0}
        >
          <RefreshCw className="h-4 w-4" />
          환불하기
        </Button>

      </div>

      {/* 자동 새로고침 안내 */}
      <Alert>
        <RefreshCw className="h-4 w-4" />
        <AlertDescription>
          입금 완료 확인을 위해 30초마다 자동으로 잔액이 업데이트됩니다. 
          입금 후 5-10분 내에 잔액에 반영됩니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}