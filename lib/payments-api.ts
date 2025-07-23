// lib/payments-api.ts
import { api } from './api';

// 결제 관련 API 요청/응답 타입
export interface DepositGenerateRequest {
  bank_name?: string;
  account_number?: string;
}

export interface DepositGenerateResponse {
  deposit_request_id: number;
  deposit_name: string;
  amount?: number;
  bank_name: string;
  account_number: string;
  expires_at: string;
  created_at: string;
}

export interface BalanceDeductRequest {
  amount: number;
  service_type: 'course_generation' | 'premium_feature' | 'chat_service' | 'ai_search' | 'other';
  service_id?: string;
  description?: string;
}

export interface BalanceSummaryResponse {
  user_id: string;
  total_balance: number;
  refundable_balance: number;
  non_refundable_balance: number;
  total_charged: number;
  total_used: number;
  total_refunded: number;
}

export interface PaymentHistoryResponse {
  charge_histories: Array<{
    charge_history_id: number;
    amount: number;
    source_type: string;
    description: string;
    created_at: string;
    is_refundable: boolean;
    refund_status: string;
  }>;
  usage_histories: Array<{
    usage_history_id: number;
    amount: number;
    service_type: string;
    description: string;
    created_at: string;
  }>;
  current_balance: BalanceSummaryResponse;
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

export interface RefundableAmountResponse {
  charge_history_id: number;
  original_amount: number;
  refunded_amount: number;
  refundable_amount: number;
  is_refundable: boolean;
  has_pending_refund: boolean;
}

export interface RefundRequestCreate {
  charge_history_id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  refund_amount: number;
  contact: string;
  reason: string;
}

export interface RefundRequestResponse {
  refund_request_id: number;
  charge_history_id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  refund_amount: number;
  contact: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  processed_at?: string;
  admin_memo?: string;
}

export interface RefundHistoryResponse {
  refund_requests: RefundRequestResponse[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}

// 결제 API 클라이언트
export const paymentsApi = {
  // 잔액 관련
  async getBalanceSummary(token: string): Promise<BalanceSummaryResponse> {
    const response = await api('/api/v1/payments/history', 'GET', undefined, token);
    return response.user_balance;
  },

  async getPaymentHistory(
    params: {
      page?: number;
      size?: number;
      history_type?: 'charge' | 'usage';
    },
    token: string
  ): Promise<PaymentHistoryResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());
    if (params.history_type) searchParams.set('history_type', params.history_type);
    
    const url = `/api/v1/payments/history${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return api(url, 'GET', undefined, token);
  },

  // 환불 가능한 충전 내역 조회
  async getRefundableHistories(token: string) {
    return api('/api/v1/payments/refundable-histories', 'GET', undefined, token);
  },

  // 충전 관련
  async generateDepositName(
    data: DepositGenerateRequest,
    token: string
  ): Promise<DepositGenerateResponse> {
    return api('/api/v1/payments/deposit/generate', 'POST', data, token);
  },

  // 잔액 차감
  async deductBalance(
    data: BalanceDeductRequest,
    token: string
  ): Promise<{ success: boolean; message: string; remaining_balance: number }> {
    return api('/api/v1/payments/deduct', 'POST', data, token);
  },

  // 환불 관련
  async getRefundableAmount(
    chargeHistoryId: number,
    token: string
  ): Promise<RefundableAmountResponse> {
    return api(`/api/v1/payments/refundable/${chargeHistoryId}`, 'GET', undefined, token);
  },

  async createRefundRequest(
    data: RefundRequestCreate,
    token: string
  ): Promise<RefundRequestResponse> {
    return api('/api/v1/payments/refund/request', 'POST', data, token);
  },

  async getRefundHistory(
    params: {
      page?: number;
      size?: number;
      status_filter?: 'pending' | 'approved' | 'rejected' | 'completed';
    },
    token: string
  ): Promise<RefundHistoryResponse> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());
    if (params.status_filter) searchParams.set('status_filter', params.status_filter);
    
    const url = `/api/v1/payments/refund/history${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return api(url, 'GET', undefined, token);
  },
};

// SMS 관련 API (입금자명 오류 처리)
export interface ManualMatchRequest {
  actual_deposit_name: string;
  deposit_amount: number;
  deposit_time: string; // ISO 8601 format
}

export interface ManualMatchResponse {
  success: boolean;
  message: string;
  matched_deposit_id?: number;
  charge_history_id?: number;
  charged_amount?: number;
}

export const smsApi = {
  async manualMatch(
    data: ManualMatchRequest,
    token: string
  ): Promise<ManualMatchResponse> {
    return api('/api/v1/sms/manual-match', 'POST', data, token);
  },
  
  async simpleMatch(
    data: { actual_deposit_name: string; deposit_amount: number },
    token: string
  ): Promise<{ success: boolean; message: string; charged_amount?: number }> {
    return api('/api/v1/sms/simple-match', 'POST', data, token);
  },
};