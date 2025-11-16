import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResourceStore } from '@/stores';
import { DataValidator } from '@/utils';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Save, 
  BookOpen, 
  Target,
  Award,
  MessageCircle
} from 'lucide-react';
import { Resource, ResourceType, Currency, ResourceStatus } from '@/types';

export default function ResourceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addResource, updateResource, resources, categories, addCategory } = useResourceStore();
  
  const isEditing = !!id;
  const existingResource = isEditing ? resources.find(r => r.id === id) : null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: '网课' as ResourceType,
    categoryId: '',
    price: 0,
    currency: 'CNY' as Currency,
    purchaseUrl: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    hasValidity: false,
    validityDays: 0,
    status: 'not_started' as ResourceStatus,
    progress: 0,
    estimatedHours: 0,
    tags: [] as string[],
    tagInput: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isEditing && existingResource) {
      setFormData({
        title: existingResource.title,
        description: existingResource.description,
        resourceType: existingResource.resourceType,
        categoryId: existingResource.categoryId,
        price: existingResource.price,
        currency: existingResource.currency,
        purchaseUrl: existingResource.purchaseUrl || '',
        purchaseDate: existingResource.purchaseDate ? existingResource.purchaseDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        hasValidity: !!existingResource.hasValidity,
        validityDays: existingResource.validityDays || 0,
        status: existingResource.status,
        progress: existingResource.progress,
        estimatedHours: existingResource.estimatedHours || 0,
        tags: existingResource.tags,
        tagInput: ''
      });
    }
  }, [isEditing, existingResource]);

  const validateForm = () => {
    const validation = DataValidator.validateResource({
      title: formData.title,
      description: formData.description,
      price: formData.price,
      progress: formData.progress,
      estimatedHours: formData.estimatedHours,
      purchaseUrl: formData.purchaseUrl
    });

    const newErrors: Record<string, string> = {};
    validation.errors.forEach(error => {
      newErrors[error.field] = error.message;
    });

    setErrors(newErrors);
    return validation.isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('请检查表单错误');
      return;
    }

    setIsSubmitting(true);

    try {
      const resourceData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        resourceType: formData.resourceType,
        categoryId: formData.categoryId,
        price: formData.price,
        currency: formData.currency,
        purchaseUrl: formData.purchaseUrl.trim() || undefined,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
        hasValidity: formData.hasValidity,
        validityDays: formData.hasValidity ? formData.validityDays : undefined,
        status: formData.status,
        progress: formData.progress,
        estimatedHours: formData.estimatedHours,
        tags: formData.tags,
        notes: [],
        actualHours: 0
      };

      if (isEditing && existingResource) {
        updateResource(existingResource.id, resourceData);
        toast.success('资源更新成功');
      } else {
        addResource(resourceData);
        toast.success('资源添加成功');
      }

      navigate('/resources');
    } catch (error) {
      toast.error(isEditing ? '更新失败，请重试' : '添加失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && formData.tagInput.trim()) {
      e.preventDefault();
      const newTag = formData.tagInput.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData({
          ...formData,
          tags: [...formData.tags, newTag],
          tagInput: ''
        });
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case '网课': return <BookOpen className="w-4 h-4" />;
      case '训练营': return <Target className="w-4 h-4" />;
      case '社群': return <MessageCircle className="w-4 h-4" />;
      case '书籍': return <Award className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/resources')}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回资源列表
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? '编辑资源' : '添加资源'}
        </h1>
        <div className="w-20"></div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent transition-colors ${
                    errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="请输入资源标题"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent transition-colors ${
                    errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="请输入资源描述"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  资源类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['网课', '训练营', '社群', '书籍'] as ResourceType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, resourceType: type })}
                      className={`flex items-center justify-center p-2 border rounded-lg transition-colors ${
                        formData.resourceType === type
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {getResourceTypeIcon(type)}
                      <span className="ml-2 text-sm">{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newCategoryName.trim()) return;
                        if (categories.some(c => c.name === newCategoryName.trim())) {
                          toast.error('分类已存在');
                          return;
                        }
                        const created = addCategory(newCategoryName.trim());
                        setFormData({ ...formData, categoryId: created.id });
                        setNewCategoryName('');
                        toast.success('已添加分类');
                      }
                    }}
                    placeholder="输入新分类名称"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCategoryName.trim()) return;
                      if (categories.some(c => c.name === newCategoryName.trim())) {
                        toast.error('分类已存在');
                        return;
                      }
                      const created = addCategory(newCategoryName.trim());
                      setFormData({ ...formData, categoryId: created.id });
                      setNewCategoryName('');
                      toast.success('已添加分类');
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    添加分类
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 价格和购买信息 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">价格和购买信息</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  价格
                </label>
                <div className="flex">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className={`flex-1 border rounded-l-lg px-3 py-2 focus:ring-2 focus:border-transparent transition-colors ${
                      errors.price ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0.00"
                  />
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="border border-l-0 border-gray-300 rounded-r-lg px-2 py-2 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="CNY">CNY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  购买链接
                </label>
                <input
                  type="url"
                  value={formData.purchaseUrl}
                  onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent transition-colors ${
                    errors.purchaseUrl ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="https://example.com"
                />
                {errors.purchaseUrl && <p className="text-red-500 text-sm mt-1">{errors.purchaseUrl}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">购买日期</label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">是否有有效期</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.hasValidity}
                    onChange={(e) => setFormData({ ...formData, hasValidity: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">有有效期</span>
                </div>
              </div>

              {formData.hasValidity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">有效期（天）</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.validityDays}
                    onChange={(e) => setFormData({ ...formData, validityDays: parseInt(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如 365"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    到期日：{formData.purchaseDate && formData.validityDays > 0 ? new Date(new Date(formData.purchaseDate).getTime() + formData.validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN') : '未设置'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 学习进度 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">学习进度</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ResourceStatus })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="not_started">未开始</option>
                  <option value="in_progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="abandoned">已放弃</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  进度 ({formData.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${formData.progress}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  预计学习时间（小时）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseInt(e.target.value) || 0 })}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent transition-colors ${
                    errors.estimatedHours ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="0"
                />
                {errors.estimatedHours && <p className="text-red-500 text-sm mt-1">{errors.estimatedHours}</p>}
              </div>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={formData.tagInput}
              onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
              onKeyDown={handleTagInput}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入标签后按回车添加"
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/resources')}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? '保存中...' : (isEditing ? '更新资源' : '添加资源')}
          </button>
        </div>
      </form>
    </div>
  );
}