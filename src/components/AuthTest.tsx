import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

export default function AuthTest() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const runAuthTest = async () => {
    setIsLoading(true)
    setTestResult('开始认证测试...\n')
    
    try {
      // 测试1: 检查API配置
      setTestResult(prev => prev + '检查API配置...\n')
      console.log('API Configuration:', {
        baseUrl: import.meta.env.VITE_AIPEX_API,
        hasKey: !!import.meta.env.VITE_AIPEX_API_KEY
      })
      
      // 测试2: 尝试注册新用户
      const testEmail = `test_${Date.now()}@example.com`
      const testPassword = 'test123456'
      const testNickname = `测试用户${Date.now()}`
      
      setTestResult(prev => prev + `尝试注册用户: ${testEmail}\n`)
      
      try {
        const registerResult = await api.userRegister({
          email: testEmail,
          password: testPassword,
          nick_name: testNickname
        })
        setTestResult(prev => prev + `注册成功: ${JSON.stringify(registerResult)}\n`)
      } catch (registerError) {
        setTestResult(prev => prev + `注册失败: ${registerError.message}\n`)
      }
      
      // 测试3: 尝试登录
      setTestResult(prev => prev + `尝试登录: ${testEmail}\n`)
      try {
        const loginResult = await api.loginPasswd(testEmail, testPassword)
        setTestResult(prev => prev + `登录成功，获得令牌\n`)
        
        // 存储令牌
        localStorage.setItem('auth_token', loginResult)
        localStorage.setItem('auth_email', testEmail)
        
        // 测试4: 获取用户信息
        setTestResult(prev => prev + '尝试获取用户信息...\n')
        try {
          const userInfo = await api.getUserInfo()
          setTestResult(prev => prev + `获取用户信息成功: ${JSON.stringify(userInfo)}\n`)
        } catch (userInfoError) {
          setTestResult(prev => prev + `获取用户信息失败: ${userInfoError.message}\n`)
        }
        
      } catch (loginError) {
        setTestResult(prev => prev + `登录失败: ${loginError.message}\n`)
      }
      
      setTestResult(prev => prev + '测试完成！\n')
      
    } catch (error) {
      setTestResult(prev => prev + `测试错误: ${error.message}\n`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">认证系统测试</h3>
      <button
        onClick={runAuthTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {isLoading ? '测试中...' : '运行认证测试'}
      </button>
      <div className="bg-white p-4 rounded border">
        <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
      </div>
    </div>
  )
}