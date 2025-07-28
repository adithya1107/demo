
import { useState, useEffect } from 'react';
import { useUserProfile } from './useUserProfile';
import { apiGateway } from '@/utils/apiGateway';

export interface FeeTransaction {
  id: string;
  student_id: string;
  college_id: string;
  fee_type: string;
  amount: number;
  currency: string;
  transaction_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string | null;
  transaction_id: string | null;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
}

export const useFees = () => {
  const { profile } = useUserProfile();
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchTransactions();
    }
  }, [profile?.id]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      let filters: any = {};
      
      if (profile?.user_type === 'student') {
        filters.student_id = profile.id;
      } else if (profile?.user_type === 'parent') {
        // For parents, we need to fetch transactions for their children
        // This would need to be implemented with a proper join query
        // For now, we'll fetch all transactions and filter client-side
        filters.college_id = profile.college_id;
      }

      const response = await apiGateway.select('fee_transactions', {
        filters,
        order: { column: 'created_at', ascending: false }
      });

      if (response.success && response.data) {
        setTransactions(response.data as FeeTransaction[]);
      } else {
        setError(response.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const createFeeTransaction = async (transactionData: Omit<FeeTransaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await apiGateway.insert('fee_transactions', transactionData);
      
      if (response.success) {
        await fetchTransactions(); // Refresh transactions
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to create transaction' };
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: FeeTransaction['transaction_status'], paymentDetails?: any) => {
    try {
      const updates: any = { transaction_status: status };
      
      if (status === 'completed' && paymentDetails) {
        updates.paid_at = new Date().toISOString();
        updates.payment_method = paymentDetails.payment_method;
        updates.transaction_id = paymentDetails.transaction_id;
      }

      const response = await apiGateway.update('fee_transactions', updates, { id: transactionId });
      
      if (response.success) {
        await fetchTransactions(); // Refresh transactions
        return { success: true, data: response.data };
      }
      
      return { success: false, error: response.error };
    } catch (err) {
      return { success: false, error: 'Failed to update transaction' };
    }
  };

  const processPayment = async (transactionId: string, paymentMethod: string) => {
    try {
      // This would integrate with a payment gateway
      // For now, we'll simulate a successful payment
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        const result = await updateTransactionStatus(transactionId, 'completed', {
          payment_method: paymentMethod,
          transaction_id: `TXN_${Date.now()}`
        });
        return result;
      } else {
        const result = await updateTransactionStatus(transactionId, 'failed');
        return { success: false, error: 'Payment failed' };
      }
    } catch (err) {
      return { success: false, error: 'Payment processing failed' };
    }
  };

  const getFeeStatistics = () => {
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const paidAmount = transactions
      .filter(t => t.transaction_status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0);
    const pendingAmount = transactions
      .filter(t => t.transaction_status === 'pending')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const overdueTransactions = transactions.filter(t => {
      if (t.transaction_status === 'pending' && t.due_date) {
        return new Date(t.due_date) < new Date();
      }
      return false;
    });

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount: overdueTransactions.reduce((sum, t) => sum + t.amount, 0),
      overdueCount: overdueTransactions.length,
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(t => t.transaction_status === 'completed').length
    };
  };

  return {
    transactions,
    loading,
    error,
    createFeeTransaction,
    updateTransactionStatus,
    processPayment,
    getFeeStatistics,
    refetch: fetchTransactions
  };
};
