import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useResourceStore, useProgressStore, usePaymentStore } from '@/stores';
import { DataFormatter, StudyCalculator, PaymentCalculator } from '@/utils';
import { 
  BookOpen, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Award,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import { RESOURCE_TYPES } from '@/types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

export default function Dashboard() {
  const { resources, getResourcesByStatus, getResourcesByCategory, categories } = useResourceStore();
  const { studyRecords, currentSession } = useProgressStore();
  const { payments } = usePaymentStore();
  
  const [stats, setStats] = useState({
    totalResources: 0,
    inProgress: 0,
    completed: 0,
    totalSpent: 0,
    totalStudyTime: 0,
    completionRate: 0,
    studyStreak: 0,
    averageProgress: 0,
    monthlySpending: 0
  });

  const [chartData, setChartData] = useState({
    categoryDistribution: [],
    resourceTypeSpending: [],
    studyTrend: [],
    spendingTrend: [],
    progressDistribution: []
  });

  useEffect(() => {
    const totalResources = resources.length;
    const inProgress = getResourcesByStatus('in_progress').length;
    const completed = getResourcesByStatus('completed').length;
    const totalSpent = PaymentCalculator.calculateTotalSpending(payments);
    const totalStudyTime = StudyCalculator.calculateTotalHours(studyRecords);
    const completionRate = StudyCalculator.calculateCompletionRate(resources);
    const studyStreak = StudyCalculator.calculateStudyStreak(studyRecords);
    const averageProgress = StudyCalculator.calculateAverageProgress(resources);
    const monthlySpending = PaymentCalculator.calculateMonthlySpending(payments);

    setStats({
      totalResources,
      inProgress,
      completed,
      totalSpent,
      totalStudyTime,
      completionRate,
      studyStreak,
      averageProgress,
      monthlySpending
    });

    // 生成图表数据
    generateChartData();
  }, [resources, studyRecords, payments, getResourcesByStatus, getResourcesByCategory, categories]);

  const generateChartData = () => {
    // 分类分布数据
    const categoryDistributionRaw = categories.map(category => ({
      name: category.name,
      value: getResourcesByCategory(category.id).length,
      color: COLORS[categories.indexOf(category) % COLORS.length]
    }));
    const categoryDistribution = categoryDistributionRaw.filter(d => d.value > 0);

    // 资源类型支出数据
    const resourceTypeSpendingRaw = RESOURCE_TYPES.map(type => ({
      name: type,
      value: PaymentCalculator.calculateResourceTypeSpending(payments, resources, type),
      color: COLORS[RESOURCE_TYPES.indexOf(type) % COLORS.length]
    }));
    const resourceTypeSpending = resourceTypeSpendingRaw.filter(d => d.value > 0);

    // 学习趋势数据（最近7天）
    const studyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      
      const dayRecords = studyRecords.filter(record => {
        const recordDate = new Date(record.startTime);
        return recordDate.toDateString() === date.toDateString();
      });
      
      const totalMinutes = dayRecords.reduce((sum, record) => sum + record.duration, 0);
      
      studyTrend.push({
        name: dateStr,
        minutes: totalMinutes,
        hours: Math.round(totalMinutes / 60 * 10) / 10
      });
    }

    // 支出趋势数据（最近6个月）
    const spendingTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
      
      const monthPayments = payments.filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getFullYear() === date.getFullYear() && 
               paymentDate.getMonth() === date.getMonth();
      });
      
      const totalAmount = monthPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      spendingTrend.push({
        name: monthStr,
        amount: totalAmount
      });
    }

    // 进度分布数据
    const progressRanges = [
      { range: '0-25%', min: 0, max: 25, count: 0 },
      { range: '26-50%', min: 26, max: 50, count: 0 },
      { range: '51-75%', min: 51, max: 75, count: 0 },
      { range: '76-99%', min: 76, max: 99, count: 0 },
      { range: '100%', min: 100, max: 100, count: 0 }
    ];

    resources.forEach(resource => {
      progressRanges.forEach(range => {
        if (resource.progress >= range.min && resource.progress <= range.max) {
          range.count++;
        }
      });
    });

    const progressDistribution = progressRanges.map(range => ({
      name: range.range,
      value: range.count,
      color: range.range === '100%' ? '#10B981' : '#3B82F6'
    }));

    setChartData({
      categoryDistribution,
      resourceTypeSpending,
      studyTrend,
      spendingTrend,
      progressDistribution
    });
  };

  const statCards = [
    {
      title: '总资源数',
      value: stats.totalResources,
      icon: BookOpen,
      color: 'bg-blue-500',
      description: '已添加的学习资源',
      trend: '+12%'
    },
    {
      title: '进行中',
      value: stats.inProgress,
      icon: Target,
      color: 'bg-orange-500',
      description: '正在学习的资源',
      trend: '+5%'
    },
    {
      title: '已完成',
      value: stats.completed,
      icon: Award,
      color: 'bg-green-500',
      description: '已完成学习',
      trend: '+8%'
    },
    {
      title: '总投入',
      value: DataFormatter.formatCurrency(stats.totalSpent, 'CNY'),
      icon: DollarSign,
      color: 'bg-purple-500',
      description: '累计学习投入',
      trend: '+15%'
    },
    {
      title: '学习时长',
      value: DataFormatter.formatDuration(stats.totalStudyTime * 60),
      icon: Clock,
      color: 'bg-indigo-500',
      description: '累计学习时间',
      trend: '+20%'
    },
    {
      title: '完成率',
      value: `${stats.completionRate}%`,
      icon: TrendingUp,
      color: 'bg-teal-500',
      description: '资源完成率',
      trend: '+3%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">学习仪表板</h1>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">连续学习 {stats.studyStreak} 天</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
            <Activity className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">平均进度 {stats.averageProgress}%</span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600 truncate">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{card.value}</p>
                  <p className="text-xs text-gray-500 truncate">{card.description}</p>
                </div>
                <div className={`${card.color} p-2 sm:p-3 rounded-lg text-white flex-shrink-0 ml-3`}>
                  <Icon className="h-5 sm:h-6 w-5 sm:w-6" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-green-600 font-medium">{card.trend}</span>
                <span className="text-xs text-gray-400">本月</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图表区域 - 第一行 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* 学习趋势图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg font-semibold text-gray-900">学习趋势</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Activity className="h-4 w-4 flex-shrink-0" />
              <span>最近7天</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.studyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value} 小时`, '学习时长']}
                />
                <Area 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 支出趋势图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg font-semibold text-gray-900">支出趋势</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span>最近6个月</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.spendingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`¥${value}`, '支出金额']}
                />
                <Bar dataKey="amount" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 图表区域 - 第二行 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* 分类分布饼图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg font-semibold text-gray-900">资源分类分布</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <PieChart className="h-4 w-4 flex-shrink-0" />
              <span>按分类</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.categoryDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                labelLine={false}
                minAngle={3}
                paddingAngle={2}
                label={({ name, percent, value }) => (value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
              >
                {chartData.categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={24} />
              <Tooltip formatter={(value) => [`${value} 个`, '资源数量']} />
            </RechartsPieChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* 资源类型支出饼图 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
            <h2 className="text-lg font-semibold text-gray-900">资源类型支出</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>按类型</span>
            </div>
          </div>
          <div className="h-64 sm:h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.resourceTypeSpending}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                labelLine={false}
                minAngle={3}
                paddingAngle={2}
                label={({ name, percent, value }) => (value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : '')}
              >
                {chartData.resourceTypeSpending.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={24} />
              <Tooltip formatter={(value) => [`¥${value}`, '支出金额']} />
            </RechartsPieChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* 最近活动 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">最近活动</h2>
            <Activity className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            {studyRecords.slice(0, 8).map((record) => {
              const resource = resources.find(r => r.id === record.resourceId);
              return (
                <div key={record.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      学习了 {resource?.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {DataFormatter.formatDuration(record.duration)} • 
                      {DataFormatter.formatDate(record.startTime, 'relative')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-gray-600 font-medium">
                      {record.progressBefore}% → {record.progressAfter}%
                    </span>
                  </div>
                </div>
              );
            })}
            {studyRecords.length === 0 && (
              <div className="text-center py-6 sm:py-8">
                <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm">暂无学习记录</p>
                <p className="text-gray-400 text-xs mt-1">开始你的学习之旅吧！</p>
              </div>
            )}
          </div>
        </div>

        {/* 资源状态分布 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">资源状态分布</h2>
            <PieChart className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            {[
              { status: 'not_started' as const, label: '未开始', color: 'bg-gray-500', lightColor: 'bg-gray-100' },
              { status: 'in_progress' as const, label: '进行中', color: 'bg-blue-500', lightColor: 'bg-blue-100' },
              { status: 'completed' as const, label: '已完成', color: 'bg-green-500', lightColor: 'bg-green-100' },
              { status: 'abandoned' as const, label: '已放弃', color: 'bg-red-500', lightColor: 'bg-red-100' }
            ].map((item) => {
              const count = getResourcesByStatus(item.status).length;
              const percentage = stats.totalResources > 0 ? (count / stats.totalResources) * 100 : 0;
              
              return (
                <div key={item.status} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-3 h-3 ${item.color} rounded-full flex-shrink-0`}></div>
                    <span className="text-sm font-medium text-gray-700 truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 ${item.color} rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-gray-900">{count}</span>
                      <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 快速统计 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">快速统计</h2>
            <BarChart3 className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">资源总数</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats.totalResources}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <Award className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">已完成</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats.completed}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <DollarSign className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">总投入</span>
              </div>
              <span className="text-lg font-bold text-purple-600">¥{stats.totalSpent.toFixed(0)}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">学习时长</span>
              </div>
              <span className="text-lg font-bold text-orange-600">{stats.totalStudyTime}h</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
              <div className="flex items-center space-x-3 min-w-0">
                <TrendingUp className="h-5 w-5 text-teal-600 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate">完成率</span>
              </div>
              <span className="text-lg font-bold text-teal-600">{stats.completionRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/resources/new" className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200 transform hover:scale-105">
            <BookOpen className="h-8 w-8 text-blue-600 mb-3" />
            <span className="text-sm font-medium text-blue-900">添加资源</span>
            <span className="text-xs text-blue-600 mt-1">新增学习资料</span>
          </Link>
          <Link to="/progress" className="flex flex-col items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 transition-all duration-200 transform hover:scale-105">
            <Target className="h-8 w-8 text-green-600 mb-3" />
            <span className="text-sm font-medium text-green-900">{currentSession ? '继续学习' : '开始学习'}</span>
            <span className="text-xs text-green-600 mt-1">{currentSession ? '进入学习会话' : '启动学习计时'}</span>
          </Link>
          <Link to="/payments?new=1" className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all duration-200 transform hover:scale-105">
            <DollarSign className="h-8 w-8 text-purple-600 mb-3" />
            <span className="text-sm font-medium text-purple-900">记录支出</span>
            <span className="text-xs text-purple-600 mt-1">添加支付记录</span>
          </Link>
          <Link to="/" className="flex flex-col items-center p-6 bg-orange-50 rounded-lg hover:bg-orange-100 transition-all duration-200 transform hover:scale-105">
            <BarChart3 className="h-8 w-8 text-orange-600 mb-3" />
            <span className="text-sm font-medium text-orange-900">查看统计</span>
            <span className="text-xs text-orange-600 mt-1">详细数据分析</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
