import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './SportsNewsPage.css'

const SportsNewsPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    checkAuth()
    fetchPosts()
  }, [currentPage])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', {
        params: { 
          boardKey: 'sports-news', 
          page: currentPage, 
          limit: 20 
        }
      })
      setPosts(response.data.posts || [])
      setTotalPages(response.data.pagination?.total || 1)
      setTotalItems(response.data.pagination?.count || 0)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}.${day} ${hours}:${minutes}`
  }

  return (
    <PageLayout>
      <div className="sports-news-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 스포츠뉴스</h1>
            <div className="hero-description">
              <p>최신 스포츠 뉴스와 정보를 확인하세요.</p>
              <p>다양한 스포츠 소식을 한눈에!</p>
            </div>
          </div>
        </div>

        {/* 리스트 헤더 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems.toLocaleString()} / {currentPage} 페이지
          </div>
        </div>

        {/* 게시글 목록 테이블 */}
        <div className="posts-table">
          <table>
            <thead>
              <tr>
                <th className="col-num">번호</th>
                <th className="col-title">제목</th>
                <th className="col-author">닉네임</th>
                <th className="col-date">날짜</th>
                <th className="col-views">조회</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="loading-cell">로딩 중...</td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-posts-cell">게시글이 없습니다.</td>
                </tr>
              ) : (
                posts.map((post, index) => (
                  <tr 
                    key={post._id || index} 
                    className={post.isNotice ? 'notice-row' : ''}
                  >
                    <td className="col-num">
                      {post.isNotice ? '공지' : (totalItems - (currentPage - 1) * 20 - index)}
                    </td>
                    <td className="col-title">
                      <Link to={`/post/${post._id}`}>
                        {post.isNotice && <span className="notice-badge">공지</span>}
                        {post.title}
                        {post.comments > 0 && (
                          <span className="comment-count"> [{post.comments}]</span>
                        )}
                      </Link>
                    </td>
                    <td className="col-author">{post.author || '익명'}</td>
                    <td className="col-date">{formatDate(post.createdAt)}</td>
                    <td className="col-views">{post.views || 0}</td>
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

export default SportsNewsPage

