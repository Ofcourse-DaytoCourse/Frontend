// types/admin.ts
export interface AdminDashboardState {
  pendingRefunds: AdminRefundRequest[];
  unmatchedDeposits: UnmatchedDeposit[];
  systemStats: SystemStatistics;
  cleanupStatus: CleanupStatus;
  isAuthenticated: boolean;
  sessionExpiry: Date | null;
  isLoading: boolean;
}

export interface AdminRefundRequest {
  refund_request_id: number;
  user_id: string;
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
  user_info?: {
    nickname: string;
    email: string;
  };
  charge_info?: {
    original_amount: number;
    created_at: string;
  };
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