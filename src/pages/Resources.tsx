import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResourceStore } from '@/stores';
import { DataFormatter } from '@/utils';
import { 
  BookOpen, 
  Clock, 
  Filter, 
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Target,
  Award,
  Play
} from 'lucide-react';
import { Resource, ResourceStatus, ResourceType } from '@/types';

export default function Resources() {
  const { 
    resources, 
    categories, 
    filters, 
    getFilteredResources,
    deleteResource,
    setFilter,
    clearFilters 
  } = useResourceStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredResources = getFilteredResources().filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || {
      name: '未分类',
      color: '#6B7280',
      icon: 'help-circle'
    };
  };

  const getStatusIcon = (status: ResourceStatus) => {
    switch (status) {
      case 'not_started':
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      case 'in_progress':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'abandoned':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
    }
  };

  const getStatusText = (status: ResourceStatus) => {
    switch (status) {
      case 'not_started': return '未开始';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'abandoned': return '已放弃';
    }
  };

  const getResourceTypeIcon = (type: ResourceType) => {
    switch (type) {
      case '网课':
        return <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><BookOpen className="w-4 h-4" /></div>;
      case '训练营':
        return <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><Target className="w-4 h-4" /></div>;
      case '社群':
        return <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><div className="w-4 h-4 rounded-full border-2 border-current" /></div>;
      case '书籍':
        return <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center"><Award className="w-4 h-4" /></div>;
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个资源吗？')) {
      deleteResource(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">资源管理</h1>
        <Link
          to="/resources/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加资源
        </Link>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索资源..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4 mr-2" />
          筛选
        </button>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 资源类型筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">资源类型</label>
              <select
                value={filters.resourceType || ''}
                onChange={(e) => setFilter({ ...filters, resourceType: e.target.value as ResourceType })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部类型</option>
                <option value="网课">网课</option>
                <option value="训练营">训练营</option>
                <option value="社群">社群</option>
                <option value="书籍">书籍</option>
              </select>
            </div>

            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">状态</label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilter({ ...filters, status: e.target.value as ResourceStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部状态</option>
                <option value="not_started">未开始</option>
                <option value="in_progress">进行中</option>
                <option value="completed">已完成</option>
                <option value="abandoned">已放弃</option>
              </select>
            </div>

            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <select
                value={filters.categoryId || ''}
                onChange={(e) => setFilter({ ...filters, categoryId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部分类</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            {/* 进度范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">进度范围</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500 self-center">-</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              清除筛选
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              应用筛选
            </button>
          </div>
        </div>
      )}

      {/* 资源列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const category = getCategoryInfo(resource.categoryId);
          
          return (
            <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* 资源头部 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getResourceTypeIcon(resource.resourceType)}
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug min-h-[2.5rem] sm:min-h-[3rem] max-h-[2.5rem] sm:max-h-[3rem] overflow-hidden">{resource.title}</h3>
                      <p className="text-sm text-gray-500">{resource.resourceType}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(resource.status)}
                    <span className="text-xs text-gray-500">{getStatusText(resource.status)}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-xs sm:text-sm mb-4 min-h-[2rem] sm:min-h-[2.5rem] max-h-[2rem] sm:max-h-[2.5rem] overflow-hidden">{resource.description || '暂无描述'}</p>

                {/* 进度条 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">学习进度</span>
                    <span className="text-sm text-gray-500">{resource.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${resource.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* 资源信息 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">分类</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-gray-700">{category.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">价格</span>
                    <span className="text-gray-700 font-medium">
                      {DataFormatter.formatCurrency(resource.price, resource.currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">学习时间</span>
                    <span className="text-gray-700">
                      {DataFormatter.formatDuration(resource.actualHours * 60)}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  <Link
                    to={`/resources/${resource.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    编辑
                  </Link>
                  {resource.purchaseUrl && (
                    <a
                      href={resource.purchaseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="inline-flex items-center justify-center px-3 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无资源</h3>
          <p className="text-gray-500 mb-4">还没有添加任何学习资源</p>
          <Link
            to="/resources/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            添加第一个资源
          </Link>
        </div>
      )}
    </div>
  );
}