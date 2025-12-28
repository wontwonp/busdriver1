import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'
import api from '../utils/api'
import './MobileMenu.css'

const MobileMenu = ({ isLoggedIn, onLogout, isOpen, onClose }) => {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState(null)
  const [levelProgress, setLevelProgress] = useState(null)
  const [notificationCount, setNotificationCount] = useState(0)
  const [showTooltip, setShowTooltip] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  // 15초마다 애니메이션 반복
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1)
    }, 15000) // 15초

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isLoggedIn && isOpen) {
      fetchUserInfo()
    } else {
      setUserInfo(null)
      setLevelProgress(null)
    }
  }, [isLoggedIn, isOpen])

  useEffect(() => {
    if (isLoggedIn && userInfo && isOpen) {
      fetchLevelProgress()
    }
  }, [isLoggedIn, userInfo, isOpen])

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      setUserInfo(response.data)
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
    }
  }

  const fetchLevelProgress = async () => {
    try {
      const response = await api.get('/level/progress')
      if (response.data) {
        setLevelProgress(response.data)
      }
    } catch (error) {
      console.error('레벨 진행률 로딩 실패:', error)
    }
  }

  if (!isOpen) return null
  
  return (
    <>
      <div className="mobile-menu-overlay" onClick={onClose}></div>
      <div className="mobile-menu open">
        <div className="mobile-menu-header">
          <div className="mobile-logo-section">
            <Link to="/" className="mobile-logo" onClick={onClose}>
              <ImageWithFallback
                src="/logo.gif"
                alt="tototalk"
                fallbackText="토토톡"
                style={{ height: '30px' }}
              />
            </Link>
            <p className="mobile-tagline" key={animationKey}>
              {['성인전용 커뮤니티입니다.', '미성년자 관련정보 및 불법 성매매 광고를 일절 다루지않습니다.'].map((line, lineIndex) => (
                <span key={lineIndex} className="mobile-tagline-line">
                  {line.split('').map((char, charIndex) => (
                    <span
                      key={charIndex}
                      className="mobile-tagline-char"
                      style={{
                        animationDelay: `${(lineIndex * line.length + charIndex) * 0.05}s`
                      }}
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </span>
              ))}
            </p>
          </div>
          <button className="mobile-menu-close" onClick={onClose}>×</button>
        </div>
      
      {!isLoggedIn ? (
        <div className="mobile-auth">
          <Link to="/login" onClick={onClose}>로그인</Link>
          <Link to="/signup" onClick={onClose}>회원가입</Link>
          <a href="#find-info" onClick={onClose}>정보찾기</a>
        </div>
      ) : (
        <>
          {userInfo && (
            <div className="mobile-user-info">
              <div className="mobile-user-profile">
                <div className="mobile-user-level-section">
                  <ImageWithFallback
                    src={userInfo.shopLevel && userInfo.shopLevel > 0 
                      ? '/levels/shop.gif' 
                      : `/levels/level${userInfo.level || 1}.gif`}
                    alt={userInfo.shopLevel && userInfo.shopLevel > 0 
                      ? 'Shop' 
                      : `Level ${userInfo.level || 1}`}
                    className="mobile-user-level-image"
                  />
                  <div className="mobile-user-level-info">
                    <div className="mobile-user-name-wrapper">
                      <div className="mobile-user-name">{userInfo.nickname || userInfo.username}</div>
                      <a href="#alarm" className="mobile-notification-icon-wrapper">
                        <i className="fas fa-bell"></i>
                        {notificationCount > 0 && (
                          <span className="mobile-notification-badge">{notificationCount}</span>
                        )}
                      </a>
                    </div>
                  </div>
                </div>
                {isLoggedIn && levelProgress && (!userInfo?.shopLevel || userInfo.shopLevel === 0) && (
                  <div className="mobile-experience-bar-container">
                    <div 
                      className="mobile-experience-bar-wrapper"
                      onMouseEnter={() => {
                        setShowTooltip(true)
                        fetchLevelProgress()
                      }}
                      onMouseLeave={() => setShowTooltip(false)}
                    >
                      <div 
                        className="mobile-experience-bar-fill" 
                        style={{ width: `${levelProgress.experience || 0}%` }}
                      ></div>
                    </div>
                    {showTooltip && levelProgress.nextLevel && levelProgress.progress && levelProgress.requirements && (
                      <div 
                        className="mobile-experience-tooltip"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                      >
                        <div className="mobile-tooltip-title">
                          Lv.{levelProgress.level} → Lv.{levelProgress.nextLevel} 달성 조건
                        </div>
                        <div className="mobile-tooltip-content">
                          {levelProgress.requirements.days > 0 && (
                            <div className="mobile-tooltip-item">
                              <span className="mobile-tooltip-label">일수:</span>
                              <span className="mobile-tooltip-value">
                                {levelProgress.progress.days.current} / {levelProgress.progress.days.required}일
                                {levelProgress.progress.days.required > levelProgress.progress.days.current ? (
                                  <span className="mobile-tooltip-remaining">
                                    ({levelProgress.progress.days.required - levelProgress.progress.days.current}일 더 필요)
                                  </span>
                                ) : (
                                  <span className="mobile-tooltip-completed">✓ 완료</span>
                                )}
                              </span>
                            </div>
                          )}
                          {levelProgress.requirements.points > 0 && (
                            <div className="mobile-tooltip-item">
                              <span className="mobile-tooltip-label">포인트:</span>
                              <span className="mobile-tooltip-value">
                                {levelProgress.progress.points.current.toLocaleString()} / {levelProgress.progress.points.required.toLocaleString()}P
                                {levelProgress.progress.points.required > levelProgress.progress.points.current ? (
                                  <span className="mobile-tooltip-remaining">
                                    ({(levelProgress.progress.points.required - levelProgress.progress.points.current).toLocaleString()}P 더 필요)
                                  </span>
                                ) : (
                                  <span className="mobile-tooltip-completed">✓ 완료</span>
                                )}
                              </span>
                            </div>
                          )}
                          {levelProgress.requirements.posts > 0 && (
                            <div className="mobile-tooltip-item">
                              <span className="mobile-tooltip-label">게시글:</span>
                              <span className="mobile-tooltip-value">
                                {levelProgress.progress.posts.current} / {levelProgress.progress.posts.required}개
                                {levelProgress.progress.posts.required > levelProgress.progress.posts.current ? (
                                  <span className="mobile-tooltip-remaining">
                                    ({levelProgress.progress.posts.required - levelProgress.progress.posts.current}개 더 필요)
                                  </span>
                                ) : (
                                  <span className="mobile-tooltip-completed">✓ 완료</span>
                                )}
                              </span>
                            </div>
                          )}
                          {levelProgress.requirements.comments > 0 && (
                            <div className="mobile-tooltip-item">
                              <span className="mobile-tooltip-label">댓글:</span>
                              <span className="mobile-tooltip-value">
                                {levelProgress.progress.comments.current} / {levelProgress.progress.comments.required}개
                                {levelProgress.progress.comments.required > levelProgress.progress.comments.current ? (
                                  <span className="mobile-tooltip-remaining">
                                    ({levelProgress.progress.comments.required - levelProgress.progress.comments.current}개 더 필요)
                                  </span>
                                ) : (
                                  <span className="mobile-tooltip-completed">✓ 완료</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="mobile-experience-text">
                      {levelProgress.experience?.toFixed(1) || 0}%
                    </div>
                  </div>
                )}
                <div className="mobile-user-points-box">
                  <span className="mobile-points-label">보유포인트</span>
                  <span className="mobile-points-value">{(userInfo.points || 0).toLocaleString()}P</span>
                </div>
              </div>
              <Link 
                to="/myinfo" 
                className="mobile-btn-profile" 
                onClick={onClose}
              >
                프로필
              </Link>
              <div className="mobile-user-menu">
                <div className="mobile-menu-row">
                  <a href="#message" className="mobile-menu-link-box" onClick={onClose}>쪽지</a>
                  <Link 
                    to="/" 
                    className="mobile-menu-link-box" 
                    onClick={onClose}
                  >
                    홈으로
                  </Link>
                </div>
                <div className="mobile-menu-row">
                  <Link to="/money-log" className="mobile-menu-link-box" onClick={onClose}>머니로그</Link>
                  <a href="#scrap" className="mobile-menu-link-box" onClick={onClose}>스크랩</a>
                </div>
              </div>
              <button 
                type="button"
                className="mobile-btn-logout"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (onLogout) {
                    onLogout()
                  }
                  if (onClose) {
                    onClose()
                  }
                }}
              >
                로그아웃
              </button>
            </div>
          )}
        </>
      )}

      <nav className="mobile-nav">
        <ul className="mobile-nav-list">
          <li>
            <Link to="/shops" onClick={onClose}>업소찾기</Link>
          </li>
          <li><Link to="/scam" onClick={onClose}>먹튀신고</Link></li>
          <li>
            <Link to="/free-board" onClick={onClose}>커뮤니티</Link>
            <ul>
              <li><Link to="/free-board" onClick={onClose}>자유게시판</Link></li>
              <li><Link to="/review-board" onClick={onClose}>후기게시판</Link></li>
              <li><Link to="/qna-board" onClick={onClose}>질문답변</Link></li>
              <li><Link to="/gallery" onClick={onClose}>갤러리</Link></li>
              <li><Link to="/sister-diary" onClick={onClose}>언니일기</Link></li>
              <li><Link to="/manager-diary" onClick={onClose}>실장일기</Link></li>
              <li><Link to="/find-manager" onClick={onClose}>매니저찾기</Link></li>
              <li><Link to="/recruitment" onClick={onClose}>구인(매니저&실장)</Link></li>
            </ul>
          </li>
          <li><Link to="/event" onClick={onClose}>이벤트</Link></li>
          <li>
            <Link to="/lottery-bag" onClick={onClose}>복권</Link>
            <ul>
              <li><Link to="/lottery-bag" onClick={onClose}>복권 가방</Link></li>
              <li><Link to="/winner-list" onClick={onClose}>당첨자 리스트</Link></li>
            </ul>
          </li>
          <li>
            <Link to="/point-exchange" onClick={onClose}>포인트존</Link>
            <ul>
              <li><Link to="/point-exchange" onClick={onClose}>포인트 교환</Link></li>
              <li><Link to="/gift-exchange" onClick={onClose}>기프트콘 교환</Link></li>
              <li><Link to="/point-trade" onClick={onClose}>포인트 거래</Link></li>
              <li><Link to="/point-baccarat1" onClick={onClose}>포인트 바카라1</Link></li>
              <li><Link to="/point-baccarat2" onClick={onClose}>포인트 바카라2</Link></li>
            </ul>
          </li>
          <li><Link to="/attendance" onClick={onClose}>출석체크</Link></li>
          <li><Link to="/black-list" onClick={onClose}>블랙조회</Link></li>
          <li>
            <Link to="/notice" onClick={onClose}>고객센터</Link>
            <ul>
              <li><Link to="/notice" onClick={onClose}>공지사항</Link></li>
              <li><Link to="/inquiry" onClick={onClose}>1:1 문의</Link></li>
            </ul>
          </li>
        </ul>
      </nav>

      </div>
    </>
  )
}

export default MobileMenu
