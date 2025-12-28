import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import moment from 'moment'
import './SportsAnalysisBoardManagement.css'

const SportsAnalysisBoardManagement = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPost, setSelectedPost] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const categories = ['전체', '축구', '야구', '농구', '배구', '하키', '기타']

  useEffect(() => {
    fetchPosts()
  }, [currentPage, selectedCategory, searchTerm])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'sports-analysis',
        page: currentPage,
        limit: 20,
        category: selectedCategory !== '전체' ? selectedCategory : undefined,
        search: searchTerm || undefined
      }
      
      const response = await api.get('/posts', { params })
      setPosts(response.data.posts || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('게시글 조회 오류:', error)
      alert('게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await api.delete(`/posts/${postId}`)
      alert('게시글이 삭제되었습니다.')
      fetchPosts()
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  const handleViewDetail = async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}`)
      setSelectedPost(response.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error('게시글 상세 조회 오류:', error)
      alert('게시글을 불러오는데 실패했습니다.')
    }
  }

  const handleToggleNotice = async (postId, isNotice) => {
    try {
      await api.put(`/posts/${postId}`, { isNotice: !isNotice })
      alert('공지사항 설정이 변경되었습니다.')
      fetchPosts()
    } catch (error) {
      console.error('공지사항 설정 오류:', error)
      alert('설정 변경에 실패했습니다.')
    }
  }

  const handleToggleBest = async (postId, isBest) => {
    try {
      await api.put(`/posts/${postId}`, { isBest: !isBest })
      alert('베스트 게시글 설정이 변경되었습니다.')
      fetchPosts()
    } catch (error) {
      console.error('베스트 게시글 설정 오류:', error)
      alert('설정 변경에 실패했습니다.')
    }
  }

  const handleApprove = async (postId) => {
    try {
      await api.put(`/posts/${postId}`, { isApproved: true, status: 'active' })
      alert('게시글이 승인되었습니다.')
      fetchPosts()
    } catch (error) {
      console.error('게시글 승인 오류:', error)
      alert('게시글 승인에 실패했습니다.')
    }
  }

  if (loading && posts.length === 0) {
    return <div className="sports-analysis-board-management-loading">로딩 중...</div>
  }

  return (
    <div className="sports-analysis-board-management">
      <div className="management-header">
        <h1>스포츠 분석</h1>
      </div>

      {/* 필터 및 검색 */}
      <div className="filter-section">
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(category)
                setCurrentPage(1)
              }}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="search-section">
          <input
            type="text"
            placeholder="제목 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="search-input"
          />
          <Link
            to="/admin/sports-analysis"
            className="match-management-btn"
          >
            경기등록관리
          </Link>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="posts-table-container">
        <table className="posts-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>종목</th>
              <th>제목</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회</th>
              <th>댓글</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  등록된 게시글이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post._id} className={post.isNotice ? 'notice-row' : ''}>
                  <td>
                    {post.isNotice ? (
                      <span className="badge badge-notice">공지</span>
                    ) : (
                      post.postNumber || '-'
                    )}
                  </td>
                  <td>{post.category || '-'}</td>
                  <td className="title-cell">
                    <span 
                      className="post-title-link"
                      onClick={() => handleViewDetail(post._id)}
                    >
                      {post.title}
                    </span>
                    {post.isBest && (
                      <span className="badge badge-best">베스트</span>
                    )}
                  </td>
                  <td>{post.author?.nickname || post.author?.username || '익명'}</td>
                  <td>{moment(post.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                  <td>{post.views || 0}</td>
                  <td>{post.commentCount || 0}</td>
                  <td>
                    {post.isApproved ? (
                      <span className="badge badge-success">승인</span>
                    ) : (
                      <span className="badge badge-warning">대기</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-view"
                        onClick={() => handleViewDetail(post._id)}
                      >
                        상세
                      </button>
                      <button
                        className="btn-notice"
                        onClick={() => handleToggleNotice(post._id, post.isNotice)}
                      >
                        {post.isNotice ? '공지해제' : '공지'}
                      </button>
                      <button
                        className="btn-best"
                        onClick={() => handleToggleBest(post._id, post.isBest)}
                      >
                        {post.isBest ? '베스트해제' : '베스트'}
                      </button>
                      {!post.isApproved && (
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(post._id)}
                        >
                          승인
                        </button>
                      )}
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(post._id)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="pagination">
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          이전
        </button>
        <span className="pagination-info">
          {currentPage} / {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          다음
        </button>
      </div>

      {/* 상세 모달 */}
      {showDetailModal && selectedPost && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>게시글 상세</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-item">
                <label>제목:</label>
                <span>{selectedPost.title}</span>
              </div>
              <div className="detail-item">
                <label>작성자:</label>
                <span>{selectedPost.author?.nickname || selectedPost.author?.username || '익명'}</span>
              </div>
              <div className="detail-item">
                <label>종목:</label>
                <span>{selectedPost.category || '-'}</span>
              </div>
              <div className="detail-item">
                <label>작성일:</label>
                <span>{moment(selectedPost.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
              </div>
              <div className="detail-item">
                <label>조회수:</label>
                <span>{selectedPost.views || 0}</span>
              </div>
              <div className="detail-item">
                <label>내용:</label>
                <div className="detail-content" dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              </div>
              {selectedPost.picks && selectedPost.picks.length > 0 && (
                <div className="detail-item">
                  <label>추천 픽:</label>
                  <div className="picks-list">
                    {selectedPost.picks.map((pick, index) => (
                      <div key={index} className="pick-item">
                        <div>경기: {pick.team1} vs {pick.team2}</div>
                        <div>일정: {pick.matchDate}</div>
                        <div>예상 픽: {pick.predictedPick}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SportsAnalysisBoardManagement
