
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
    let mounted = true;

    const fetchTransactions = async () => {
      if (!profile?.id || !profile?.college_id) {
        if (mounted) {
          setTransactions([]);
          setLoading(false);
        }
        return;
      }

      try {
        setError(null);
        
        let filters: any = {};
        
        if (profile.user_type === 'student') {
          filters.student_id = profile.id;
        } else if (profile.user_type === 'parent') {
          // For parents, we would need to fetch transactions for their children
          // This requires a proper relationship setup
          filters.college_id = profile.college_id;
        }

        const response = await apiGateway.select('fee_transactions', {
          filters,
          order: { column: 'created_at', ascending: false }
        });

        if (!mounted) return;

        if (response.success && response.data) {
          setTransactions(response.data as FeeTransaction[]);
        } else {
          setError(response.error || 'Failed to fetch transactions');
          setTransactions([]);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        if (mounted) {
          setError('Failed to fetch transactions');
          setTransactions([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTransactions();

    return () => {
      mounted = false;
    };
  }, [profile]);

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
    getFeeStatistics,
    refetch: () => {
      setLoading(true);
      // This will trigger the useEffect to refetch
    }
  };
};
