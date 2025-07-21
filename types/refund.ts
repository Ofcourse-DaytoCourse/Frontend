// types/refund.ts
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface RefundRequest {
  refund_request_id: number;
  user_id: string;
  charge_history_id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  refund_amount: number;
  contact: string;
  reason: string;
  status: RefundStatus;
  created_at: string;
  processed_at?: string;
  admin_memo?: string;
}

export interface ChargeHistory {
  charge_history_id: number;
  amount: number;
  refunded_amount: number;
  is_refundable: boolean;
  source_type: string;
  description: string;
  created_at: string;
  refund_status: 'available' | 'partially_refunded' | 'fully_refunded' | 'unavailable';
}

export interface RefundableAmount {
  charge_history_id: number;
  original_amount: number;
  refunded_amount: number;
  refundable_amount: number;
  is_refundable: boolean;
  has_pending_refund: boolean;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface RefundManagerState {
  // 환불 신청 섹션
  selectedChargeId: number | null;
  refundAmount: number;
  maxRefundableAmount: number;
  bankInfo: BankInfo;
  contact: string;
  reason: string;
  
  // 환불 내역 섹션
  refundHistory: RefundRequest[];
  statusFilter: RefundStatus | null;
  
  // 공통
  isLoading: boolean;
  currentTab: 'request' | 'history';
  
  // 페이지네이션
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
}