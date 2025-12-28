import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './ScamSiteManagement.css'
import moment from 'moment'

const ScamSiteManagement = () => {
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
    scamAmount: '',
    author: '익명',
    isNotice: false
  })

  useEffect(() => {
    fetchPosts()
  }, [currentPage, searchTerm, searchType])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'mttip',
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
      scamAmount: post.scamAmount ? String(post.scamAmount) : '',
      author: post.author || '익명',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        boardKey: 'mttip',
        scamAmount: formData.scamAmount ? parseInt(formData.scamAmount.replace(/,/g, '')) : null
      }

      if (editingPost) {
        await api.put(`/posts/${editingPost._id}`, submitData)
        alert('게시글이 수정되었습니다.')
      } else {
        await api.post('/posts', submitData)
        alert('게시글이 생성되었습니다.')
      }
      setShowForm(false)
      fetchPosts()
    } catch (error) {
      console.error('게시글 저장 오류:', error)
      alert(error.response?.data?.message || '게시글 저장에 실패했습니다.')
    }
  }

  const formatDate = (date) => {
    const postDate = moment(date)
    const today = moment().startOf('day')
    const postDateStart = postDate.startOf('day')
    
    if (postDateStart.isSame(today)) {
      // 오늘 날짜면 시간만 표시
      return postDate.format('HH:mm')
    } else {
      // 오늘이 지나면 날짜 표시
      return postDate.format('YYYY.MM.DD')
    }
  }

  const formatNumber = (num) => {
    if (!num) return ''
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  if (loading && posts.length === 0) {
    return <div className="loading">로딩 중...</div>
  }

  return (
    <div className="scam-site-management">
      <div className="page-header">
        <h1>먹튀사이트 관리</h1>
        <button className="btn-create" onClick={() => {
          setEditingPost(null)
          setFormData({
            title: '',
            content: '',
            siteName: '',
            siteUrl: '',
            scamAmount: '',
            author: '익명',
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
              <th>피해금액</th>
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
                // 전체 일반 게시글 수 계산 (전체 게시글 수에서 공지글 수 추정)
                // 정확한 계산을 위해 현재 페이지의 공지글 수를 고려
                const noticeCountInCurrentPage = posts.filter(p => p.isNotice).length
                // 전체 공지글 수는 정확히 알 수 없으므로, 현재 페이지 기준으로 추정
                // 실제로는 백엔드에서 공지글을 제외한 일반 게시글 수를 별도로 반환하는 것이 정확함
                const estimatedTotalNotices = noticeCountInCurrentPage > 0 ? Math.ceil((pagination.count / 20) * noticeCountInCurrentPage) : 0
                const totalNonNoticePosts = Math.max(0, pagination.count - estimatedTotalNotices)
                
                return posts.map((post, index) => {
                  // 공지글이 아닌 게시글만 카운팅 (역순 번호 매기기 - 최신글이 큰 번호)
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
                        <td>{post.scamAmount ? `${formatNumber(post.scamAmount)}원` : '-'}</td>
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
                  
                  // 역순 번호 계산
                  const nonNoticePostsBeforeCurrent = posts.slice(0, index).filter(p => !p.isNotice)
                  const displayNumber = totalNonNoticePosts - (currentPage - 1) * 20 - nonNoticePostsBeforeCurrent.length
                  
                  return (
                  <tr key={post._id}>
                    <td>{displayNumber}</td>
                    <td className="col-title">
                      {post.title}
                    </td>
                    <td>{post.siteName || '-'}</td>
                    <td className="col-url">{post.siteUrl || '-'}</td>
                    <td>{post.scamAmount ? `${formatNumber(post.scamAmount)}원` : '-'}</td>
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
          <div className="form-content">
            <div className="form-header">
              <h2>{editingPost ? '게시글 수정' : '게시글 추가'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
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
                <label>사이트명</label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteName: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>사이트주소</label>
                <input
                  type="text"
                  value={formData.siteUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, siteUrl: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>피해금액</label>
                <input
                  type="text"
                  value={formatNumber(formData.scamAmount)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '')
                    if (value === '' || /^\d+$/.test(value)) {
                      setFormData(prev => ({ ...prev, scamAmount: value }))
                    }
                  }}
                  placeholder="숫자만 입력"
                />
              </div>

              <div className="form-group">
                <label>내용 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows="10"
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

export default ScamSiteManagement


