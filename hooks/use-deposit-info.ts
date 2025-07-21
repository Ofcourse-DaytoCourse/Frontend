// hooks/use-deposit-info.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { paymentsApi, DepositGenerateResponse } from '@/lib/payments-api';
import { TokenStorage } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export const useDepositInfo = (amount: number = 10000) => {
  const [depositInfo, setDepositInfo] = useState<DepositGenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const amountRef = useRef(amount);
  
  // amount가 변경될 때마다 ref 업데이트
  useEffect(() => {
    amountRef.current = amount;
  }, [amount]);

  const generateDepositInfo = useCallback(async (chargeAmount?: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = TokenStorage.get();
      if (!token) {
        throw new Error('인증 토큰이 없습니다.');
      }

      const response = await paymentsApi.generateDepositName(
        { 
          bank_name: '우리은행',
          account_number: '1002766420576'
        },
        token
      );

      setDepositInfo(response);
      
      toast({
        title: "입금 정보가 생성되었습니다",
        description: "1시간 내에 입금을 완료해주세요.",
      });

      return response;
    } catch (error: any) {
      const errorMessage = error.message || '입금 정보 생성에 실패했습니다.';
      setError(errorMessage);
      
      toast({
        title: "오류 발생",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]); // amount 의존성 제거하고 ref 사용

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "복사 완료",
        description: `${label}이(가) 클립보드에 복사되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "복사 실패",
        description: "클립보드 복사에 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    depositInfo,
    isLoading,
    error,
    generateDepositInfo,
    copyToClipboard,
  };
};