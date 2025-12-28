import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import './FreeBoardPage.css'

const FreeBoardPage = () => {
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
          boardKey: 'free-board', 
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
      <div className="free-board-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 자유게시판</h1>
            <div className="hero-description">
              <p>자유롭게 의견을 나누고 소통하는 공간입니다.</p>
              <p>건전한 커뮤니티 문화를 만들어가요.</p>
            </div>
            <button className="hero-cta-btn" onClick={() => navigate('/free-board/write')}>글쓰기</button>
          </div>
        </div>

        {/* 리스트 헤더 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems.toLocaleString()} / {currentPage} 페이지
          </div>
          <div className="list-actions">
            <Link to="/free-board/write" className="write-btn">
              글쓰기
            </Link>
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
                  <tr key={post._id || index} className={post.isNotice ? 'notice-row' : ''}>
                    <td className="col-num">
                      {post.isNotice ? (
                        <span className="notice-badge">알림</span>
                      ) : (
                        (currentPage - 1) * 20 + index + 1
                      )}
                    </td>
                    <td className="col-title">
                      <Link to={`/post/${post._id}`} className="post-link">
                        {post.title}
                        {post.comments && post.comments > 0 && (
                          <span className="comments-count"> +{post.comments}</span>
                        )}
                      </Link>
                    </td>
                    <td className="col-author">
                      {post.author?.nickname || post.author?.username || post.author || '익명'}
                    </td>
                    <td className="col-date">{formatDate(post.createdAt)}</td>
                    <td className="col-views">{(post.views || 0).toLocaleString()}</td>
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
              const page = i + 1
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

        {/* 게시판 가이드 (페이지 하단) */}
        <BoardGuide boardKey="free-board" />
        </div>
      </div>
    </PageLayout>
  )
}

export default FreeBoardPage
