import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './NoticeManagement.css'
import moment from 'moment'

const NoticeManagement = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPinned: false
  })

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notices')
      setNotices(response.data)
    } catch (error) {
      console.error('공지사항 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingNotice(null)
    setFormData({ title: '', content: '', isPinned: false })
    setShowForm(true)
  }

  const handleEdit = (notice) => {
    setEditingNotice(notice)
    setFormData({
      title: notice.title,
      content: notice.content,
      isPinned: notice.isPinned
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingNotice) {
        await api.put(`/notices/${editingNotice._id}`, formData)
        alert('공지사항이 수정되었습니다.')
      } else {
        await api.post('/notices', formData)
        alert('공지사항이 생성되었습니다.')
      }
      setShowForm(false)
      fetchNotices()
    } catch (error) {
      alert(error.response?.data?.message || '공지사항 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/notices/${id}`)
      alert('공지사항이 삭제되었습니다.')
      fetchNotices()
    } catch (error) {
      alert('공지사항 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="notice-management">
      <div className="management-header">
        <h1>공지사항 관리</h1>
        <button onClick={handleCreate} className="create-btn">새 공지사항 작성</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingNotice ? '공지사항 수정' : '새 공지사항 작성'}</h2>
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
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  />
                  상단 고정
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

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="notices-list">
          {notices.map((notice) => (
            <div key={notice._id} className="notice-card">
              <div className="notice-header">
                <h3>{notice.title}</h3>
                {notice.isPinned && <span className="pinned-badge">고정</span>}
              </div>
              <p className="notice-content">{notice.content}</p>
              <div className="notice-footer">
                <span className="notice-date">{moment(notice.createdAt).format('YYYY.MM.DD')}</span>
                <div className="notice-actions">
                  <button onClick={() => handleEdit(notice)} className="edit-btn">수정</button>
                  <button onClick={() => handleDelete(notice._id)} className="delete-btn">삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NoticeManagement



