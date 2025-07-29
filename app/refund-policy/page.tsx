"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicyPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로가기
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">환불 정책</h1>
        <p className="text-gray-600">최종 업데이트: 2024년 7월 26일</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>제1조 (목적)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 환불정책은 [서비스명] (이하 "회사")이 제공하는 크레딧 충전 서비스와 관련된 환불 절차, 조건 및 기준을 명확히 하여 이용자의 권익을 보호하고 공정한 거래질서를 확립하는 것을 목적으로 합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제2조 (용어의 정의)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. "크레딧"이란 회사가 제공하는 서비스 이용을 위해 발행한 전자적 가치를 의미합니다.</p>
              <p>2. "충전"이란 이용자가 금전을 지급하고 크레딧을 구매하는 행위를 말합니다.</p>
              <p>3. "환불"이란 이용자의 요청에 따라 사용하지 않은 크레딧에 상응하는 금액을 이용자에게 반환하는 것을 말합니다.</p>
              <p>4. "사용한 크레딧"이란 서비스 이용을 통해 차감된 크레딧을 의미합니다.</p>
              <p>5. "미사용 크레딧"이란 충전 후 서비스에 사용되지 않고 잔여로 남아있는 크레딧을 의미합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제3조 (환불 가능 조건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>다음 조건을 모두 충족하는 경우에 한하여 환불이 가능합니다:</p>
              <p>1. <strong>미사용 크레딧에 한함</strong></p>
              <p>• 서비스에 사용되지 않은 크레딧만 환불 대상입니다.</p>
              <p>• 부분 환불이 가능하며, 사용한 크레딧을 제외한 잔여 크레딧에 대해서만 환불됩니다.</p>
              <p>2. <strong>충전 후 30일 이내 신청</strong></p>
              <p>• 크레딧 충전일로부터 30일 이내에 환불을 신청해야 합니다.</p>
              <p>• 30일 경과 후에는 환불이 불가능합니다.</p>
              <p>3. <strong>본인 확인 가능</strong></p>
              <p>• 충전을 진행한 본인임을 확인할 수 있어야 합니다.</p>
              <p>• 입금자명과 회원정보가 일치해야 합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제4조 (환불 불가 조건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>다음에 해당하는 경우에는 환불이 불가능합니다:</p>
              <p>1. <strong>이미 사용된 크레딧</strong></p>
              <p>• 서비스 이용을 통해 차감된 크레딧은 환불되지 않습니다.</p>
              <p>2. <strong>보너스 또는 프로모션으로 지급된 크레딧</strong></p>
              <p>• 회사에서 무료로 제공한 보너스 크레딧은 환불 대상이 아닙니다.</p>
              <p>• 이벤트나 프로모션을 통해 추가로 지급된 크레딧은 환불되지 않습니다.</p>
              <p>3. <strong>충전 후 30일 경과된 경우</strong></p>
              <p>• 충전일로부터 30일이 경과한 크레딧은 환불이 불가능합니다.</p>
              <p>4. <strong>부정 사용이 확인된 경우</strong></p>
              <p>• 약관 위반, 부정한 방법으로 크레딧을 취득한 경우</p>
              <p>• 타인의 결제수단을 무단으로 사용한 경우</p>
              <p>5. <strong>회원 탈퇴시</strong></p>
              <p>• 회원 탈퇴와 동시에 보유하고 있던 모든 크레딧은 자동으로 소멸되며 환불되지 않습니다.</p>
              <p>• 탈퇴 전 환불을 원하는 경우 탈퇴 이전에 환불 신청을 완료해야 합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제5조 (환불 신청 절차)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. <strong>환불 신청 방법</strong></p>
              <p>• 회사에서 제공하는 환불 신청 페이지를 통해 온라인으로 신청</p>
              <p>• 고객센터 이메일 또는 전화를 통한 신청</p>
              <p>2. <strong>필요 정보</strong></p>
              <p>• 회원 정보 (이름, 이메일, 휴대폰번호)</p>
              <p>• 환불 사유</p>
              <p>• 환불받을 계좌 정보 (예금주명, 은행명, 계좌번호)</p>
              <p>• 충전 관련 정보 (충전일시, 입금자명, 충전금액)</p>
              <p>3. <strong>신청 후 처리</strong></p>
              <p>• 환불 신청 접수 확인 알림</p>
              <p>• 관리자 검토 및 승인 절차</p>
              <p>• 환불 처리 결과 통보</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제6조 (환불 처리 기간 및 방법)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. <strong>처리 기간</strong></p>
              <p>• 환불 신청 접수일로부터 영업일 기준 7일 이내에 처리됩니다.</p>
              <p>• 추가 확인이 필요한 경우 최대 14일까지 소요될 수 있습니다.</p>
              <p>• 처리 지연 시 이용자에게 사전 안내합니다.</p>
              <p>2. <strong>환불 방법</strong></p>
              <p>• 이용자가 지정한 계좌로 직접 입금</p>
              <p>• 원칙적으로 충전 시 사용한 결제 수단으로 환불</p>
              <p>• 계좌 이체 수수료는 회사에서 부담합니다.</p>
              <p>3. <strong>환불 금액 계산</strong></p>
              <p>• 미사용 크레딧 × 크레딧 당 단가 = 환불 금액</p>
              <p>• 부가세가 포함된 경우 부가세 포함 금액으로 환불</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제7조 (환불 거부 및 이의제기)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. <strong>환불 거부 사유</strong></p>
              <p>회사는 다음의 경우 환불을 거부할 수 있으며, 그 사유를 이용자에게 통지합니다:</p>
              <p>• 제4조의 환불 불가 조건에 해당하는 경우</p>
              <p>• 신청 정보가 허위이거나 확인이 불가능한 경우</p>
              <p>• 부정한 방법으로 환불을 신청한 경우</p>
              <p>2. <strong>이의제기 절차</strong></p>
              <p>• 환불 거부 결정에 대해 이의가 있는 경우 통지받은 날로부터 30일 이내에 재심을 요청할 수 있습니다.</p>
              <p>• 재심 요청 시 추가 증빙자료를 제출할 수 있습니다.</p>
              <p>• 재심 결과는 요청일로부터 15일 이내에 통보됩니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제8조 (특별 환불 정책)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. <strong>서비스 장애 시 환불</strong></p>
              <p>• 회사의 시스템 장애로 인해 서비스를 이용하지 못한 경우</p>
              <p>• 장애 발생 기간 동안 사용된 크레딧에 대해 환불 또는 보상</p>
              <p>2. <strong>약관 변경으로 인한 환불</strong></p>
              <p>• 이용자에게 불리한 약관 변경 시 변경 거부 이용자에 대한 환불</p>
              <p>• 변경 시행일 이전까지 환불 신청 가능</p>
              <p>3. <strong>미성년자 환불</strong></p>
              <p>• 법정대리인의 동의 없이 미성년자가 충전한 경우</p>
              <p>• 법정대리인의 요청 시 전액 환불 가능</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제9조 (분쟁 해결)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 환불과 관련하여 분쟁이 발생한 경우 다음 기관에 조정을 신청할 수 있습니다:</p>
              <p>• 소비자분쟁조정위원회 (국번없이 1372)</p>
              <p>• 금융감독원 금융분쟁조정위원회 (국번없이 1332)</p>
              <p>• 개인정보보호위원회 개인정보 침해신고센터 (privacy.go.kr)</p>
              <p>2. 이 정책에 관한 분쟁의 관할법원은 서울중앙지방법원으로 합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제10조 (기타)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. <strong>정책 변경</strong></p>
              <p>• 이 환불정책의 변경 시 최소 7일 전에 공지합니다.</p>
              <p>• 변경된 정책은 공지 후 시행일부터 적용됩니다.</p>
              <p>2. <strong>고객지원</strong></p>
              <p>• 환불 관련 문의: [고객센터 이메일]</p>
              <p>• 고객센터 운영시간: 평일 09:00~18:00 (주말, 공휴일 제외)</p>
              <p>3. <strong>관련 법령 준수</strong></p>
              <p>• 이 정책은 전자상거래 등에서의 소비자보호에 관한 법률, 소비자기본법 등 관련 법령을 준수하여 운영됩니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>부칙</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 환불정책은 2024년 7월 26일부터 시행됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}