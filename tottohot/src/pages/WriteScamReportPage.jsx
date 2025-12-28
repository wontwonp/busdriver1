import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './WriteScamReportPage.css'

const WriteScamReportPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    siteName: '',
    siteUrl: '',
    scamAmount: '',
    content: '',
    mainImage: null,
    evidenceFiles: []
  })
  const [mainImagePreview, setMainImagePreview] = useState(null)
  const [evidencePreviews, setEvidencePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleScamAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '') // 컴마 제거
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        scamAmount: value
      }))
    }
  }

  const formatNumber = (num) => {
    if (!num) return ''
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const handleMainImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, mainImage: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEvidenceFileAdd = (e) => {
    const files = Array.from(e.target.files)
    setFormData(prev => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...files]
    }))
    
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEvidencePreviews(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleEvidenceFileRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index)
    }))
    setEvidencePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 필수 필드 검증
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // 메인 이미지 업로드 (워터마크 추가)
      let mainImageUrl = null
      if (formData.mainImage) {
        const mainImageFormData = new FormData()
        mainImageFormData.append('image', formData.mainImage)
        const mainImageRes = await api.post('/upload/image?watermark=true', mainImageFormData)
        mainImageUrl = mainImageRes.data.imageUrl
      }

      // 증거 파일 업로드 (워터마크 추가)
      const evidenceUrls = []
      for (const file of formData.evidenceFiles) {
        const evidenceFormData = new FormData()
        evidenceFormData.append('image', file)
        const evidenceRes = await api.post('/upload/image?watermark=true', evidenceFormData)
        evidenceUrls.push(evidenceRes.data.imageUrl)
      }

      // 게시글 작성
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        boardKey: 'mttip',
        author: '익명', // 기본값으로 익명 사용
        siteName: formData.siteName.trim() || null,
        siteUrl: formData.siteUrl.trim() || null,
        scamAmount: formData.scamAmount ? parseInt(formData.scamAmount.replace(/,/g, '')) : null,
        mainImage: mainImageUrl || null,
        evidenceImages: evidenceUrls.length > 0 ? evidenceUrls : []
      }

      await api.post('/posts', postData)
      
      // 게시판으로 이동
      navigate('/mttip')
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '게시글 작성에 실패했습니다.'
      setError(errorMessage)
      console.error('게시글 작성 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-scam-report-page">
        <div className="write-header">
          <div className="write-header-left">
            <span className="write-header-title">글쓰기</span>
          </div>
          <div className="write-header-right">
            <span className="write-tab active">먹튀검증</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="write-scam-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* 메인화면 */}
          <div className="form-group">
            <label htmlFor="mainImage">메인화면</label>
            <div className="file-input-group">
              <input
                type="text"
                className="file-path-input"
                placeholder="파일"
                value={formData.mainImage ? formData.mainImage.name : ''}
                readOnly
              />
              <label htmlFor="mainImage" className="file-select-btn">
                ↑선택
                <input
                  type="file"
                  id="mainImage"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {mainImagePreview && (
              <div className="image-preview">
                <img src={mainImagePreview} alt="메인 이미지 미리보기" />
              </div>
            )}
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label htmlFor="title">
              제목
              <span className="required-mark">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="게시글 제목을 작성해주세요."
              required
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
              placeholder="먹튀사이트 이름을 작성해주세요."
            />
          </div>

          {/* 사이트주소 */}
          <div className="form-group">
            <label htmlFor="siteUrl">사이트주소</label>
            <input
              type="text"
              id="siteUrl"
              name="siteUrl"
              value={formData.siteUrl}
              onChange={handleInputChange}
              placeholder="먹튀사이트 주소를 작성해주세요."
            />
          </div>

          {/* 먹튀금액 */}
          <div className="form-group">
            <label htmlFor="scamAmount">먹튀금액</label>
            <div className="amount-input-group">
              <input
                type="text"
                id="scamAmount"
                name="scamAmount"
                value={formatNumber(formData.scamAmount)}
                onChange={handleScamAmountChange}
                placeholder="피해 금액을 숫자로 입력해주세요."
              />
              <span className="amount-unit">원</span>
            </div>
          </div>

          {/* 먹튀내용 */}
          <div className="form-group">
            <label htmlFor="content">먹튀내용</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="먹튀 내용을 상세히 작성해주세요."
              rows={15}
            />
          </div>

          {/* 증거첨부 */}
          <div className="form-group">
            <label htmlFor="evidenceFiles">증거첨부</label>
            <div className="evidence-controls">
              <label htmlFor="evidenceFiles" className="evidence-add-btn">
                파일 추가
                <input
                  type="file"
                  id="evidenceFiles"
                  accept="image/*"
                  multiple
                  onChange={handleEvidenceFileAdd}
                  style={{ display: 'none' }}
                />
              </label>
              <button
                type="button"
                className="evidence-delete-btn"
                onClick={() => {
                  setFormData(prev => ({ ...prev, evidenceFiles: [] }))
                  setEvidencePreviews([])
                }}
                disabled={formData.evidenceFiles.length === 0}
              >
                파일 삭제
              </button>
            </div>
            <div className="evidence-file-info">
              파일 {formData.evidenceFiles.length}
            </div>
            {formData.evidenceFiles.length > 0 && (
              <div className="evidence-preview-list">
                {evidencePreviews.map((preview, index) => (
                  <div key={index} className="evidence-preview-item">
                    <img src={preview} alt={`증거 ${index + 1}`} />
                    <button
                      type="button"
                      className="evidence-remove-btn"
                      onClick={() => handleEvidenceFileRemove(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="evidence-instruction">먹튀 증거사진을 첨부하세요.</p>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? '작성 중...' : '작성완료'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/mttip')}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}

export default WriteScamReportPage

