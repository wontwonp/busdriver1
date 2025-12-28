import React, { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import moment from 'moment'
import './ScamVerificationPage.css'

const ScamVerificationPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [verificationSites, setVerificationSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentRatings, setCommentRatings] = useState({
    sports: 7.0,
    realtime: 7.0,
    customerService: 7.0,
    odds: 7.0,
    events: 7.0
  })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [averageRatings, setAverageRatings] = useState({
    sports: 0,
    realtime: 0,
    customerService: 0,
    odds: 0,
    events: 0
  })

  useEffect(() => {
    fetchPosts()
    checkAuth()
  }, [currentPage])

  useEffect(() => {
    if (selectedPost) {
      fetchComments()
      calculateAverageRatings()
    }
  }, [selectedPost, comments])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchComments = async () => {
    if (!selectedPost) return
    try {
      const response = await api.get(`/post-comments/post/${selectedPost._id}`)
      console.log('댓글 조회 결과:', response.data)
      const comments = response.data || []
      comments.forEach((comment, index) => {
        console.log(`댓글 ${index + 1}:`, {
          id: comment._id,
          hasRatings: !!comment.ratings,
          ratings: comment.ratings,
          overallRating: comment.overallRating
        })
      })
      setComments(comments)
    } catch (error) {
      console.error('댓글 조회 실패:', error)
      setComments([])
    }
  }

  const calculateAverageRatings = () => {
    if (!comments || comments.length === 0) {
      setAverageRatings({
        sports: 0,
        realtime: 0,
        customerService: 0,
        odds: 0,
        events: 0
      })
      return
    }

    const ratingsWithValues = comments.filter(c => c.ratings)
    if (ratingsWithValues.length === 0) {
      setAverageRatings({
        sports: 0,
        realtime: 0,
        customerService: 0,
        odds: 0,
        events: 0
      })
      return
    }

    const totals = ratingsWithValues.reduce((acc, comment) => {
      if (comment.ratings) {
        acc.sports += comment.ratings.sports || 0
        acc.realtime += comment.ratings.realtime || 0
        acc.customerService += comment.ratings.customerService || 0
        acc.odds += comment.ratings.odds || 0
        acc.events += comment.ratings.events || 0
      }
      return acc
    }, { sports: 0, realtime: 0, customerService: 0, odds: 0, events: 0 })

    setAverageRatings({
      sports: totals.sports / ratingsWithValues.length,
      realtime: totals.realtime / ratingsWithValues.length,
      customerService: totals.customerService / ratingsWithValues.length,
      odds: totals.odds / ratingsWithValues.length,
      events: totals.events / ratingsWithValues.length
    })
  }

  const handleCommentRatingChange = (category, value) => {
    setCommentRatings(prev => ({
      ...prev,
      [category]: parseFloat(value)
    }))
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }
    if (!commentText.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      const overallRating = Object.values(commentRatings).reduce((sum, val) => sum + val, 0) / 5
      
      console.log('댓글 제출 데이터:', {
        postId: selectedPost._id,
        content: commentText,
        ratings: commentRatings,
        overallRating: Math.round(overallRating * 10) / 10
      })
      
      const response = await api.post('/post-comments', {
        postId: selectedPost._id,
        content: commentText,
        ratings: commentRatings,
        overallRating: Math.round(overallRating * 10) / 10
      })
      
      console.log('댓글 생성 응답:', response.data)
      
      setCommentText('')
      setCommentRatings({
        sports: 7.0,
        realtime: 7.0,
        customerService: 7.0,
        odds: 7.0,
        events: 7.0
      })
      await fetchComments()
      await fetchPosts() // 게시글 목록 새로고침하여 평점 업데이트
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      console.error('에러 상세:', error.response?.data)
      alert('댓글 작성에 실패했습니다: ' + (error.response?.data?.message || error.message))
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', {
        params: {
          boardKey: 'scam-verification',
          page: currentPage,
          limit: 12
        }
      })
      setVerificationSites(response.data.posts || [])
      setTotalPages(response.data.pagination?.total || 1)
      setTotalItems(response.data.pagination?.count || 0)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
      setVerificationSites([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    
    try {
      const postDate = moment(date)
      if (!postDate.isValid()) {
        return '-'
      }
      
      const today = moment().startOf('day')
      const postDateStart = postDate.startOf('day')
      
      if (postDateStart.isSame(today)) {
        return postDate.format('HH:mm')
      } else {
        return postDate.format('YYYY.MM.DD')
      }
    } catch (error) {
      console.error('날짜 포맷 오류:', error, date)
      return '-'
    }
  }

  const renderStars = (rating) => {
    if (!rating || isNaN(rating) || rating < 0) {
      return <span>-</span>
    }
    if (rating > 10) {
      rating = 10
    }
    
    // 10점 만점을 5점 만점으로 변환 (별점 표시용)
    const starRating = (rating / 2)
    const fullStars = Math.floor(starRating)
    const hasHalfStar = starRating % 1 >= 0.5
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0))
    
    return (
      <>
        {Array(Math.max(0, fullStars)).fill(0).map((_, i) => (
          <span key={`full-${i}`} className="star full">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {Array(Math.max(0, emptyStars)).fill(0).map((_, i) => (
          <span key={`empty-${i}`} className="star empty">☆</span>
        ))}
      </>
    )
  }

  return (
    <PageLayout>
      <div className="scam-verification-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 먹튀검증</h1>
            <div className="hero-description">
              <p>로얄토토의 먹튀검증은 투명과 공정을 바탕으로 작성됩니다.</p>
              <p>언제나 이용자들의 입장을 우선으로 생각하고 업체의 회유나 이익에 흔들리지 않고</p>
              <p>1건의 삭제없이 사실만을 바탕으로 검증해오고 있습니다.</p>
            </div>
          </div>
        </div>

        {/* 페이지네이션 및 검색 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems} / {currentPage} 페이지
          </div>
          <div className="list-actions">
            <button className="refresh-btn">🔄</button>
            <button className="search-btn">🔍</button>
          </div>
        </div>

        {/* 사이트 목록 그리드 */}
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : verificationSites.length === 0 ? (
          <div className="no-posts">등록된 게시글이 없습니다.</div>
        ) : (
          <div className="verification-grid">
            {verificationSites.map(site => (
              <div 
                key={site._id} 
                className="verification-card"
                onClick={() => {
                  setSelectedPost(site)
                  setShowModal(true)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.cursor = 'pointer'
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(57, 255, 20, 0.5)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(57, 255, 20, 0.2)'
                }}
              >
                <div className="card-thumbnail">
                  {site.mainImage ? (
                    <img src={`http://localhost:4001${site.mainImage}`} alt={site.siteName || site.title} />
                  ) : (
                    <div className="thumbnail-placeholder">
                      <span>{site.siteName || site.title}</span>
                    </div>
                  )}
                  <div className="card-date-overlay">{formatDate(site.createdAt)}</div>
                </div>
                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">사이트 이름</span>
                    <span className="info-value">{site.siteName || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">사이트 주소</span>
                    <span className="info-value">{site.siteUrl || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">총평점</span>
                    <div className="info-value rating-display">
                      {site.overallRating ? (
                        <>
                          <div className="stars-container">
                            {renderStars(site.overallRating)}
                          </div>
                          <span className="rating-number">{site.overallRating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-stats">
                  <span className="stat-item">
                    <span className="stat-icon">💬</span>
                    {site.commentCount || 0}
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">👍</span>
                    {site.likes || 0}
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">👁</span>
                    {(site.views || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

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
        <div className="verification-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="verification-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            <div className="modal-header">
              <h2>{selectedPost.title}</h2>
              <div className="modal-meta">
                <span>{selectedPost.author || '검증단원'}</span>
                <span>{formatDate(selectedPost.createdAt)}</span>
              </div>
            </div>
            
            {/* 메인 컨텐츠 영역 - 2열 레이아웃 */}
            <div className="modal-main-content">
              {/* 왼쪽 컬럼: 이미지 및 사이트 정보 */}
              <div className="modal-left-column">
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
                    <div className="info-label">총평점</div>
                    <div className="info-value rating-display">
                      {selectedPost.overallRating ? (
                        <>
                          <div className="stars-container">
                            {renderStars(selectedPost.overallRating)}
                          </div>
                          <span className="rating-number">{selectedPost.overallRating.toFixed(1)}</span>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-content-text">
                  <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
                </div>
                <div className="modal-stats">
                  <span className="stat-item">
                    <span className="stat-icon">💬</span>
                    {comments.length || 0}
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">👍</span>
                    {selectedPost.likes || 0}
                  </span>
                  <span className="stat-item">
                    <span className="stat-icon">👁</span>
                    {(selectedPost.views || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* 오른쪽 컬럼: 평점 통계 */}
              <div className="modal-right-column">
                {comments.length > 0 ? (
                  <div className="modal-rating-stats">
                    <h3 className="rating-stats-title">평점 통계</h3>
                    <div className="radar-chart-container">
                      <svg className="radar-chart" viewBox="0 0 300 300">
                        <g transform="translate(150, 150)">
                          {/* 배경 그리드 */}
                          {[2, 4, 6, 8, 10].map((level) => {
                            const radius = (level / 10) * 120
                            const points = []
                            for (let i = 0; i < 5; i++) {
                              const angle = (i * 72 - 90) * (Math.PI / 180)
                              const x = radius * Math.cos(angle)
                              const y = radius * Math.sin(angle)
                              points.push(`${x},${y}`)
                            }
                            return (
                              <g key={level}>
                                <polygon
                                  points={points.join(' ')}
                                  fill="none"
                                  stroke="#333"
                                  strokeWidth="1"
                                />
                                <text x="0" y={-radius - 5} fill="#666" fontSize="10" textAnchor="middle">
                                  {level}
                                </text>
                              </g>
                            )
                          })}
                          {/* 축 라인 */}
                          {['스포츠', '실시간', '고객응대', '배당', '이벤트'].map((label, i) => {
                            const angle = (i * 72 - 90) * (Math.PI / 180)
                            const x = 120 * Math.cos(angle)
                            const y = 120 * Math.sin(angle)
                            return (
                              <line
                                key={i}
                                x1="0"
                                y1="0"
                                x2={x}
                                y2={y}
                                stroke="#333"
                                strokeWidth="1"
                              />
                            )
                          })}
                          {/* 평균 점수 영역 */}
                          {(() => {
                            const points = []
                            for (let i = 0; i < 5; i++) {
                              const angle = (i * 72 - 90) * (Math.PI / 180)
                              let rating = 0
                              if (i === 0) rating = averageRatings.sports
                              else if (i === 1) rating = averageRatings.realtime
                              else if (i === 2) rating = averageRatings.customerService
                              else if (i === 3) rating = averageRatings.odds
                              else if (i === 4) rating = averageRatings.events
                              const radius = (rating / 10) * 120
                              const x = radius * Math.cos(angle)
                              const y = radius * Math.sin(angle)
                              points.push(`${x},${y}`)
                            }
                            return (
                              <polygon
                                points={points.join(' ')}
                                fill="rgba(237, 28, 36, 0.3)"
                                stroke="#ed1c24"
                                strokeWidth="2"
                              />
                            )
                          })()}
                          {/* 라벨 */}
                          {['스포츠', '실시간', '고객응대', '배당', '이벤트'].map((label, i) => {
                            const angle = (i * 72 - 90) * (Math.PI / 180)
                            const x = 135 * Math.cos(angle)
                            const y = 135 * Math.sin(angle)
                            return (
                              <text
                                key={i}
                                x={x}
                                y={y}
                                fill="#fff"
                                fontSize="12"
                                textAnchor="middle"
                                dominantBaseline="middle"
                              >
                                {label}
                              </text>
                            )
                          })}
                        </g>
                      </svg>
                      <div className="rating-values">
                        <div className="rating-value-item">
                          <span className="rating-label">스포츠</span>
                          <span className="rating-num">{averageRatings.sports.toFixed(1)}</span>
                        </div>
                        <div className="rating-value-item">
                          <span className="rating-label">실시간</span>
                          <span className="rating-num">{averageRatings.realtime.toFixed(1)}</span>
                        </div>
                        <div className="rating-value-item">
                          <span className="rating-label">고객응대</span>
                          <span className="rating-num">{averageRatings.customerService.toFixed(1)}</span>
                        </div>
                        <div className="rating-value-item">
                          <span className="rating-label">배당</span>
                          <span className="rating-num">{averageRatings.odds.toFixed(1)}</span>
                        </div>
                        <div className="rating-value-item">
                          <span className="rating-label">이벤트</span>
                          <span className="rating-num">{averageRatings.events.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="modal-rating-stats">
                    <h3 className="rating-stats-title">평점 통계</h3>
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      댓글이 없어 평점 통계를 표시할 수 없습니다.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 댓글 섹션 */}
            <div className="modal-comments-section">
              <h3 className="comments-title">댓글 ({comments.length})</h3>
              
              {!isLoggedIn ? (
                <div className="login-prompt" style={{ padding: '15px', background: '#1a1a1a', borderRadius: '6px', marginBottom: '20px', color: '#999', textAlign: 'center' }}>
                  댓글을 작성하려면 로그인이 필요합니다.
                </div>
              ) : (
                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <div className="comment-ratings-section">
                    <div className="ratings-prompt">
                      <span>😊</span>
                      <span>해당사이트의 평점을 채점하여 후기를 남겨주세요.</span>
                    </div>
                    <div className="comment-ratings-grid">
                      <div className="comment-rating-item">
                        <label>스포츠</label>
                        <div className="rating-control">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={commentRatings.sports}
                            onChange={(e) => handleCommentRatingChange('sports', e.target.value)}
                            className="rating-slider"
                          />
                          <span className="rating-value">{commentRatings.sports.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="comment-rating-item">
                        <label>실시간</label>
                        <div className="rating-control">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={commentRatings.realtime}
                            onChange={(e) => handleCommentRatingChange('realtime', e.target.value)}
                            className="rating-slider"
                          />
                          <span className="rating-value">{commentRatings.realtime.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="comment-rating-item">
                        <label>고객응대</label>
                        <div className="rating-control">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={commentRatings.customerService}
                            onChange={(e) => handleCommentRatingChange('customerService', e.target.value)}
                            className="rating-slider"
                          />
                          <span className="rating-value">{commentRatings.customerService.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="comment-rating-item">
                        <label>배당</label>
                        <div className="rating-control">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={commentRatings.odds}
                            onChange={(e) => handleCommentRatingChange('odds', e.target.value)}
                            className="rating-slider"
                          />
                          <span className="rating-value">{commentRatings.odds.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="comment-rating-item">
                        <label>이벤트</label>
                        <div className="rating-control">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={commentRatings.events}
                            onChange={(e) => handleCommentRatingChange('events', e.target.value)}
                            className="rating-slider"
                          />
                          <span className="rating-value">{commentRatings.events.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="댓글을 입력하세요..."
                    rows={4}
                    className="comment-textarea"
                  />
                  <button type="submit" className="comment-submit-btn">등록</button>
                </form>
              )}

              <div className="comments-list">
                {comments.map(comment => (
                  <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author?.nickname || comment.author?.username || '익명'}</span>
                      <span className="comment-date">{formatDate(comment.createdAt)}</span>
                    </div>
                    <div className="comment-ratings-display">
                      <span>스포츠: {comment.ratings?.sports?.toFixed(1) || '-'}</span>
                      <span>실시간: {comment.ratings?.realtime?.toFixed(1) || '-'}</span>
                      <span>고객응대: {comment.ratings?.customerService?.toFixed(1) || '-'}</span>
                      <span>배당: {comment.ratings?.odds?.toFixed(1) || '-'}</span>
                      <span>이벤트: {comment.ratings?.events?.toFixed(1) || '-'}</span>
                    </div>
                    <div className="comment-content">{comment.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게시판 가이드 (페이지 하단) */}
      <BoardGuide boardKey="scam-verification" />
    </PageLayout>
  )
}

export default ScamVerificationPage
