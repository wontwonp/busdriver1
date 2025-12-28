import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './PostManagement.css'
import moment from 'moment'

const PostManagement = () => {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [boardKey, setBoardKey] = useState('mttip')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showPendingOnly, setShowPendingOnly] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [formData, setFormData] = useState({
    boardKey: 'mttip',
    title: '',
    content: '',
    category: '일반',
    author: '관리자',
    isNotice: false,
    isBest: false
  })

  useEffect(() => {
    fetchPosts()
  }, [currentPage, boardKey, showPendingOnly])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey,
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined
      }
      
      // 승인 대기 게시글만 보기
      if (showPendingOnly) {
        params.status = 'pending'
      }
      
      const response = await api.get('/posts', { params })
      setPosts(response.data.posts)
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

  const handleCreate = () => {
    setEditingPost(null)
    setFormData({
      boardKey: 'mttip',
      title: '',
      content: '',
      category: '일반',
      author: '관리자',
      isNotice: false,
      isBest: false
    })
    setShowForm(true)
  }

  const handleEdit = (post) => {
    setEditingPost(post)
    setFormData({
      boardKey: post.boardKey,
      title: post.title,
      content: post.content,
      category: post.category,
      author: post.author,
      isNotice: post.isNotice,
      isBest: post.isBest
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPost) {
        await api.put(`/posts/${editingPost._id}`, formData)
        alert('게시글이 수정되었습니다.')
      } else {
        await api.post('/posts', formData)
        alert('게시글이 생성되었습니다.')
      }
      setShowForm(false)
      fetchPosts()
    } catch (error) {
      alert(error.response?.data?.message || '게시글 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/posts/${id}`)
      alert('게시글이 삭제되었습니다.')
      fetchPosts()
    } catch (error) {
      alert('게시글 삭제에 실패했습니다.')
    }
  }

  const handleApprove = async (id) => {
    if (!confirm('이 게시글을 승인하시겠습니까?')) return

    try {
      await api.patch(`/posts/${id}/approve`)
      alert('게시글이 승인되었습니다.')
      fetchPosts()
    } catch (error) {
      alert(error.response?.data?.message || '게시글 승인에 실패했습니다.')
    }
  }

  return (
    <div className="post-management">
      <div className="management-header">
        <h1>게시판 관리</h1>
        <button onClick={handleCreate} className="create-btn">새 게시글 작성</button>
      </div>

      <div className="management-filters">
        <select value={boardKey} onChange={(e) => setBoardKey(e.target.value)}>
          <option value="mttip">먹튀사이트 신고</option>
          <option value="free-money-promo">꽁머니홍보</option>
        </select>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showPendingOnly}
            onChange={(e) => setShowPendingOnly(e.target.checked)}
          />
          승인 대기만 보기
        </label>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어 입력"
          />
          <button type="submit">검색</button>
        </form>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingPost ? '게시글 수정' : '새 게시글 작성'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows="10"
                  required
                />
              </div>
              <div className="form-group">
                <label>카테고리</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="일반">일반</option>
                  <option value="공지">공지</option>
                  <option value="베스트">베스트</option>
                </select>
              </div>
              <div className="form-group">
                <label>작성자</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isNotice}
                    onChange={(e) => setFormData({ ...formData, isNotice: e.target.checked })}
                  />
                  공지사항
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isBest}
                    onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                  />
                  베스트글
                </label>
              </div>
              <div className="form-actions">
                <button type="submit">저장</button>
                <button type="button" onClick={() => setShowForm(false)}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="posts-table">
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>제목</th>
                <th>작성자</th>
                <th>카테고리</th>
                <th>조회수</th>
                <th>추천</th>
                <th>작성일</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, index) => (
                <tr key={post._id}>
                  <td>{(currentPage - 1) * 20 + index + 1}</td>
                  <td>
                    {post.title}
                    {!post.isApproved && (
                      <span className="pending-badge">[승인대기]</span>
                    )}
                  </td>
                  <td>{post.author}</td>
                  <td>{post.category}</td>
                  <td>{post.views}</td>
                  <td>{post.likes}</td>
                  <td>{moment(post.createdAt).format('YYYY.MM.DD')}</td>
                  <td>
                    {post.status === 'pending' || !post.isApproved ? (
                      <span className="status-pending">승인대기</span>
                    ) : (
                      <span className="status-approved">승인됨</span>
                    )}
                  </td>
                  <td>
                    {(!post.isApproved || post.status === 'pending') && (
                      <button onClick={() => handleApprove(post._id)} className="approve-btn">승인</button>
                    )}
                    <button onClick={() => handleEdit(post)} className="edit-btn">수정</button>
                    <button onClick={() => handleDelete(post._id)} className="delete-btn">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default PostManagement

