import React, { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './PenaltyListPage.css'

const PenaltyListPage = () => {
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedTab, setSelectedTab] = useState('전체')
  const [searchType, setSearchType] = useState('닉네임')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPenalties()
  }, [currentPage, selectedTab, searchTerm])

  const fetchPenalties = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20
      }
      
      if (selectedTab !== '전체') {
        params.penaltyType = selectedTab
      }
      
      if (searchTerm) {
        params.searchType = searchType
        params.searchTerm = searchTerm
      }
      
      const response = await api.get('/penalties', { params })
      setPenalties(response.data.penalties || [])
      setTotalPages(response.data.pagination?.total || 1)
      setTotalItems(response.data.pagination?.count || 0)
    } catch (error) {
      console.error('패널티 목록 로딩 실패:', error)
      setPenalties([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPenalties()
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const penaltyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    if (penaltyDate.getTime() === today.getTime()) {
      // 오늘 날짜면 시간만 표시
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${hours}:${minutes}`
    } else {
      // 다른 날짜면 월.일 형식
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${month}.${day}`
    }
  }

  const getPenaltyDisplay = (penalty) => {
    if (penalty.penaltyType === '포인트차감') {
      return `${penalty.points?.toLocaleString() || 0}포인트 차감`
    }
    return penalty.penaltyType || '경고'
  }

  return (
    <PageLayout>
      <div className="penalty-list-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 패널티명단</h1>
            <div className="hero-description">
              <p>규정을 위반한 회원들의 명단입니다.</p>
              <p>공정한 커뮤니티 운영을 위해 노력하겠습니다.</p>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="penalty-tabs">
          <button
            className={`tab-btn ${selectedTab === '전체' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTab('전체')
              setCurrentPage(1)
            }}
          >
            전체
          </button>
          <button
            className={`tab-btn ${selectedTab === '계정차단' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTab('계정차단')
              setCurrentPage(1)
            }}
          >
            계정차단
          </button>
          <button
            className={`tab-btn ${selectedTab === '작성권한박탈' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTab('작성권한박탈')
              setCurrentPage(1)
            }}
          >
            작성권한박탈
          </button>
          <button
            className={`tab-btn ${selectedTab === '포인트차감' ? 'active' : ''}`}
            onClick={() => {
              setSelectedTab('포인트차감')
              setCurrentPage(1)
            }}
          >
            포인트차감
          </button>
        </div>

        {/* 리스트 헤더 및 검색 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems.toLocaleString()} / {currentPage} 페이지
          </div>
          <form className="search-form" onSubmit={handleSearch}>
            <select
              className="search-type"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="닉네임">닉네임</option>
            </select>
            <input
              type="text"
              className="search-input"
              placeholder="검색어를 입력해 주세요."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn">Q</button>
          </form>
        </div>

        {/* 패널티 목록 테이블 */}
        <div className="penalties-table">
          <table>
            <thead>
              <tr>
                <th className="col-num">번호</th>
                <th className="col-nickname">닉네임</th>
                <th className="col-penalty">페널티</th>
                <th className="col-reason">사유</th>
                <th className="col-date">날짜</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">로딩 중...</td>
                </tr>
              ) : penalties.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-penalties-cell">패널티 내역이 없습니다.</td>
                </tr>
              ) : (
                penalties.map((penalty, index) => (
                  <tr key={penalty._id || index}>
                    <td className="col-num">
                      {totalItems - (currentPage - 1) * 20 - index}
                    </td>
                    <td className="col-nickname">
                      <span className="nickname-text">{penalty.nickname || penalty.username || '익명'}</span>
                    </td>
                    <td className="col-penalty">
                      <span className={`penalty-text ${penalty.penaltyType === '계정차단' ? 'red' : penalty.penaltyType === '작성권한박탈' ? 'red' : ''}`}>
                        {getPenaltyDisplay(penalty)}
                      </span>
                    </td>
                    <td className="col-reason">{penalty.reason || '-'}</td>
                    <td className="col-date">{formatDate(penalty.createdAt || penalty.date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="pagination">
          <button
            className="pagination-btn prev"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              let page
              if (totalPages <= 10) {
                page = i + 1
              } else if (currentPage <= 5) {
                page = i + 1
              } else if (currentPage >= totalPages - 4) {
                page = totalPages - 9 + i
              } else {
                page = currentPage - 5 + i
              }
              return (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <button
            className="pagination-btn next"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default PenaltyListPage

