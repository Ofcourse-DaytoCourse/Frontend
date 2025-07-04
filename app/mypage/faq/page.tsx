import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Mail } from "lucide-react"

export default function FAQPage() {
  const developerEmail = "sknplaydata@gmail.com"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/mypage" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">FAQ</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              개발자 문의
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">궁금한 점이나 문의사항이 있으시면 아래 이메일로 연락해주세요.</p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="font-mono text-lg">{developerEmail}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">빠른 시일 내에 답변드리겠습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
