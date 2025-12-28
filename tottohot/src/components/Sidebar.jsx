import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import ImageWithFallback from './ImageWithFallback'
import ChatBox from './ChatBox'
import './Sidebar.css'

const Sidebar = ({ isLoggedIn, onLogin, onLogout }) => {
  const navigate = useNavigate()
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [notificationCount, setNotificationCount] = useState(0) // 알림 개수 (추후 API로 가져올 예정)
  const [rankingType, setRankingType] = useState('level') // 'level' or 'points'
  const [levelRanking, setLevelRanking] = useState([])
  const [pointsRanking, setPointsRanking] = useState([])
  const [rankingLoading, setRankingLoading] = useState(false)
  const [levelProgress, setLevelProgress] = useState(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [latestNotice, setLatestNotice] = useState(null)

  // 로그인 상태에 따라 사용자 정보 가져오기
  useEffect(() => {
    console.log('Sidebar - isLoggedIn 변경:', isLoggedIn)
    if (isLoggedIn) {
      fetchUserInfo()
    } else {
      setUserInfo(null)
      setLevelProgress(null)
    }
  }, [isLoggedIn])

  // userInfo가 로드되면 레벨 진행률 가져오기
  useEffect(() => {
    if (isLoggedIn && userInfo) {
      fetchLevelProgress()
    }
  }, [isLoggedIn, userInfo])

  // 페이지 포커스 시에만 레벨 진행률 갱신 (서버 부하 방지)
  useEffect(() => {
    if (!isLoggedIn || !userInfo) return

    const handleFocus = () => {
      fetchLevelProgress()
    }

    // 커스텀 이벤트 리스너 (게시글 작성, 댓글 작성 등 활동 후 갱신)
    const handleLevelUpdate = () => {
      fetchLevelProgress()
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('levelProgressUpdate', handleLevelUpdate)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('levelProgressUpdate', handleLevelUpdate)
    }
  }, [isLoggedIn, userInfo])

  // 레벨 진행률 가져오기
  const fetchLevelProgress = async () => {
    try {
      const response = await api.get('/level/progress')
      if (response.data) {
        setLevelProgress(response.data)
      } else {
        // 기본값 설정 (레벨 1, 경험치 0%)
        setLevelProgress({
          level: userInfo?.level || 1,
          experience: 0,
          nextLevel: (userInfo?.level || 1) + 1,
          requirements: null,
          progress: {
            days: { current: 0, required: 0, percentage: 0 },
            points: { current: 0, required: 0, percentage: 0 },
            posts: { current: 0, required: 0, percentage: 0 },
            reviews: { current: 0, required: 0, percentage: 0 },
            comments: { current: 0, required: 0, percentage: 0 }
          }
        })
      }
    } catch (error) {
      console.error('레벨 진행률 로딩 실패:', error)
      // 오류 발생 시에도 기본값으로 표시
      setLevelProgress({
        level: userInfo?.level || 1,
        experience: 0,
        nextLevel: (userInfo?.level || 1) + 1,
        requirements: null,
        progress: {
          days: { current: 0, required: 0, percentage: 0 },
          points: { current: 0, required: 0, percentage: 0 },
          posts: { current: 0, required: 0, percentage: 0 },
          reviews: { current: 0, required: 0, percentage: 0 },
          comments: { current: 0, required: 0, percentage: 0 }
        }
      })
    }
  }

  // 랭킹 데이터 가져오기
  useEffect(() => {
    fetchRankings()
  }, [])

  // 최신 공지사항 가져오기
  useEffect(() => {
    fetchLatestNotice()
  }, [])

  const fetchLatestNotice = async () => {
    try {
      const response = await api.get('/notices?limit=1')
      if (response.data && response.data.length > 0) {
        setLatestNotice(response.data[0])
      }
    } catch (error) {
      console.error('최신 공지사항 로딩 실패:', error)
    }
  }

  const fetchRankings = async () => {
    try {
      setRankingLoading(true)
      const [levelRes, pointsRes] = await Promise.all([
        api.get('/rankings/level?limit=10'),
        api.get('/rankings/points?limit=10')
      ])
      setLevelRanking(levelRes.data)
      setPointsRanking(pointsRes.data)
    } catch (error) {
      console.error('랭킹 로딩 실패:', error)
    } finally {
      setRankingLoading(false)
    }
  }

  const fetchUserInfo = async () => {
    try {
      console.log('Sidebar - 사용자 정보 가져오기 시도')
      const response = await api.get('/auth/me')
      console.log('Sidebar - 사용자 정보 로딩 성공:', response.data)
      setUserInfo(response.data)
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
      // 에러가 발생해도 기본 정보는 표시
      setUserInfo({ username: '사용자', nickname: '사용자', role: 'user', points: 0 })
    }
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/auth/login', {
        username: loginForm.username,
        password: loginForm.password
      })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('isLoggedIn', 'true')
      onLogin()
      // 로그인 성공 후 사용자 정보 가져오기
      await fetchUserInfo()
    } catch (error) {
      setError(error.response?.data?.message || '로그인에 실패했습니다.')
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

  console.log('Sidebar 렌더링:', { isLoggedIn, hasUserInfo: !!userInfo, userInfo })
  
  return (
    <aside className="sidebar" style={{ display: 'block', width: '280px', minWidth: '280px' }}>
      {!isLoggedIn ? (
        <div className="login-box">
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">아이디</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginForm.username}
                onChange={handleInputChange}
                placeholder="아이디"
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
                placeholder="비밀번호"
              />
            </div>
            {error && <div className="login-error">{error}</div>}
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? '로그인 중..' : '로그인'}
            </button>
            <div className="login-options">
              <div className="login-links">
                <a href="#find-info">정보찾기</a>
                <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup') }}>
                  회원가입
                </a>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="user-box widget-outlogin-wrap">
          <div className="f-de font-weight-normal">
            <div className="d-flex">
              <div className="flex-grow-1 pt-2">
                <h5 className="hide-photo mb-2">
                  <b>
                    <span className="xp-icon">
                      <ImageWithFallback
                        src={`/levels/level${userInfo?.level || 1}.gif`}
                        alt={`Level ${userInfo?.level || 1}`}
                        className="user-level-image-small"
                        style={{ width: '25px', height: '25px' }}
                      />
                    </span>
                    <span className="v_wrap">
                      <a 
                        href="/myinfo" 
                        className="sv_member en" 
                        onClick={(e) => { e.preventDefault(); navigate('/myinfo') }}
                        title={userInfo ? `${userInfo.nickname || userInfo.username} 자기소개` : ''}
                      >
                        {userInfo ? (userInfo.nickname || userInfo.username) : '로딩 중...'}
                      </a>
                    </span>
                  </b>
                </h5>
                
                {isLoggedIn && levelProgress && (
                  <div className="exp">
                    <div className="pull-left" style={{ lineHeight: '32px', marginLeft: '7px', fontSize: '12px', color: '#777' }}>
                      경험치
                    </div>
                    <div className="at-tip">
                      <div className="div-progress progress">
                        <div 
                          className="progress-bar progress-bar-exp progress-bar-danger" 
                          role="progressbar"
                          aria-valuenow={levelProgress.experience || 0}
                          aria-valuemin="0"
                          aria-valuemax="100"
                          style={{ 
                            width: `${levelProgress.experience || 0}%`,
                            backgroundColor: '#e4241e',
                            boxShadow: 'inset 0 -1px 0 rgb(0 0 0 / 15%)'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="info">
                  <div className="text-muted">
                    <div className="pull-left">
                      <span>회원등급: {userInfo 
                        ? (userInfo.role === 'admin' ? '관리자' : userInfo.shopLevel && userInfo.shopLevel > 0 ? '샵회원' : '일반회원')
                        : '일반회원'}</span>
                    </div>
                    <div className="pull-right">
                      <a 
                        href="/money-log" 
                        className="win_point"
                        onClick={(e) => { e.preventDefault(); navigate('/money-log') }}
                      >
                        포인트: {userInfo ? (userInfo.points || 0).toLocaleString() : '0'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <ul className="login_menu">
              <li>
                <a href="#notification" className="at-tip" title="알림">
                  <img src="/images/icon_outlogin_1.png" alt="알림" />
                </a>
              </li>
              <li>
                <a href="#message" className="win_memo" title="쪽지">
                  <img src="/images/icon_outlogin_2.png" alt="쪽지" />
                </a>
              </li>
              <li>
                <a href="#attendance" title="출석부">
                  <img src="/images/icon_outlogin_3.png" alt="출석부" />
                </a>
              </li>
              <li>
                <a href="#scrap" className="win_scrap" title="스크랩">
                  <img src="/images/icon_outlogin_4.png" alt="스크랩" />
                </a>
              </li>
              <li>
                <a href="/myinfo" title="내정보" onClick={(e) => { e.preventDefault(); navigate('/myinfo') }}>
                  <img src="/images/icon_outlogin_5.png" alt="내정보" />
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 채팅창 - 유저정보 박스 아래에 고정 (로그인 상태에서만 표시) */}
      {isLoggedIn && (
        <div className="sidebar-chat-container">
          <ChatBox />
        </div>
      )}

      <div className="notice-box">
        {latestNotice ? (
          <Link to={`/notice/${latestNotice._id}`} className="notice-link">
            {(() => {
              const date = new Date(latestNotice.createdAt)
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              return `${year}. ${month}. ${day} 📢 ${latestNotice.title}`
            })()}
          </Link>
        ) : (
          <a href="#notice" className="notice-link">
            공지사항 로딩 중...
          </a>
        )}
      </div>

      <div className="event-box">
        <h3 className="event-title">이벤트</h3>
        <ul className="event-list">
          <li>
            <a href="#event1">토토톡X보증업체 콜라보 이벤트+108</a>
          </li>
          <li>
            <a href="#event2">가입드림 이벤트+112</a>
          </li>
          <li>
            <a href="#event3">보증업체 신기 이벤트+111</a>
          </li>
          <li>
            <a href="#event4">토토톡 신규가입 이벤트+122</a>
          </li>
          <li>
            <a href="#event5">텔레그램 채널 가입 이벤트+107</a>
          </li>
        </ul>
      </div>

      <div className="ranking-box">
        <div className="ranking-tabs">
          <button 
            className={`ranking-tab ${rankingType === 'level' ? 'active' : ''}`}
            onClick={() => setRankingType('level')}
          >
            레벨 랭킹
          </button>
          <button 
            className={`ranking-tab ${rankingType === 'points' ? 'active' : ''}`}
            onClick={() => setRankingType('points')}
          >
            포인트 랭킹
          </button>
        </div>
        <div className="ranking-content">
          {rankingLoading ? (
            <div className="ranking-loading">로딩 중..</div>
          ) : (
            <ul className="ranking-list">
              {(rankingType === 'level' ? levelRanking : pointsRanking).map((user, index) => (
                <li key={user._id || index} className="ranking-item">
                  <div className="ranking-number">
                    {index === 0 && <i className="fas fa-medal" style={{ color: '#FFD700' }}></i>}
                    {index === 1 && <i className="fas fa-medal" style={{ color: '#C0C0C0' }}></i>}
                    {index === 2 && <i className="fas fa-medal" style={{ color: '#CD7F32' }}></i>}
                    {index > 2 && <span className="rank-number">{index + 1}</span>}
                  </div>
                  <div className="ranking-user-info">
                    <ImageWithFallback
                      src={`/levels/level${user.level || 1}.gif`} 
                      alt={`Level ${user.level || 1}`} 
                      className="ranking-level-image"
                    />
                    <span className="ranking-username">{user.nickname || user.username}</span>
                  </div>
                  <div className="ranking-value">
                    {rankingType === 'level' ? (
                      <span className="ranking-level">LV.{user.level || 1}</span>
                    ) : (
                      <span className="ranking-points">{(user.points || 0).toLocaleString()}P</span>
                    )}
                  </div>
                </li>
              ))}
              {!rankingLoading && (rankingType === 'level' ? levelRanking : pointsRanking).length === 0 && (
                <li className="ranking-empty">랭킹 데이터가 없습니다.</li>
              )}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
