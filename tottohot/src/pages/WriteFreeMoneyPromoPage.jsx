import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './WriteFreeMoneyPromoPage.css'

const WriteFreeMoneyPromoPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    siteName: '',
    siteUrl: '',
    images: []
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userPoints, setUserPoints] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const REQUIRED_POINTS = 5000

  useEffect(() => {
    checkAuth()
    if (isLoggedIn) {
      fetchUserPoints()
    }
  }, [isLoggedIn])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      setIsLoggedIn(true)
      try {
        // TODO: 사용자 정보 API가 있다면 사용
        // const response = await api.get('/auth/me')
        // setUserPoints(response.data.points || 0)
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error)
      }
    } else {
      setIsLoggedIn(false)
      alert('로그인이 필요합니다.')
      navigate('/')
    }
  }

  const fetchUserPoints = async () => {
    try {
      // TODO: 사용자 포인트 조회 API
      // const response = await api.get('/auth/me')
      // setUserPoints(response.data.points || 0)
      setUserPoints(10000) // 임시값
    } catch (error) {
      console.error('포인트 조회 실패:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles(prev => [...prev, ...files])
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
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

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.')
      return
    }

    if (userPoints < REQUIRED_POINTS) {
      setError(`포인트가 부족합니다. (필요: ${REQUIRED_POINTS.toLocaleString()}P, 보유: ${userPoints.toLocaleString()}P)`)
      return
    }

    if (!confirm(`게시글 작성 시 ${REQUIRED_POINTS.toLocaleString()}포인트가 차감됩니다. 계속하시겠습니까?`)) {
      return
    }

    setLoading(true)

    try {
      // 이미지 업로드
      const uploadedImages = []
      for (const file of imageFiles) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', file)
        
        const uploadResponse = await api.post('/upload/image', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        uploadedImages.push(uploadResponse.data.imageUrl)
      }

      // 게시글 생성 (승인 대기 상태)
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        boardKey: 'free-money-promo',
        author: '익명',
        siteName: formData.siteName.trim() || undefined,
        siteUrl: formData.siteUrl.trim() || undefined,
        mainImage: uploadedImages[0] || undefined,
        evidenceImages: uploadedImages.slice(1),
        status: 'pending',
        isApproved: false,
        pointsUsed: REQUIRED_POINTS
      }

      const response = await api.post('/posts', postData)
      
      // 포인트 차감
      try {
        await api.post('/posts/deduct-points', {
          postId: response.data._id,
          points: REQUIRED_POINTS
        })
      } catch (pointError) {
        console.error('포인트 차감 실패:', pointError)
        // 포인트 차감 실패 시 게시글 삭제
        await api.delete(`/posts/${response.data._id}`)
        throw new Error('포인트 차감에 실패했습니다.')
      }
      
      alert('게시글이 작성되었습니다. 관리자 승인 후 게시됩니다.')
      navigate('/free-money-promo')
    } catch (err) {
      setError(err.response?.data?.message || err.message || '게시글 작성에 실패했습니다.')
      console.error('게시글 작성 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-free-money-promo-page">
        <div className="write-header">
          <h1 className="write-title">글쓰기</h1>
        </div>

        {/* 포인트 안내 */}
        <div className="points-notice">
          <div className="points-info">
            <span className="points-label">보유 포인트:</span>
            <span className="points-value">{userPoints.toLocaleString()}P</span>
          </div>
          <div className="points-required">
            <span className="required-label">필요 포인트:</span>
            <span className="required-value">{REQUIRED_POINTS.toLocaleString()}P</span>
          </div>
          {userPoints < REQUIRED_POINTS && (
            <div className="points-warning">
              포인트가 부족합니다. 게시글을 작성할 수 없습니다.
            </div>
          )}
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

          {/* 사이트명 */}
          <div className="form-group">
            <label htmlFor="siteName">사이트명</label>
            <input
              type="text"
              id="siteName"
              name="siteName"
              value={formData.siteName}
              onChange={handleInputChange}
              placeholder="홍보할 사이트명을 입력하세요"
              className="title-input"
            />
          </div>

          {/* 사이트 주소 */}
          <div className="form-group">
            <label htmlFor="siteUrl">사이트 주소</label>
            <input
              type="url"
              id="siteUrl"
              name="siteUrl"
              value={formData.siteUrl}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="title-input"
            />
          </div>

          {/* 본문 */}
          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="content">본문</label>
              <span className="required-mark">*</span>
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="홍보 내용을 입력하세요"
              rows={15}
              required
              className="content-textarea"
            />
          </div>

          {/* 이미지 업로드 */}
          <div className="form-group">
            <label htmlFor="images">이미지 업로드 (선택)</label>
            <div className="image-upload-section">
              <label htmlFor="imageInput" className="upload-btn">
                + 이미지 추가
              </label>
              <input
                type="file"
                id="imageInput"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
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
              onClick={() => navigate('/free-money-promo')}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || userPoints < REQUIRED_POINTS}
            >
              {loading ? '작성 중...' : `작성완료 (${REQUIRED_POINTS.toLocaleString()}P 소모)`}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}

export default WriteFreeMoneyPromoPage



