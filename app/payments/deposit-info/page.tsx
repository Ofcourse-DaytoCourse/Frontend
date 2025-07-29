// app/payments/deposit-info/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Copy, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDepositInfo } from "@/hooks/use-deposit-info";

interface DepositInfo {
  depositName: string;
  accountNumber: string;
  bankName: string;
  amount?: number;
  expiresAt: string;
}

export default function DepositInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { depositInfo: apiDepositInfo, isLoading, error, generateDepositInfo, copyToClipboard } = useDepositInfo(10000);
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const hasInitialized = useRef(false);

  // 페이지 진입 시 입금자명 자동 생성 (한 번만 실행)
  useEffect(() => {
    if (hasInitialized.current) return;
    
    const initializeDepositInfo = async () => {
      hasInitialized.current = true;
      try {
        const response = await generateDepositInfo();
        if (response) {
          const depositData: DepositInfo = {
            depositName: response.deposit_name,
            accountNumber: response.account_number,
            bankName: response.bank_name,
            amount: response.amount,
            expiresAt: response.expires_at,
          };
          setDepositInfo(depositData);
        }
      } catch (error) {
        hasInitialized.current = false; // 실패 시 다시 시도할 수 있도록
        router.push("/payments/guide");
      }
    };

    initializeDepositInfo();
    
    // 새로고침 방지
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "페이지를 새로고침하면 입금자명이 재생성됩니다. 계속하시겠습니까?";
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [router]); // generateDepositInfo 제거

  // 타이머 설정
  useEffect(() => {
    if (!depositInfo) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(depositInfo.expiresAt).getTime();
      const difference = expiry - now;
      
      // 디버깅
      console.log('DEBUG Frontend:', {
        now: new Date(now).toISOString(),
        expiry: new Date(expiry).toISOString(),
        expiresAt: depositInfo.expiresAt,
        difference: difference,
        differenceMinutes: Math.floor(difference / (1000 * 60))
      });

      if (difference > 0) {
        setTimeRemaining(difference);
      } else {
        setTimeRemaining(0);
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [depositInfo]);


  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleGoToDashboard = () => {
    router.push("/payments/dashboard");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">입금 정보를 생성하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error || !depositInfo) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-20">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">{error || "입금 정보 생성에 실패했습니다."}</p>
          <Button onClick={() => router.push("/payments/guide")}>
            다시 시도하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">입금 정보</h1>
        <p className="text-gray-600">아래 정보로 입금을 완료해주세요</p>
      </div>

      {/* 타이머 카드 */}
      <Card className={`border-2 ${isExpired ? 'border-red-500' : 'border-orange-500'}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <Clock className={`h-6 w-6 ${isExpired ? 'text-red-500' : 'text-orange-500'}`} />
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">남은 시간</p>
              <p className={`text-2xl font-bold ${isExpired ? 'text-red-500' : 'text-orange-500'}`}>
                {isExpired ? "만료됨" : formatTime(timeRemaining)}
              </p>
            </div>
          </div>
          {isExpired && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                입금 시간이 만료되었습니다. 새로운 충전 요청을 진행해주세요.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 입금 정보 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            입금 정보
            <Badge variant={isExpired ? "destructive" : "default"}>
              {isExpired ? "만료됨" : "활성"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">입금 안내</p>
            <p className="text-lg font-medium text-blue-600">
              원하는 금액만큼 입금하시면 자동으로 day가 충전됩니다
            </p>
          </div>

          {/* 은행 정보 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">은행명</p>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{depositInfo.bankName}</span>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">계좌번호</p>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium font-mono">{depositInfo.accountNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(depositInfo.accountNumber, "계좌번호")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 입금자명 */}
          <div className="space-y-2">
            <p className="text-sm text-gray-600">입금자명 (중요!)</p>
            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="font-bold text-lg text-yellow-800">{depositInfo.depositName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(depositInfo.depositName, "입금자명")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주의사항 */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>입금 시 주의사항:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• 입금자명을 <strong>"{depositInfo.depositName}"</strong>로 정확히 입력해주세요</li>
            <li>• 원하는 금액만큼 입금하시면 됩니다</li>
            <li>• {formatTime(timeRemaining)} 내에 입금을 완료해주세요</li>
            <li>• 입금자명이 다르면 자동 처리되지 않습니다</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* 버튼 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button 
          variant="outline" 
          onClick={() => router.push("/payments/guide")}
          disabled={!isExpired}
        >
          다시 충전하기
        </Button>
        <Button 
          onClick={handleGoToDashboard}
          size="lg"
          className="px-8"
        >
          입금 확인하러 가기
        </Button>
      </div>

      {/* 입금 완료 확인 안내 */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 mb-1">입금 완료 후</p>
              <p className="text-sm text-green-700">
                입금이 완료되면 보통 5-10분 내에 자동으로 day가 충전됩니다. 
                "입금 확인하러 가기" 버튼을 눌러 잔액을 확인해보세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}