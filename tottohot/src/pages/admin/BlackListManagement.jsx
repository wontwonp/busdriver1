import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import './BlackListManagement.css'
import moment from 'moment'

const BlackListManagement = () => {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPost, setSelectedPost] = useState(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showNoticeModal, setShowNoticeModal] = useState(false)
  const [viewPost, setViewPost] = useState(null)
  const [commentContent, setCommentContent] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [noticeContent, setNoticeContent] = useState('')
  const [noticeLoading, setNoticeLoading] = useState(false)
  const [unansweredCount, setUnansweredCount] = useState(0)

  useEffect(() => {
    fetchPosts()
    fetchUnansweredCount()
    fetchNotice()
  }, [currentPage, searchTerm])

  const fetchNotice = async () => {
    try {
      const response = await api.get('/black-list-notice')
      setNoticeContent(response.data.notice || '')
    } catch (error) {
      console.error('안내 메시지 조회 실패:', error)
    }
  }

  const fetchUnansweredCount = async () => {
    try {
      const response = await api.get('/admin/stats')
      setUnansweredCount(response.data.unansweredBlackListCount || 0)
    } catch (error) {
      console.error('미답변 게시글 수 조회 실패:', error)
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'black-list',
        page: currentPage,
        limit: 20
      }
      
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
        params.searchType = 'titleContent'
      }
      
      const response = await api.get('/posts', { params })
      setPosts(response.data.posts || [])
      setPagination(response.data.pagination || { current: 1, total: 1, count: 0 })
    } catch (error) {
      console.error('게시글 조회 오류:', error)
      alert('게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPosts()
  }

  const handleViewPost = async (post) => {
    try {
      // 게시글 상세 정보 가져오기
      const response = await api.get(`/posts/${post._id}`)
      setViewPost(response.data)
      setShowViewModal(true)
    } catch (error) {
      console.error('게시글 조회 오류:', error)
      alert('게시글을 불러오는데 실패했습니다.')
    }
  }

  const handleAddNotice = () => {
    setShowNoticeModal(true)
  }

  const handleSubmitNotice = async () => {
    setNoticeLoading(true)
    try {
      await api.put('/black-list-notice', {
        notice: noticeContent.trim() || null
      })
      alert('안내 메시지가 저장되었습니다.')
      setShowNoticeModal(false)
    } catch (error) {
      console.error('안내 메시지 저장 오류:', error)
      alert(error.response?.data?.message || '안내 메시지 저장에 실패했습니다.')
    } finally {
      setNoticeLoading(false)
    }
  }

  const handleAddComment = (post) => {
    setSelectedPost(post)
    setCommentContent('')
    setShowCommentModal(true)
  }

  const handleSubmitComment = async () => {
    if (!commentContent.trim()) {
      alert('댓글 내용을 입력해주세요.')
      return
    }

    setCommentLoading(true)
    try {
      await api.post('/post-comments', {
        postId: selectedPost._id,
        content: commentContent.trim(),
        isSecret: false
      })
      alert('댓글이 등록되었습니다.')
      setShowCommentModal(false)
      setSelectedPost(null)
      setCommentContent('')
      fetchPosts()
      fetchUnansweredCount()
    } catch (error) {
      console.error('댓글 작성 오류:', error)
      alert(error.response?.data?.message || '댓글 작성에 실패했습니다.')
    } finally {
      setCommentLoading(false)
    }
  }

  const formatDate = (date) => {
    return moment(date).format('YYYY-MM-DD HH:mm')
  }

  return (
    <div className="black-list-management">
      <div className="management-header">
        <h1>블랙조회 관리</h1>
        <div className="header-right">
          {unansweredCount > 0 && (
            <div className="unanswered-badge">
              미답변: {unansweredCount}건
            </div>
          )}
          <button 
            onClick={handleAddNotice}
            className="btn-notice-header"
          >
            안내메세지
          </button>
        </div>
      </div>

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="제목 또는 내용으로 검색"
            className="search-input"
          />
          <button type="submit" className="search-btn">검색</button>
        </form>
      </div>

      <div className="posts-table-container">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <table className="posts-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>이름</th>
                <th>생년월일</th>
                <th>휴대폰</th>
                <th>은행</th>
                <th>계좌번호</th>
                <th>작성일</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-cell">등록된 글이 없습니다.</td>
                </tr>
              ) : (
                posts.map((post, index) => (
                  <tr key={post._id}>
                    <td>{pagination.count - (currentPage - 1) * 20 - index}</td>
                    <td className="title-cell">
                      <span className="secret-icon">🔒</span>
                      {post.title}
                    </td>
                    <td>{post.blackListInfo?.name || '-'}</td>
                    <td>{post.blackListInfo?.birthDate || '-'}</td>
                    <td>{post.blackListInfo?.phoneNumber || '-'}</td>
                    <td>{post.blackListInfo?.bank || '-'}</td>
                    <td>{post.blackListInfo?.accountNumber || '-'}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td>
                      {post.hasComment ? (
                        <span className="status-answered">답변완료</span>
                      ) : (
                        <span className="status-pending">답변대기</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleViewPost(post)}
                          className="btn-view"
                        >
                          보기
                        </button>
                        {!post.hasComment && (
                          <button 
                            onClick={() => handleAddComment(post)}
                            className="btn-comment"
                          >
                            댓글달기
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {pagination.total > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            이전
          </button>
          {Array.from({ length: pagination.total }, (_, i) => i + 1)
            .filter(page => {
              if (pagination.total <= 10) return true
              return (
                page === 1 ||
                page === pagination.total ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              )
            })
            .map((page, index, array) => (
              <React.Fragment key={page}>
                {index > 0 && array[index - 1] < page - 1 && (
                  <span className="page-ellipsis">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))}
          <button
            onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))}
            disabled={currentPage === pagination.total}
            className="page-btn"
          >
            다음
          </button>
        </div>
      )}

      {/* 게시글 보기 모달 */}
      {showViewModal && viewPost && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>블랙조회 게시글</h2>
              <button 
                className="modal-close"
                onClick={() => setShowViewModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="post-view-section">
                <div className="post-view-row">
                  <label>제목</label>
                  <div>{viewPost.title}</div>
                </div>
                <div className="post-view-row">
                  <label>조회 내용</label>
                  <div className="post-content-text">{viewPost.content}</div>
                </div>
                <div className="post-view-row">
                  <label>이름</label>
                  <div>{viewPost.blackListInfo?.name || '-'}</div>
                </div>
                <div className="post-view-row">
                  <label>생년월일</label>
                  <div>{viewPost.blackListInfo?.birthDate || '-'}</div>
                </div>
                <div className="post-view-row">
                  <label>휴대폰 번호</label>
                  <div>{viewPost.blackListInfo?.phoneNumber || '-'}</div>
                </div>
                <div className="post-view-row">
                  <label>은행</label>
                  <div>{viewPost.blackListInfo?.bank || '-'}</div>
                </div>
                <div className="post-view-row">
                  <label>계좌번호</label>
                  <div>{viewPost.blackListInfo?.accountNumber || '-'}</div>
                </div>
                <div className="post-view-row">
                  <label>작성일</label>
                  <div>{formatDate(viewPost.createdAt)}</div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowViewModal(false)}
                className="btn-cancel"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 안내 메시지 작성 모달 */}
      {showNoticeModal && (
        <div className="modal-overlay" onClick={() => setShowNoticeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>블랙조회 안내 메시지 작성</h2>
              <button 
                className="modal-close"
                onClick={() => setShowNoticeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="comment-form">
                <label>안내 메시지</label>
                <textarea
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="블랙조회 페이지 제목 아래에 표시될 안내 메시지를 입력해주세요"
                  rows={8}
                  className="comment-textarea"
                />
                <p className="form-hint">이 메시지는 블랙조회 페이지의 "블랙조회" 제목 바로 아래에 표시됩니다.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="btn-cancel"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitNotice}
                className="btn-submit"
                disabled={noticeLoading}
              >
                {noticeLoading ? '저장 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 댓글 작성 모달 */}
      {showCommentModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>댓글 작성</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCommentModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="post-info">
                <h3>{selectedPost.title}</h3>
                <p className="post-content">{selectedPost.content}</p>
              </div>
              <div className="comment-form">
                <label>댓글 내용</label>
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="댓글을 입력해주세요"
                  rows={6}
                  className="comment-textarea"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                onClick={() => setShowCommentModal(false)}
                className="btn-cancel"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitComment}
                className="btn-submit"
                disabled={commentLoading}
              >
                {commentLoading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlackListManagement