import type React from "react"

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="">
      {" "}
      {/* 햄버거 버튼 공간 확보 */}
      {children}
    </div>
  )
}
