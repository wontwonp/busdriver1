import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './EventManagement.css'

const EventManagement = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    delta: '+0',
    date: '',
    active: true,
    order: 0
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/events')
      setEvents(response.data)
    } catch (error) {
      console.error('이벤트 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingEvent(null)
    setFormData({ title: '', delta: '+0', date: '', active: true, order: 0 })
    setShowForm(true)
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      delta: event.delta,
      date: event.date,
      active: event.active,
      order: event.order
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, formData)
        alert('이벤트가 수정되었습니다.')
      } else {
        await api.post('/events', formData)
        alert('이벤트가 생성되었습니다.')
      }
      setShowForm(false)
      fetchEvents()
    } catch (error) {
      alert(error.response?.data?.message || '이벤트 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/events/${id}`)
      alert('이벤트가 삭제되었습니다.')
      fetchEvents()
    } catch (error) {
      alert('이벤트 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="event-management">
      <div className="management-header">
        <h1>이벤트 관리</h1>
        <button onClick={handleCreate} className="create-btn">새 이벤트 추가</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEvent ? '이벤트 수정' : '새 이벤트 추가'}</h2>
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
                <label>Delta (예: +110)</label>
                <input
                  type="text"
                  value={formData.delta}
                  onChange={(e) => setFormData({ ...formData, delta: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>날짜 (예: 25.12.22)</label>
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>순서</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  활성화
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
        <div className="events-list">
          {events.map((event) => (
            <div key={event._id} className="event-card">
              <div className="event-info">
                <h3>{event.title}</h3>
                <div className="event-meta">
                  <span>Delta: {event.delta}</span>
                  <span>날짜: {event.date}</span>
                  <span>순서: {event.order}</span>
                  <span className={event.active ? 'active' : 'inactive'}>
                    {event.active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              <div className="event-actions">
                <button onClick={() => handleEdit(event)} className="edit-btn">수정</button>
                <button onClick={() => handleDelete(event._id)} className="delete-btn">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EventManagement



