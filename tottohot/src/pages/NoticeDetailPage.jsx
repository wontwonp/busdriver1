import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import ImageWithFallback from '../components/ImageWithFallback'
import './NoticeDetailPage.css'

const NoticeDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [noticeLikes, setNoticeLikes] = useState(0)
  const [noticeDislikes, setNoticeDislikes] = useState(0)
  const [userLiked, setUserLiked] = useState(false)
  const [userDisliked, setUserDisliked] = useState(false)
  const [isScraped, setIsScraped] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const init = async () => {
      const userIdValue = await checkAuth()
      if (id) {
        await fetchNotice()
        await fetchComments()
        if (userIdValue) {
          await checkScrapStatus()
        }
      }
    }
    init()
  }, [id])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const loggedIn = !!token
    setIsLoggedIn(loggedIn)
    
    if (token) {
      try {
        const response = await api.get('/auth/me')
        const userIdValue = response.data._id || response.data.id
        setUserId(userIdValue)
        return userIdValue
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error)
        return null
      }
    }
    return null
  }

  const checkScrapStatus = async () => {
    if (!userId || !id) return
    try {
      const response = await api.get(`/notices/${id}/scrap`)
      setIsScraped(response.data.isScraped)
    } catch (error) {
      console.error('스크랩 상태 확인 실패:', error)
    }
  }

  const fetchNotice = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/notices/${id}`)
      setNotice(response.data)
      setNoticeLikes(response.data.likes || 0)
      setNoticeDislikes(response.data.dislikes || 0)
      
      // 사용자가 좋아요를 눌렀는지 여부 확인
      if (userId) {
        const userIdStr = userId.toString()
        if (response.data.likedBy) {
          const likedByIds = response.data.likedBy.map(id => id.toString())
          setUserLiked(likedByIds.includes(userIdStr))
        }
        if (response.data.dislikedBy) {
          const dislikedByIds = response.data.dislikedBy.map(id => id.toString())
          setUserDisliked(dislikedByIds.includes(userIdStr))
        }
      }
    } catch (error) {
      console.error('공지사항 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/notice/${id}`)
      setComments(response.data)
    } catch (error) {
      console.error('댓글 로딩 실패:', error)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!isLoggedIn) {
      alert('로그인 후 댓글을 작성할 수 있습니다.')
      return
    }

    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      const response = await api.post('/comments', {
        noticeId: id,
        content: commentContent
      })
      setComments([...comments, response.data])
      setCommentContent('')
    } catch (error) {
      alert(error.response?.data?.message || '댓글 작성에 실패했습니다.')
      console.error('댓글 작성 실패:', error)
    }
  }

  const handleCommentEdit = async (commentId) => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    try {
      const response = await api.put(`/comments/${commentId}`, {
        content: editContent
      })
      setComments(comments.map(c => c._id === commentId ? response.data : c))
      setEditingCommentId(null)
      setEditContent('')
    } catch (error) {
      alert(error.response?.data?.message || '댓글 수정에 실패했습니다.')
      console.error('댓글 수정 실패:', error)
    }
  }

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return
    }

    try {
      await api.delete(`/comments/${commentId}`)
      setComments(comments.filter(c => c._id !== commentId))
    } catch (error) {
      alert(error.response?.data?.message || '댓글 삭제에 실패했습니다.')
      console.error('댓글 삭제 실패:', error)
    }
  }

  const handleCommentReaction = async (commentId, type) => {
    if (!isLoggedIn) {
      alert('로그인 후 추천할 수 있습니다.')
      return
    }

    try {
      const response = await api.post(`/comments/${commentId}/reaction`, { type })
      setComments(comments.map(c => c._id === commentId ? response.data : c))
    } catch (error) {
      console.error('반응 실패:', error)
    }
  }

  const handleNoticeReaction = async (type) => {
    if (!isLoggedIn) {
      alert('로그인 후 추천할 수 있습니다.')
      return
    }

    try {
      const response = await api.post(`/notices/${id}/reaction`, { type })
      setNoticeLikes(response.data.likes || 0)
      setNoticeDislikes(response.data.dislikes || 0)
      
      if (userId) {
        const userIdStr = userId.toString()
        if (response.data.likedBy) {
          const likedByIds = response.data.likedBy.map(id => id.toString())
          setUserLiked(likedByIds.includes(userIdStr))
        }
        if (response.data.dislikedBy) {
          const dislikedByIds = response.data.dislikedBy.map(id => id.toString())
          setUserDisliked(dislikedByIds.includes(userIdStr))
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || '추천/비추천에 실패했습니다.')
      console.error('반응 실패:', error)
    }
  }

  const handleScrap = async () => {
    if (!isLoggedIn) {
      alert('로그인 후 스크랩할 수 있습니다.')
      return
    }

    try {
      const response = await api.post(`/notices/${id}/scrap`)
      setIsScraped(response.data.isScraped)
      alert(response.data.message)
    } catch (error) {
      alert(error.response?.data?.message || '스크랩에 실패했습니다.')
      console.error('스크랩 실패:', error)
    }
  }

  const handleLogin = () => {
    navigate('/')
  }

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

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  if (loading) {
    return (
      <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
        <div className="loading">로딩 중...</div>
      </PageLayout>
    )
  }

  if (!notice) {
    return (
      <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
        <div className="error">공지사항을 찾을 수 없습니다.</div>
        <Link to="/notice" className="btn-back">목록으로</Link>
      </PageLayout>
    )
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <div className="notice-detail-container">
        <div className="notice-detail-header">
          <div className="notice-title-section">
            <h1 className="notice-title">
              {formatDateShort(notice.createdAt)} {notice.title}
            </h1>
          </div>
          
          <div className="notice-author-section">
            <div className="notice-author-info">
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
              <span className="author-name">{notice.author?.nickname || notice.author?.username || '토토톡'}</span>
            </div>
            <div className="notice-date-time">
              {formatDate(notice.createdAt)}
            </div>
          </div>

          <div className="notice-stats">
            <div className="stat-item">
              <i className="far fa-eye"></i>
              <span>{notice.views || 0}</span>
            </div>
            <div className="stat-item">
              <i className="far fa-comment"></i>
              <span>{comments.length}</span>
            </div>
            <div className="stat-item">
              <i className="far fa-thumbs-up"></i>
              <span>{noticeLikes}</span>
            </div>
            <div className="stat-item">
              <i className="far fa-thumbs-down"></i>
              <span>{noticeDislikes}</span>
            </div>
            <div className="notice-actions">
              <Link to="/notice" className="action-btn">
                <i className="fas fa-list"></i>
                <span>목록</span>
              </Link>
              <button 
                className={`action-btn ${isScraped ? 'active' : ''}`}
                onClick={handleScrap}
              >
                <i className={isScraped ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                <span>스크랩</span>
              </button>
            </div>
          </div>
        </div>

        <div className="notice-content-section">
          <div className="content-label">내용</div>
          <div className="notice-content">
            {notice.content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < notice.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="notice-reactions">
          <button 
            className={`reaction-btn ${userLiked ? 'active' : ''}`}
            onClick={() => handleNoticeReaction('like')}
          >
            <i className="far fa-thumbs-up"></i>
            <span>{noticeLikes} 추천</span>
          </button>
          <button 
            className={`reaction-btn ${userDisliked ? 'active' : ''}`}
            onClick={() => handleNoticeReaction('dislike')}
          >
            <i className="far fa-thumbs-down"></i>
            <span>비추천 {noticeDislikes}</span>
          </button>
        </div>

        <div className="comments-section">
          <div className="comment-warning">
            <i className="fas fa-info-circle"></i>
            <span>무성의한 댓글 및 같은 내용 반복 입력시 인정없이 몰수 당합니다.</span>
          </div>
          
          <div className="comment-input-info">
            <i className="far fa-comment"></i>
            <span>현재 {commentContent.length} 글자</span>
          </div>

          {isLoggedIn ? (
            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                className="comment-textarea"
                placeholder="댓글을 입력해주세요."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={5}
              />
              <button type="submit" className="comment-submit-btn">
                댓글 등록
              </button>
            </form>
          ) : (
            <div className="comment-login-prompt">
              로그인한 회원만 댓글 등록이 가능합니다.
            </div>
          )}

          <div className="comments-list">
            {comments.length === 0 ? (
              <div className="no-comments">등록된 댓글이 없습니다.</div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <div className="comment-header">
                    <div className="comment-author">
                      {(comment.userId && (comment.userId.level !== undefined || comment.userId.shopLevel !== undefined)) || (comment.level !== undefined || comment.shopLevel !== undefined) ? (
                        <ImageWithFallback
                          src={(comment.userId?.shopLevel && comment.userId.shopLevel > 0) || (comment.shopLevel && comment.shopLevel > 0)
                            ? '/levels/shop.gif' 
                            : `/levels/level${comment.userId?.level || comment.level || 1}.gif`}
                          alt="레벨"
                          className="comment-author-level"
                          fallbackText=""
                          style={{ width: '40px', height: '40px', display: 'block', visibility: 'visible' }}
                        />
                      ) : null}
                      <span className="comment-author-name">{comment.userId?.nickname || comment.userId?.username || comment.nickname || comment.username}</span>
                    </div>
                    <div className="comment-date">
                      {formatDate(comment.createdAt)}
                    </div>
                  </div>
                  
                  {editingCommentId === comment._id ? (
                    <div className="comment-edit-form">
                      <textarea
                        className="comment-edit-textarea"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                      />
                      <div className="comment-edit-actions">
                        <button 
                          className="comment-edit-save"
                          onClick={() => handleCommentEdit(comment._id)}
                        >
                          수정
                        </button>
                        <button 
                          className="comment-edit-cancel"
                          onClick={() => {
                            setEditingCommentId(null)
                            setEditContent('')
                          }}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="comment-content">
                        {comment.content}
                      </div>
                      <div className="comment-actions">
                        <button 
                          className={`comment-reaction-btn ${userId && comment.likedBy && comment.likedBy.some(id => id.toString() === userId.toString()) ? 'active' : ''}`}
                          onClick={() => handleCommentReaction(comment._id, 'like')}
                        >
                          <i className="far fa-thumbs-up"></i>
                          <span>{comment.likes || 0}</span>
                        </button>
                        <button 
                          className={`comment-reaction-btn ${userId && comment.dislikedBy && comment.dislikedBy.some(id => id.toString() === userId.toString()) ? 'active' : ''}`}
                          onClick={() => handleCommentReaction(comment._id, 'dislike')}
                        >
                          <i className="far fa-thumbs-down"></i>
                          <span>{comment.dislikes || 0}</span>
                        </button>
                        {isLoggedIn && userId && (comment.userId?._id?.toString() === userId.toString() || comment.userId?.toString() === userId.toString()) && (
                          <>
                            <button 
                              className="comment-edit-btn"
                              onClick={() => {
                                setEditingCommentId(comment._id)
                                setEditContent(comment.content)
                              }}
                            >
                              수정
                            </button>
                            <button 
                              className="comment-delete-btn"
                              onClick={() => handleCommentDelete(comment._id)}
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="notice-footer">
          <Link to="/notice" className="btn-back">
            <i className="fas fa-list"></i>
            목록
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}

export default NoticeDetailPage
