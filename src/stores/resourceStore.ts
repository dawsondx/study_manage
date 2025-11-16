import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Resource, Category, ResourceFilters, RESOURCE_TYPES } from '../types';
import { usePaymentStore } from './paymentStore';

interface ResourceStore {
  resources: Resource[];
  categories: Category[];
  loading: boolean;
  filters: ResourceFilters;
  addResource: (resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  addCategory: (name: string, color?: string) => Category;
  setFilter: (filters: ResourceFilters) => void;
  clearFilters: () => void;
  getFilteredResources: () => Resource[];
  getResourceTypes: () => typeof RESOURCE_TYPES;
  getResourcesByType: (type: Resource['resourceType']) => Resource[];
  getResourcesByCategory: (categoryId: string) => Resource[];
  getResourcesByStatus: (status: Resource['status']) => Resource[];
  clearAllData: () => void;
}

const defaultCategories: Category[] = [
  {
    id: '1',
    name: '编程开发',
    color: '#3B82F6',
    icon: 'code',
    createdAt: new Date()
  },
  {
    id: '2', 
    name: '设计创意',
    color: '#8B5CF6',
    icon: 'palette',
    createdAt: new Date()
  },
  {
    id: '3',
    name: '商业管理',
    color: '#10B981',
    icon: 'briefcase',
    createdAt: new Date()
  },
  {
    id: '4',
    name: '语言学习',
    color: '#F59E0B',
    icon: 'languages',
    createdAt: new Date()
  },
  {
    id: '5',
    name: '职业技能',
    color: '#EF4444',
    icon: 'graduation-cap',
    createdAt: new Date()
  }
];

export const useResourceStore = create<ResourceStore>()(
  persist(
    (set, get) => ({
      resources: [],
      categories: defaultCategories,
      loading: false,
      filters: {},

      addResource: (resourceData) => {
        const newResource: Resource = {
          ...resourceData,
          id: Date.now().toString(),
          expiryDate:
            resourceData.hasValidity && resourceData.validityDays && resourceData.purchaseDate
              ? new Date(new Date(resourceData.purchaseDate).getTime() + resourceData.validityDays * 24 * 60 * 60 * 1000)
              : undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        set((state) => ({
          resources: [...state.resources, newResource]
        }));

        if (newResource.price > 0) {
          const paymentStore = usePaymentStore.getState();
          paymentStore.addPayment({
            resourceId: newResource.id,
            amount: newResource.price,
            currency: newResource.currency,
            paymentDate: newResource.purchaseDate ? new Date(newResource.purchaseDate) : new Date(),
            paymentMethod: '其他',
            notes: '自动同步：添加资源时生成支付记录'
          });
        }
      },

      updateResource: (id, updates) => {
        const state = get();
        const current = state.resources.find((r) => r.id === id);
        if (!current) return;

        const merged: Resource = {
          ...current,
          ...updates,
          expiryDate:
            (updates.hasValidity ?? current.hasValidity) && (updates.validityDays ?? current.validityDays) && (updates.purchaseDate ?? current.purchaseDate)
              ? new Date(
                  new Date((updates.purchaseDate ?? current.purchaseDate) as Date).getTime() +
                    ((updates.validityDays ?? current.validityDays) as number) * 24 * 60 * 60 * 1000
                )
              : undefined,
          updatedAt: new Date()
        };

        set({
          resources: state.resources.map((resource) => (resource.id === id ? merged : resource))
        });

        if (
          updates.price !== undefined ||
          updates.currency !== undefined ||
          updates.purchaseDate !== undefined
        ) {
          const effectivePrice = merged.price;
          const effectiveCurrency = merged.currency;
          const effectivePurchaseDate = merged.purchaseDate;

          if (effectivePrice > 0) {
            const paymentStore = usePaymentStore.getState();
            const existing = paymentStore.getResourcePayments(id);
            if (existing.length > 0) {
              const latest = existing[0];
              paymentStore.updatePayment(latest.id, {
                amount: effectivePrice,
                currency: effectiveCurrency,
                paymentDate: effectivePurchaseDate ? new Date(effectivePurchaseDate) : latest.paymentDate,
                notes: '自动同步：更新资源时调整支付记录'
              });
            } else {
              paymentStore.addPayment({
                resourceId: id,
                amount: effectivePrice,
                currency: effectiveCurrency,
                paymentDate: effectivePurchaseDate ? new Date(effectivePurchaseDate) : new Date(),
                paymentMethod: '其他',
                notes: '自动同步：更新资源时生成支付记录'
              });
            }
          }
        }
      },

      addCategory: (name, color = '#6B7280') => {
        const newCategory: Category = {
          id: Date.now().toString(),
          name,
          color,
          icon: 'tag',
          createdAt: new Date()
        };
        set((state) => ({ categories: [...state.categories, newCategory] }));
        return newCategory;
      },

      deleteResource: (id) => {
        set((state) => ({
          resources: state.resources.filter((resource) => resource.id !== id)
        }));
      },

      setFilter: (filters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      getFilteredResources: () => {
        const { resources, filters } = get();
        
        return resources.filter((resource) => {
          if (filters.resourceType && resource.resourceType !== filters.resourceType) {
            return false;
          }
          
          if (filters.categoryId && resource.categoryId !== filters.categoryId) {
            return false;
          }
          
          if (filters.status && resource.status !== filters.status) {
            return false;
          }
          
          if (filters.priceRange) {
            const [min, max] = filters.priceRange;
            if (resource.price < min || resource.price > max) {
              return false;
            }
          }
          
          if (filters.progressRange) {
            const [min, max] = filters.progressRange;
            if (resource.progress < min || resource.progress > max) {
              return false;
            }
          }
          
          if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some((tag) =>
              resource.tags.includes(tag)
            );
            if (!hasMatchingTag) {
              return false;
            }
          }
          
          return true;
        });
      },

      getResourceTypes: () => RESOURCE_TYPES,

      getResourcesByType: (type) => {
        const { resources } = get();
        return resources.filter((resource) => resource.resourceType === type);
      },

      getResourcesByCategory: (categoryId) => {
        const { resources } = get();
        return resources.filter((resource) => resource.categoryId === categoryId);
      },

      getResourcesByStatus: (status) => {
        const { resources } = get();
        return resources.filter((resource) => resource.status === status);
      },

      clearAllData: () => {
        set({ resources: [], categories: defaultCategories });
      }
    }),
    {
      name: 'resource-store',
      partialize: (state) => ({
        resources: state.resources,
        categories: state.categories
      })
    }
  )
);