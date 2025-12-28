import React, { useState, useEffect } from 'react'
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom'
import api from '../../utils/api'
import PostManagement from './PostManagement'
import BannerManagement from './BannerManagement'
import NoticeManagement from './NoticeManagement'
import EventManagement from './EventManagement'
import RankingManagement from './RankingManagement'
import AboutManagement from './AboutManagement'
import PenaltyManagement from './PenaltyManagement'
import GuaranteeCompanyManagement from './GuaranteeCompanyManagement'
import ScamSiteManagement from './ScamSiteManagement'
import ScamVerificationManagement from './ScamVerificationManagement'
import ReviewBoardManagement from './ReviewBoardManagement'
import BlackListManagement from './BlackListManagement'
import SportsAnalysisManagement from './SportsAnalysisManagement'
import SportsAnalysisBoardManagement from './SportsAnalysisBoardManagement'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [adminInfo, setAdminInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState({
    member: false,
    scamVerification: false,
    tipster: false,
    community: false,
    promotion: false
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      navigate('/admin/login')
      return
    }

    try {
      const response = await api.get('/admin/me')
      setAdminInfo(response.data.admin)
    } catch (error) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminInfo')
      navigate('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminInfo')
    navigate('/admin/login')
  }

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => {
      // 아코디언 효과: 다른 메뉴는 모두 닫고, 클릭한 메뉴만 토글
      const newState = {
        member: false,
        scamVerification: false,
        tipster: false,
        community: false,
        promotion: false
      }
      // 현재 열려있지 않으면 열기, 열려있으면 닫기
      newState[menuKey] = !prev[menuKey]
      return newState
    })
  }

  const handleExternalLink = (url) => {
    window.location.href = url
  }

  if (loading) {
    return <div className="admin-loading">로딩 중...</div>
  }

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>로얄토토 관리자</h2>
          <div className="admin-info">
            <p>{adminInfo?.email}</p>
            <button onClick={handleLogout} className="logout-btn">로그아웃</button>
          </div>
        </div>
        
        <nav className="admin-nav">
          <Link to="/admin" className={`nav-item ${location.pathname === '/admin' ? 'active' : ''}`}>
            대시보드
          </Link>
          
          <div className="nav-menu-item">
            <div className="nav-menu-header" onClick={() => toggleMenu('member')}>
              <span>회원관리</span>
              <span className={`menu-arrow ${expandedMenus.member ? 'expanded' : ''}`}>▼</span>
            </div>
            {expandedMenus.member && (
              <div className="nav-submenu">
                {/* 회원관리 하위 메뉴는 추후 추가 예정 */}
              </div>
            )}
          </div>

          <Link to="/admin/guarantee-company" className={`nav-item ${location.pathname.includes('/admin/guarantee-company') ? 'active' : ''}`}>
            보증업체관리
          </Link>

          <div className="nav-menu-item">
            <div className="nav-menu-header" onClick={() => toggleMenu('scamVerification')}>
              <span>먹튀검증관리</span>
              <span className={`menu-arrow ${expandedMenus.scamVerification ? 'expanded' : ''}`}>▼</span>
            </div>
            {expandedMenus.scamVerification && (
              <div className="nav-submenu">
                <Link 
                  to="/admin/scam-site" 
                  className={`nav-subitem ${location.pathname.includes('/admin/scam-site') ? 'active' : ''}`}
                >
                  먹튀사이트
                </Link>
                <Link 
                  to="/admin/scam-verification" 
                  className={`nav-subitem ${location.pathname.includes('/admin/scam-verification') ? 'active' : ''}`}
                >
                  먹튀검증
                </Link>
                <Link 
                  to="/admin/review-board" 
                  className={`nav-subitem ${location.pathname.includes('/admin/review-board') ? 'active' : ''}`}
                >
                  먹튀검증
                </Link>
              </div>
            )}
          </div>

          <div className="nav-menu-item">
            <div className="nav-menu-header" onClick={() => toggleMenu('tipster')}>
              <span>팁스터존관리</span>
              <span className={`menu-arrow ${expandedMenus.tipster ? 'expanded' : ''}`}>▼</span>
            </div>
            {expandedMenus.tipster && (
              <div className="nav-submenu">
                <Link 
                  to="/admin/sports-analysis" 
                  className={`nav-subitem ${location.pathname.includes('/admin/sports-analysis') ? 'active' : ''}`}
                >
                  경기등록관리
                </Link>
                <Link 
                  to="/admin/sports-analysis-board" 
                  className={`nav-subitem ${location.pathname.includes('/admin/sports-analysis-board') ? 'active' : ''}`}
                >
                  스포츠분석게시판
                </Link>
                <a 
                  href="/toto-guide" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/toto-guide')
                  }}
                >
                  토토가이드
                </a>
              </div>
            )}
          </div>

          <div className="nav-menu-item">
            <div className="nav-menu-header" onClick={() => toggleMenu('community')}>
              <span>커뮤니티 관리</span>
              <span className={`menu-arrow ${expandedMenus.community ? 'expanded' : ''}`}>▼</span>
            </div>
            {expandedMenus.community && (
              <div className="nav-submenu">
                <a 
                  href="/free-board" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/free-board')
                  }}
                >
                  자유게시판 관리
                </a>
                <Link 
                  to="/admin/review-board" 
                  className={`nav-subitem ${location.pathname.includes('/admin/review-board') ? 'active' : ''}`}
                >
                  후기게시판 관리
                </Link>
                <a 
                  href="/humor" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/humor')
                  }}
                >
                  유머이슈관리
                </a>
                <a 
                  href="/penalty-list" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/penalty-list')
                  }}
                >
                  패널티명단관리
                </a>
                <a 
                  href="/sports-news" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/sports-news')
                  }}
                >
                  스포츠뉴스관리
                </a>
                <a 
                  href="/gallery" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/gallery')
                  }}
                >
                  은꼴모음관리
                </a>
              </div>
            )}
          </div>

          <div className="nav-menu-item">
            <div className="nav-menu-header" onClick={() => toggleMenu('promotion')}>
              <span>홍보센터 관리</span>
              <span className={`menu-arrow ${expandedMenus.promotion ? 'expanded' : ''}`}>▼</span>
            </div>
            {expandedMenus.promotion && (
              <div className="nav-submenu">
                <a 
                  href="/free-money-promo" 
                  className="nav-subitem"
                  onClick={(e) => {
                    e.preventDefault()
                    handleExternalLink('/free-money-promo')
                  }}
                >
                  꽁머니홍보
                </a>
              </div>
            )}
          </div>

          <Link to="/admin/black-list" className={`nav-item ${location.pathname.includes('/admin/black-list') ? 'active' : ''}`}>
            블랙조회 관리
          </Link>
          <Link to="/admin/posts" className={`nav-item ${location.pathname.includes('/admin/posts') ? 'active' : ''}`}>
            게시판 관리
          </Link>
          <Link to="/admin/banners" className={`nav-item ${location.pathname.includes('/admin/banners') ? 'active' : ''}`}>
            배너 관리
          </Link>
          <Link to="/admin/notices" className={`nav-item ${location.pathname.includes('/admin/notices') ? 'active' : ''}`}>
            공지사항 관리
          </Link>
          <Link to="/admin/events" className={`nav-item ${location.pathname.includes('/admin/events') ? 'active' : ''}`}>
            이벤트 관리
          </Link>
          <Link to="/admin/rankings" className={`nav-item ${location.pathname.includes('/admin/rankings') ? 'active' : ''}`}>
            랭킹 관리
          </Link>
          <Link to="/admin/about" className={`nav-item ${location.pathname.includes('/admin/about') ? 'active' : ''}`}>
            소개 관리
          </Link>
          <Link to="/admin/penalties" className={`nav-item ${location.pathname.includes('/admin/penalties') ? 'active' : ''}`}>
            패널티 관리
          </Link>
        </nav>
      </aside>

      <main className="admin-content">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/black-list" element={<BlackListManagement />} />
          <Route path="/sports-analysis" element={<SportsAnalysisManagement />} />
          <Route path="/sports-analysis-board" element={<SportsAnalysisBoardManagement />} />
          <Route path="/posts" element={<PostManagement />} />
          <Route path="/banners" element={<BannerManagement />} />
          <Route path="/notices" element={<NoticeManagement />} />
          <Route path="/events" element={<EventManagement />} />
          <Route path="/rankings" element={<RankingManagement />} />
          <Route path="/about" element={<AboutManagement />} />
          <Route path="/penalties" element={<PenaltyManagement />} />
          <Route path="/guarantee-company" element={<GuaranteeCompanyManagement />} />
          <Route path="/scam-site" element={<ScamSiteManagement />} />
          <Route path="/scam-verification" element={<ScamVerificationManagement />} />
          <Route path="/review-board" element={<ReviewBoardManagement />} />
        </Routes>
      </main>
    </div>
  )
}

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    newMembersToday: 0,
    totalPosts: 0,
    totalCompanies: 0,
    ongoingEvents: 0,
    pendingInquiries: 0,
    totalBlackListPosts: 0,
    unansweredBlackListCount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats')
      setStats(response.data)
    } catch (error) {
      console.error('통계 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-home">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="dashboard-home">
      <h1>대시보드</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>전체 회원</h3>
            <p className="stat-number">{stats.totalMembers}</p>
            <span className="stat-sub">활성: {stats.activeMembers}</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>전체 게시글</h3>
            <p className="stat-number">{stats.totalPosts}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>보증업체</h3>
            <p className="stat-number">{stats.totalCompanies}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-info">
            <h3>진행 중인 이벤트</h3>
            <p className="stat-number">{stats.ongoingEvents}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <h3>답변 대기 문의</h3>
            <p className="stat-number">{stats.pendingInquiries}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <h3>오늘 가입자</h3>
            <p className="stat-number">{stats.newMembersToday}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚫</div>
          <div className="stat-info">
            <h3>블랙조회</h3>
            <p className="stat-number">{stats.totalBlackListPosts}</p>
            <span className="stat-sub">미답변: {stats.unansweredBlackListCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard

