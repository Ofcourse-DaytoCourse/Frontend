// hooks/use-balance-data.ts
import { useState, useEffect, useCallback } from 'react';
import { paymentsApi } from '@/lib/payments-api';
import { TokenStorage } from '@/lib/storage';
import { BalanceInfo, Transaction } from '@/types/balance';

export const useBalanceData = (autoRefresh = true, intervalSeconds = 30) => {
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBalanceData = useCallback(async () => {
    try {
      const token = TokenStorage.get();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      setError(null);
      
      // 잔액 정보와 거래 내역을 한 번에 조회 (전체 내역)
      const historyData = await paymentsApi.getPaymentHistory(
        { page: 1, size: 1000 },
        token
      );
      
      // 잔액 정보 설정
      setBalance(historyData.user_balance);

      // 충전/사용 내역을 합쳐서 최근 순으로 정렬
      const allTransactions: Transaction[] = [
        ...historyData.charge_histories.map(item => ({
          id: item.charge_history_id,
          type: 'charge' as const,
          amount: item.amount,
          description: item.description || 'day 충전',
          created_at: item.created_at,
          status: item.refund_status,
        })),
        ...historyData.usage_histories.map(item => ({
          id: item.usage_history_id,
          type: 'usage' as const,
          amount: item.amount,
          description: item.description || '서비스 이용',
          created_at: item.created_at,
        })),
      ];

      // 최근 순으로 정렬하고 5개만 선택
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setRecentTransactions(allTransactions.slice(0, 5));
      setLastUpdateTime(new Date());

    } catch (error: any) {
      console.error('잔액 데이터 조회 실패:', error);
      setError(error.message || '잔액 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    fetchBalanceData();
  }, [fetchBalanceData]);

  // 자동 새로고침 설정
  useEffect(() => {
    if (!autoRefresh || intervalSeconds <= 0) return;

    const interval = setInterval(fetchBalanceData, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, intervalSeconds, fetchBalanceData]);

  const refreshBalance = useCallback(() => {
    setIsLoading(true);
    return fetchBalanceData();
  }, [fetchBalanceData]);

  return {
    balance,
    recentTransactions,
    isLoading,
    lastUpdateTime,
    error,
    refreshBalance,
  };
};