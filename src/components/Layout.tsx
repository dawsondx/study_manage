import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  CreditCard, 
  Settings,
  Menu,
  X,
  Activity
} from 'lucide-react';
import { useProgressStore } from '@/stores';
import { useAuthStore } from '@/stores/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { currentSession } = useProgressStore();
  const { user, logout, fetchUser } = useAuthStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const authed = !!useAuthStore((s) => s.token);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (currentSession) {
      setElapsedTime(Date.now() - currentSession.startTime.getTime());
      interval = setInterval(() => {
        setElapsedTime(Date.now() - currentSession.startTime.getTime());
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession]);

  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (token && !user) {
      fetchUser();
    }
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, []);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const navigation = [
    { name: '仪表板', href: '/', icon: Home },
    { name: '资源管理', href: '/resources', icon: BookOpen },
    { name: '学习进度', href: '/progress', icon: TrendingUp },
    { name: '支付记录', href: '/payments', icon: CreditCard },
    { name: '设置', href: '/settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 lg:grid lg:grid-cols-[18rem,1fr]">
      {/* 移动端遮罩 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:translate-x-0 lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 truncate">知识付费管理</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-4 pb-6">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* 主内容区域 */}
      <div className="">
        {/* 顶部导航栏 */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </span>
            <span className="text-sm text-gray-500 sm:hidden">
              {new Date().toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
            {currentSession && (
              <Link
                to="/progress"
                className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
              >
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">学习中 {formatTime(elapsedTime)}</span>
                <span className="text-xs">前往</span>
              </Link>
            )}
            {!authed && (
              <Link
                to="/login"
                className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                登录
              </Link>
            )}
            {authed && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                >
                  <span className="inline-flex items-center space-x-2">
                    <span className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-semibold">
                      {((user?.nick_name || user?.email || '账').trim().charAt(0)).toUpperCase()}
                    </span>
                    <span>{(user?.nick_name || user?.email) || '账户'}</span>
                  </span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <Link
                      to="/settings?tab=account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      账户设置
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      我的资料
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); logout(); navigate('/login'); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}