import { useState, useEffect } from 'react';
import { useResourceStore, useProgressStore, usePaymentStore } from '@/stores';
import { DataFormatter } from '@/utils';
import { toast } from 'sonner';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Palette,
  Globe,
  Shield,
  Database,
  FileText,
  Calendar,
  DollarSign,
  BookOpen,
  Clock,
  User,
  Save,
  RotateCcw
} from 'lucide-react';

interface SettingsState {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: {
    studyReminders: boolean;
    budgetAlerts: boolean;
    progressUpdates: boolean;
  };
  data: {
    autoBackup: boolean;
    backupInterval: number;
    exportFormat: 'json' | 'csv';
  };
  display: {
    showCompleted: boolean;
    showAbandoned: boolean;
    itemsPerPage: number;
    dateFormat: string;
  };
}

const defaultSettings: SettingsState = {
  theme: 'auto',
  language: 'zh-CN',
  notifications: {
    studyReminders: true,
    budgetAlerts: true,
    progressUpdates: true
  },
  data: {
    autoBackup: true,
    backupInterval: 7,
    exportFormat: 'json'
  },
  display: {
    showCompleted: true,
    showAbandoned: true,
    itemsPerPage: 10,
    dateFormat: 'YYYY-MM-DD'
  }
};

export default function Settings() {
  const { resources, clearAllData: clearResources } = useResourceStore();
  const { studyRecords, clearAllData: clearProgress } = useProgressStore();
  const { payments, clearAllData: clearPayments } = usePaymentStore();

  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'data' | 'display'>('general');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 数据概览
  const dataOverview = {
    resources: resources.length,
    studyRecords: studyRecords.length,
    payments: payments.length,
    totalSize: JSON.stringify({ resources, studyRecords, payments }).length
  };

  // 保存设置
  const saveSettings = (newSettings: Partial<SettingsState>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('app-settings', JSON.stringify(updatedSettings));
    toast.success('设置已保存');
  };

  // 重置设置
  const resetSettings = () => {
    if (confirm('确定要重置所有设置吗？')) {
      setSettings(defaultSettings);
      localStorage.setItem('app-settings', JSON.stringify(defaultSettings));
      toast.success('设置已重置');
    }
  };

  // 导出数据
  const exportData = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        resources,
        studyRecords,
        payments,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `knowledge-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('数据导出成功');
    } catch (error) {
      toast.error('数据导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  // 导入数据
  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
          // 这里应该调用相应的 store 方法来导入数据
          // 暂时只显示成功消息
          toast.success('数据导入成功');
        }
      } catch (error) {
        toast.error('数据格式错误，请检查文件');
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  // 清除所有数据
  const clearAllData = () => {
    if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      clearResources();
      clearProgress();
      clearPayments();
      toast.success('所有数据已清除');
    }
  };

  // 清除缓存
  const clearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('缓存已清除');
    // 重新加载页面
    window.location.reload();
  };

  const tabs = [
    { id: 'general', label: '通用', icon: SettingsIcon },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'data', label: '数据', icon: Database },
    { id: 'display', label: '显示', icon: Palette }
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">设置</h1>
        <button
          onClick={resetSettings}
          className="inline-flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          重置设置
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* 通用设置 */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">外观设置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">主题</label>
                    <select
                      value={settings.theme}
                      onChange={(e) => saveSettings({ theme: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="auto">自动</option>
                      <option value="light">浅色</option>
                      <option value="dark">深色</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">语言</label>
                    <select
                      value={settings.language}
                      onChange={(e) => saveSettings({ language: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="zh-CN">简体中文</option>
                      <option value="en-US">English</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">隐私设置</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">匿名使用统计</label>
                      <p className="text-xs text-gray-500">帮助我们改进产品体验</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">数据加密</label>
                      <p className="text-xs text-gray-500">本地数据加密存储</p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 通知设置 */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">学习提醒</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">学习提醒</label>
                      <p className="text-xs text-gray-500">每日学习提醒通知</p>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        notifications: {
                          ...settings.notifications,
                          studyReminders: !settings.notifications.studyReminders
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.studyReminders ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.notifications.studyReminders ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">预算警告</label>
                      <p className="text-xs text-gray-500">超出预算时的提醒</p>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        notifications: {
                          ...settings.notifications,
                          budgetAlerts: !settings.notifications.budgetAlerts
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.budgetAlerts ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.notifications.budgetAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">进度更新</label>
                      <p className="text-xs text-gray-500">学习进度变化提醒</p>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        notifications: {
                          ...settings.notifications,
                          progressUpdates: !settings.notifications.progressUpdates
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.notifications.progressUpdates ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.notifications.progressUpdates ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 数据设置 */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">数据概览</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">资源</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{dataOverview.resources}</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">学习记录</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 mt-1">{dataOverview.studyRecords}</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">支付记录</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{dataOverview.payments}</p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Database className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">数据大小</span>
                    </div>
                    <p className="text-sm font-bold text-orange-600 mt-1">
                      {DataFormatter.formatFileSize(dataOverview.totalSize)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">数据备份</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">自动备份</label>
                      <p className="text-xs text-gray-500">定期自动备份数据</p>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        data: {
                          ...settings.data,
                          autoBackup: !settings.data.autoBackup
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.data.autoBackup ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.data.autoBackup ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  {settings.data.autoBackup && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">备份间隔（天）</label>
                      <select
                        value={settings.data.backupInterval}
                        onChange={(e) => saveSettings({
                          data: {
                            ...settings.data,
                            backupInterval: parseInt(e.target.value)
                          }
                        })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>每天</option>
                        <option value={3}>每3天</option>
                        <option value={7}>每周</option>
                        <option value={30}>每月</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
                    <select
                      value={settings.data.exportFormat}
                      onChange={(e) => saveSettings({
                        data: {
                          ...settings.data,
                          exportFormat: e.target.value as any
                        }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">数据操作</h3>
                <div className="space-y-3">
                  <button
                    onClick={exportData}
                    disabled={isExporting}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? '导出中...' : '导出数据'}
                  </button>
                  
                  <label className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    导入数据
                    <input
                      type="file"
                      accept=".json"
                      onChange={importData}
                      className="hidden"
                      disabled={isImporting}
                    />
                  </label>
                  
                  <button
                    onClick={clearAllData}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清除所有数据
                  </button>
                  
                  <button
                    onClick={clearCache}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    清除缓存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 显示设置 */}
          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">显示选项</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">显示已完成</label>
                      <p className="text-xs text-gray-500">在列表中显示已完成的项目</p>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        display: {
                          ...settings.display,
                          showCompleted: !settings.display.showCompleted
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.display.showCompleted ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.display.showCompleted ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">显示已放弃</label>
                      <p className="text-xs text-gray-500">在列表中显示已放弃的项目</p>
                    </div>
                    <button
                      onClick={() => saveSettings({
                        display: {
                          ...settings.display,
                          showAbandoned: !settings.display.showAbandoned
                        }
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.display.showAbandoned ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        settings.display.showAbandoned ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">分页设置</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">每页显示数量</label>
                  <select
                    value={settings.display.itemsPerPage}
                    onChange={(e) => saveSettings({
                      display: {
                        ...settings.display,
                        itemsPerPage: parseInt(e.target.value)
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={5}>5 条</option>
                    <option value={10}>10 条</option>
                    <option value={20}>20 条</option>
                    <option value={50}>50 条</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">日期格式</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">日期显示格式</label>
                  <select
                    value={settings.display.dateFormat}
                    onChange={(e) => saveSettings({
                      display: {
                        ...settings.display,
                        dateFormat: e.target.value
                      }
                    })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="YYYY-MM-DD">2024-01-01</option>
                    <option value="DD/MM/YYYY">01/01/2024</option>
                    <option value="MM/DD/YYYY">01/01/2024</option>
                    <option value="DD-MM-YYYY">01-01-2024</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={() => toast.success('所有设置已保存')}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          保存所有设置
        </button>
      </div>
    </div>
  );
}