import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './BannerManagement.css'

const BannerManagement = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    imageUrl: '',
    linkUrl: '',
    order: 0,
    active: true
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const response = await api.get('/banners')
      setBanners(response.data)
    } catch (error) {
      console.error('배너 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingBanner(null)
    setFormData({
      title: '',
      text: '',
      imageUrl: '',
      linkUrl: '',
      order: 0,
      active: true
    })
    setShowForm(true)
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      text: banner.text,
      imageUrl: banner.imageUrl || '',
      linkUrl: banner.linkUrl || '',
      order: banner.order,
      active: banner.active
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBanner) {
        await api.put(`/banners/${editingBanner._id}`, formData)
        alert('배너가 수정되었습니다.')
      } else {
        await api.post('/banners', formData)
        alert('배너가 생성되었습니다.')
      }
      setShowForm(false)
      fetchBanners()
    } catch (error) {
      alert(error.response?.data?.message || '배너 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    try {
      await api.delete(`/banners/${id}`)
      alert('배너가 삭제되었습니다.')
      fetchBanners()
    } catch (error) {
      alert('배너 삭제에 실패했습니다.')
    }
  }

  return (
    <div className="banner-management">
      <div className="management-header">
        <h1>배너 관리</h1>
        <button onClick={handleCreate} className="create-btn">새 배너 추가</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingBanner ? '배너 수정' : '새 배너 추가'}</h2>
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
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows="3"
                  required
                />
              </div>
              <div className="form-group">
                <label>이미지 URL</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>링크 URL</label>
                <input
                  type="text"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
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
        <div className="banners-grid">
          {banners.map((banner) => (
            <div key={banner._id} className="banner-card">
              <div className="banner-info">
                <h3>{banner.title}</h3>
                <p>{banner.text}</p>
                <div className="banner-meta">
                  <span>순서: {banner.order}</span>
                  <span className={banner.active ? 'active' : 'inactive'}>
                    {banner.active ? '활성' : '비활성'}
                  </span>
                </div>
              </div>
              <div className="banner-actions">
                <button onClick={() => handleEdit(banner)} className="edit-btn">수정</button>
                <button onClick={() => handleDelete(banner._id)} className="delete-btn">삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BannerManagement



