import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './TotoGuideManagement.css'
import moment from 'moment'

const TotoGuideManagement = () => {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editingGuide, setEditingGuide] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    titleColor: '#39ff14',
    content: '',
    category: '',
    order: 0,
    isActive: true,
    isFixed: false // 고정 글 여부
  })
  const [mainImage, setMainImage] = useState(null)
  const [mainImagePreview, setMainImagePreview] = useState(null)

  useEffect(() => {
    fetchGuides()
  }, [currentPage])

  const fetchGuides = async () => {
    try {
      setLoading(true)
      const response = await api.get('/toto-guide', {
        params: {
          page: currentPage,
          limit: 20
        }
      })
      setGuides(response.data.guides)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('토토가이드 조회 오류:', error)
      alert('토토가이드 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingGuide(null)
    setFormData({
      title: '',
      titleColor: '#39ff14',
      content: '',
      category: '',
      order: 0,
      isActive: true,
      isFixed: false
    })
    setMainImage(null)
    setMainImagePreview(null)
    setShowForm(true)
  }

  const handleEdit = (guide) => {
    setEditingGuide(guide)
    setFormData({
      title: guide.title,
      titleColor: guide.titleColor || '#39ff14',
      content: guide.content,
      category: guide.category || '',
      order: guide.order || 0,
      isActive: guide.isActive !== undefined ? guide.isActive : true,
      isFixed: guide.isFixed !== undefined ? guide.isFixed : false
    })
    setMainImage(null)
    setMainImagePreview(guide.mainImage ? `http://localhost:4001${guide.mainImage}` : null)
    setShowForm(true)
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setMainImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    try {
      const submitData = new FormData()
      submitData.append('title', formData.title)
      submitData.append('titleColor', formData.titleColor)
      submitData.append('content', formData.content)
      submitData.append('category', formData.category)
      submitData.append('order', formData.order.toString())
      submitData.append('isActive', formData.isActive.toString())
      submitData.append('isFixed', formData.isFixed.toString())
      
      if (mainImage) {
        submitData.append('mainImage', mainImage)
      }

      console.log('제출할 데이터:', {
        title: formData.title,
        isActive: formData.isActive,
        isFixed: formData.isFixed,
        isFixedType: typeof formData.isFixed
      })

      if (editingGuide) {
        await api.put(`/toto-guide/${editingGuide._id}`, submitData)
        alert('토토가이드가 수정되었습니다.')
      } else {
        await api.post('/toto-guide', submitData)
        alert('토토가이드가 생성되었습니다.')
      }
      
      setShowForm(false)
      fetchGuides()
    } catch (error) {
      console.error('토토가이드 저장 오류:', error)
      console.error('오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method,
          headers: error.config?.headers
        }
      })
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || '토토가이드 저장에 실패했습니다.'
      alert(`토토가이드 저장 실패: ${errorMessage}`)
    }
  }

  const handleDelete = async (guideId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await api.delete(`/toto-guide/${guideId}`)
      alert('토토가이드가 삭제되었습니다.')
      fetchGuides()
    } catch (error) {
      console.error('토토가이드 삭제 오류:', error)
      alert('토토가이드 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return <div className="toto-guide-management-loading">로딩 중...</div>
  }

  return (
    <div className="toto-guide-management">
      <div className="management-header">
        <h1>토토가이드 관리</h1>
        <button className="btn-create" onClick={handleCreate}>
          가이드 추가
        </button>
      </div>

      {/* 가이드 목록 */}
      <div className="guides-list">
        {guides.length === 0 ? (
          <div className="no-data">등록된 가이드가 없습니다.</div>
        ) : (
          <div className="guides-grid">
            {guides.map((guide) => (
              <div key={guide._id} className="guide-item">
                {guide.mainImage && (
                  <div className="guide-image">
                    <img src={`http://localhost:4001${guide.mainImage}`} alt={guide.title} />
                  </div>
                )}
                <div className="guide-content">
                  <div 
                    className="guide-title-bar"
                    style={{ 
                      backgroundColor: guide.titleColor || '#39ff14',
                      width: 'fit-content',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}
                  >
                    <h3 style={{ color: '#000', margin: 0, fontWeight: 700 }}>
                      {guide.title}
                    </h3>
                  </div>
                  <div className="guide-meta">
                    <span className="guide-category">{guide.category || '기타'}</span>
                    <span className="guide-date">{moment(guide.createdAt).format('YYYY-MM-DD')}</span>
                    <span className={`guide-status ${guide.isActive ? 'active' : 'inactive'}`}>
                      {guide.isActive ? '활성' : '비활성'}
                    </span>
                    {guide.isFixed && (
                      <span className="guide-status fixed" style={{ marginLeft: '10px', backgroundColor: '#ff6b6b', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
                        고정글
                      </span>
                    )}
                  </div>
                  <div className="guide-actions">
                    <button
                      className="btn btn-edit"
                      onClick={() => handleEdit(guide)}
                    >
                      수정
                    </button>
                    <button
                      className="btn btn-delete"
                      onClick={() => handleDelete(guide._id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            이전
          </button>
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            다음
          </button>
        </div>
      )}

      {/* 작성/수정 폼 모달 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGuide ? '토토가이드 수정' : '토토가이드 추가'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>제목 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="form-input"
                  placeholder="가이드 제목"
                />
              </div>

              <div className="form-group">
                <label>제목 색상</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={formData.titleColor}
                    onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={formData.titleColor}
                    onChange={(e) => setFormData({ ...formData, titleColor: e.target.value })}
                    className="color-input"
                    placeholder="#39ff14"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>메인 이미지</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="form-input"
                />
                {mainImagePreview && (
                  <div className="image-preview">
                    <img src={mainImagePreview} alt="미리보기" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>카테고리</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  placeholder="카테고리 (선택사항)"
                />
              </div>

              <div className="form-group">
                <label>정렬 순서</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="form-input"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>내용 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  className="form-textarea"
                  rows="10"
                  placeholder="가이드 내용을 입력하세요"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  활성화
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isFixed || false}
                    onChange={(e) => {
                      const newValue = e.target.checked
                      console.log('고정 글 체크박스 변경:', newValue)
                      setFormData({ ...formData, isFixed: newValue })
                    }}
                  />
                  고정 글 (페이지 하단에 표시되는 관리글)
                </label>
                <div style={{ marginTop: '5px', fontSize: '12px', color: '#888' }}>
                  현재 값: {formData.isFixed ? 'true' : 'false'} (타입: {typeof formData.isFixed})
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-submit">
                  {editingGuide ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TotoGuideManagement
