// types/payment-flow.ts
export interface PaymentFlowState {
  currentStep: 'guide' | 'deposit-info' | 'dashboard' | 'deposit-error' | 'refund';
  isLoading: boolean;
  error: string | null;
}

export interface ServiceGuideState {
  termsAccepted: boolean;
  privacyAccepted: boolean;
  isChargeReady: boolean;
}

export interface DepositInfoState {
  depositName: string;
  accountNumber: string;
  bankName: string;
  amount: number;
  expiresAt: Date;
  timeRemaining: number;
  isExpired: boolean;
  isLoading: boolean;
}