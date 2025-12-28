import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import './SignupPage.css'

const SignupPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    nickname: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameChecked, setUsernameChecked] = useState(false)
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [checkingNickname, setCheckingNickname] = useState(false)
  const [usernameMessage, setUsernameMessage] = useState('')
  const [nicknameMessage, setNicknameMessage] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckUsername = async () => {
    if (!formData.username) {
      setUsernameMessage('아이디를 입력해주세요.')
      return
    }

    setCheckingUsername(true)
    setError('')
    setUsernameChecked(false)
    setUsernameMessage('')

    try {
      const response = await api.post('/auth/check-username', {
        username: formData.username
      })

      if (response.data.available) {
        setUsernameChecked(true)
        setUsernameMessage('사용 가능한 아이디입니다.')
      } else {
        setUsernameChecked(false)
        setUsernameMessage(response.data.message || '이미 사용 중인 아이디입니다.')
      }
    } catch (error) {
      setUsernameChecked(false)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CONNECTION_REFUSED')) {
        setUsernameMessage('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else {
        setUsernameMessage(error.response?.data?.message || '중복확인에 실패했습니다.')
      }
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleCheckNickname = async () => {
    if (!formData.nickname) {
      setNicknameMessage('닉네임을 입력해주세요.')
      return
    }

    setCheckingNickname(true)
    setError('')
    setNicknameChecked(false)
    setNicknameMessage('')

    try {
      const response = await api.post('/auth/check-nickname', {
        nickname: formData.nickname
      })

      if (response.data.available) {
        setNicknameChecked(true)
        setNicknameMessage('사용 가능한 닉네임입니다.')
      } else {
        setNicknameChecked(false)
        setNicknameMessage(response.data.message || '이미 사용 중인 닉네임입니다.')
      }
    } catch (error) {
      setNicknameChecked(false)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CONNECTION_REFUSED')) {
        setNicknameMessage('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else {
        setNicknameMessage(error.response?.data?.message || '중복확인에 실패했습니다.')
      }
    } finally {
      setCheckingNickname(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!usernameChecked) {
      setError('아이디 중복확인을 완료해주세요.')
      return
    }

    if (!nicknameChecked) {
      setError('닉네임 중복확인을 완료해주세요.')
      return
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/auth/register', {
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname
      })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('isLoggedIn', 'true')
      navigate('/')
      window.location.reload()
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('CONNECTION_REFUSED')) {
        setError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else {
        setError(error.response?.data?.message || '회원가입에 실패했습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="signup-page-wrapper">
      <div className="signup-page">
        <h1 className="page-title">회원가입</h1>
        
        <form onSubmit={handleSubmit} className="signup-form">
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="form-group">
            <label>아이디 *</label>
            <div className="input-group">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={(e) => {
                  handleChange(e)
                  setUsernameChecked(false)
                  setUsernameMessage('')
                }}
                required
                placeholder="아이디를 입력하세요"
              />
              <button
                type="button"
                className="btn btn-line-primary"
                onClick={handleCheckUsername}
                disabled={checkingUsername || !formData.username || usernameChecked}
              >
                {checkingUsername ? '확인 중...' : usernameChecked ? '확인완료' : '중복확인'}
              </button>
            </div>
            {usernameMessage && (
              <p style={{ 
                marginTop: '5px', 
                fontSize: '14px', 
                color: usernameChecked ? '#4CAF50' : '#ff6b6b' 
              }}>
                {usernameMessage}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>닉네임 *</label>
            <div className="input-group">
              <input
                type="text"
                name="nickname"
                value={formData.nickname}
                onChange={(e) => {
                  handleChange(e)
                  setNicknameChecked(false)
                  setNicknameMessage('')
                }}
                required
                placeholder="닉네임을 입력하세요"
              />
              <button
                type="button"
                className="btn btn-line-primary"
                onClick={handleCheckNickname}
                disabled={checkingNickname || !formData.nickname || nicknameChecked}
              >
                {checkingNickname ? '확인 중...' : nicknameChecked ? '확인완료' : '중복확인'}
              </button>
            </div>
            {nicknameMessage && (
              <p style={{ 
                marginTop: '5px', 
                fontSize: '14px', 
                color: nicknameChecked ? '#4CAF50' : '#ff6b6b' 
              }}>
                {nicknameMessage}
              </p>
            )}
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="비밀번호를 입력하세요 (6자 이상)"
            />
          </div>

          <div className="form-group">
            <label>비밀번호 확인</label>
            <input
              type="password"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleChange}
              required
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          <button type="submit" className="btn-submit" disabled={loading || !usernameChecked || !nicknameChecked}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default SignupPage
