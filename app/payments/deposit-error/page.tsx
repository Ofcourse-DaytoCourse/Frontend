// app/payments/deposit-error/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smsApi } from "@/lib/payments-api";
import { TokenStorage } from "@/lib/storage";
import { MatchResult } from "@/types/balance";

export default function DepositErrorPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    actualDepositName: "",
    depositAmount: ""
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 입력이 변경되면 이전 결과 초기화
    if (hasSearched) {
      setMatchResult(null);
      setHasSearched(false);
    }
  };

  const validateForm = () => {
    if (!formData.actualDepositName.trim()) {
      toast({
        title: "입력 오류",
        description: "실제 입금자명을 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.depositAmount || parseInt(formData.depositAmount) <= 0) {
      toast({
        title: "입력 오류", 
        description: "유효한 입금 금액을 입력해주세요.",
        variant: "destructive",
      });
      return false;
    }


    return true;
  };

  const handleSearch = async () => {
    if (!validateForm()) return;

    setIsSearching(true);
    setMatchResult(null);

    try {
      const token = TokenStorage.get();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const requestData = {
        actual_deposit_name: formData.actualDepositName.trim(),
        deposit_amount: parseInt(formData.depositAmount)
      };

      const response = await smsApi.simpleMatch(requestData, token);
      
      setMatchResult(response);
      setHasSearched(true);

      if (response.success) {
        toast({
          title: "매칭 성공!",
          description: `${response.charged_amount?.toLocaleString()} day가 반영되었습니다.`,
        });
        
        // 3초 후 대시보드로 이동
        setTimeout(() => {
          router.push("/payments/dashboard");
        }, 3000);
      } else {
        toast({
          title: "매칭 실패",
          description: response.message || "일치하는 입금 내역을 찾을 수 없습니다.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('수동 매칭 실패:', error);
      
      const errorMessage = error.message || '매칭 처리 중 오류가 발생했습니다.';
      setMatchResult({
        success: false,
        message: errorMessage,
      });
      setHasSearched(true);

      toast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/payments/dashboard");
  };


  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={handleBackToDashboard}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          대시보드로 돌아가기
        </Button>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">입금자명 오류 신고</h1>
          <p className="text-gray-600">
            입금자명을 잘못 입력하셨나요? 실제 입금 정보를 입력해서 매칭해보세요.
          </p>
        </div>

        {/* 안내 사항 */}
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>안내:</strong> 입금 후 자동 충전되지 않았다면, 아래 정보를 정확히 입력해주세요. 
            시스템에서 일치하는 입금을 찾아 자동으로 day에 반영됩니다.
          </AlertDescription>
        </Alert>

        {/* 입력 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              실제 입금 정보 입력
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 실제 입금자명 */}
            <div className="space-y-2">
              <Label htmlFor="actualDepositName">실제 입금자명 *</Label>
              <Input
                id="actualDepositName"
                placeholder="실제로 입금할 때 사용한 이름을 입력하세요"
                value={formData.actualDepositName}
                onChange={(e) => handleInputChange("actualDepositName", e.target.value)}
                className="font-medium"
              />
              <p className="text-xs text-gray-500">
                은행 앱에서 이체할 때 입력한 이름을 정확히 입력해주세요
              </p>
            </div>

            {/* 입금 금액 */}
            <div className="space-y-2">
              <Label htmlFor="depositAmount">입금 금액 *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="depositAmount"
                  type="number"
                  placeholder="입금한 금액을 입력하세요"
                  value={formData.depositAmount}
                  onChange={(e) => handleInputChange("depositAmount", e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-500">
                실제 입금한 정확한 금액을 입력하세요 (day 단위)
              </p>
            </div>


            {/* 검색 버튼 */}
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full gap-2"
              size="lg"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  매칭 중...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  입금 내역 찾기
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 매칭 결과 */}
        {hasSearched && matchResult && (
          <Card className={`border-2 ${matchResult.success ? 'border-green-500' : 'border-red-500'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${matchResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {matchResult.success ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    매칭 성공!
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5" />
                    매칭 실패
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className={matchResult.success ? 'text-green-700' : 'text-red-700'}>
                  {matchResult.message}
                </p>

                {matchResult.success && matchResult.charged_amount && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-green-800 font-medium">충전된 금액:</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        +{matchResult.charged_amount.toLocaleString()} day
                      </Badge>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      잠시 후 대시보드로 이동합니다...
                    </p>
                  </div>
                )}

                {!matchResult.success && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-800 font-medium mb-2">다음 사항을 확인해주세요:</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• 입금자명이 정확한지 확인</li>
                      <li>• 입금 금액이 정확한지 확인</li>
                      <li>• 입금이 실제로 완료되었는지 확인</li>
                    </ul>
                    <p className="text-sm text-red-600 mt-3">
                      그래도 문제가 해결되지 않으면 고객센터로 문의해주세요.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 추가 도움말 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-medium text-blue-800 mb-3">💡 도움말</h3>
            <div className="space-y-2 text-sm text-blue-700">
              <p><strong>입금자명 확인 방법:</strong></p>
              <ul className="space-y-1 ml-4">
                <li>• 은행 앱 → 거래내역 → 최근 이체 확인</li>
                <li>• ATM 영수증 확인</li>
                <li>• 인터넷뱅킹 거래내역 확인</li>
              </ul>
              <p className="mt-3">
                <strong>주의:</strong> 입금자명은 대소문자, 띄어쓰기까지 정확히 일치해야 합니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}