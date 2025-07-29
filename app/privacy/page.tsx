"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-gray-600">최종 업데이트: 2024년 7월 26일</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>제1조 (개인정보의 처리목적)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>[서비스명]은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
              <p><strong>1. 회원가입 및 관리</strong></p>
              <p>• 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리</p>
              <p>• 서비스 부정이용 방지, 각종 고지·통지, 고충처리 목적으로 개인정보를 처리합니다.</p>
              <p><strong>2. 재화 또는 서비스 제공</strong></p>
              <p>• 서비스 제공, 계약서·청구서 발송, 콘텐츠 제공, 맞춤서비스 제공</p>
              <p>• 본인인증, 요금결제·정산, 채권추심 목적으로 개인정보를 처리합니다.</p>
              <p><strong>3. 고충처리</strong></p>
              <p>• 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지</p>
              <p>• 처리결과 통보 목적으로 개인정보를 처리합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제2조 (개인정보의 처리 및 보유기간)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
              <p><strong>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</strong></p>
              <p>• 회원가입 및 관리: 회원탈퇴시까지. 다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료시까지</p>
              <p>  - 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료시까지</p>
              <p>  - 서비스 이용에 따른 채권·채무관계 잔존시에는 해당 채권·채무관계 정산시까지</p>
              <p>• 전자금융거래 기록: 전자금융거래법에 따라 5년간 보관</p>
              <p>• 표시·광고에 관한 기록: 전자상거래등에서의 소비자보호에 관한 법률에 따라 6개월</p>
              <p>• 계약 또는 청약철회 등에 관한 기록: 전자상거래등에서의 소비자보호에 관한 법률에 따라 5년</p>
              <p>• 대금결제 및 재화 등의 공급에 관한 기록: 전자상거래등에서의 소비자보호에 관한 법률에 따라 5년</p>
              <p>• 소비자의 불만 또는 분쟁처리에 관한 기록: 전자상거래등에서의 소비자보호에 관한 법률에 따라 3년</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제3조 (처리하는 개인정보의 항목)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
              <p><strong>1. 회원가입 및 관리</strong></p>
              <p>• 필수항목: 이메일, 비밀번호, 이름</p>
              <p>• 선택항목: 휴대전화번호</p>
              <p><strong>2. 인터넷 서비스 이용과정에서 아래 개인정보 항목이 자동으로 생성되어 수집될 수 있습니다.</strong></p>
              <p>• IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량 이용기록 등</p>
              <p><strong>3. 결제 서비스 이용시</strong></p>
              <p>• 은행명, 계좌번호, 입금자명 등 결제 관련 정보</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제4조 (개인정보의 제3자 제공)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 정보주체의 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
              <p>2. 회사는 다음과 같은 경우에 정보주체의 개인정보를 제3자에게 제공하고 있습니다.</p>
              <p>• 결제대행업체: 결제 처리를 위한 최소한의 정보 제공</p>
              <p>• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제5조 (개인정보처리의 위탁)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.</p>
              <p><strong>위탁업무 내용: 결제대행 서비스</strong></p>
              <p>• 위탁받는 자(수탁자): [결제대행업체명]</p>
              <p>• 위탁하는 업무의 내용: 전자결제 서비스 제공 및 이와 관련된 본인확인, 대금정산</p>
              <p>• 개인정보의 보유 및 이용기간: 전자금융거래법에 따라 5년</p>
              <p>2. 회사는 위탁계약 체결시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제6조 (정보주체의 권리·의무 및 그 행사방법)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
              <p>• 개인정보 처리정지 요구</p>
              <p>• 개인정보 열람요구</p>
              <p>• 개인정보 정정·삭제요구</p>
              <p>• 개인정보 처리정지 요구</p>
              <p>2. 제1항에 따른 권리 행사는 회사에 대해 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.</p>
              <p>3. 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우에는 회사는 정정 또는 삭제를 완료할 때까지 당해 개인정보를 이용하거나 제공하지 않습니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제7조 (개인정보의 파기)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
              <p>2. 정보주체로부터 동의받은 개인정보 보유기간이 경과하거나 처리목적이 달성되었음에도 불구하고 다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를 별도의 데이터베이스(DB)로 옮기거나 보관장소를 달리하여 보존합니다.</p>
              <p>3. 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
              <p>• 파기절차: 회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</p>
              <p>• 파기방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 로우레벨포맷(Low Level Format) 등의 방법을 이용하여 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제8조 (개인정보의 안전성 확보조치)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.</p>
              <p>1. 개인정보 취급 직원의 최소화 및 교육</p>
              <p>2. 개인정보에 대한 접근 제한</p>
              <p>3. 개인정보의 암호화</p>
              <p>4. 해킹 등에 대비한 기술적 대책</p>
              <p>5. 개인정보처리시스템 등의 접근권한 관리</p>
              <p>6. 접속기록의 보관 및 위변조 방지</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제9조 (개인정보 보호책임자)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
              <p><strong>개인정보 보호책임자</strong></p>
              <p>• 성명: [담당자명]</p>
              <p>• 연락처: [이메일주소], [전화번호]</p>
              <p>2. 정보주체께서는 회사의 서비스를 이용하시면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의하실 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제10조 (개인정보 처리방침 변경)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
              <p>2. 개인정보 침해신고센터(privacy.go.kr, 국번없이 182)</p>
              <p>3. 대검찰청 사이버범죄수사단(www.spo.go.kr, 국번없이 1301)</p>
              <p>4. 경찰청 사이버안전국(cyberbureau.police.go.kr, 국번없이 182)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>부칙</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 개인정보처리방침은 2024년 7월 26일부터 시행됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}