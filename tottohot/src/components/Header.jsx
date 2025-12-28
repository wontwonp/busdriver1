import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'
import './Header.css'

const Header = ({ isLoggedIn, onLogout, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [animationKey, setAnimationKey] = useState(0)

  const handleSearch = (e) => {
    e.preventDefault()
    // 검색 기능 구현
    console.log('검색:', searchQuery)
  }

  // 15초마다 애니메이션 반복
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationKey(prev => prev + 1)
    }, 15000) // 15초

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="header">
      <div className="header-bottom">
        <div className="logo-section">
          {onMenuClick && (
            <button className="btn-hamburger" onClick={onMenuClick} aria-label="메뉴 열기">
              <i className="fas fa-bars"></i>
            </button>
          )}
          <Link to="/" className="logo">
            <ImageWithFallback
              src="/logo.gif"
              alt="tototalk"
              fallbackText="토토톡"
              style={{ height: '55px' }}
            />
          </Link>
          <p className="tagline" key={animationKey}>
            {['성인전용 커뮤니티입니다.', '미성년자 관련정보 및 불법 성매매 광고를 일절 다루지않습니다.'].map((line, lineIndex) => (
              <span key={lineIndex} className="tagline-line">
                {line.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className="tagline-char"
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
        <nav className="gnb">
          <ul className="gnb-list">
            <li className="has-submenu">
              <Link to="/shops">업소찾기</Link>
              <ul className="submenu">
                <li><Link to="/shops?region=서울">서울</Link></li>
                <li><Link to="/shops?region=부산">부산</Link></li>
                <li><Link to="/shops?region=대구">대구</Link></li>
                <li><Link to="/shops?region=인천">인천</Link></li>
                <li><Link to="/shops?region=광주">광주</Link></li>
                <li><Link to="/shops?region=대전">대전</Link></li>
                <li><Link to="/shops?region=울산">울산</Link></li>
                <li><Link to="/shops?region=세종">세종</Link></li>
                <li><Link to="/shops?region=경기도">경기도</Link></li>
                <li><Link to="/shops?region=충청북도">충청북도</Link></li>
                <li><Link to="/shops?region=충청남도">충청남도</Link></li>
                <li><Link to="/shops?region=전라남도">전라남도</Link></li>
                <li><Link to="/shops?region=경상북도">경상북도</Link></li>
                <li><Link to="/shops?region=경상남도">경상남도</Link></li>
                <li><Link to="/shops?region=강원도">강원도</Link></li>
                <li><Link to="/shops?region=전라북도">전라북도</Link></li>
                <li><Link to="/shops?region=제주도">제주도</Link></li>
                <li><Link to="/shops">전체보기</Link></li>
              </ul>
            </li>
            <li><Link to="/scam">먹튀사이트</Link></li>
            <li className="has-submenu">
              <Link to="/free-board">커뮤니티</Link>
              <ul className="submenu">
                <li><Link to="/free-board">자유게시판</Link></li>
                <li><Link to="/review-board">후기게시판</Link></li>
                <li><Link to="/qna-board">질문답변</Link></li>
                <li><Link to="/gallery">갤러리</Link></li>
                <li><Link to="/sister-diary">언니일기</Link></li>
                <li><Link to="/manager-diary">실장일기</Link></li>
                <li><Link to="/find-manager">매니저찾기</Link></li>
                <li><Link to="/recruitment">구인(매니저&실장)</Link></li>
              </ul>
            </li>
            <li><Link to="/event">이벤트</Link></li>
            <li className="has-submenu">
              <Link to="/lottery-bag">복권</Link>
              <ul className="submenu">
                <li><Link to="/lottery-bag">복권 가방</Link></li>
                <li><Link to="/winner-list">당첨자 리스트</Link></li>
              </ul>
            </li>
            <li className="has-submenu">
              <Link to="/point-exchange">포인트존</Link>
              <ul className="submenu">
                <li><Link to="/point-exchange">포인트 교환</Link></li>
                <li><Link to="/gift-exchange">기프티콘 교환</Link></li>
                <li><Link to="/point-trade">포인트 거래</Link></li>
                <li><Link to="/point-baccarat1">포인트 바카라 1</Link></li>
                <li><Link to="/point-baccarat2">포인트 바카라 2</Link></li>
              </ul>
            </li>
            <li><Link to="/attendance">출석체크</Link></li>
            <li className="has-submenu">
              <Link to="/notice">고객센터</Link>
              <ul className="submenu">
                <li><Link to="/notice">공지사항</Link></li>
                <li><Link to="/inquiry">1:1 문의</Link></li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header

