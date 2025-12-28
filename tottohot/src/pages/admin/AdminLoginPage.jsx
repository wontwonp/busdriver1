import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import './AdminLoginPage.css'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/admin/login', { email, password })
      
      // 관리자 토큰 저장
      localStorage.setItem('adminToken', response.data.token)
      localStorage.setItem('adminInfo', JSON.stringify(response.data.admin))
      
      // 관리자 대시보드로 이동
      navigate('/admin')
    } catch (error) {
      setError(error.response?.data?.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <div className="admin-login-header">
          <h1>로얄토토 관리자</h1>
          <p>관리자 로그인</p>
        </div>
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tottohot.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <p>초기 계정: admin@tottohot.com / admin123</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage

