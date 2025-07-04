"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SigninPage() {
  const [nickname, setNickname] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<string | null>(null)
  const { completeRegistration } = useAuth()

  const handleNicknameCheck = async () => {
    setIsChecking(true)
    // 실제로는 API 호출
    setTimeout(() => {
      setCheckResult(nickname ? "사용 가능한 닉네임입니다." : "닉네임을 입력해주세요.")
      setIsChecking(false)
    }, 1000)
  }

  const handleComplete = () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력해주세요.")
      return
    }

    completeRegistration({ nickname })
    alert("회원가입이 완료되었습니다!")
    window.location.href = "/course"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-pink-600">회원가입</CardTitle>
          <CardDescription>닉네임을 설정해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
            <span className="text-gray-500">회원가입 이미지</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">사용할 닉네임</Label>
            <div className="flex gap-2">
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
              />
              <Button onClick={handleNicknameCheck} disabled={isChecking} variant="outline">
                {isChecking ? "확인중..." : "중복 확인"}
              </Button>
            </div>
          </div>

          {checkResult && (
            <Alert>
              <AlertDescription>{checkResult}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleComplete} className="w-full bg-pink-600 hover:bg-pink-700">
            가입 완료
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
