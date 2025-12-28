import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import NeonLogo from '../components/NeonLogo'
import Sidebar from '../components/Sidebar'
import '../App.css'

const navItems = [
  { 
    label: '공식보증업체', 
    submenu: [
      { label: '보증업체', path: '/guarantee-company' }
    ] 
  },
  { 
    label: '먹튀검증', 
    submenu: [
      { label: '먹튀사이트', path: '/mttip' },
      { label: '먹튀검증', path: '/scam-verification' }
    ] 
  },
  { 
    label: '팁스터존', 
    submenu: [
      { label: '스포츠분석', path: '/sports-analysis' },
      { label: '토토가이드', path: '/toto-guide' }
    ] 
  },
  { 
    label: '커뮤니티', 
    submenu: [
      { label: '자유게시판', path: '/free-board' },
      { label: '후기게시판', path: '/review-board' }
    ] 
  },
  { 
    label: '홍보센터', 
    submenu: [
      { label: '꽁머니홍보', path: '/free-money-promo' },
      { label: '일반홍보', path: '/general-promo' }
    ] 
  },
  { 
    label: '포인트존', 
    submenu: [
      { label: '로얄토토이벤트', path: '/events' },
      { label: '꽁머니교환', path: '/gift-exchange' },
      { label: '기프티콘교환', path: '/gift-card-exchange' },
      { label: '출석체크', path: '/attendance' },
      { label: '오즈게임', path: '/odds-game' },
      { label: '포인트안내', path: '/point-info' }
    ] 
  },
  { 
    label: '블랙조회', 
    submenu: [
      { label: '블랙조회', path: '/black-list' }
    ] 
  },
  { 
    label: '고객센터', 
    submenu: [
      { label: '공지사항', path: '/notices' },
      { label: '1:1문의', path: '/inquiry' }
    ] 
  }
]

const events = [
  { title: '크리스마스 이벤트 ( 준비중 )', date: '25.12.22', comments: 134 },
  { title: '묻지마 돌발 이벤트!', date: '25.12.21', comments: 61 },
  { title: 'EPL 맨시티 v 웨스트햄 언오버', date: '25.12.17', comments: 41 },
  { title: 'V리그 여자부 흥국생명 v 페퍼저축은행', date: '25.12.17', comments: 32 },
  { title: '아침 출근길 따뜻한 아메리카노 한잔! 작은 선물 ❤️', date: '25.12.15', comments: 34 }
]

const quickActions = [
  { label: '먹튀 신고', color: '#f4525f', desc: '먹튀신고 및 먹튀사이트를 확인하세요.' },
  { label: '꽁머니 교환', color: '#ffb733', desc: '로얄토토 포인트를 현금화 해요.' },
  { label: '출석체크', color: '#6cc56f', desc: '출석체크하고 포인트를 모으세요.' }
]

const noticeList = [
  { title: '[필독] 2025년 로얄토토 보증업체 제휴종료 리스트', comments: 125 },
  { title: '2025년 새해 인사', comments: 172 },
  { title: '[긴급공지] 로얄토토을 복제사이트 관련 입장문', comments: 189 },
  { title: '[중요] 로얄토토 사칭관련 안내문', comments: 76 },
  { title: '일부 회원분들의 접속 차단 관련 안내', comments: 134 },
  { title: '2024년 새해 인사', comments: 269 }
]

const banners = [
  '레드불 신규 최대 40% 매충 15% 페이백 10% 코드: HOT',
  '메타카지노 타이밍 따라 승률 결정! 코드: HOT',
  'SHOTBET 먹튀이력 0% 최상위 단체 베팅',
  '지니카지노 스포츠/카지노/홀덤 한 번에',
  '부자벳 신규회원 무제재 코드 HOT',
  'URUS 신규첫충 40% 페이백 10%',
  'Revue 라이브카지노',
  '인생한방 스포/카지노/홀덤 지원'
]

const rankingLevel = [
  '은둥', '파스마이너스원', '윤떼요', '완전게임', '다영샷',
  '티슈는토리도리', '블런틴', '미얼은', '홍박사', '여름독사'
]

const rankingPoint = [
  '13,119,588P', '2,366,927P', '1,561,479P', '1,380,100P', '1,344,096P',
  '1,272,629P', '1,272,629P', '1,203,937P', '1,172,829P', '1,094,623P'
]

const freeMoneyPosts = [
  { title: '온카랜드 이용 시 꽁머니 무한 지급!', views: 177, date: '25.03.01' },
  { title: '첫충 없이 환전 가능한 가입머니 최대...', views: 216, date: '24.09.21' },
  { title: '2024년 8월, 첫 가입 꽁머니와 신규...', views: 111, date: '24.08.21' },
  { title: '푸우푸우 가입머니 2만', views: 106, date: '24.07.11' },
  { title: '로얄토토 회원이라면 기프티콘 100% 지급', views: 57, date: '24.06.19' },
  { title: '진짜 환전 가능한 꽁머니 1만 지급', views: 142, date: '24.02.08' },
  { title: '신규 가입머니 2만원 (스포츠)', views: 98, date: '24.02.08' },
  { title: '20000만꽁 신규40% 카지노 슬롯 인...', views: 63, date: '24.01.14' },
  { title: '바오슬롯 신규가입 2만쿠폰지급이벤 1...', views: 45, date: '23.12.20' },
  { title: '슈퍼P슬롯 가입머니 쿠폰 3만원', views: 39, date: '23.12.19' },
  { title: '가입머니 5만원 윌리엄 꽁머니 즉시 지', views: 55, date: '23.12.07' },
  { title: '가입머니 1만원 꽁머니 쇼핑', views: 52, date: '23.11.30' }
]

const scamSites = [
  { name: 'WO', description: '환전신청후 45분째', image: '' },
  { name: 'Topx', description: '사이트 1주일 넘게...', image: '' },
  { name: 'korwin', description: '검사완료면 먹튀...', image: '' },
  { name: 'Ktwin', description: '먹튀입니다', image: '' },
  { name: 'XXhacsino1', description: '(재업) XXhacsino1...', image: '' }
]

function HomePage() {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [aboutData, setAboutData] = useState({
    badge: '국내 최대 규모 NO.1',
    title: '로얄토토 소개',
    description: '로얄토토은 국내 최대 규모의 방대한 정보를 보유하고 있는 먹튀 검증 커뮤니티입니다. 안녕하세요.',
    content: '',
    image: ''
  })
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetchAbout()
    checkAuth()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      console.log('로그인 시도:', loginForm.username)
      const response = await api.post('/auth/login', {
        username: loginForm.username,
        password: loginForm.password
      })

      console.log('로그인 성공:', response.data)
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('isLoggedIn', 'true')
      setIsLoggedIn(true)
      setLoginForm({ username: '', password: '' })
      alert('로그인 성공!')
      window.location.reload()
    } catch (error) {
      console.error('로그인 오류:', error)
      console.error('응답 데이터:', error.response?.data)
      console.error('에러 상태:', error.response?.status)
      console.error('에러 메시지:', error.message)
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        setLoginError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
      } else if (error.response?.status === 404) {
        setLoginError('로그인 API를 찾을 수 없습니다. 백엔드 서버를 확인해주세요.')
      } else {
        setLoginError(error.response?.data?.message || error.message || '로그인에 실패했습니다.')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('isLoggedIn')
    setIsLoggedIn(false)
    window.location.reload()
  }

  const fetchAbout = async () => {
    try {
      const response = await api.get('/about')
      if (response.data) {
        setAboutData(response.data)
      }
    } catch (error) {
      console.error('소개 정보 조회 오류:', error)
    }
  }

  const nextNotice = () => {
    setCurrentNoticeIndex(prev => (prev + 1) % noticeList.length)
  }

  const prevNotice = () => {
    setCurrentNoticeIndex(prev => (prev - 1 + noticeList.length) % noticeList.length)
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-left">
          <span>⭐ 즐겨찾기 추가</span>
          <span className="divider">·</span>
          <span>새로고침</span>
          <span className="divider">·</span>
          <span>2025년 12월 23일</span>
        </div>
        <div className="topbar-right">
          <div className="search">
            <input placeholder="원하는 검색어를 입력하세요." />
            <button aria-label="검색">🔍</button>
          </div>
          <button className="btn-ghost">회원가입</button>
          <button className="btn-ghost">로그인</button>
          <button className="btn-menu">☰</button>
        </div>
      </div>

      <header className="header">
        <nav className="nav-top">
          <Link to="/" className="logo-area">
            <NeonLogo />
            <span className="slogan">먹튀검증사이트 로얄토토</span>
          </Link>
          {navItems.map(item => (
            <div className="nav-item" key={item.label}>
              <span>{item.label}</span>
              <div className="nav-dropdown">
                {item.submenu.map(sub => (
                  <Link key={sub.label || sub} to={sub.path || '#'} className="nav-dropdown-link">
                    {sub.label || sub}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </header>

      <main className="layout">
        <Sidebar 
          isLoggedIn={isLoggedIn} 
          onLogin={() => {
            setIsLoggedIn(true)
            checkAuth()
          }}
          onLogout={handleLogout}
        />

        <section className="content">
          <div className="quick-actions">
            {quickActions.map(action => (
              <div className="quick-card" key={action.label}>
                <div className="quick-icon" style={{ background: action.color }}>★</div>
                <div className="quick-body">
                  <div className="quick-title">{action.label}</div>
                  <div className="quick-desc">{action.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="official-container">
            <div className="official">
              <div className="official-title">로얄토토 공식보증업체</div>
              <p>로얄토토의 모든 배너는 인증된 보증업체 입니다. 사고 발생시 전액 보상!</p>
            </div>

            <div className="ad-grid">
              {banners.map((text, idx) => (
                <div className="ad-card" key={idx}>
                  <div className="ad-overlay">{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="promotion-section">
            <div className="promotion-header">
              <div className="promotion-nav">
                <button className="promotion-nav-item active">꽁머니홍보</button>
                <button className="promotion-nav-item">일반홍보</button>
                <button className="promotion-nav-item">구인구직</button>
                <button className="promotion-nav-item">자유게시판</button>
                <button className="promotion-nav-item">유머 & 이슈</button>
                <button className="promotion-nav-item">스포츠포럼</button>
                <button className="promotion-nav-item">은꼴모음</button>
              </div>
            </div>
            <div className="promotion-content">
              <div className="promotion-list">
                {freeMoneyPosts.map((post, idx) => (
                  <div key={idx} className="promotion-item">
                    <span className="promotion-badge">[꽁머니홍보]</span>
                    <a href="#" className="promotion-title">{post.title}</a>
                    <span className="promotion-views">+{post.views}</span>
                    <span className="promotion-date">{post.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="scam-list-section">
            <div className="scam-list-header">
              <h2 className="scam-list-title">먹튀리스트</h2>
              <a href="#" className="scam-list-more">More →</a>
            </div>
            <div className="scam-list-grid">
              {scamSites.map((site, idx) => (
                <div key={idx} className="scam-card">
                  <div className="scam-card-new">New</div>
                  <div className="scam-card-content">
                    <div className="scam-card-name">{site.name}</div>
                    <div className="scam-card-desc">{site.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero">
            <div className="hero-content">
              {aboutData.image && (
                <div className="hero-image">
                  <img src={aboutData.image} alt="로얄토토 소개" />
                </div>
              )}
              <div className="hero-badge">{aboutData.badge}</div>
              <h1 className="hero-main-title">{aboutData.title}</h1>
              <p className="hero-description">
                {aboutData.description}
              </p>
              {aboutData.content && (
                <div className="hero-content-text">
                  {aboutData.content}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage

