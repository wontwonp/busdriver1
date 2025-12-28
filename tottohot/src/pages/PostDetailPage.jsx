import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import PageLayout from '../components/PageLayout'
import './PostDetailPage.css'
import '../App.css'

// API 기본 URL 가져오기
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:4001`
    }
  }
  return 'http://localhost:4001'
}

const PostDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [isSecretComment, setIsSecretComment] = useState(false)
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentRatings, setCommentRatings] = useState({
    sports: 7,
    realtime: 7,
    customerService: 7,
    odds: 7,
    events: 7
  })
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({ title: '', content: '', isSecret: false })
  const [editLoading, setEditLoading] = useState(false)

  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return '-'
      }
      
      // 한국 시간대(UTC+9)로 변환
      const koreaOffset = 9 * 60 // 한국은 UTC+9
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000)
      const koreaTime = new Date(utcTime + (koreaOffset * 60 * 1000))
      
      const year = koreaTime.getUTCFullYear()
      const month = String(koreaTime.getUTCMonth() + 1).padStart(2, '0')
      const day = String(koreaTime.getUTCDate()).padStart(2, '0')
      const hours = String(koreaTime.getUTCHours()).padStart(2, '0')
      const minutes = String(koreaTime.getUTCMinutes()).padStart(2, '0')
      
      return `${year}.${month}.${day} ${hours}:${minutes}`
    } catch (error) {
      console.error('날짜 포맷 오류:', error, dateString)
      return '-'
    }
  }

  useEffect(() => {
    checkAuth()
    fetchPost()
    fetchComments()
    
    // localStorage 변경 감지 (다른 탭에서 로그인/로그아웃 시)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'isLoggedIn') {
        checkAuth()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 주기적으로 토큰 확인 (같은 탭에서 로그인 시) - 빈도 줄임
    const interval = setInterval(() => {
      checkAuth()
    }, 5000) // 5초마다 확인 (1초는 너무 빈번함)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [id])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const isLoggedInStorage = localStorage.getItem('isLoggedIn') === 'true'
    const shouldBeLoggedIn = !!(token || isLoggedInStorage)
    
    // 로그인 상태가 변경되지 않으면 API 호출하지 않음
    setIsLoggedIn(prev => {
      if (prev === shouldBeLoggedIn) {
        return prev // 상태가 같으면 변경하지 않음
      }
      return shouldBeLoggedIn
    })
    
    if (shouldBeLoggedIn && token) {
      // userInfo에서 먼저 정보 가져오기 (빠른 응답)
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
        if (userInfo._id || userInfo.id) {
          setCurrentUserId(userInfo._id || userInfo.id)
          setIsAdmin(userInfo.role === 'admin')
        }
      } catch (e) {
        console.error('userInfo 파싱 실패:', e)
      }
      
      // 백그라운드에서 서버 확인 (실패해도 무시)
      try {
        const response = await api.get('/auth/me')
        setCurrentUserId(response.data._id)
        setIsAdmin(response.data.role === 'admin')
      } catch (error) {
        // API 실패해도 토큰이 있으면 로그인 상태 유지 (에러 무시)
        // 이미 userInfo에서 정보를 가져왔으므로 문제없음
      }
    } else {
      setCurrentUserId(null)
      setIsAdmin(false)
    }
  }

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/posts/${id}`)
      setPost(response.data)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
      setError('게시글을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/post-comments/post/${id}`)
      setComments(response.data || [])
    } catch (error) {
      console.error('댓글 로딩 실패:', error)
      setComments([])
    }
  }

  const handleCommentRatingChange = (category, value) => {
    setCommentRatings(prev => ({
      ...prev,
      [category]: parseInt(value, 10)
    }))
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setCommentLoading(true)
      const overallRating = Object.values(commentRatings).reduce((sum, val) => sum + val, 0) / 5
      
      await api.post('/post-comments', {
        postId: id,
        content: commentContent,
        isSecret: isSecretComment,
        ratings: commentRatings,
        overallRating: Math.round(overallRating * 10) / 10
      })
      
      setCommentContent('')
      setIsSecretComment(false)
      setCommentRatings({
        sports: 7,
        realtime: 7,
        customerService: 7,
        odds: 7,
        events: 7
      })
      await fetchComments()
      await fetchPost()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      alert(error.response?.data?.message || '댓글 작성에 실패했습니다.')
    } finally {
      setCommentLoading(false)
    }
  }

  const handleReplySubmit = async (parentCommentId, e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }

    if (!replyContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setReplyLoading(true)
      await api.post('/post-comments', {
        postId: id,
        content: replyContent,
        parentCommentId: parentCommentId
      })
      
      setReplyContent('')
      setReplyingTo(null)
      await fetchComments()
      await fetchPost()
    } catch (error) {
      console.error('대댓글 작성 실패:', error)
      alert(error.response?.data?.message || '대댓글 작성에 실패했습니다.')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }

    if (post.isLiked) {
      alert('이미 추천한 게시글입니다.')
      return
    }

    try {
      const response = await api.post(`/posts/${id}/like`)
      const updatedPost = { ...post, likes: response.data.likes, isLiked: true }
      setPost(updatedPost)
    } catch (error) {
      console.error('추천 실패:', error)
      if (error.response?.status === 400) {
        alert(error.response.data.message || '이미 추천한 게시글입니다.')
      } else {
        alert('추천에 실패했습니다.')
      }
    }
  }

  const handleEditClick = () => {
    setEditData({
      title: post.title,
      content: post.content,
      isSecret: post.isSecret || false
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)

    try {
      await api.patch(`/posts/${id}`, editData)
      await fetchPost()
      setShowEditModal(false)
      alert('게시글이 수정되었습니다.')
    } catch (error) {
      console.error('게시글 수정 실패:', error)
      alert('게시글 수정에 실패했습니다.')
    } finally {
      setEditLoading(false)
    }
  }

  const getBoardPath = () => {
    if (!post) return '/'
    const boardPathMap = {
      'mttip': '/mttip',
      'free-board': '/free-board',
      'review-board': '/review-board',
      'qna-board': '/qna-board',
      'gallery': '/gallery',
      'sister-diary': '/sister-diary',
      'manager-diary': '/manager-diary',
      'find-manager': '/find-manager',
      'recruitment': '/recruitment'
    }
    return boardPathMap[post.boardKey || post.boardType] || '/'
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="post-detail-container">
          <div className="post-detail">
            <div className="loading">로딩 중..</div>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (error || !post) {
    return (
      <PageLayout>
        <div className="post-detail-container">
          <div className="post-detail">
            <div className="error">{error || '게시글을 찾을 수 없습니다.'}</div>
            <Link to={getBoardPath()} className="btn-list">목록</Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  const canViewPost = () => {
    if (!post.isSecret) return true
    if (isAdmin) return true
    // author가 ObjectId인 경우 (populate된 경우)
    if (currentUserId && post.author?._id && post.author._id.toString() === currentUserId.toString()) return true
    // author가 문자열인 경우 (블랙조회 게시글 등)
    if (currentUserId && typeof post.author === 'string' && post.author === currentUserId.toString()) return true
    return false
  }

  const isAuthor = () => {
    if (!currentUserId) return false
    // author가 ObjectId인 경우 (populate된 경우)
    if (post.author?._id && post.author._id.toString() === currentUserId.toString()) return true
    // author가 문자열인 경우 (블랙조회 게시글 등)
    if (typeof post.author === 'string' && post.author === currentUserId.toString()) return true
    return false
  }

  if (post.isSecret && !canViewPost()) {
    return (
      <PageLayout>
        <div className="post-detail-container">
          <div className="post-detail">
            <div className="error">비밀글입니다. 작성자와 관리자만 볼 수 있습니다.</div>
            <Link to={getBoardPath()} className="btn-list">목록</Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="post-detail-container">
        <div className="post-detail">
          <div className="post-header">
            <h1 className="post-title">
              {post.isSecret && <span className="secret-badge">🔒</span>}
              {post.title}
            </h1>
            <div className="post-meta">
              <span className="author">작성자: {post.author?.nickname || post.author?.username || post.author || '익명'}</span>
              <span>작성일: {new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '. ').replace(/\s/g, ' ')}</span>
              <span>조회: {post.views || 0}</span>
              <span>추천: {post.likes || 0}</span>
            </div>
            {/* 후기게시판 평점 표시 */}
            {post.boardKey === 'review-board' && post.ratings && (
              <div className="post-ratings-section">
                <div className="ratings-chart">
                  <div className="rating-item">
                    <label>스포츠</label>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{ width: `${(post.ratings.sports || 0) * 10}%` }}></div>
                      <span className="rating-value">{post.ratings.sports?.toFixed(1) || 0}</span>
                    </div>
                  </div>
                  <div className="rating-item">
                    <label>실시간</label>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{ width: `${(post.ratings.realtime || 0) * 10}%` }}></div>
                      <span className="rating-value">{post.ratings.realtime?.toFixed(1) || 0}</span>
                    </div>
                  </div>
                  <div className="rating-item">
                    <label>고객응대</label>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{ width: `${(post.ratings.customerService || 0) * 10}%` }}></div>
                      <span className="rating-value">{post.ratings.customerService?.toFixed(1) || 0}</span>
                    </div>
                  </div>
                  <div className="rating-item">
                    <label>배당</label>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{ width: `${(post.ratings.odds || 0) * 10}%` }}></div>
                      <span className="rating-value">{post.ratings.odds?.toFixed(1) || 0}</span>
                    </div>
                  </div>
                  <div className="rating-item">
                    <label>이벤트</label>
                    <div className="rating-bar">
                      <div className="rating-fill" style={{ width: `${(post.ratings.events || 0) * 10}%` }}></div>
                      <span className="rating-value">{post.ratings.events?.toFixed(1) || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="overall-rating-display">
                  <strong>전체 평점: {post.overallRating?.toFixed(1) || 0}</strong>
                </div>
              </div>
            )}
          </div>
          
          <div className="post-content">
            {/* 메인 이미지 - 최상단에 표시 */}
            {post.mainImage && (
              <div className="post-images main-image-section">
                <img 
                  src={post.mainImage.startsWith('/uploads/') || post.mainImage.startsWith('/')
                    ? `${getApiBaseUrl()}${post.mainImage}`
                    : post.mainImage.startsWith('http')
                      ? post.mainImage
                      : `${getApiBaseUrl()}${post.mainImage}`}
                  alt="메인 이미지"
                  onError={(e) => {
                    console.error('이미지 로드 실패:', post.mainImage)
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            )}
            
            {/* 게시글 정보 (먹튀사이트 신고용) */}
            {(post.siteName || post.siteUrl || post.scamAmount) && (
              <div className="post-info-section">
                {post.siteName && (
                  <div className="info-item">
                    <span className="info-label">사이트명</span>
                    <span className="info-value">{post.siteName}</span>
                  </div>
                )}
                {post.siteUrl && (
                  <div className="info-item">
                    <span className="info-label">사이트주소</span>
                    <span className="info-value">{post.siteUrl}</span>
                  </div>
                )}
                {post.scamAmount && (
                  <div className="info-item">
                    <span className="info-label">피해금액</span>
                    <span className="info-value">{post.scamAmount.toLocaleString()}원</span>
                  </div>
                )}
              </div>
            )}
            
            {/* 스포츠 분석 게시글 - 추천 픽 표시 */}
            {post.boardKey === 'sports-analysis' && post.picks && post.picks.length > 0 && (
              <div className="post-picks-section">
                <div className="section-label">추천 픽</div>
                {post.picks.map((pick, index) => (
                  <div key={index} className="pick-item">
                    <div className="pick-header">
                      <span className="pick-number">추천 픽 {index + 1}</span>
                    </div>
                    <div className="pick-details">
                      {pick.matchDate && (
                        <div className="pick-detail-row">
                          <span className="pick-label">경기 일정:</span>
                          <span className="pick-value">{pick.matchDate}</span>
                        </div>
                      )}
                      <div className="pick-detail-row">
                        <span className="pick-label">대결 팀:</span>
                        <span className="pick-value">
                          {pick.team1} <span className="vs-text">VS</span> {pick.team2}
                        </span>
                      </div>
                      {pick.predictedPick && (
                        <div className="pick-detail-row">
                          <span className="pick-label">예상 픽:</span>
                          <span className="pick-value predicted-pick">{pick.predictedPick}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 피해내용 섹션 - 먹튀사이트 신고 게시판에만 표시 */}
            {post.boardKey === 'mttip' && post.content && post.content.trim() && (
              <div className="post-damage-section">
                <div className="section-label">피해내용</div>
                <div className="post-text">
                  {post.content.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < post.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* 일반 게시글 내용 - 스포츠 분석이 아닌 경우에만 표시 */}
            {post.boardKey !== 'sports-analysis' && post.boardKey !== 'mttip' && post.content && post.content.trim() && (
              <div className="post-text-content">
                <div className="post-text">
                  {post.content.split('\n').map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < post.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
            
            {/* 일반 이미지들 */}
            {post.images && post.images.length > 0 && (
              <div className="post-images">
                {post.images.map((image, index) => {
                  const apiBaseUrl = getApiBaseUrl()
                  const imageUrl = image.startsWith('/uploads/') || image.startsWith('/')
                    ? `${apiBaseUrl}${image}`
                    : image.startsWith('http')
                      ? image
                      : `${apiBaseUrl}${image}`
                  return (
                    <img 
                      key={index} 
                      src={imageUrl} 
                      alt={`이미지 ${index + 1}`}
                      onError={(e) => {
                        console.error('이미지 로드 실패:', imageUrl)
                        e.target.style.display = 'none'
                      }}
                    />
                  )
                })}
              </div>
            )}
            
            {/* 증거사진 섹션 */}
            {post.evidenceImages && post.evidenceImages.length > 0 && (
              <div className="post-evidence-section">
                <div className="section-label">증거사진</div>
                <div className="evidence-images-grid">
                  {post.evidenceImages.map((image, index) => {
                    const apiBaseUrl = getApiBaseUrl()
                    const imageUrl = image.startsWith('/uploads/') || image.startsWith('/')
                      ? `${apiBaseUrl}${image}`
                      : image.startsWith('http')
                        ? image
                        : `${apiBaseUrl}${image}`
                    return (
                      <img 
                        key={index} 
                        src={imageUrl} 
                        alt={`증거 이미지 ${index + 1}`}
                        onError={(e) => {
                          console.error('이미지 로드 실패:', imageUrl)
                          e.target.style.display = 'none'
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="post-actions">
            <button 
              className={`btn-like ${post.isLiked ? 'liked' : ''}`} 
              onClick={handleLike}
              disabled={post.isLiked || !isLoggedIn}
            >
              {post.isLiked ? '✓ 추천됨' : '👍 추천'}
            </button>
            {isAuthor() && (
              <button className="btn-edit" onClick={handleEditClick}>
                수정
              </button>
            )}
            <Link to={getBoardPath()} className="btn-list">목록</Link>
          </div>

          {/* 수정 모달 */}
          {showEditModal && (
            <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>게시글 수정</h2>
                <form onSubmit={handleEditSubmit}>
                  <div className="form-group">
                    <label>제목</label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>내용</label>
                    <textarea
                      value={editData.content}
                      onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                      rows={10}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowEditModal(false)}>취소</button>
                    <button type="submit" disabled={editLoading}>
                      {editLoading ? '수정 중...' : '수정하기'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 댓글 섹션 */}
          <div className="comments-section">
            <h3 className="comments-title">댓글 ({comments.length})</h3>
            
            {isLoggedIn && (
              <form onSubmit={handleCommentSubmit} className="comment-form">
                {/* 후기게시판 평점 입력 */}
                {post.boardKey === 'review-board' && (
                  <div className="comment-ratings-section">
                    <div className="ratings-prompt">
                      <span>😊</span>
                      <span>해당사이트의 평점을 채점하여 후기를 남겨주세요.</span>
                    </div>
                    <div className="comment-ratings-dropdowns">
                      <div className="rating-dropdown-item">
                        <select
                          value={commentRatings.sports}
                          onChange={(e) => handleCommentRatingChange('sports', e.target.value)}
                          className="rating-dropdown"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <span className="rating-label-text">스포츠</span>
                      </div>
                      <div className="rating-dropdown-item">
                        <select
                          value={commentRatings.realtime}
                          onChange={(e) => handleCommentRatingChange('realtime', e.target.value)}
                          className="rating-dropdown"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <span className="rating-label-text">실시간</span>
                      </div>
                      <div className="rating-dropdown-item">
                        <select
                          value={commentRatings.customerService}
                          onChange={(e) => handleCommentRatingChange('customerService', e.target.value)}
                          className="rating-dropdown"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <span className="rating-label-text">고객응대</span>
                      </div>
                      <div className="rating-dropdown-item">
                        <select
                          value={commentRatings.odds}
                          onChange={(e) => handleCommentRatingChange('odds', e.target.value)}
                          className="rating-dropdown"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <span className="rating-label-text">배당</span>
                      </div>
                      <div className="rating-dropdown-item">
                        <select
                          value={commentRatings.events}
                          onChange={(e) => handleCommentRatingChange('events', e.target.value)}
                          className="rating-dropdown"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num}</option>
                          ))}
                        </select>
                        <span className="rating-label-text">이벤트</span>
                      </div>
                    </div>
                  </div>
                )}
                <textarea
                  className="comment-input"
                  placeholder="댓글을 입력하세요..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={4}
                  required
                />
                <div className="comment-options">
                  <label className="secret-comment-checkbox">
                    <input
                      type="checkbox"
                      checked={isSecretComment}
                      onChange={(e) => setIsSecretComment(e.target.checked)}
                    />
                    <span>비밀댓글</span>
                  </label>
                </div>
                <button 
                  type="submit" 
                  className="btn-comment-submit"
                  disabled={commentLoading}
                >
                  {commentLoading ? '작성 중...' : '등록'}
                </button>
              </form>
            )}

            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">댓글이 없습니다.</div>
              ) : (
                comments
                  .filter(comment => !comment.parentCommentId)
                  .map((comment) => {
                    const replies = comments.filter(c => {
                      if (!c.parentCommentId) return false
                      if (typeof c.parentCommentId === 'object' && c.parentCommentId !== null) {
                        return c.parentCommentId._id?.toString() === comment._id.toString()
                      }
                      return c.parentCommentId.toString() === comment._id.toString()
                    })
                    return (
                      <div key={comment._id} className="comment-item">
                        <div className="comment-header">
                          <div className="comment-author">
                            <span className="comment-author-name">
                              {comment.userId?.nickname || comment.userId?.username || comment.nickname || comment.username || '익명'}
                            </span>
                          </div>
                          <span className="comment-date">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        {/* 댓글 평점 표시 */}
                        {comment.ratings && 
                         Object.keys(comment.ratings).length > 0 && 
                         (comment.ratings.sports != null || 
                          comment.ratings.realtime != null || 
                          comment.ratings.customerService != null || 
                          comment.ratings.odds != null || 
                          comment.ratings.events != null) && (
                          <div className="comment-ratings-display">
                            <span className="rating-label">평점 {
                              comment.overallRating != null 
                                ? comment.overallRating.toFixed(1)
                                : (() => {
                                    const ratings = comment.ratings
                                    const values = [
                                      ratings.sports,
                                      ratings.realtime,
                                      ratings.customerService,
                                      ratings.odds,
                                      ratings.events
                                    ].filter(v => v != null)
                                    if (values.length === 0) return '0.0'
                                    const avg = values.reduce((sum, val) => sum + val, 0) / values.length
                                    return Math.round(avg * 10) / 10
                                  })()
                            }</span>
                            <div className="comment-rating-bars">
                              <div className="comment-rating-bar">
                                <span>스포츠</span>
                                <div className="bar">
                                  <div className="bar-fill" style={{ width: `${(comment.ratings.sports || 0) * 10}%` }}></div>
                                  <span>{comment.ratings.sports?.toFixed(1) || 0}</span>
                                </div>
                              </div>
                              <div className="comment-rating-bar">
                                <span>실시간</span>
                                <div className="bar">
                                  <div className="bar-fill" style={{ width: `${(comment.ratings.realtime || 0) * 10}%` }}></div>
                                  <span>{comment.ratings.realtime?.toFixed(1) || 0}</span>
                                </div>
                              </div>
                              <div className="comment-rating-bar">
                                <span>고객응대</span>
                                <div className="bar">
                                  <div className="bar-fill" style={{ width: `${(comment.ratings.customerService || 0) * 10}%` }}></div>
                                  <span>{comment.ratings.customerService?.toFixed(1) || 0}</span>
                                </div>
                              </div>
                              <div className="comment-rating-bar">
                                <span>배당</span>
                                <div className="bar">
                                  <div className="bar-fill" style={{ width: `${(comment.ratings.odds || 0) * 10}%` }}></div>
                                  <span>{comment.ratings.odds?.toFixed(1) || 0}</span>
                                </div>
                              </div>
                              <div className="comment-rating-bar">
                                <span>이벤트</span>
                                <div className="bar">
                                  <div className="bar-fill" style={{ width: `${(comment.ratings.events || 0) * 10}%` }}></div>
                                  <span>{comment.ratings.events?.toFixed(1) || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="comment-content">
                          {comment.isSecret && comment.isSecretHidden ? (
                            <span className="secret-comment-text">비밀댓글입니다.</span>
                          ) : (
                            comment.content
                          )}
                          {comment.isSecret && !comment.isSecretHidden && (
                            <span className="secret-badge">🔒</span>
                          )}
                        </div>
                        {isLoggedIn && (
                          <div className="comment-actions">
                            <button 
                              className="btn-reply"
                              onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                            >
                              {replyingTo === comment._id ? '취소' : '답글'}
                            </button>
                          </div>
                        )}
                        {replyingTo === comment._id && (
                          <form onSubmit={(e) => handleReplySubmit(comment._id, e)} className="reply-form">
                            <textarea
                              className="reply-input"
                              placeholder="답글을 입력하세요..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={3}
                              required
                            />
                            <button 
                              type="submit" 
                              className="btn-reply-submit"
                              disabled={replyLoading}
                            >
                              {replyLoading ? '작성 중...' : '답글 작성'}
                            </button>
                          </form>
                        )}
                        {replies.length > 0 && (
                          <div className="replies-list">
                            {replies.map((reply) => (
                              <div key={reply._id} className="reply-item">
                                <div className="comment-header">
                                  <div className="comment-author">
                                    <span className="comment-author-name">
                                      {reply.userId?.nickname || reply.userId?.username || reply.nickname || reply.username || '익명'}
                                    </span>
                                  </div>
                                  <span className="comment-date">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <div className="comment-content">
                                  {reply.isSecret && reply.isSecretHidden ? (
                                    <span className="secret-comment-text">비밀댓글입니다.</span>
                                  ) : (
                                    reply.content
                                  )}
                                  {reply.isSecret && !reply.isSecretHidden && (
                                    <span className="secret-badge">🔒</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default PostDetailPage