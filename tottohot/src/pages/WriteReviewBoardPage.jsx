import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './WriteReviewBoardPage.css'

const WriteReviewBoardPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    company: '',
    title: '',
    content: '',
    files: [],
    images: []
  })
  const [fileList, setFileList] = useState([])
  const [imageList, setImageList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // 제휴 업체 목록 (나중에 관리자 페이지에서 관리)
  const [partnerCompanies, setPartnerCompanies] = useState([
    '선택하세요',
    '고광렬카지노',
    '골드시티',
    '나루토카지노',
    '네임드카지노',
    '노마드',
    '당근벳',
    '대물카지노',
    '대빵',
    '디스',
    '디즈니벳',
    '도브벳',
    '도깨비',
    '도라에몽',
    '돌직구벳',
    '돛단배',
    '라이브',
    '라바카지노',
    '라비앙',
    '라칸',
    '비제휴'
  ])

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      // TODO: 관리자 페이지에서 등록한 제휴 업체 목록 가져오기
      // const response = await api.get('/partner-companies')
      // setPartnerCompanies(['선택하세요', ...response.data, '비제휴'])
    } catch (error) {
      console.error('제휴 업체 목록 로딩 실패:', error)
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.company || formData.company === '선택하세요') {
      setError('제휴 업체를 선택해주세요.')
      return
    }

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      // 제목 앞에 업체명 추가
      const finalTitle = formData.company === '비제휴' 
        ? `비제휴 | ${formData.title.trim()}`
        : `${formData.company} | ${formData.title.trim()}`

      // TODO: 파일 및 이미지 업로드 처리
      const postData = {
        title: finalTitle,
        content: formData.content.trim(),
        boardKey: 'review-board',
        company: formData.company,
        author: '익명'
      }

      await api.post('/posts', postData)
      
      alert('게시글이 작성되었습니다.')
      navigate('/review-board')
    } catch (err) {
      setError(err.response?.data?.message || '게시글 작성에 실패했습니다.')
      console.error('게시글 작성 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-review-board-page">
        <div className="write-header">
          <h1 className="write-title">글쓰기</h1>
        </div>

        <form onSubmit={handleSubmit} className="write-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* 분류 (제휴 업체 선택) */}
          <div className="form-group">
            <label htmlFor="company">분류</label>
            <select
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className="company-select"
              required
            >
              {partnerCompanies.map(company => (
                <option key={company} value={company === '선택하세요' ? '' : company}>
                  {company}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label htmlFor="title">
              제목<span className="required-mark">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="제목을 입력하세요"
              required
            />
            <div className="warning-text">
              *경고! 무성의한 글 작성 시
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
            />
            <div className="editor-toolbar">
              <button type="button" className="toolbar-btn">▶</button>
              <button type="button" className="toolbar-btn">
                <span>C</span>
                <span className="toolbar-count">0</span>
              </button>
            </div>
          </div>

          {/* 첨부 파일 */}
          <div className="form-group">
            <label>첨부 파일</label>
            <div className="file-controls">
              <input
                type="text"
                className="file-path-input"
                placeholder="파일"
                value={fileList.length > 0 ? `${fileList.length}개 파일` : ''}
                readOnly
              />
              <label htmlFor="fileInput" className="select-btn">
                선택
              </label>
              <input
                type="file"
                id="fileInput"
                style={{ display: 'none' }}
                onChange={handleFileAdd}
                multiple
              />
            </div>
          </div>

          {/* 첨부 사진 */}
          <div className="form-group">
            <label>첨부 사진</label>
            <input
              type="text"
              className="image-path-input"
              placeholder="사진"
              value={imageList.length > 0 ? `${imageList.length}개 사진` : ''}
              readOnly
            />
            <p className="image-instruction">
              내용에 입력시 지정 첨부사진이 출력됩니다.
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
            </div>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/review-board')}
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

export default WriteReviewBoardPage



