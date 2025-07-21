// types/balance.ts
export interface BalanceInfo {
  user_id: string;
  total_balance: number;
  refundable_balance: number;
  non_refundable_balance: number;
  total_charged: number;
  total_used: number;
  total_refunded: number;
}

export interface Transaction {
  id: number;
  type: 'charge' | 'usage';
  amount: number;
  description: string;
  created_at: string;
  status?: string;
}

export interface BalanceDashboardState {
  balance: BalanceInfo | null;
  recentTransactions: Transaction[];
  isLoading: boolean;
  lastUpdateTime: Date | null;
  autoRefreshInterval: number; // seconds
}

export interface DepositErrorState {
  actualDepositName: string;
  depositAmount: number;
  depositTime: Date;
  isSearching: boolean;
  matchResult: MatchResult | null;
}

export interface MatchResult {
  success: boolean;
  message: string;
  matched_deposit_id?: number;
  charge_history_id?: number;
  charged_amount?: number;
}