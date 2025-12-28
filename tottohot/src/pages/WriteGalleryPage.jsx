import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './WriteGalleryPage.css'

const WriteGalleryPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: []
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    if (imageFiles.length + files.length > 10) {
      alert('최대 10장까지 업로드 가능합니다.')
      return
    }

    const newFiles = [...imageFiles, ...files]
    setImageFiles(newFiles)
    setFormData(prev => ({
      ...prev,
      images: newFiles
    }))

    // 미리보기 생성
    const newPreviews = files.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  const handleRemoveImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    
    // URL 해제
    URL.revokeObjectURL(imagePreviews[index])
    
    setImageFiles(newFiles)
    setImagePreviews(newPreviews)
    setFormData(prev => ({
      ...prev,
      images: newFiles
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    if (imageFiles.length === 0) {
      setError('최소 1장 이상의 이미지를 업로드해주세요.')
      return
    }

    setLoading(true)

    try {
      // 이미지 업로드
      const uploadedImages = []
      for (const file of imageFiles) {
        const formData = new FormData()
        formData.append('image', file)
        
        const uploadResponse = await api.post('/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        uploadedImages.push(uploadResponse.data.imageUrl)
      }

      // 게시글 생성
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        boardKey: 'gallery',
        author: '익명',
        images: uploadedImages
      }

      await api.post('/posts', postData)
      
      alert('게시글이 작성되었습니다.')
      navigate('/gallery')
    } catch (err) {
      setError(err.response?.data?.message || '게시글 작성에 실패했습니다.')
      console.error('게시글 작성 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-gallery-page">
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
          </div>

          {/* 본문 */}
          <div className="form-group">
            <label htmlFor="content">본문</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="내용을 입력하세요 (선택사항)"
              rows={10}
              className="content-textarea"
            />
          </div>

          {/* 이미지 업로드 */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="images">이미지 업로드</label>
              <span className="required-mark">*</span>
            </div>
            <div className="image-upload-section">
              <label htmlFor="imageInput" className="upload-btn">
                + 이미지 추가 (최대 10장)
              </label>
              <input
                type="file"
                id="imageInput"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
                disabled={imageFiles.length >= 10}
              />
              <div className="image-count">
                현재 {imageFiles.length}/10장
              </div>
            </div>

            {/* 이미지 미리보기 */}
            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview} alt={`미리보기 ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/gallery')}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || imageFiles.length === 0}
            >
              {loading ? '작성 중...' : '작성완료'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}

export default WriteGalleryPage



