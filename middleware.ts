import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // AuthGuard가 모든 라우팅 처리를 담당하도록 middleware 비활성화
  return NextResponse.next();
}

export const config = {
  matcher: [],
};