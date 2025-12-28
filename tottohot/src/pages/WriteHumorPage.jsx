import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './WriteHumorPage.css'

const WriteHumorPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    files: [],
    images: [],
    imagePosition: 'top' // top, bottom, insert
  })
  const [fileList, setFileList] = useState([])
  const [imageList, setImageList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileAdd = (e) => {
    const files = Array.from(e.target.files)
    setFileList(prev => [...prev, ...files])
    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }))
  }

  const handleFileRemove = () => {
    setFileList([])
    setFormData(prev => ({ ...prev, files: [] }))
  }

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files)
    setImageList(prev => [...prev, ...files])
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const handleImageRemove = () => {
    setImageList([])
    setFormData(prev => ({ ...prev, images: [] }))
  }

  const handleImagePositionChange = (e) => {
    setFormData(prev => ({
      ...prev,
      imagePosition: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        boardKey: 'humor',
        author: '익명'
      }

      await api.post('/posts', postData)
      
      alert('게시글이 작성되었습니다.')
      navigate('/humor')
    } catch (err) {
      setError(err.response?.data?.message || '게시글 작성에 실패했습니다.')
      console.error('게시글 작성 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-humor-page">
        <div className="write-header">
          <h1 className="write-title">글쓰기</h1>
        </div>

        <form onSubmit={handleSubmit} className="write-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* 제목 */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="title">제목</label>
              <span className="required-mark">*</span>
            </div>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="제목을 입력하세요"
              required
              className="title-input"
            />
            <div className="warning-text">
              경고! 무성의한 글 작성 시 페널티 부여됩니다.
            </div>
          </div>

          {/* 본문 */}
          <div className="form-group">
            <label htmlFor="content">본문</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="내용을 입력하세요"
              rows={15}
              required
              className="content-textarea"
            />
            <div className="editor-toolbar">
              <button type="button" className="toolbar-btn">😊</button>
              <button type="button" className="toolbar-btn">🏁</button>
              <button type="button" className="toolbar-btn">▶</button>
              <button type="button" className="toolbar-btn">
                <span>🔄</span>
                <span className="toolbar-count">0</span>
              </button>
            </div>
          </div>

          {/* 첨부 파일 */}
          <div className="form-group">
            <label>첨부 파일</label>
            <div className="file-controls">
              <label htmlFor="fileInput" className="add-file-btn">
                + 파일 추가
              </label>
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileAdd}
                multiple
              />
              <button
                type="button"
                className="remove-file-btn"
                onClick={handleFileRemove}
                disabled={fileList.length === 0}
              >
                X 파일 삭제
              </button>
              <div className="file-count">파일 {fileList.length}</div>
              <label htmlFor="fileSelect" className="select-btn">
                선택
              </label>
              <input
                type="file"
                id="fileSelect"
                style={{ display: 'none' }}
                onChange={handleFileAdd}
                multiple
              />
            </div>
          </div>

          {/* 첨부 사진 */}
          <div className="form-group">
            <label>첨부사진</label>
            <div className="image-position-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="imagePosition"
                  value="top"
                  checked={formData.imagePosition === 'top'}
                  onChange={handleImagePositionChange}
                />
                <span>상단 위치</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="imagePosition"
                  value="bottom"
                  checked={formData.imagePosition === 'bottom'}
                  onChange={handleImagePositionChange}
                />
                <span>하단 위치</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="imagePosition"
                  value="insert"
                  checked={formData.imagePosition === 'insert'}
                  onChange={handleImagePositionChange}
                />
                <span>본문 삽입</span>
              </label>
            </div>
            <p className="image-instruction">
              본문 삽입시 {'{이미지:0}'}, {'{이미지:1}'} 형태로 글내용에 입력시 지정 첨부사진이 출력됩니다.
            </p>
            <div className="image-controls">
              <label htmlFor="imageInput" className="add-image-btn">
                + 사진 추가
              </label>
              <input
                type="file"
                id="imageInput"
                style={{ display: 'none' }}
                onChange={handleImageAdd}
                accept="image/*"
                multiple
              />
              <button
                type="button"
                className="remove-image-btn"
                onClick={handleImageRemove}
                disabled={imageList.length === 0}
              >
                X 사진 삭제
              </button>
              <div className="image-count">사진 {imageList.length}</div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/humor')}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '작성 중...' : '작성완료'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}

export default WriteHumorPage



