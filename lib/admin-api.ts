// lib/admin-api.ts
import { api } from './api';

// 관리자 전용 API 타입 (새로운 환불 시스템)
export interface AdminRefundRequest {
  refund_request_id: number;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  refund_amount: number;
  contact: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at?: string;
  processed_at?: string;
  admin_memo?: string;
  user_info?: {
    nickname: string;
    email: string;
  };
}

export interface RefundRequestUpdate {
  admin_memo: string;
}

export interface UnmatchedDeposit {
  unmatched_deposit_id: number;
  parsed_amount: number;
  parsed_name: string;
  parsed_time: string;
  status: 'unmatched' | 'matched' | 'ignored';
  matched_user_id?: string;
  created_at: string;
  matched_at?: string;
  expires_at: string;
  raw_message: string;
}

export interface SystemStatistics {
  total_users: number;
  total_charged: number;
  total_used: number;
  total_refunded: number;
  pending_refunds: number;
  unmatched_deposits: number;
  active_deposits: number;
  today_stats: {
    new_charges: number;
    new_usages: number;
    new_refunds: number;
  };
}

export interface CleanupStatus {
  rate_limit_logs: {
    total_count: number;
    expired_count: number;
    cleanup_needed: boolean;
  };
  expired_deposits: {
    total_count: number;
    cleanup_needed: boolean;
  };
  old_unmatched_deposits: {
    total_count: number;
    cleanup_needed: boolean;
  };
  last_cleanup: string;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  details: {
    rate_limit_logs_deleted: number;
    expired_deposits_deleted: number;
    old_unmatched_deposits_deleted: number;
  };
  execution_time: number;
}

export interface ManualChargeRequest {
  target_type: 'all_users' | 'single_user';
  nickname?: string;
  amount: number;
  is_refundable: boolean;
  description?: string;
}

export interface ManualChargeResult {
  user_id: string;
  nickname: string;
  amount: number;
  is_refundable: boolean;
  charge_history_id: number;
  success: boolean;
  error_message?: string;
}

export interface ManualChargeResponse {
  total_users: number;
  success_count: number;
  failed_count: number;
  total_amount: number;
  results: ManualChargeResult[];
}

export interface AdminUser {
  user_id: string;
  nickname: string;
  email: string;
  user_status: string;
  created_at: string;
}

// 관리자 API 클라이언트
export const adminApi = {
  // 환불 관리
  async getRefundRequests(
    params: {
      status_filter?: 'pending' | 'approved' | 'rejected' | 'completed';
      page?: number;
      size?: number;
    },
    token: string
  ): Promise<{
    refund_history: AdminRefundRequest[];
    pagination: {
      page: number;
      size: number;
      total: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.status_filter) searchParams.set('status_filter', params.status_filter);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());
    
    const url = `/api/v1/admin/refund/requests${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return api(url, 'GET', undefined, token);
  },

  async approveRefund(
    refundRequestId: number,
    data: RefundRequestUpdate,
    token: string
  ): Promise<AdminRefundRequest> {
    return api(`/api/v1/admin/refund/${refundRequestId}/approve`, 'POST', data, token);
  },

  async rejectRefund(
    refundRequestId: number,
    data: RefundRequestUpdate,
    token: string
  ): Promise<AdminRefundRequest> {
    return api(`/api/v1/admin/refund/${refundRequestId}/reject`, 'POST', data, token);
  },

  // 미매칭 입금 관리
  async getUnmatchedDeposits(
    params: {
      status?: 'unmatched' | 'matched' | 'ignored';
      page?: number;
      size?: number;
    },
    token: string
  ): Promise<{
    success: boolean;
    data: {
      unmatched_deposits: UnmatchedDeposit[];
      pagination: {
        page: number;
        size: number;
        total: number;
      };
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());
    
    const url = `/api/v1/admin/unmatched-deposits${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return api(url, 'GET', undefined, token);
  },

  // 시스템 관리
  async getCleanupStatus(token: string): Promise<CleanupStatus> {
    const response = await api('/api/v1/admin/cleanup/status', 'GET', undefined, token);
    return response.data;
  },

  async runCleanup(
    params: {
      cleanup_type?: 'all' | 'rate_limit' | 'deposits' | 'unmatched';
      parallel?: boolean;
    },
    token: string
  ): Promise<CleanupResult> {
    const searchParams = new URLSearchParams();
    if (params.cleanup_type) searchParams.set('cleanup_type', params.cleanup_type);
    if (params.parallel !== undefined) searchParams.set('parallel', params.parallel.toString());
    
    const url = `/api/v1/admin/cleanup${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return api(url, 'POST', undefined, token);
  },

  async getStatistics(token: string): Promise<SystemStatistics> {
    const response = await api('/api/v1/admin/statistics', 'GET', undefined, token);
    return response.data;
  },

  // 수동 충전
  async manualCharge(
    data: ManualChargeRequest,
    token: string
  ): Promise<ManualChargeResponse> {
    return api('/api/v1/admin/manual-charge', 'POST', data, token);
  },

  async getUserList(
    params: {
      page?: number;
      size?: number;
      search_nickname?: string;
    },
    token: string
  ): Promise<{
    users: AdminUser[];
    pagination: {
      page: number;
      size: number;
      total: number;
    };
  }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());
    if (params.search_nickname) searchParams.set('search_nickname', params.search_nickname);
    
    const url = `/api/v1/admin/users${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    return api(url, 'GET', undefined, token);
  },
};