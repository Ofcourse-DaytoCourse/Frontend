import type { User } from '@/types/api';
const TOKEN_KEY = "token";

// 로컬스토리지 키 상수 정의
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  PENDING_SIGNUP: 'pending_signup'
} as const;

// 토큰 관련 함수들
export const TokenStorage = {
  get: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  set: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },
  remove: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
};

// 사용자 정보 관련 함수들
export const UserStorage = {
  get: () => {
    if (typeof window === "undefined") return null;
    const user = sessionStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  set: (user: any) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("user", JSON.stringify(user));
  },
  
  remove: (): void => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("user");
  }
};

// 회원가입 대기 정보 관련 함수들
export const PendingSignupStorage = {
  get: (): any | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_SIGNUP);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },
  
  set: (data: any): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PENDING_SIGNUP, JSON.stringify(data));
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PENDING_SIGNUP);
  }
};

// 모든 인증 관련 데이터 제거
export const clearAuthStorage = (): void => {
  TokenStorage.remove();
  UserStorage.remove();
  PendingSignupStorage.remove();
};