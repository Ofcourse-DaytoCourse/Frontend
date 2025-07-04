"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SaveCoursePage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const courseContent = `🌟 추천 코스:
1. 카페에서 브런치 - 2시간
2. 공원 산책 - 1시간  
3. 영화 관람 - 2시간
4. 맛집에서 저녁식사 - 1.5시간

총 소요시간: 약 6.5시간
예상 비용: 8만원-12만원`

  const handleSave = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    // 실제로는 API 호출 시 description도 함께 전송
    console.log({ title, description, courseContent })
    setTimeout(() => {
      setIsSaving(false)
      alert("코스가 저장되었습니다!")
      window.location.href = "/list"
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/course" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">코스 저장하기</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                코스 정보 입력
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">저장할 코스 제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 서울 실내 데이트 코스"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">코스 설명</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="이 코스에 대한 간단한 설명을 작성해주세요"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label>추천된 코스 내용</Label>
                <Textarea value={courseContent} readOnly className="min-h-[200px] bg-gray-50" />
              </div>

              <Button
                onClick={handleSave}
                disabled={!title.trim() || isSaving}
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                {isSaving ? "저장중..." : "저장하기"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
