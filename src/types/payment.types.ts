// 支付方式定义
export const PAYMENT_METHODS = ['支付宝', '微信支付', '银行卡', '信用卡', 'PayPal', '其他'] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

// 支付记录接口
export interface PaymentRecord {
  id: string;
  resourceId: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
}

// 预算设置接口
export interface BudgetSettings {
  monthlyBudget: number;
  yearlyBudget: number;
  defaultCurrency: string;
  alertThreshold: number; // 预算警告阈值百分比
}

// 支付统计接口
export interface PaymentStatistics {
  totalSpent: number;
  monthlySpending: number;
  yearlySpending: number;
  averageCostPerResource: number;
  categorySpending: Record<string, number>;
  resourceTypeSpending: Record<string, number>;
  budgetUsagePercentage: number;
}