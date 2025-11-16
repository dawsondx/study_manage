import { Resource, StudyRecord, PaymentRecord, Currency } from '../types';

// 数据格式化工具类
export class DataFormatter {
  // 格式化货币金额
  static formatCurrency(amount: number, currency: Currency): string {
    const currencySymbols: Record<Currency, string> = {
      CNY: '¥',
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥'
    };

    const symbol = currencySymbols[currency] || '¥';
    return `${symbol}${amount.toFixed(2)}`;
  }

  // 格式化时长（分钟转换为小时和分钟）
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}小时`;
    }
    
    return `${hours}小时${remainingMinutes}分钟`;
  }

  // 格式化日期
  static formatDate(date: Date, format: 'short' | 'long' | 'relative' = 'short'): string {
    switch (format) {
      case 'short':
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      
      case 'long':
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      
      case 'relative':
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        if (diffDays > 0) {
          return diffDays === 1 ? '昨天' : `${diffDays}天前`;
        } else if (diffHours > 0) {
          return diffHours === 1 ? '1小时前' : `${diffHours}小时前`;
        } else if (diffMinutes > 0) {
          return diffMinutes === 1 ? '1分钟前' : `${diffMinutes}分钟前`;
        } else {
          return '刚刚';
        }
      
      default:
        return date.toLocaleDateString('zh-CN');
    }
  }

  // 格式化进度百分比
  static formatProgress(progress: number): string {
    return `${Math.round(progress)}%`;
  }

  // 格式化资源状态
  static formatResourceStatus(status: Resource['status']): { text: string; color: string } {
    const statusMap = {
      not_started: { text: '未开始', color: 'text-gray-500' },
      in_progress: { text: '进行中', color: 'text-blue-500' },
      completed: { text: '已完成', color: 'text-green-500' },
      abandoned: { text: '已放弃', color: 'text-red-500' }
    };
    
    return statusMap[status];
  }

  // 格式化资源类型
  static formatResourceType(type: Resource['resourceType']): { text: string; icon: string } {
    const typeMap = {
      '网课': { text: '网课', icon: 'video' },
      '训练营': { text: '训练营', icon: 'users' },
      '社群': { text: '社群', icon: 'message-circle' },
      '书籍': { text: '书籍', icon: 'book' }
    };
    
    return typeMap[type];
  }

  // 格式化数字（添加千分位分隔符）
  static formatNumber(num: number): string {
    return num.toLocaleString('zh-CN');
  }

  // 截断长文本
  static truncateText(text: string, maxLength: number = 100): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  // 生成颜色类名（基于字符串哈希）
  static getColorClass(text: string): string {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800',
      'bg-gray-100 text-gray-800'
    ];
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  // 格式化文件大小
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}