import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { BookOpen, Github, User, Mail, Lock, UserPlus } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login, fetchUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickName, setNickName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  useEffect(() => {
    // 检查是否有重定向路径
    const redirectPath = sessionStorage.getItem('redirect_path')
    if (redirectPath) {
      console.log('Found redirect path:', redirectPath)
    }
    
    // 处理OAuth回调
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const success = params.get('login_success')
    if (token && success === 'true') {
      localStorage.setItem('auth_token', token)
      fetchUser().finally(() => {
        navigate('/')
      })
    }
    
    // 检查API配置
    console.log('Login page loaded, checking API configuration...')
  }, [fetchUser, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      if (isRegisterMode) {
        await onRegister()
      } else {
        try {
          await login(email, password)
        } catch (err: any) {
          const m = String(err?.message || '')
          if (m.includes('参数') || m.includes('UsernameNotFound') || m.includes('NOT_LOGIN') || m.includes('no_auth')) {
            await api.userRegister({ email, password, nick_name: nickName || email.split('@')[0] })
            await login(email, password)
          } else {
            throw err
          }
        }
        navigate('/')
      }
    } catch (e: any) {
      // 更友好的错误处理
      if (e.message?.includes('Failed to fetch')) {
        setError('无法连接到服务器，请确保后端服务已启动')
        toast.error('无法连接到服务器')
      } else if (e.message?.includes('NetworkError')) {
        setError('网络连接错误，请检查网络设置')
        toast.error('网络连接错误')
      } else {
        const msg = e.message || (isRegisterMode ? '注册失败' : '登录失败')
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const onRegister = async () => {
    setLoading(true)
    setError(null)
    setInfo(null)
    try {
      await api.userRegister({ email, password, nick_name: nickName })
      setInfo('注册成功，请登录')
      setIsRegisterMode(false)
    } catch (e: any) {
      // 更友好的错误处理
      if (e.message?.includes('Failed to fetch')) {
        setError('无法连接到服务器，请确保后端服务已启动')
        toast.error('无法连接到服务器')
      } else if (e.message?.includes('NetworkError')) {
        setError('网络连接错误，请检查网络设置')
        toast.error('网络连接错误')
      } else {
        const msg = e.message || '注册失败，请检查输入信息'
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 头部标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">知识付费管理</h1>
          <p className="text-gray-600">{isRegisterMode ? '创建账户，开始学习之旅' : '登录账户，继续学习之旅'}</p>
        </div>

        {/* 登录表单卡片 */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* 邮箱输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-2" />
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="请输入邮箱地址"
                required
              />
            </div>

            {/* 注册模式下的额外字段 */}
            {isRegisterMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  昵称
                </label>
                <input
                  type="text"
                  value={nickName}
                  onChange={(e) => setNickName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="请输入昵称（可选）"
                />
              </div>
            )}

            {/* 密码输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="inline w-4 h-4 mr-2" />
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="请输入密码"
                required
              />
            </div>

            {/* 错误和成功消息 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            {info && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{info}</p>
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isRegisterMode ? '注册中...' : '登录中...'}
                </span>
              ) : (
                isRegisterMode ? '创建账户' : '登录'
              )}
            </button>

            {/* GitHub 登录 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                try {
                  const url = await api.oauthAuthorize('github')
                  window.location.href = url
                } catch (e) {
                  setError('GitHub 授权失败')
                }
              }}
              className="w-full px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>使用 GitHub 登录</span>
            </button>
          </form>

          {/* 注册/登录切换 */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isRegisterMode ? '已有账户？' : '还没有账户？'}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode)
                  setError(null)
                  setInfo(null)
                }}
                className="ml-1 text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
              >
                {isRegisterMode ? '立即登录' : '立即注册'}
              </button>
            </p>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            登录即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  )
}