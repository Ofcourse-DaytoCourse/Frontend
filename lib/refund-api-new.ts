// lib/refund-api-new.ts
// 새로운 환불 시스템 API 클라이언트

import { api } from './api';

// ================================================================
// 1. 환불 가능 금액 조회
// ================================================================

export interface RefundAvailableResponse {
  user_id: string;
  refundable_amount: number;
  total_balance: number;
  can_request_refund: boolean;
  message: string;
}

export const getRefundAvailable = (token: string): Promise<{
  success: boolean;
  data: RefundAvailableResponse;
}> =>
  api("/api/v1/payments/refund/available", "GET", undefined, token);

// ================================================================
// 2. 환불 신청
// ================================================================

export interface RefundRequestCreateNew {
  bank_name: string;
  account_number: string;
  account_holder: string;
  refund_amount: number;
  contact: string;
  reason: string;
}

export interface RefundRequestResponseNew {
  refund_request_id: number;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  refund_amount: number;
  contact: string;
  reason: string;
  status: string;
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  admin_memo?: string;
}

export const createRefundRequest = (
  request: RefundRequestCreateNew,
  token: string
): Promise<{
  success: boolean;
  message: string;
  data: {
    refund_request_id: number;
    refund_amount: number;
    status: string;
    created_at: string;
  };
}> =>
  api("/api/v1/payments/refund/request", "POST", request, token);

// ================================================================
// 3. 환불 내역 조회
// ================================================================

export const getRefundHistory = (
  params: {
    page?: number;
    size?: number;
    status_filter?: string;
  },
  token: string
): Promise<{
  success: boolean;
  data: {
    refund_history: RefundRequestResponseNew[];
    pagination: {
      page: number;
      size: number;
      total: number;
    };
  };
}> => {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.size) searchParams.set('size', params.size.toString());
  if (params.status_filter) searchParams.set('status_filter', params.status_filter);
  
  const url = `/api/v1/payments/refund/history${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  return api(url, "GET", undefined, token);
};