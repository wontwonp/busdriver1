import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './GalleryPage.css'

const GalleryPage = () => {
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
          boardKey: 'gallery', 
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
      <div className="gallery-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 은꼴모음</h1>
            <div className="hero-description">
              <p>다양한 이미지와 콘텐츠를 공유하는 공간입니다.</p>
              <p>함께 즐거운 시간을 보내요.</p>
            </div>
            <button className="hero-cta-btn" onClick={() => navigate('/gallery/write')}>글쓰기</button>
          </div>
        </div>

        {/* 리스트 헤더 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems.toLocaleString()} / {currentPage} 페이지
          </div>
          <div className="list-actions">
            <Link to="/gallery/write" className="write-btn">
              글쓰기
            </Link>
          </div>
        </div>

        {/* 갤러리 그리드 */}
        <div className="gallery-grid">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="no-posts">게시글이 없습니다.</div>
          ) : (
            posts.map((post, index) => (
              <div key={post._id || index} className="gallery-item">
                <Link to={`/post/${post._id}`} className="gallery-link">
                  {post.images && post.images.length > 0 ? (
                    <div className="gallery-image">
                      <img src={post.images[0]} alt={post.title} />
                    </div>
                  ) : (
                    <div className="gallery-image placeholder">
                      <span>이미지 없음</span>
                    </div>
                  )}
                  <div className="gallery-info">
                    <h3 className="gallery-title">{post.title}</h3>
                    <div className="gallery-meta">
                      <span>{post.author || '익명'}</span>
                      <span>❤️ {post.likes || 0}</span>
                      <span>👁️ {post.views || 0}</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))
          )}
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

export default GalleryPage
