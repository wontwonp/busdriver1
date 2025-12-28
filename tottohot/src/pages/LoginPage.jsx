import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import api from '../utils/api'
import './LoginPage.css'

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('로그인 시도:', { username: loginForm.username, apiBaseUrl: api.defaults.baseURL })
      const response = await api.post('/auth/login', {
        username: loginForm.username,
        password: loginForm.password
      })

      console.log('로그인 성공:', response.data)
      // 일반 사용자 로그인 시 admin 토큰 제거
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminInfo')
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('isLoggedIn', 'true')
      
      // 사용자 정보 저장
      if (response.data.user) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
      }
      
      // 로그인 성공 콜백 호출
      if (onLogin) {
        onLogin()
      }
      
      // 로그인 성공 후 홈으로 이동
      navigate('/')
    } catch (error) {
      console.error('로그인 오류:', error)
      console.error('오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method
        }
      })
      setError(error.response?.data?.message || error.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setLoginForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-page">
        <div className="login-container">
          <div className="login-logo">
            <ImageWithFallback
              src="/logo.gif"
              alt="tototalk"
              fallbackText="토토톡"
              style={{ height: '60px' }}
            />
          </div>
          <h1 className="login-title">로그인</h1>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">아이디</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginForm.username}
                onChange={handleInputChange}
                placeholder="아이디를 입력하세요"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginForm.password}
                onChange={handleInputChange}
                placeholder="비밀번호를 입력하세요"
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </button>
            
            <div className="signup-link-container">
              <a href="/signup" className="signup-link" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>
                회원가입
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
