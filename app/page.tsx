"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bot, ArrowRight, MessageSquare, Star, Users, Sparkles, Clock, Target } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/contexts/auth-context"

const HeroSection = () => (
  <section className="relative bg-white py-20 sm:py-32">
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-12">
        {/* Main Heading */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
            나만의 데이트 코스,
            <br />
            <span className="text-primary-pink">AI가 다 짜줄게요</span>
          </h1>
          <p className="text-xl sm:text-2xl font-medium text-light-purple max-w-3xl mx-auto">
            감성은 살리고, 고민은 줄이고.
          </p>
          <p className="text-lg text-text-secondary leading-relaxed max-w-4xl mx-auto">
            내 연인, 내 상황, 내 취향에 딱 맞춘 데이트 추천.
            <br />
            <span className="font-semibold text-text-primary">지금 당장, AI 코스를 시작해보세요!</span>
          </p>
        </div>

        {/* Service Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-secondary-pink rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary-pink" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">AI 맞춤 추천</h3>
            <p className="text-text-secondary">MBTI, 취향, 예산까지 고려한 완벽한 코스 설계</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-soft-purple rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-light-purple" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">실시간 채팅</h3>
            <p className="text-text-secondary">AI와 대화하며 실시간으로 코스를 조정하고 완성</p>
          </div>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-secondary-pink rounded-2xl flex items-center justify-center mx-auto">
              <Target className="w-8 h-8 text-primary-pink" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">검증된 코스</h3>
            <p className="text-text-secondary">실제 커플들이 검증한 리얼 후기 기반 코스 마켓</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-primary-pink hover:bg-primary-pink/90 text-white rounded-full px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/course">
              AI 코스 추천 시작하기 <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-6 text-lg font-bold border-2 border-light-purple text-light-purple hover:bg-light-purple hover:text-white transition-all duration-300 bg-transparent"
          >
            <Link href="/community/courses">커뮤니티 코스 둘러보기</Link>
          </Button>
        </div>

      </div>
    </div>
  </section>
)

const FeaturesSection = () => {
  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary-pink" />,
      title: "AI 맞춤 추천",
      description: "MBTI, 취향, 예산까지 고려한 완벽한 코스 설계",
      bgColor: "bg-white",
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-light-purple" />,
      title: "실시간 채팅",
      description: "AI와 대화하며 실시간으로 코스를 조정하고 완성",
      bgColor: "bg-white",
    },
    {
      icon: <Users className="w-8 h-8 text-primary-pink" />,
      title: "커뮤니티 마켓",
      description: "실제 커플들이 검증한 리얼 후기 기반 코스 구매",
      bgColor: "bg-white",
    },
  ]

  return (
    <section id="features" className="py-20 sm:py-32 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">왜 DayToCourse일까요?</h2>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            복잡한 계획은 AI에게 맡기고, 소중한 순간에만 집중하세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ${feature.bgColor}`}
            >
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 bg-secondary-pink rounded-2xl flex items-center justify-center shadow-md">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

const TrustSection = () => {
  const testimonials = [
    {
      text: "성수동 데이트 코스 추천받았는데 진짜 완벽했어요! 연인이 너무 좋아했어요 💕",
      author: "김민지",
      rating: 5,
    },
    {
      text: "MBTI까지 고려해서 추천해주니까 우리 둘 다 만족하는 코스가 나왔어요",
      author: "박준호",
      rating: 5,
    },
    {
      text: "비 오는 날 실내 데이트 코스 찾고 있었는데 AI가 딱 맞는 걸 추천해줬어요!",
      author: "이서연",
      rating: 5,
    },
  ]

  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">실제 사용자들의 후기</h2>
          <p className="text-lg text-text-secondary">커플들이 직접 경험한 솔직한 후기</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border border-gray-200 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-text-primary mb-4 leading-relaxed">"{testimonial.text}"</p>
                <p className="text-sm font-semibold text-text-secondary">- {testimonial.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

const CommunityHighlightSection = () => {
  const [popularCourses, setPopularCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularCourses = async () => {
      try {
        // API에서 인기 코스 3개 가져오기 (구매순 정렬)
        const { getSharedCourses } = await import('@/lib/api')
        const response = await getSharedCourses({ 
          skip: 0, 
          limit: 3, 
          sort_by: 'purchase_count_desc' 
        })
        console.log('인기 코스 API 응답:', response)
        console.log('첫 번째 코스 데이터:', response.courses?.[0])
        setPopularCourses(response.courses || [])
      } catch (error) {
        console.error('인기 코스 로딩 실패:', error)
        setPopularCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchPopularCourses()
  }, [])

  return (
    <section className="py-20 sm:py-32 bg-gray-50">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">인기 커뮤니티 코스</h2>
          <p className="text-lg text-text-secondary">실제 커플들이 검증한 베스트 데이트 코스</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="border border-gray-200 shadow-lg bg-white">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="flex gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : popularCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularCourses.map((course, index) => (
              <Card
                key={index}
                className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white cursor-pointer"
                onClick={() => window.location.href = `/community/courses/${course.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-primary-pink">{course.price} day</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold">
                        {course.overall_rating ? course.overall_rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-xs text-text-secondary">
                        ({course.buyer_review_count || 0}개)
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-3">{course.title}</h3>
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-3">
                    <span>구매 {course.purchase_count || 0}회</span>
                    <span>작성자: {course.creator_name || '익명'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {course.categories?.map((category, tagIndex) => (
                      <span key={tagIndex} className="px-3 py-1 bg-secondary-pink text-primary-pink text-sm rounded-full">
                        #{category}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">아직 인기 코스가 없습니다.</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-6 text-lg font-bold border-2 border-primary-pink text-primary-pink hover:bg-primary-pink hover:text-white transition-all duration-300 bg-transparent"
          >
            <Link href="/community/courses">
              더 많은 코스 둘러보기 <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

const FinalCTASection = () => {
  const { user } = useAuth()
  
  // 로그인된 사용자는 CTA 섹션 표시하지 않음
  if (user) {
    return null
  }
  
  return (
    <section className="py-20 sm:py-32 bg-white">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-primary-pink">지금 바로 시작해보세요!</h2>
        <p className="text-xl mb-10 text-text-secondary">
          회원가입하고 3,000 day를 받아보세요!
          <br />
          AI가 여러분만의 특별한 코스를 설계해드립니다.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-primary-pink text-white hover:bg-primary-pink/90 rounded-full px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Link href="/login">
              회원가입하고 3,000 day 받기 <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-sm text-text-secondary/75">회원가입 즉시 3,000 day 지급 • 카카오 간편 로그인</p>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-white">
      <HeroSection />
      <FeaturesSection />
      <TrustSection />
      <CommunityHighlightSection />
      <FinalCTASection />
    </div>
  )
}