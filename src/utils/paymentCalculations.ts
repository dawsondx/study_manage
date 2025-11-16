import { Resource, PaymentRecord } from '../types';

// 费用分析计算工具类
export class PaymentCalculator {
  // 计算总支出
  static calculateTotalSpending(payments: PaymentRecord[]): number {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  }

  // 计算平均每资源投入成本
  static calculateAverageCost(resources: Resource[], payments: PaymentRecord[]): number {
    const totalSpent = this.calculateTotalSpending(payments);
    const uniqueResourceIds = new Set(payments.map(p => p.resourceId));
    return uniqueResourceIds.size > 0 ? totalSpent / uniqueResourceIds.size : 0;
  }

  // 按分类计算支出（需要结合资源信息）
  static calculateCategorySpending(
    payments: PaymentRecord[], 
    resources: Resource[], 
    categoryId: string
  ): number {
    const categoryResourceIds = resources
      .filter(resource => resource.categoryId === categoryId)
      .map(resource => resource.id);
    
    return payments
      .filter(payment => categoryResourceIds.includes(payment.resourceId))
      .reduce((total, payment) => total + payment.amount, 0);
  }

  // 按资源类型计算支出（需要结合资源信息）
  static calculateResourceTypeSpending(
    payments: PaymentRecord[], 
    resources: Resource[], 
    resourceType: Resource['resourceType']
  ): number {
    const typeResourceIds = resources
      .filter(resource => resource.resourceType === resourceType)
      .map(resource => resource.id);
    
    return payments
      .filter(payment => typeResourceIds.includes(payment.resourceId))
      .reduce((total, payment) => total + payment.amount, 0);
  }

  // 计算投资回报率（ROI）
  static calculateROI(resources: Resource[], payments: PaymentRecord[]): number {
    const totalSpent = this.calculateTotalSpending(payments);
    const completedResources = resources.filter(r => r.status === 'completed').length;
    const totalResources = resources.length;
    
    if (totalSpent === 0 || totalResources === 0) return 0;
    
    // 简化的ROI计算：完成率 / 平均成本 * 100
    const completionRate = completedResources / totalResources;
    const averageCost = this.calculateAverageCost(resources, payments);
    
    return Math.round(completionRate * 100 / (averageCost / 100 + 1) * 100) / 100;
  }

  // 计算月度支出
  static calculateMonthlySpending(payments: PaymentRecord[]): number {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return payments
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((total, payment) => total + payment.amount, 0);
  }

  // 计算年度支出
  static calculateYearlySpending(payments: PaymentRecord[]): number {
    const currentYear = new Date().getFullYear();

    return payments
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getFullYear() === currentYear;
      })
      .reduce((total, payment) => total + payment.amount, 0);
  }

  // 获取最近的支付记录
  static getRecentPayments(payments: PaymentRecord[], limit: number = 10): PaymentRecord[] {
    return payments
      .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime())
      .slice(0, limit);
  }

  // 按时间段统计支出
  static getSpendingByPeriod(
    payments: PaymentRecord[], 
    period: 'week' | 'month' | 'year'
  ): { period: string; amount: number }[] {
    const now = new Date();
    const periods: { period: string; amount: number }[] = [];
    
    switch (period) {
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const periodStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
          
          const dayPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.toDateString() === date.toDateString();
          });
          
          periods.push({
            period: periodStr,
            amount: dayPayments.reduce((sum, p) => sum + p.amount, 0)
          });
        }
        break;
        
      case 'month':
        for (let i = 11; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const periodStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
          
          const monthPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getFullYear() === date.getFullYear() && 
                   paymentDate.getMonth() === date.getMonth();
          });
          
          periods.push({
            period: periodStr,
            amount: monthPayments.reduce((sum, p) => sum + p.amount, 0)
          });
        }
        break;
        
      case 'year':
        const currentYear = now.getFullYear();
        for (let i = 4; i >= 0; i--) {
          const year = currentYear - i;
          const periodStr = year.toString();
          
          const yearPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getFullYear() === year;
          });
          
          periods.push({
            period: periodStr,
            amount: yearPayments.reduce((sum, p) => sum + p.amount, 0)
          });
        }
        break;
    }
    
    return periods;
  }
}