// 主题类型定义
export const THEMES = ['light', 'dark'] as const;
export type Theme = typeof THEMES[number];

// 用户设置接口
export interface UserSettings {
  theme: Theme;
  notifications: boolean;
  autoBackup: boolean;
  backupInterval: number; // 备份间隔（小时）
  defaultCurrency: string;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// 本地存储键定义
export const STORAGE_KEYS = {
  RESOURCES: 'knowledge_resources',
  CATEGORIES: 'resource_categories', 
  STUDY_RECORDS: 'study_records',
  PAYMENT_RECORDS: 'payment_records',
  USER_SETTINGS: 'user_settings',
  LAST_SYNC: 'last_sync_time'
} as const;

// 数据备份接口
export interface DataBackup {
  version: string;
  timestamp: Date;
  data: {
    resources: any[];
    categories: any[];
    studyRecords: any[];
    payments: any[];
    settings: any;
  };
}