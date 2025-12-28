import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './ReviewBoardManagement.css'
import moment from 'moment'

const ReviewBoardManagement = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('title')
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    siteName: '',
    siteUrl: '',
    mainImage: null,
    mainImagePreview: null,
    author: '검증단원',
    isNotice: false
  })

  useEffect(() => {
    fetchPosts()
  }, [currentPage, searchTerm, searchType])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'scam-verification',
        page: currentPage,
        limit: 20
      }
      
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
        params.searchType = searchType
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

  const handleEdit = (post) => {
    setEditingPost(post)
    setFormData({
      title: post.title || '',
      content: post.content || '',
      siteName: post.siteName || '',
      siteUrl: post.siteUrl || '',
      mainImage: null,
      mainImagePreview: post.mainImage ? `http://localhost:4001${post.mainImage}` : null,
      author: post.author || '검증단원',
      isNotice: post.isNotice || false
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/posts/${id}`)
      alert('게시글이 삭제되었습니다.')
      fetchPosts()
    } catch (error) {
      console.error('게시글 삭제 오류:', error)
      alert('게시글 삭제에 실패했습니다.')
    }
  }


  const handleMainImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({
        ...prev,
        mainImage: file,
        mainImagePreview: URL.createObjectURL(file)
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 필수 필드 검증
    if (!formData.title || !formData.title.trim()) {
      alert('제목을 입력해주세요.')
      return
    }
    if (!formData.content || !formData.content.trim()) {
      alert('내용을 입력해주세요.')
      return
    }
    
    try {
      const submitData = new FormData()
      submitData.append('boardKey', 'scam-verification')
      submitData.append('title', formData.title.trim())
      submitData.append('content', formData.content.trim())
      submitData.append('siteName', formData.siteName || '')
      submitData.append('siteUrl', formData.siteUrl || '')
      submitData.append('author', formData.author || '검증단원')
      submitData.append('isNotice', String(formData.isNotice || false))
      
      if (formData.mainImage) {
        submitData.append('mainImage', formData.mainImage)
      }

      if (editingPost) {
        await api.put(`/posts/${editingPost._id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('게시글이 수정되었습니다.')
      } else {
        await api.post('/posts', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        alert('게시글이 생성되었습니다.')
      }
      setShowForm(false)
      fetchPosts()
    } catch (error) {
      console.error('게시글 저장 오류:', error)
      console.error('에러 상세:', error.response?.data)
      alert(error.response?.data?.message || '게시글 저장에 실패했습니다.')
    }
  }

  const formatDate = (date) => {
    const postDate = moment(date)
    const today = moment().startOf('day')
    const postDateStart = postDate.startOf('day')
    
    if (postDateStart.isSame(today)) {
      return postDate.format('HH:mm')
    } else {
      return postDate.format('YYYY.MM.DD')
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
      <div className="star-rating">
        {Array(Math.max(0, fullStars)).fill(0).map((_, i) => (
          <span key={`full-${i}`} className="star filled">★</span>
        ))}
        {hasHalfStar && <span className="star half">★</span>}
        {Array(Math.max(0, emptyStars)).fill(0).map((_, i) => (
          <span key={`empty-${i}`} className="star empty">☆</span>
        ))}
        <span className="rating-number">{rating.toFixed(1)}</span>
      </div>
    )
  }

  if (loading && posts.length === 0) {
    return <div className="loading">로딩 중...</div>
  }

  return (
    <div className="review-board-management">
      <div className="page-header">
        <h1>먹튀검증관리</h1>
        <button className="btn-create" onClick={() => {
          setEditingPost(null)
          setFormData({
            title: '',
            content: '',
            siteName: '',
            siteUrl: '',
            mainImage: null,
            mainImagePreview: null,
            author: '검증단원',
            isNotice: false
          })
          setShowForm(true)
        }}>
          게시글 추가
        </button>
      </div>

      {/* 검색 영역 */}
      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <select 
            className="search-select"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="title">제목</option>
            <option value="siteName">사이트명</option>
            <option value="siteUrl">사이트주소</option>
            <option value="titleContent">제목+내용</option>
            <option value="author">글쓴이</option>
          </select>
          <input
            type="text"
            className="search-input"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-btn">검색</button>
        </form>
      </div>

      {/* 게시글 목록 */}
      <div className="posts-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>사이트명</th>
              <th>사이트주소</th>
              <th>평점</th>
              <th>작성자</th>
              <th>작성일</th>
              <th>조회수</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  게시글이 없습니다.
                </td>
              </tr>
            ) : (
              (() => {
                const noticeCountInCurrentPage = posts.filter(p => p.isNotice).length
                const estimatedTotalNotices = noticeCountInCurrentPage > 0 ? Math.ceil((pagination.count / 20) * noticeCountInCurrentPage) : 0
                const totalNonNoticePosts = Math.max(0, pagination.count - estimatedTotalNotices)
                
                return posts.map((post, index) => {
                  if (post.isNotice) {
                    return (
                      <tr key={post._id}>
                        <td>공지</td>
                        <td className="col-title">
                          <span className="notice-badge">공지</span>
                          {post.title}
                        </td>
                        <td>{post.siteName || '-'}</td>
                        <td className="col-url">{post.siteUrl || '-'}</td>
                        <td>{post.overallRating ? `${post.overallRating.toFixed(1)}` : '-'}</td>
                        <td>{post.author}</td>
                        <td>{formatDate(post.createdAt)}</td>
                        <td>{post.views || 0}</td>
                        <td>
                          <button onClick={() => handleEdit(post)} className="btn-edit">수정</button>
                          <button onClick={() => handleDelete(post._id)} className="btn-delete">삭제</button>
                        </td>
                      </tr>
                    )
                  }
                  
                  const nonNoticePostsBeforeCurrent = posts.slice(0, index).filter(p => !p.isNotice)
                  const displayNumber = totalNonNoticePosts - (currentPage - 1) * 20 - nonNoticePostsBeforeCurrent.length
                  
                  return (
                  <tr key={post._id}>
                    <td>{displayNumber}</td>
                    <td className="col-title">{post.title}</td>
                    <td>{post.siteName || '-'}</td>
                    <td className="col-url">{post.siteUrl || '-'}</td>
                    <td>{post.overallRating ? `${post.overallRating.toFixed(1)}` : '-'}</td>
                    <td>{post.author}</td>
                    <td>{formatDate(post.createdAt)}</td>
                    <td>{post.views || 0}</td>
                    <td>
                      <button onClick={() => handleEdit(post)} className="btn-edit">수정</button>
                      <button onClick={() => handleDelete(post._id)} className="btn-delete">삭제</button>
                    </td>
                  </tr>
                  )
                })
              })()
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
        <div className="pagination-numbers">
          {Array.from({ length: Math.min(10, pagination.total) }, (_, i) => {
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
          className="pagination-btn"
          onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))}
          disabled={currentPage === pagination.total}
        >
          다음
        </button>
      </div>

      {/* 게시글 작성/수정 폼 */}
      {showForm && (
        <div className="form-modal">
          <div className="form-content large">
            <div className="form-header">
              <h2>{editingPost ? '게시글 수정' : '게시글 추가'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-layout-single">
                {/* 왼쪽: 이미지 */}
                <div className="form-left">
                  <div className="form-group">
                    <label>메인 이미지 *</label>
                    <div className="image-upload-area">
                      {formData.mainImagePreview ? (
                        <img src={formData.mainImagePreview} alt="미리보기" className="image-preview" />
                      ) : (
                        <div className="image-placeholder">이미지를 선택하세요</div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainImageChange}
                        className="image-input"
                      />
                    </div>
                  </div>
                  
                  {/* 표 형식 정보 */}
                  <div className="info-table">
                    <div className="info-row">
                      <div className="info-label">사이트 이름</div>
                      <div className="info-value">
                        <input
                          type="text"
                          value={formData.siteName}
                          onChange={(e) => setFormData(prev => ({ ...prev, siteName: e.target.value }))}
                          placeholder="사이트 이름"
                        />
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">사이트 주소</div>
                      <div className="info-value">
                        <input
                          type="text"
                          value={formData.siteUrl}
                          onChange={(e) => setFormData(prev => ({ ...prev, siteUrl: e.target.value }))}
                          placeholder="사이트 주소"
                        />
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">총 평점</div>
                      <div className="info-value rating-display">
                        <span style={{ color: '#999' }}>댓글 작성 후 표시됩니다</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>상세 내용 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows="15"
                  required
                />
              </div>

              <div className="form-group">
                <label>작성자</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isNotice}
                    onChange={(e) => setFormData(prev => ({ ...prev, isNotice: e.target.checked }))}
                  />
                  공지사항
                </label>
              </div>

              <div className="form-actions">
                <button type="submit">{editingPost ? '수정' : '생성'}</button>
                <button type="button" onClick={() => setShowForm(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReviewBoardManagement

