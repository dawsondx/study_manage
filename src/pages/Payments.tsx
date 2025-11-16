import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useResourceStore, usePaymentStore } from '@/stores';
import { PaymentCalculator, DataFormatter } from '@/utils';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Filter,
  PieChart,
  BarChart3
} from 'lucide-react';
import { PaymentRecord, PaymentMethod, PAYMENT_METHODS } from '@/types';

export default function Payments() {
  const { resources } = useResourceStore();
  const { 
    payments, 
    budgetSettings, 
    addPayment, 
    updatePayment, 
    deletePayment,
    updateBudgetSettings,
    getPaymentStatistics,
    getBudgetAlertMessage
  } = usePaymentStore();

  const location = useLocation();

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [filterResource, setFilterResource] = useState<string>('');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // 表单状态
  const [formData, setFormData] = useState({
    resourceId: '',
    amount: '',
    currency: 'CNY',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '支付宝' as PaymentMethod,
    notes: ''
  });

  // 预算设置表单
  const [budgetForm, setBudgetForm] = useState({
    monthlyBudget: budgetSettings.monthlyBudget,
    yearlyBudget: budgetSettings.yearlyBudget,
    defaultCurrency: budgetSettings.defaultCurrency,
    alertThreshold: budgetSettings.alertThreshold
  });

  // 过滤支付记录
  const filteredPayments = payments.filter(payment => {
    const resourceMatch = !filterResource || payment.resourceId === filterResource;
    const methodMatch = !filterPaymentMethod || payment.paymentMethod === filterPaymentMethod;
    
    let dateMatch = true;
    if (filterDateRange.start || filterDateRange.end) {
      const paymentDate = new Date(payment.paymentDate);
      if (filterDateRange.start) {
        dateMatch = dateMatch && paymentDate >= new Date(filterDateRange.start);
      }
      if (filterDateRange.end) {
        dateMatch = dateMatch && paymentDate <= new Date(filterDateRange.end);
      }
    }
    
    return resourceMatch && methodMatch && dateMatch;
  });

  // 支付统计
  const statistics = getPaymentStatistics();
  const budgetAlert = getBudgetAlertMessage();

  // 根据查询参数打开对应模态框
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openNew = params.get('new');
    const openBudget = params.get('budget');
    if (openNew === '1') setShowPaymentForm(true);
    if (openBudget === '1') setShowBudgetSettings(true);
  }, [location.search]);

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.resourceId || !formData.amount) {
      toast.error('请填写完整信息');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的金额');
      return;
    }

    const paymentData = {
      resourceId: formData.resourceId,
      amount,
      currency: formData.currency,
      paymentDate: new Date(formData.paymentDate),
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    if (editingPayment) {
      updatePayment(editingPayment.id, paymentData);
      toast.success('支付记录已更新');
    } else {
      addPayment(paymentData);
      toast.success('支付记录已添加');
    }

    // 重置表单
    setFormData({
      resourceId: '',
      amount: '',
      currency: 'CNY',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: '支付宝',
      notes: ''
    });
    setShowPaymentForm(false);
    setEditingPayment(null);
  };

  // 处理预算设置提交
  const handleBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBudgetSettings(budgetForm);
    setShowBudgetSettings(false);
    toast.success('预算设置已更新');
  };

  // 编辑支付记录
  const handleEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setFormData({
      resourceId: payment.resourceId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      paymentDate: payment.paymentDate.toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod,
      notes: payment.notes || ''
    });
    setShowPaymentForm(true);
  };

  // 删除支付记录
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条支付记录吗？')) {
      deletePayment(id);
      toast.success('支付记录已删除');
    }
  };

  // 获取资源名称
  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.title : '未知资源';
  };

  // 获取支付方式图标
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case '支付宝': return '💙';
      case '微信支付': return '💚';
      case '银行卡': return '🏦';
      case '信用卡': return '💳';
      case 'PayPal': return '🅿️';
      default: return '💰';
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和预算警告 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">支付记录</h1>
        <div className="flex items-center space-x-4">
          {budgetAlert && (
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">{budgetAlert}</span>
            </div>
          )}
          <button
            onClick={() => setShowBudgetSettings(true)}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <PieChart className="w-4 h-4 mr-2" />
            预算设置
          </button>
          <button
            onClick={() => setShowPaymentForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加支付
          </button>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <DollarSign className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">¥{statistics.totalSpent.toFixed(2)}</p>
          <p className="text-sm text-gray-500">总支出</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">¥{statistics.monthlySpending.toFixed(2)}</p>
          <p className="text-sm text-gray-500">本月支出</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${statistics.budgetUsagePercentage > budgetSettings.alertThreshold ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(statistics.budgetUsagePercentage, 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{statistics.budgetUsagePercentage.toFixed(1)}% 已使用</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">¥{statistics.yearlySpending.toFixed(2)}</p>
          <p className="text-sm text-gray-500">本年支出</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <CreditCard className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">¥{statistics.averageCostPerResource.toFixed(2)}</p>
          <p className="text-sm text-gray-500">平均成本</p>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">筛选条件</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">资源</label>
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部资源</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>{resource.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
            <select
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部方式</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={filterDateRange.start}
              onChange={(e) => setFilterDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={filterDateRange.end}
              onChange={(e) => setFilterDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => {
              setFilterResource('');
              setFilterPaymentMethod('');
              setFilterDateRange({ start: '', end: '' });
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            清除筛选
          </button>
        </div>
      </div>

      {/* 支付记录列表 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">支付记录</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredPayments.map(payment => (
            <div key={payment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getPaymentMethodIcon(payment.paymentMethod)}</div>
                  <div>
                    <p className="font-medium text-gray-900">{getResourceName(payment.resourceId)}</p>
                    <p className="text-sm text-gray-500">
                      {DataFormatter.formatDate(payment.paymentDate)} • {payment.paymentMethod}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-gray-400 mt-1">{payment.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {payment.currency === 'CNY' ? '¥' : '$'}{payment.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">{payment.currency}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(payment)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(payment.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">暂无支付记录</p>
          </div>
        )}
      </div>

      {/* 支付表单模态框 */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPayment ? '编辑支付记录' : '添加支付记录'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资源 *</label>
                <select
                  value={formData.resourceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, resourceId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">选择资源</option>
                  {resources.map(resource => (
                    <option key={resource.id} value={resource.id}>{resource.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额 *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">货币</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CNY">CNY ¥</option>
                    <option value="USD">USD $</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付日期</label>
                <input
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">支付方式</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="可选备注信息"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setEditingPayment(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPayment ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 预算设置模态框 */}
      {showBudgetSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">预算设置</h3>
            </div>
            
            <form onSubmit={handleBudgetSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">月度预算</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetForm.monthlyBudget}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, monthlyBudget: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">年度预算</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={budgetForm.yearlyBudget}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, yearlyBudget: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">默认货币</label>
                <select
                  value={budgetForm.defaultCurrency}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CNY">CNY ¥</option>
                  <option value="USD">USD $</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预算警告阈值 (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={budgetForm.alertThreshold}
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, alertThreshold: parseInt(e.target.value) || 80 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBudgetSettings(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}