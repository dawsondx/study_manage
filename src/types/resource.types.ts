// 资源类型定义
export const RESOURCE_TYPES = ['网课', '训练营', '社群', '书籍'] as const;
export type ResourceType = typeof RESOURCE_TYPES[number];

// 资源状态定义
export const RESOURCE_STATUSES = ['not_started', 'in_progress', 'completed', 'abandoned'] as const;
export type ResourceStatus = typeof RESOURCE_STATUSES[number];

// 货币类型定义
export const CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP', 'JPY'] as const;
export type Currency = typeof CURRENCIES[number];

// 资源分类接口
export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
}

// 资源筛选条件接口
export interface ResourceFilters {
  resourceType?: ResourceType;
  categoryId?: string;
  status?: ResourceStatus;
  priceRange?: [number, number];
  progressRange?: [number, number];
  tags?: string[];
}

// 学习资源接口
export interface Resource {
  id: string;
  title: string;
  description: string;
  resourceType: ResourceType;
  categoryId: string;
  price: number;
  currency: Currency;
  purchaseUrl?: string;
  purchaseDate?: Date;
  hasValidity?: boolean;
  validityDays?: number;
  expiryDate?: Date;
  status: ResourceStatus;
  progress: number; // 0-100
  startDate?: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours: number;
  notes: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}