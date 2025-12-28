import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import ImageWithFallback from '../components/ImageWithFallback'
import './NoticePage.css'

const NoticePage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchType, setSearchType] = useState('title')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filteredNotices, setFilteredNotices] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    checkAuth()
    fetchNotices()
  }, [])

  useEffect(() => {
    filterNotices()
  }, [notices, searchKeyword, searchType])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notices')
      setNotices(response.data)
    } catch (error) {
      console.error('공지사항 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterNotices = () => {
    if (!searchKeyword.trim()) {
      setFilteredNotices(notices)
      return
    }

    const filtered = notices.filter(notice => {
      if (searchType === 'title') {
        return notice.title.toLowerCase().includes(searchKeyword.toLowerCase())
      } else {
        return notice.content.toLowerCase().includes(searchKeyword.toLowerCase())
      }
    })
    setFilteredNotices(filtered)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    filterNotices()
  }

  const handleLogin = () => {
    navigate('/')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}. ${month}. ${day}`
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  const displayNotices = searchKeyword ? filteredNotices : notices
  
  // 페이지네이션 계산
  const totalPages = Math.ceil(displayNotices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNotices = displayNotices.slice(startIndex, endIndex)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    setCurrentPage(1) // 검색시 페이지를 1로
  }, [searchKeyword])

  return (
    <PageLayout>
      <div className="notice-page-container">
        <div className="notice-tabs">
          <Link to="/notice" className="notice-tab active">공지사항</Link>
          <Link to="/inquiry" className="notice-tab">1:1 문의</Link>
        </div>

        <form className="notice-search" onSubmit={handleSearch}>
          <select 
            className="search-type" 
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="title">제목</option>
            <option value="content">내용</option>
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="검색어를 입력해주세요"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="search-button">
            <i className="fas fa-search"></i>
          </button>
        </form>

        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : displayNotices.length === 0 ? (
          <div className="no-notices">등록된 공지사항이 없습니다.</div>
        ) : (
          <>
            <div className="notice-page-info">
              현재 {currentPage} / {totalPages} 페이지
            </div>
            <div className="notice-table-container">
              <table className="notice-table">
                <thead>
                  <tr>
                    <th className="col-type">구분</th>
                    <th className="col-title">제목</th>
                    <th className="col-author">작성자</th>
                    <th className="col-date">날짜</th>
                    <th className="col-views">조회</th>
                  </tr>
                </thead>
                <tbody>
                  {currentNotices.map((notice) => (
                    <tr key={notice._id} className="notice-row">
                      <td className="col-type">
                        <span className="notice-type-badge">일반</span>
                      </td>
                      <td className="col-title">
                        <Link to={`/notice/${notice._id}`} className="notice-title-link">
                          <span className="notice-date-inline">{formatDate(notice.createdAt)}</span>
                          {notice.isImportant && <span className="notice-important-icon">🔔</span>}
                          <span className="notice-title-text">{notice.title}</span>
                          <span className="notice-points">+{notice.views ? Math.floor(notice.views / 10) : 0}</span>
                        </Link>
                      </td>
                      <td className="col-author">
                        <div className="notice-author-cell">
                          {notice.author && (
                            <ImageWithFallback
                              src={
                                (notice.author.userId?.role === 'admin' || notice.author.role === 'admin')
                                  ? '/levels/admin.gif'
                                  : (notice.author.userId?.shopLevel && notice.author.userId.shopLevel > 0) || (notice.author.shopLevel && notice.author.shopLevel > 0)
                                    ? '/levels/shop.gif' 
                                    : (notice.author.userId?.level && notice.author.userId.level <= 60) || (notice.author.level && notice.author.level <= 60)
                                      ? `/levels/level${notice.author.userId?.level || notice.author.level || 1}.gif`
                                      : '/levels/level1.gif'
                              }
                              alt="레벨"
                              className="author-level-image"
                              fallbackText=""
                              style={{ width: '30px', height: '30px', display: 'block', visibility: 'visible' }}
                            />
                          )}
                          <span className="author-nickname">{notice.author?.nickname || notice.author?.username || '토토톡'}</span>
                        </div>
                      </td>
                      <td className="col-date">{formatDateShort(notice.createdAt)}</td>
                      <td className="col-views">{notice.views || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="notice-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  처음
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // 현재 페이지 주변 5개 페이지만 표시
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="pagination-ellipsis">...</span>
                  }
                  return null
                })}
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  마지막
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}

export default NoticePage
