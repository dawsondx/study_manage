import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaymentRecord, BudgetSettings, PaymentStatistics } from '../types';

interface PaymentStore {
  payments: PaymentRecord[];
  budgetSettings: BudgetSettings;
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => void;
  deletePayment: (id: string) => void;
  updateBudgetSettings: (settings: Partial<BudgetSettings>) => void;
  getResourcePayments: (resourceId: string) => PaymentRecord[];
  getPaymentStatistics: () => PaymentStatistics;
  getTotalSpent: () => number;
  getMonthlySpending: () => number;
  getYearlySpending: () => number;
  isOverBudget: () => boolean;
  getBudgetAlertMessage: () => string | null;
  fetchAll: () => Promise<void>;
  clearAllData: () => void;
}

const defaultBudgetSettings: BudgetSettings = {
  monthlyBudget: 1000,
  yearlyBudget: 10000,
  defaultCurrency: 'CNY',
  alertThreshold: 80 // 80% 时警告
};

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      payments: [],
      budgetSettings: defaultBudgetSettings,

      addPayment: (paymentData) => {
        const newPayment: PaymentRecord = {
          ...paymentData,
          id: Date.now().toString(),
          createdAt: new Date()
        };
        
        set((state) => ({
          payments: [...state.payments, newPayment]
        }));
      },

      updatePayment: (id, updates) => {
        set((state) => ({
          payments: state.payments.map((payment) =>
            payment.id === id
              ? { ...payment, ...updates }
              : payment
          )
        }));
      },

      deletePayment: (id) => {
        set((state) => ({
          payments: state.payments.filter((payment) => payment.id !== id)
        }));
      },

      updateBudgetSettings: (settings) => {
        set((state) => ({
          budgetSettings: { ...state.budgetSettings, ...settings }
        }));
      },

      getResourcePayments: (resourceId) => {
        const { payments } = get();
        return payments
          .filter((payment) => payment.resourceId === resourceId)
          .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
      },

      getPaymentStatistics: () => {
        const { payments, budgetSettings } = get();
        
        if (payments.length === 0) {
          return {
            totalSpent: 0,
            monthlySpending: 0,
            yearlySpending: 0,
            averageCostPerResource: 0,
            categorySpending: {},
            resourceTypeSpending: {},
            budgetUsagePercentage: 0
          };
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 计算总支出
        const totalSpent = payments.reduce((total, payment) => total + payment.amount, 0);

        // 计算本月支出
        const monthlySpending = payments
          .filter((payment) => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
          })
          .reduce((total, payment) => total + payment.amount, 0);

        // 计算本年支出
        const yearlySpending = payments
          .filter((payment) => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getFullYear() === currentYear;
          })
          .reduce((total, payment) => total + payment.amount, 0);

        // 计算平均成本（这里简化处理，实际需要关联资源）
        const uniqueResourceIds = new Set(payments.map((p) => p.resourceId));
        const averageCostPerResource = uniqueResourceIds.size > 0 
          ? totalSpent / uniqueResourceIds.size 
          : 0;

        // 计算预算使用率
        const budgetUsagePercentage = (monthlySpending / budgetSettings.monthlyBudget) * 100;

        return {
          totalSpent,
          monthlySpending,
          yearlySpending,
          averageCostPerResource,
          categorySpending: {}, // 需要结合资源分类计算
          resourceTypeSpending: {}, // 需要结合资源类型计算
          budgetUsagePercentage
        };
      },

      getTotalSpent: () => {
        const { payments } = get();
        return payments.reduce((total, payment) => total + payment.amount, 0);
      },

      getMonthlySpending: () => {
        const { payments } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return payments
          .filter((payment) => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
          })
          .reduce((total, payment) => total + payment.amount, 0);
      },

      getYearlySpending: () => {
        const { payments } = get();
        const currentYear = new Date().getFullYear();

        return payments
          .filter((payment) => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getFullYear() === currentYear;
          })
          .reduce((total, payment) => total + payment.amount, 0);
      },

      isOverBudget: () => {
        const { budgetSettings } = get();
        const monthlySpending = get().getMonthlySpending();
        return monthlySpending > budgetSettings.monthlyBudget;
      },

      getBudgetAlertMessage: () => {
        const { budgetSettings } = get();
        const monthlySpending = get().getMonthlySpending();
        const usagePercentage = (monthlySpending / budgetSettings.monthlyBudget) * 100;

        if (usagePercentage >= budgetSettings.alertThreshold) {
          return `本月已使用预算的 ${usagePercentage.toFixed(1)}%，请注意控制支出`;
        }

        return null;
      },

      clearAllData: () => {
        set({ payments: [], budgetSettings: defaultBudgetSettings })
      },

      fetchAll: async () => {
        const data = await api.getPayments()
        set({ payments: Array.isArray(data) ? data : [] })
      }
    }),
    {
      name: 'payment-store',
      partialize: (state) => ({
        payments: state.payments,
        budgetSettings: state.budgetSettings
      }),
      skipHydration: true
    }
  )
);
import { api } from '@/lib/api';