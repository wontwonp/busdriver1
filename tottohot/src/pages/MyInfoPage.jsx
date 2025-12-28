import React, { useState, useEffect } from 'react'
import PageLayout from './PageLayout'
import api from '../utils/api'
import './MyInfoPage.css'

const MyInfoPage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserInfo()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      setUserInfo(response.data)
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')

    // 유효성 검사
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('모든 비밀번호를 입력해주세요.')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('새 비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setPasswordError('현재 비밀번호와 새 비밀번호가 같습니다.')
      return
    }

    setPasswordLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      alert('비밀번호가 성공적으로 변경되었습니다.')
      setShowPasswordModal(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      setPasswordError(error.response?.data?.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <PageLayout isLoggedIn={false} onLogin={() => {}}>
        <h1 className="page-title">내정보</h1>
        <p style={{ color: '#888', textAlign: 'center' }}>로그인이 필요합니다.</p>
      </PageLayout>
    )
  }

  if (loading) {
    return (
      <PageLayout isLoggedIn={true} onLogin={() => {}}>
        <h1 className="page-title">내정보</h1>
        <p style={{ color: '#888', textAlign: 'center' }}>로딩 중...</p>
      </PageLayout>
    )
  }

  if (!userInfo) {
    return (
      <PageLayout isLoggedIn={true} onLogin={() => {}}>
        <h1 className="page-title">내정보</h1>
        <p style={{ color: '#888', textAlign: 'center' }}>사용자 정보를 불러올 수 없습니다.</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout isLoggedIn={true} onLogin={() => {}}>
      <h1 className="page-title">내정보</h1>
      
      <div className="user-info">
        <div className="user-profile-header">
          <div className="user-level-display">
            <img 
              src={`/levels/level${userInfo.level || 1}.gif`} 
              alt={`Level ${userInfo.level || 1}`}
              className="user-level-image-large"
              onError={(e) => {
                e.target.src = '/levels/level1.gif' // 기본 이미지
              }}
            />
            <div className="user-level-text">레벨 {userInfo.level || 1}</div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <h3>기본 정보</h3>
            <div className="info-item">
              <span className="info-label">아이디</span>
              <span className="info-value">{userInfo.username || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">닉네임</span>
              <span className="info-value">{userInfo.nickname || userInfo.username || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">이메일</span>
              <span className="info-value">{userInfo.email || '-'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">전화번호</span>
              <span className="info-value">{userInfo.phoneNumber || '-'}</span>
            </div>
          </div>
          
          <div className="info-card">
            <h3>포인트 정보</h3>
            <div className="info-item">
              <span className="info-label">보유 포인트</span>
              <span className="info-value" style={{ color: '#FFD700', fontSize: '20px', fontWeight: '700' }}>
                {(userInfo.points || 0).toLocaleString()}P
              </span>
            </div>
          </div>

          <div className="info-card">
            <h3>레벨 정보</h3>
            <div className="info-item">
              <span className="info-label">현재 레벨</span>
              <span className="info-value">레벨 {userInfo.level || 1}</span>
            </div>
          </div>
          
          <div className="info-card">
            <h3>계정 관리</h3>
            <button 
              className="btn-password-change" 
              onClick={() => setShowPasswordModal(true)}
            >
              비밀번호 변경
            </button>
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>비밀번호 변경</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>현재 비밀번호</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="현재 비밀번호를 입력하세요"
                  required
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="새 비밀번호를 다시 입력하세요"
                  required
                  minLength={6}
                />
              </div>
              {passwordError && (
                <div className="error-message">{passwordError}</div>
              )}
              <div className="modal-buttons">
                <button type="submit" className="btn-primary" disabled={passwordLoading}>
                  {passwordLoading ? '변경 중...' : '변경하기'}
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordError('')
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default MyInfoPage
