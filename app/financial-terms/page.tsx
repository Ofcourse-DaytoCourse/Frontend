"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function FinancialTermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">전자금융거래 이용약관</h1>
        <p className="text-gray-600">최종 업데이트: 2024년 7월 26일</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>제1조 (목적)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 약관은 [서비스명] (이하 "회사")이 제공하는 전자금융거래 서비스를 이용자가 이용함에 있어 회사와 이용자 사이의 전자금융거래에 관한 기본적인 사항을 정함을 목적으로 합니다.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제2조 (용어의 정의)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. "전자금융거래"라 함은 회사가 전자적 장치를 통하여 제공하는 금융상품 및 서비스를 이용자가 전자적 장치를 통하여 이용하는 거래를 말합니다.</p>
              <p>2. "전자적 장치"라 함은 전자금융거래정보를 전자적 방법으로 전송하거나 처리하는데 이용되는 장치를 말하며, 현금자동지급기, 자동입출금기, 지급용단말기, 컴퓨터, 전화기 그 밖에 전자적 방법으로 금융상품이나 서비스의 제공이 가능한 장치를 말합니다.</p>
              <p>3. "접근매체"라 함은 전자금융거래에 있어서 거래지시를 하거나 이용자 및 거래내용의 진실성과 정확성을 확보하기 위하여 사용되는 수단 또는 정보로서 전자식 카드 및 이에 준하는 전자적 정보, 계좌번호 및 비밀번호 등 전자금융거래법 시행령 제2조 제10호에서 정하는 것을 말합니다.</p>
              <p>4. "거래지시"라 함은 이용자가 전자금융거래계약에 따라 회사에 대하여 전자금융거래의 처리를 지시하는 것을 말합니다.</p>
              <p>5. "오류"라 함은 이용자의 고의 또는 과실 없이 전자금융거래가 전자금융거래계약 또는 이용자의 거래지시에 따라 이행되지 아니한 경우를 말합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제3조 (약관의 명시 및 변경)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 이용자가 전자금융거래 서비스를 이용하기 전에 이 약관을 게시하고 이용자가 이 약관의 중요한 내용을 확인할 수 있도록 합니다.</p>
              <p>2. 회사는 이용자의 요청이 있는 경우 전자문서의 전송방식에 의하여 본 약관의 사본을 이용자에게 교부합니다.</p>
              <p>3. 회사는 약관의 규제에 관한 법률, 전자금융거래법, 전자상거래 등에서의 소비자보호에 관한 법률 등 관련 법령에 위배되지 않는 범위에서 이 약관을 변경할 수 있습니다.</p>
              <p>4. 회사가 약관을 변경하는 때에는 그 시행일 1월 전에 변경되는 약관을 회사가 제공하는 전자금융거래 서비스 이용 초기화면 및 회사의 홈페이지에 게시함으로써 공지합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제4조 (접근매체의 선정과 사용 및 관리)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 전자금융거래 서비스 제공시 접근매체를 선정하여 이용자의 신원, 권한 및 거래지시의 내용 등을 확인할 수 있습니다.</p>
              <p>2. 이용자는 접근매체를 제3자에게 대여하거나 사용을 위임하거나 양도 또는 담보목적으로 제공할 수 없습니다.</p>
              <p>3. 이용자는 자신의 접근매체를 제3자에게 누설 또는 노출하거나 방치하여서는 안되며, 접근매체의 도용이나 위조 또는 변조를 방지하기 위하여 충분한 주의를 기울여야 합니다.</p>
              <p>4. 회사는 이용자로부터 접근매체의 분실이나 도난 등의 통지를 받은 때에는 그 때부터 제3자가 그 접근매체를 사용함으로 인하여 이용자에게 발생한 손해를 배상할 책임을 집니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제5조 (거래내용의 확인)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 이용자와 미리 약정한 전자적 방법을 통하여 이용자의 거래내용(이용자의 거래지시, 이용내역, 대가의 지급내역 등을 말합니다)을 확인할 수 있도록 하며 이용자의 요청이 있는 경우에는 요청받은 날로부터 2주 이내에 모사전송 등의 방법으로 거래내용에 관한 서면을 교부합니다.</p>
              <p>2. 회사가 이용자에게 제공하는 거래내용 확인서면 또는 거래내용 확인에 필요한 전자적 정보의 보존기간은 해당 전자금융거래가 종료된 날로부터 5년으로 합니다. 다만, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관계법령에 의하여 거래기록을 더 오랜 기간 보존하여야 하는 경우에는 해당 법령이 정한 기간까지 보존합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제6조 (오류정정 등)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 이용자는 전자금융거래 서비스를 이용함에 있어 오류가 있음을 안 때에는 회사에 대하여 그 정정을 요구할 수 있습니다.</p>
              <p>2. 회사는 전항의 요구를 받은 날로부터 2주 이내에 오류의 내용을 조사하여 처리결과를 이용자에게 알려드리며, 오류가 확인되는 경우에는 그 결과를 즉시 정정하여 처리합니다.</p>
              <p>3. 회사는 오류의 조사가 완료되기 전까지 이용자가 요구한 금액의 출금을 잠정적으로 보류할 수 있으며, 오류가 확인된 경우에는 표준약관에서 정한 지급수단으로 당해 금액의 지급절차를 밟습니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제7조 (책임의 귀속)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 접근매체의 위조나 변조로 발생한 사고로 인하여 이용자에게 손해가 발생한 경우에는 그 손해를 배상할 책임을 집니다. 다만, 다음 각 호의 어느 하나에 해당하는 경우 회사는 배상책임이 없거나 그 책임이 경감됩니다.</p>
              <p>• 이용자가 접근매체를 제3자에게 대여하거나 사용을 위임하거나 양도 또는 담보목적으로 제공한 경우</p>
              <p>• 제3자가 권한 없이 이용자의 접근매체를 이용하여 전자금융거래를 할 수 있음을 알았거나 알 수 있었음에도 불구하고 이용자가 접근매체를 누설 또는 노출하거나 방치한 경우</p>
              <p>• 이용자가 회사로부터 접근매체의 분실이나 도난 등의 통지를 받고도 상당한 기간이 지나도록 신고를 하지 아니한 경우</p>
              <p>• 이용자가 제4조 제2항 및 제3항을 위반한 경우</p>
              <p>2. 회사는 전자금융거래를 위한 전자적 장치나 '정보통신망 이용촉진 및 정보보호 등에 관한 법률'에 따른 정보통신망에 침입하여 거짓이나 그 밖의 부정한 방법으로 처리된 전자금융거래로 발생한 사고로 인하여 이용자에게 그 손해가 발생한 경우에는 그 손해를 배상할 책임을 집니다.</p>
              <p>3. 회사는 이용자로부터 접근매체의 분실이나 도난 등의 통지를 받은 때에는 그 때부터 제3자가 그 접근매체를 사용함으로 인하여 이용자에게 발생한 손해를 배상할 책임을 집니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제8조 (거래기록의 생성 및 보존)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 이용자가 전자금융거래의 내용을 추적하거나 검색할 수 있는 충분한 거래기록을 생성하여 보존합니다.</p>
              <p>2. 전항의 거래기록의 보존기간은 해당 전자금융거래가 완료된 날로부터 5년으로 합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제9조 (전자금융거래 수수료)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 이용자에게 전자금융거래 서비스를 제공하고 수수료를 받을 수 있습니다.</p>
              <p>2. 전항의 수수료는 회사와 이용자간에 합의에 의하여 정하되, 그 수수료는 전자금융거래 서비스를 이용할 때 이용자에게 명시합니다.</p>
              <p>3. 회사는 수수료를 변경하는 경우에는 변경일 1개월 전까지 홈페이지 등에 공지합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제10조 (분쟁처리 및 분쟁조정)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 이용자는 전자금융거래 서비스를 이용하면서 발생한 분쟁사항에 대하여 회사에 조정을 신청할 수 있습니다.</p>
              <p>2. 이용자가 회사에 분쟁처리를 신청한 경우 회사는 15일 이내에 이에 대한 조사 또는 처리결과를 이용자에게 안내합니다.</p>
              <p>3. 이용자는 「금융감독기구의 설치 등에 관한 법률」 제51조의 규정에 따라 금융감독원장에게 조정을 신청하거나 「소비자기본법」 제60조의 규정에 따라 소비자분쟁조정위원회에 조정을 신청할 수 있습니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제11조 (손해배상)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사가 전자금융거래와 관련하여 이용자에게 손해를 끼친 때에는 그 손해를 배상할 책임을 집니다. 다만, 불가항력, 이용자의 귀책사유 등 회사의 고의 또는 과실이 없는 경우에는 그러하지 아니합니다.</p>
              <p>2. 회사는 전자금융거래에 관한 분쟁이 발생한 경우에는 이용자의 주장에 상당한 이유가 있다고 인정되는 경우에는 손해배상 등 필요한 조치를 취합니다.</p>
              <p>3. 회사는 이용자가 전자금융거래를 이용하여 얻은 정보, 자료, 사실의 정확성, 신뢰성 등 그 내용에 관하여는 책임을 지지 않습니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>제12조 (회사의 안전성 확보 의무)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 leading-relaxed space-y-2">
              <p>1. 회사는 전자금융거래의 안전성과 신뢰성을 확보할 수 있도록 전자금융거래의 종류별로 전자적 전송이나 처리를 위한 인력, 시설, 전자적 장치 등의 정보기술부문 및 전자금융업무에 관하여 금융감독원장이 정하는 기준을 준수합니다.</p>
              <p>2. 회사는 전자금융거래에서 발생할 수 있는 사고를 방지하기 위하여 보험 또는 공제에 가입하거나 준비금을 적립하는 등 필요한 조치를 취합니다.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>부칙</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              이 약관은 2024년 7월 26일부터 시행됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}