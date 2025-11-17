// Mock API for development when backend is not available
export const mockApi = {
  register: async (email: string, password: string, nickName?: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock validation
    if (!email || !password) {
      throw new Error('邮箱和密码不能为空')
    }
    
    if (password.length < 6) {
      throw new Error('密码长度至少6位')
    }
    
    if (!email.includes('@')) {
      throw new Error('请输入有效的邮箱地址')
    }
    
    // Mock successful registration
    return {
      success: true,
      message: '注册成功',
      data: {
        id: Math.floor(Math.random() * 1000),
        email,
        nick_name: nickName || email.split('@')[0],
        created_at: new Date().toISOString()
      }
    }
  },
  
  login: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock validation
    if (!email || !password) {
      throw new Error('邮箱和密码不能为空')
    }
    
    // Mock successful login
    return {
      success: true,
      message: '登录成功',
      data: {
        token: 'mock_jwt_token_' + Math.random().toString(36).substr(2, 9),
        user: {
          id: Math.floor(Math.random() * 1000),
          email,
          nick_name: email.split('@')[0]
        }
      }
    }
  }
}