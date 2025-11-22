const API_BASE = import.meta.env.VITE_AIPEX_API || ''
const API_KEY = import.meta.env.VITE_AIPEX_API_KEY || ''
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || false

// Mock API for development
const mockRequest = async <T>(mockData: T, delay = 500): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay))
  return mockData
}
function getAppId() {
  return localStorage.getItem('app_id') || import.meta.env.VITE_APP_ID || ''
}

type BaseResponse<T> = {
  code: number
  data: T
  message: string
  success: boolean
}

function getToken() {
  return localStorage.getItem('auth_token') || ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'CODE_FLYING': API_KEY } : {}),
      ...(init?.headers || {}),
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      // 后端已内置默认 APP_ID，无需强制携带
    },
    ...init
  })
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    const hint = `HTTP ${res.status} ${res.statusText}`
    const preview = text.slice(0, 120)
    throw new Error(`接口返回非 JSON：${hint}，路径：${url}，内容片段：${preview}`)
  }
  const json: BaseResponse<T> = await res.json()
  if (!json.success) {
    throw new Error(json.message || `Request failed with code ${json.code}`)
  }
  return json.data
}

export const api = {
  getVersion: () => request<{
    version: string
    latestVersion: string
    hasUpdate: boolean
    notes: string
    message: string
  }>(`/admin/version`)
  ,
  loginPasswd: (phoneOrEmail: string, password: string) => {
    if (USE_MOCK_API) {
      return mockRequest<string>(`mock_jwt_token_${Math.random().toString(36).substr(2, 9)}`, 800)
    }
    // 判断是手机号还是邮箱格式，只传递对应的字段
    const isEmail = phoneOrEmail.includes('@')
    const params: any = { password }
    if (isEmail) {
      params.email = phoneOrEmail
    } else {
      params.phone = phoneOrEmail
    }
    return request<string>(`/login/passwd`, {
      method: 'POST',
      body: JSON.stringify(params)
    })
  },
  getUserInfo: () => request<any>(`/getUserInfo`)
  ,
  getResources: () => {
    if (USE_MOCK_API) {
      return mockRequest<any[]>([], 300)
    }
    return request<any[]>(`/resources`)
  }
  ,
  getProgressRecords: () => {
    if (USE_MOCK_API) {
      return mockRequest<any[]>([], 300)
    }
    return request<any[]>(`/progress`)
  }
  ,
  getPayments: () => {
    if (USE_MOCK_API) {
      return mockRequest<any[]>([], 300)
    }
    return request<any[]>(`/payments`)
  }
  ,
  updateUserProfile: (payload: { nick_name?: string, avatar?: string }) => {
    if (USE_MOCK_API) {
      return mockRequest<any>({ success: true }, 500)
    }
    return request<any>(`/user/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  }
  ,
  changePassword: (payload: { current_password: string, new_password: string }) => {
    if (USE_MOCK_API) {
      return mockRequest<any>({ success: true }, 500)
    }
    return request<any>(`/user/password`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
  }
  ,
  userRegister: (payload: { email: string, password: string, nick_name?: string }) => {
    if (USE_MOCK_API) {
      return mockRequest<any>({
        success: true,
        message: '注册成功',
        data: {
          id: Math.floor(Math.random() * 1000),
          email: payload.email,
          nick_name: payload.nick_name || payload.email.split('@')[0],
          created_at: new Date().toISOString()
        }
      }, 1000)
    }
    return request<any>(`/login/register`, {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        user_name: payload.nick_name  // 将 nick_name 改为 user_name 以匹配后端期望的参数名
      })
    })
  }
  ,
  oauthAuthorize: async (provider: string): Promise<string> => {
    const url = await request<string>(`/oauth2/authorize/${provider}`)
    return url
  }
}

export { API_BASE }