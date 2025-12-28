import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import './ReviewBoardPage.css'

const ReviewBoardPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedCompany, setSelectedCompany] = useState('전체')
  const [startIndex, setStartIndex] = useState(0)
  const itemsPerPage = 10
  const [selectedPost, setSelectedPost] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  // 제휴 업체 목록 (나중에 관리자 페이지에서 관리)
  const [partnerCompanies, setPartnerCompanies] = useState([
    '전체',
    '고광렬카지노',
    '골드시티',
    '나루토카지노',
    '네임드카지노',
    '노마드',
    '당근벳',
    '대물카지노',
    '대빵',
    '디스',
    '디즈니벳',
    '도브벳',
    '도깨비',
    '도라에몽',
    '돌직구벳',
    '돛단배',
    '라이브',
    '라바카지노',
    '라비앙',
    '라칸'
  ])

  useEffect(() => {
    checkAuth()
    fetchCompanies()
    fetchPosts()
  }, [currentPage, selectedCompany])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchCompanies = async () => {
    try {
      // TODO: 관리자 페이지에서 등록한 제휴 업체 목록 가져오기
      // const response = await api.get('/partner-companies')
      // setPartnerCompanies(['전체', ...response.data])
    } catch (error) {
      console.error('제휴 업체 목록 로딩 실패:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'review-board',
        page: currentPage,
        limit: 20
      }
      
      if (selectedCompany && selectedCompany !== '전체') {
        params.company = selectedCompany
      }
      
      const response = await api.get('/posts', { params })
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

  const tabsContainerRef = useRef(null)

  const scrollTabs = (direction, e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current
      const scrollAmount = 300
      const currentScroll = container.scrollLeft
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      container.scrollTo({ left: newScroll, behavior: 'smooth' })
    }
  }
  const [canScrollLeftState, setCanScrollLeftState] = useState(false)
  const [canScrollRightState, setCanScrollRightState] = useState(true)

  useEffect(() => {
    if (tabsContainerRef.current) {
      const container = tabsContainerRef.current
      const checkScroll = () => {
        setCanScrollLeftState(container.scrollLeft > 0)
        setCanScrollRightState(container.scrollLeft < container.scrollWidth - container.clientWidth - 1)
      }
      container.addEventListener('scroll', checkScroll)
      checkScroll()
      return () => container.removeEventListener('scroll', checkScroll)
    }
  }, [])

  const visibleCompanies = partnerCompanies
  const canScrollLeft = canScrollLeftState
  const canScrollRight = canScrollRightState

  return (
    <PageLayout>
      <div className="review-board-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 이용후기</h1>
            <div className="hero-description">
              <p>실제 이용자들의 솔직한 후기를 확인하고 안전한 사이트를 선택하세요.</p>
              <p>후기를 남기고 다양한 이벤트와 혜택을 받으세요.</p>
            </div>
            <button className="hero-cta-btn">후기 작성하기</button>
          </div>
        </div>

        {/* 제휴 업체 필터 탭 */}
        <div className="company-filter-section">
          <div className="company-tabs-wrapper">
            <button 
              type="button"
              className="scroll-btn left"
              onClick={(e) => scrollTabs('left', e)}
              disabled={!canScrollLeft}
            >
              &lt;
            </button>
            <div className="company-tabs-container" ref={tabsContainerRef}>
              <div className="company-tabs">
                {visibleCompanies.map(company => (
                  <button
                    key={company}
                    type="button"
                    className={`company-tab ${selectedCompany === company ? 'active' : ''}`}
                    onClick={() => setSelectedCompany(company)}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
            <button 
              type="button"
              className="scroll-btn right"
              onClick={(e) => scrollTabs('right', e)}
              disabled={!canScrollRight}
            >
              &gt;
            </button>
            <button className="search-icon-btn">🔍</button>
          </div>
        </div>

        {/* 리스트 헤더 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems.toLocaleString()} / {currentPage} 페이지
          </div>
        </div>

        {/* 게시글 카드 목록 */}
        <div className="review-cards-grid">
          {loading ? (
            <div className="loading-cell">로딩 중...</div>
          ) : posts.length === 0 ? (
            <div className="no-posts-cell">게시글이 없습니다.</div>
          ) : (
            posts.map((post, index) => (
              <div 
                key={post._id || index} 
                className="review-card"
                onClick={() => {
                  setSelectedPost(post)
                  setShowModal(true)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(57, 255, 20, 0.3)'
                }}
              >
                {post.mainImage && (
                  <div className="card-image">
                    <img 
                      src={`http://localhost:4001${post.mainImage}`} 
                      alt={post.title}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    <div className="card-date-overlay">{formatDate(post.createdAt)}</div>
                  </div>
                )}
                <div className="card-info">
                  <div className="info-row">
                    <div className="info-label">사이트 이름</div>
                    <div className="info-value">{post.siteName || '-'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">사이트 주소</div>
                    <div className="info-value">{post.siteUrl || '-'}</div>
                  </div>
                  <div className="info-row">
                    <div className="info-label">총 평점</div>
                    <div className="info-value rating-display">
                      {post.overallRating ? (
                        <>
                          {Array(Math.floor(post.overallRating / 2)).fill(0).map((_, i) => (
                            <span key={i} className="star filled">★</span>
                          ))}
                          {post.overallRating % 2 >= 1 && <span className="star half">★</span>}
                          {Array(5 - Math.ceil(post.overallRating / 2)).fill(0).map((_, i) => (
                            <span key={i} className="star empty">☆</span>
                          ))}
                          <span className="rating-number">{post.overallRating.toFixed(1)}</span>
                        </>
                      ) : '-'}
                    </div>
                  </div>
                </div>
                <div className="card-stats">
                  <span className="stat-item">
                    <span className="stat-icon">💬</span>
                    <span className="stat-value">{post.commentCount || 0}</span>
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">👍</span>
                    <span className="stat-value">{post.likes || 0}</span>
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">👁️</span>
                    <span className="stat-value">{(post.views || 0).toLocaleString()}</span>
                  </span>
                </div>
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
        </div>
      </div>

      {/* 모달 */}
      {showModal && selectedPost && (
        <div className="review-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="review-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            <div className="modal-header">
              <h2>{selectedPost.title}</h2>
              <div className="modal-meta">
                <span>{selectedPost.author || '검증단원'}</span>
                <span>{formatDate(selectedPost.createdAt)}</span>
              </div>
            </div>
            {selectedPost.mainImage && (
              <div className="modal-image">
                <img src={`http://localhost:4001${selectedPost.mainImage}`} alt={selectedPost.title} />
              </div>
            )}
            <div className="modal-info-table">
              <div className="info-row">
                <div className="info-label">사이트 이름</div>
                <div className="info-value">{selectedPost.siteName || '-'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">사이트 주소</div>
                <div className="info-value">{selectedPost.siteUrl || '-'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">총 평점</div>
                <div className="info-value rating-display">
                  {selectedPost.overallRating ? (
                    <>
                      {Array(Math.floor(selectedPost.overallRating / 2)).fill(0).map((_, i) => (
                        <span key={i} className="star filled">★</span>
                      ))}
                      {selectedPost.overallRating % 2 >= 1 && <span className="star half">★</span>}
                      {Array(5 - Math.ceil(selectedPost.overallRating / 2)).fill(0).map((_, i) => (
                        <span key={i} className="star empty">☆</span>
                      ))}
                      <span className="rating-number">{selectedPost.overallRating.toFixed(1)}</span>
                    </>
                  ) : '-'}
                </div>
              </div>
            </div>
            <div className="modal-content">
              <div dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br>') }} />
            </div>
            <div className="modal-actions">
              <button onClick={() => navigate(`/post/${selectedPost._id}`)} className="view-detail-btn">
                상세보기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게시판 가이드 (페이지 하단) */}
      <BoardGuide boardKey="review-board" />
    </PageLayout>
  )
}

export default ReviewBoardPage