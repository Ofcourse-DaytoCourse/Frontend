import type { User } from '@/types/api';

// 로컬스토리지 키 상수 정의
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
  PENDING_SIGNUP: 'pending_signup'
} as const;

// 토큰 관련 함수들
export const TokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
};

// 사용자 정보 관련 함수들
export const UserStorage = {
  get: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userData) return null;
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  },
  
  set: (user: User): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
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