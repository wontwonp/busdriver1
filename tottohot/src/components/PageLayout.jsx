import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import NeonLogo from './NeonLogo'
import Sidebar from './Sidebar'
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

const noticeList = [
  { title: '[필독] 2025년 로얄토토 보증업체 제휴종료 리스트', comments: 125 },
  { title: '2025년 새해 인사', comments: 172 },
  { title: '[긴급공지] 로얄토토을 복제사이트 관련 입장문', comments: 189 },
  { title: '[중요] 로얄토토 사칭관련 안내문', comments: 76 },
  { title: '일부 회원분들의 접속 차단 관련 안내', comments: 134 },
  { title: '2024년 새해 인사', comments: 269 }
]

const events = [
  { title: '크리스마스 이벤트', comments: 135, date: '25.12.22' },
  { title: '묻지마 돌발 이벤트!', comments: 61, date: '25.12.21' },
  { title: 'EPL 맨시티 vs 웨스...', comments: 41, date: '25.12.17' },
  { title: '진짜 환전 가능한 꽁머니 1만 지급', comments: 142, date: '24.02.08' },
  { title: '신규 가입머니 2만원 (스포츠)', comments: 98, date: '24.02.08' }
]

const rankingLevel = ['사용자1', '사용자2', '사용자3', '사용자4', '사용자5']

const PageLayout = ({ children }) => {
  const [currentNoticeIndex, setCurrentNoticeIndex] = useState(0)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const isLoggedInStorage = localStorage.getItem('isLoggedIn') === 'true'
    const shouldBeLoggedIn = !!(token || isLoggedInStorage)
    setIsLoggedIn(shouldBeLoggedIn)
    
    // 토큰이 있으면 사용자 정보 확인
    if (shouldBeLoggedIn && token) {
      try {
        await api.get('/auth/me')
      } catch (error) {
        // 토큰이 유효하지 않으면 로그아웃 처리
        if (error.response?.status === 401) {
          setIsLoggedIn(false)
          localStorage.removeItem('token')
          localStorage.removeItem('isLoggedIn')
        }
      }
    }
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
        {/* 기존 left-column 제거 - Sidebar로 대체됨 */}

        <section className="content">
          {children}
        </section>
      </main>
    </div>
  )
}

export default PageLayout

