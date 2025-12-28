import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import './WritePostPage.css'

const WritePostPage = () => {
  const navigate = useNavigate()
  const { boardType } = useParams()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: []
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSecret, setIsSecret] = useState(false)
  const [location, setLocation] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const locations = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기도', '충청북도', '충청남도', '전라남도', '경상북도', '경상남도',
    '강원도', '전라북도', '제주도'
  ]

  const boardTypeMap = {
    'free-board': '자유게시판',
    'review-board': '후기게시판',
    'qna-board': '질문답변',
    'gallery': '갤러리',
    'sister-diary': '언니일기',
    'manager-diary': '실장일기',
    'find-manager': '매니저찾기',
    'recruitment': '구인(매니저&실장)'
  }
  
  const isGallery = boardType === 'gallery'
  const isSisterDiary = boardType === 'sister-diary'
  const isQnaBoard = boardType === 'qna-board'
  const isManagerDiary = boardType === 'manager-diary'
  const isRecruitment = boardType === 'recruitment'

  useEffect(() => {
    checkUserAuth()
  }, [])

  const checkUserAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }
      
      const response = await api.get('/auth/me')
      setUserInfo(response.data)
      
      // 실장일기 또는 구인게시판인 경우 업체레벨 체크
      if ((isManagerDiary || isRecruitment) && (!response.data.shopLevel || response.data.shopLevel === 0)) {
        alert('업체레벨이 있는 사용자만 게시글을 작성할 수 있습니다.')
        navigate(isManagerDiary ? '/manager-diary' : '/recruitment')
        return
      }
    } catch (error) {
      console.error('사용자 정보 확인 실패:', error)
      navigate('/login')
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    
    // 갤러리인 경우 최대 10장 제한 체크
    if (isGallery) {
      const currentCount = imageFiles.length
      const newCount = currentCount + files.length
      if (newCount > 10) {
        alert(`갤러리는 최대 10장까지 업로드 가능합니다. (현재: ${currentCount}장, 추가 시도: ${files.length}장)`)
        e.target.value = '' // 파일 입력 초기화
        return
      }
    }
    
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return false
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('파일 크기는 50MB 이하여야 합니다.')
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // 갤러리인 경우 다시 한 번 체크 (필터링 후)
    if (isGallery && imageFiles.length + validFiles.length > 10) {
      const allowedCount = 10 - imageFiles.length
      if (allowedCount > 0) {
        alert(`갤러리는 최대 10장까지 업로드 가능합니다. ${allowedCount}장만 추가됩니다.`)
        const limitedFiles = validFiles.slice(0, allowedCount)
        const newPreviews = limitedFiles.map(file => URL.createObjectURL(file))
        setImageFiles(prev => [...prev, ...limitedFiles])
        setImagePreviews(prev => [...prev, ...newPreviews])
      } else {
        alert('이미지가 최대 개수(10장)에 도달했습니다.')
      }
      e.target.value = '' // 파일 입력 초기화
      return
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImageFiles(prev => [...prev, ...validFiles])
    setImagePreviews(prev => [...prev, ...newPreviews])
    e.target.value = '' // 파일 입력 초기화
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 갤러리는 제목과 이미지 필요
    if (isGallery) {
      if (!formData.title.trim()) {
        setError('제목을 입력해주세요.')
        return
      }
      if (imageFiles.length === 0) {
        setError('이미지를 최소 1개 이상 업로드해주세요.')
        return
      }
      if (imageFiles.length > 10) {
        setError('갤러리는 최대 10장까지 업로드 가능합니다.')
        return
      }
    } else {
      // 갤러리가 아닌 경우 제목/내용 필요 (질문답변 게시판 포함)
      if (!formData.title.trim()) {
        setError('제목을 입력해주세요.')
        return
      }

      if (!formData.content.trim()) {
        setError('내용을 입력해주세요.')
        return
      }
    }

    setLoading(true)

    let postData = null
    try {
      // 이미지 업로드 (질문답변 게시판이 아닌 경우만)
      const uploadedImages = []
      if (!isQnaBoard && imageFiles.length > 0) {
        for (const file of imageFiles) {
          const uploadFormData = new FormData()
          uploadFormData.append('image', file)
          try {
            const uploadRes = await api.post('/upload/image', uploadFormData)
            uploadedImages.push(uploadRes.data.imageUrl)
          } catch (uploadError) {
            console.error('이미지 업로드 실패:', uploadError)
            throw new Error('이미지 업로드에 실패했습니다.')
          }
        }
      }

      // 구인게시판인 경우 제목에 위치 추가
      let finalTitle = formData.title.trim()
      if (isRecruitment && location) {
        finalTitle = `[${location}] ${finalTitle}`
      }

      // 게시글 작성
      postData = {
        title: finalTitle,
        content: isGallery ? '' : formData.content.trim(),
        boardType: boardType || 'free-board',
        images: isQnaBoard ? [] : uploadedImages, // 질문답변 게시판은 이미지 없음
        isSecret: isSisterDiary ? isSecret : false,
        isRecruitmentCompleted: false,
        location: isRecruitment ? location : null
      }

      console.log('게시글 작성 요청 데이터:', postData)
      console.log('이미지 개수:', postData.images.length)
      const response = await api.post('/posts', postData)
      console.log('게시글 작성 성공:', response.data)
      
      // 레벨 진행률 갱신 이벤트 발생
      window.dispatchEvent(new Event('levelProgressUpdate'))
      
      // 게시판으로 이동
      const redirectPathMap = {
        'free-board': '/free-board',
        'review-board': '/review-board',
        'qna-board': '/qna-board',
        'gallery': '/gallery',
        'sister-diary': '/sister-diary',
        'manager-diary': '/manager-diary',
        'find-manager': '/find-manager',
        'recruitment': '/recruitment'
      }
      navigate(redirectPathMap[boardType] || '/free-board')
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || '게시글 작성에 실패했습니다.'
      setError(errorMessage)
      console.error('게시글 작성 오류:', err)
      console.error('에러 상세:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        postData: postData
      })
    } finally {
      setLoading(false)
    }
  }

  const isLoggedIn = !!localStorage.getItem('token')

  if (checkingAuth) {
    return (
      <PageLayout isLoggedIn={true}>
        <div className="write-post-page">
          <div className="loading">권한 확인 중...</div>
        </div>
      </PageLayout>
    )
  }

  if (!isLoggedIn) {
    return (
      <PageLayout isLoggedIn={false}>
        <div className="write-post-page">
          <p>로그인이 필요합니다.</p>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn}>
      <div className="write-post-page">
        <h1 className="page-title">{boardTypeMap[boardType] || '게시판'} 글쓰기</h1>
        
        <form onSubmit={handleSubmit} className="write-form">
          {isRecruitment && (
            <div className="form-group location-select-top">
              <label htmlFor="location-top">지역</label>
              <select
                id="location-top"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              >
                <option value="">위치를 선택하세요</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">제목</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          {!isGallery && (
            <div className="form-group">
              <label htmlFor="content">내용</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="내용을 입력하세요"
                rows={15}
                required
              />
            </div>
          )}

          {!isQnaBoard && (
            <div className="form-group">
              <label htmlFor="images">이미지 업로드 {isGallery && '(필수, 최대 10장)'}</label>
              <input
                type="file"
                id="images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                required={isGallery}
                disabled={isGallery && imageFiles.length >= 10}
              />
              <small>
                이미지 파일만 업로드 가능합니다. (최대 50MB)
                {isGallery && ` 현재 ${imageFiles.length}/10장`}
              </small>
              
              {imagePreviews.length > 0 && (
                <div className="image-preview-grid">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="image-preview-item">
                      <img src={preview} alt={`미리보기 ${index + 1}`} />
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={() => removeImage(index)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isSisterDiary && (
            <div className="form-group">
              <label className="secret-post-checkbox">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                />
                <span>비밀글 (관리자와 작성자만 볼 수 있습니다)</span>
              </label>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(-1)}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '작성 중...' : '작성하기'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}

export default WritePostPage

