// app/payments/guide/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, CreditCard, RefreshCw, Shield } from "lucide-react";

export default function PaymentGuidePage() {
  const router = useRouter();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [refundPolicyAccepted, setRefundPolicyAccepted] = useState(false);

  const isChargeReady = termsAccepted && privacyAccepted && refundPolicyAccepted;

  const handleChargeClick = () => {
    if (!isChargeReady) return;
    router.push("/payments/deposit-info");
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">서비스 day 충전</h1>
        <p className="text-gray-600">안전하고 간편한 충전 서비스를 이용해보세요</p>
      </div>

      {/* 서비스 설명 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            day 사용법
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">💰 충전 방법</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 고유 입금자명과 계좌번호 발급</li>
                <li>• 1시간 내 해당 계좌로 입금</li>
                <li>• 자동으로 day 충전 완료</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 사용 방법</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 서비스 이용 시 자동으로 차감</li>
                <li>• 실시간 잔액 확인 가능</li>
                <li>• 사용 내역 상세 조회</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 충전 프로세스 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            충전 프로세스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p className="text-sm font-medium">충전 요청</p>
              <p className="text-xs text-gray-500">금액 입력</p>
            </div>
            <div className="hidden md:block text-gray-300">→</div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <p className="text-sm font-medium">입금자명 생성</p>
              <p className="text-xs text-gray-500">입금자명 생성</p>
            </div>
            <div className="hidden md:block text-gray-300">→</div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <p className="text-sm font-medium">입금 완료</p>
              <p className="text-xs text-gray-500">1시간 내</p>
            </div>
            <div className="hidden md:block text-gray-300">→</div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">✓</span>
              </div>
              <p className="text-sm font-medium">충전 완료</p>
              <p className="text-xs text-gray-500">자동 처리</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 환불 정책 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            환불 정책
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✅ 환불 가능</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 사용하지 않은 day</li>
                <li>• 부분 환불 지원</li>
                <li>• 관리자 승인 후 처리</li>
                <li>• 영업일 기준 7일 이내 처리</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">❌ 환불 불가</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 이미 사용된 day</li>
                <li>• 보너스로 지급된 day</li>
                <li>• 30일 경과된 충전건</li>
                <li>• 회원 탈퇴시 모든 day도 함께 삭제</li>
                <li>• 부정 사용이 확인된 경우</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 주의사항 */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>중요 안내:</strong> 
          입금자명을 정확히 입력해주세요. 잘못 입력 시 수동 처리가 필요하며 시간이 지연될 수 있습니다.
          충전 요청 후 1시간 내 입금하지 않으면 요청이 만료됩니다.
          개인정보는 전자금융거래법에 따라 5년간 보관되며, 서비스 탈퇴 시 지체없이 파기됩니다.
        </AlertDescription>
      </Alert>

      {/* 약관 동의 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm">
                <a href="/terms" className="text-blue-600 hover:underline">이용약관</a> 및 <a href="/financial-terms" className="text-blue-600 hover:underline">전자금융거래 이용약관</a>에 동의합니다 (필수)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="privacy" 
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
              />
              <label htmlFor="privacy" className="text-sm">
                <a href="/privacy" className="text-blue-600 hover:underline">개인정보처리방침</a>에 동의합니다 (필수)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="refund-policy" 
                checked={refundPolicyAccepted}
                onCheckedChange={(checked) => setRefundPolicyAccepted(checked as boolean)}
              />
              <label htmlFor="refund-policy" className="text-sm">
                <a href="/refund-policy" className="text-blue-600 hover:underline">환불 정책</a>에 동의합니다 (필수)
              </label>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              분쟁 발생 시 금융감독원 금융분쟁조정위원회(1332) 또는 소비자분쟁조정위원회(1372)에 조정을 신청할 수 있습니다.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 충전하기 버튼 */}
      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleChargeClick}
          disabled={!isChargeReady}
          size="lg"
          className="px-12 py-3 text-lg"
        >
          {isChargeReady ? "충전하기" : "약관에 동의해주세요"}
        </Button>
      </div>
    </div>
  );
}