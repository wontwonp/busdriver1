import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './BoardGuideManagement.css'
import moment from 'moment'

const BOARD_KEYS = [
  { value: 'guarantee-company', label: '보증업체' },
  { value: 'mttip', label: '먹튀사이트' },
  { value: 'scam-verification', label: '먹튀검증' },
  { value: 'sports-analysis', label: '스포츠분석' },
  { value: 'toto-guide', label: '토토가이드' },
  { value: 'free-money-promo', label: '꽁머니홍보' },
  { value: 'general-promo', label: '일반홍보' },
  { value: 'royal-toto-event', label: '로얄토토이벤트' }
]

const BoardGuideManagement = () => {
  const [guides, setGuides] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGuide, setEditingGuide] = useState(null)
  const [selectedBoardKey, setSelectedBoardKey] = useState('')
  const [formData, setFormData] = useState({
    boardKey: '',
    title: '',
    titleColor: '#39ff14',
    content: '',
    order: 0,
    isActive: true
  })

  useEffect(() => {
    fetchGuides()
  }, [])

  const fetchGuides = async () => {
    try {
      setLoading(true)
      const response = await api.get('/board-guide')
      setGuides(response.data.guides || [])
    } catch (error) {
      console.error('게시판 가이드 조회 오류:', error)
      alert('게시판 가이드 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingGuide(null)
    setFormData({
      boardKey: selectedBoardKey || '',
      title: '',
      titleColor: '#39ff14',
      content: '',
      order: 0,
      isActive: true
    })
    setShowForm(true)
  }

  const handleEdit = (guide) => {
    setEditingGuide(guide)
    setFormData({
      boardKey: guide.boardKey,
      title: guide.title,
      titleColor: guide.titleColor || '#39ff14',
      content: guide.content,
      order: guide.order || 0,
      isActive: guide.isActive !== undefined ? guide.isActive : true
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.boardKey || !formData.title || !formData.content) {
      alert('게시판, 제목, 내용을 입력해주세요.')
      return
    }

    try {
      if (editingGuide) {
        await api.put(`/board-guide/${editingGuide._id}`, formData)
        alert('게시판 가이드가 수정되었습니다.')
      } else {
        await api.post('/board-guide', formData)
        alert('게시판 가이드가 생성되었습니다.')
      }
      
      setShowForm(false)
      fetchGuides()
    } catch (error) {
      console.error('게시판 가이드 저장 오류:', error)
      alert('게시판 가이드 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await api.delete(`/board-guide/${id}`)
      alert('게시판 가이드가 삭제되었습니다.')
      fetchGuides()
    } catch (error) {
      console.error('게시판 가이드 삭제 오류:', error)
      alert('게시판 가이드 삭제에 실패했습니다.')
    }
  }

  const filteredGuides = selectedBoardKey 
    ? guides.filter(g => g.boardKey === selectedBoardKey)
    : guides

  return (
    <div className="board-guide-management">
      <div className="page-header">
        <h1>게시판 가이드 관리</h1>
        <div className="header-actions">
          <select
            value={selectedBoardKey}
            onChange={(e) => setSelectedBoardKey(e.target.value)}
            className="board-filter"
          >
            <option value="">전체 게시판</option>
            {BOARD_KEYS.map(board => (
              <option key={board.value} value={board.value}>
                {board.label}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleCreate}>
            가이드 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-message">로딩 중...</div>
      ) : filteredGuides.length === 0 ? (
        <div className="no-guides">등록된 가이드가 없습니다.</div>
      ) : (
        <div className="guides-list">
          {filteredGuides.map(guide => (
            <div key={guide._id} className="guide-item">
              <div className="guide-header">
                <div>
                  <h3>{guide.title}</h3>
                  <div className="guide-meta">
                    <span className="guide-board">
                      {BOARD_KEYS.find(b => b.value === guide.boardKey)?.label || guide.boardKey}
                    </span>
                    <span className="guide-date">
                      {moment(guide.createdAt).format('YYYY-MM-DD')}
                    </span>
                    <span className={`guide-status ${guide.isActive ? 'active' : 'inactive'}`}>
                      {guide.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
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
              <div className="guide-preview">
                <div 
                  className="preview-title"
                  style={{
                    backgroundColor: guide.titleColor || '#39ff14',
                    padding: '10px 15px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    width: 'fit-content'
                  }}
                >
                  <span style={{ color: '#000', fontWeight: 700 }}>
                    {guide.title}
                  </span>
                </div>
                <div className="preview-content">
                  {guide.content.substring(0, 100)}...
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 작성/수정 폼 모달 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGuide ? '게시판 가이드 수정' : '게시판 가이드 추가'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>게시판 *</label>
                <select
                  value={formData.boardKey}
                  onChange={(e) => setFormData({ ...formData, boardKey: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">게시판 선택</option>
                  {BOARD_KEYS.map(board => (
                    <option key={board.value} value={board.value}>
                      {board.label}
                    </option>
                  ))}
                </select>
              </div>

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
                <label>내용 *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  className="form-textarea"
                  rows="15"
                  placeholder="가이드 내용을 입력하세요 (01, 02 등 번호 포함 가능)"
                />
                <div className="form-hint">
                  예시:<br/>
                  01 자본력<br/>
                  자본이 부족한 사이트는 입출금 및 충환전이 지연되거나 먹튀 피해가 발생하기 쉽습니다.<br/><br/>
                  02 운영기간<br/>
                  운영기간이 길다고 하여 안전한 업체라고 보기는 어렵습니다.
                </div>
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
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  활성화
                </label>
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

export default BoardGuideManagement