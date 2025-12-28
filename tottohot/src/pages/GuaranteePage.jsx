import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageLayout from './PageLayout'
import ImageWithFallback from '../components/ImageWithFallback'
import api from '../utils/api'
import './GuaranteePage.css'

const GuaranteePage = () => {
  const navigate = useNavigate()
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('제목')
  const [showBlogModal, setShowBlogModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [shops, setShops] = useState([])
  const [shopsLoading, setShopsLoading] = useState(false)
  const [shopsPage, setShopsPage] = useState(1)
  const [shopsTotalPages, setShopsTotalPages] = useState(1)
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [categories, setCategories] = useState([])
  const [userInfo, setUserInfo] = useState(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerFormData, setRegisterFormData] = useState({ 
    name: '', 
    region: '', 
    district: '', 
    category: '', 
    address: '', 
    phone: '', 
    description: '', 
    duration: 7,
    isFeatured: false
  })
  const [mainImageFile, setMainImageFile] = useState(null)
  const [modalImageFiles, setModalImageFiles] = useState([])
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  
  const allRegions = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기도', '충청북도', '충청남도', '전라남도', '경상북도', '경상남도', '강원도', '전라북도', '제주도']

  useEffect(() => {
    fetchCompanies()
    fetchShops()
    fetchRegions()
    fetchCategories()
    if (isLoggedIn) {
      fetchUserInfo()
    }
  }, [])

  useEffect(() => {
    fetchShops()
  }, [shopsPage])

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserInfo()
    }
  }, [isLoggedIn])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await api.get('/companies')
      setCompanies(response.data)
    } catch (error) {
      console.error('보증업체 목록 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    window.location.reload()
  }

  const handleSearch = () => {
    // 검색 기능은 추중에 구현 예정
    console.log('검색', searchType, searchTerm)
  }

  const handleVisitCompany = (company) => {
    if (company.url) {
      window.open(company.url, '_blank')
    } else {
      alert('업체 URL이 등록되어 있지 않습니다.')
    }
  }

  const handleBlogVisit = (company) => {
    setSelectedCompany(company)
    setShowBlogModal(true)
  }

  const handleCloseBlogModal = () => {
    setShowBlogModal(false)
    setSelectedCompany(null)
  }

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      setUserInfo(response.data)
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
    }
  }

  const fetchShops = async () => {
    try {
      setShopsLoading(true)
      const response = await api.get('/shops/premium', {
        params: { page: shopsPage, limit: 20 }
      })
      setShops(response.data.shops)
      setShopsTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('업소 로딩 실패:', error)
    } finally {
      setShopsLoading(false)
    }
  }

  const fetchRegions = async () => {
    try {
      const response = await api.get('/shops/regions/list')
      setRegions(response.data)
    } catch (error) {
      console.error('지역 목록 로딩 실패:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/shops/categories/list')
      setCategories(response.data)
    } catch (error) {
      console.error('업소 종류 목록 로딩 실패:', error)
    }
  }

  const fetchDistricts = async (region) => {
    try {
      const response = await api.get(`/shops/regions/${region}/districts`)
      setDistricts(response.data)
    } catch (error) {
      console.error('구 목록 로딩 실패:', error)
    }
  }

  const handleMainImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.')
        return
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('파일 크기는 50MB 이하여야 합니다.')
        return
      }
      setMainImageFile(file)
    }
  }

  const handleModalImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + modalImageFiles.length > 9) {
      alert('모달 이미지는 최대 9개까지 업로드가 가능합니다.')
      return
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
    setModalImageFiles([...modalImageFiles, ...validFiles])
  }

  const removeMainImageFile = () => {
    setMainImageFile(null)
  }

  const removeModalImageFile = (index) => {
    setModalImageFiles(modalImageFiles.filter((_, i) => i !== index))
  }

  const handleRegisterShop = async (e) => {
    e.preventDefault()
    if (!registerFormData.name.trim() || !registerFormData.region || !registerFormData.district || !registerFormData.category) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    try {
      // 이미지 업로드
      const images = []
      
      // 메인 이미지 업로드
      if (mainImageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', mainImageFile)
        const uploadResponse = await api.post('/upload/image', uploadFormData)
        const imageUrl = uploadResponse.data.imageUrl || uploadResponse.data.url
        if (imageUrl) {
          // 상대 경로로 변환
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            const uploadsIndex = imageUrl.indexOf('/uploads/')
            images.push(uploadsIndex !== -1 ? imageUrl.substring(uploadsIndex) : imageUrl)
          } else {
            images.push(imageUrl)
          }
        }
      }

      // 모달 이미지 업로드
      for (const file of modalImageFiles) {
        const uploadFormData = new FormData()
        uploadFormData.append('image', file)
        const uploadResponse = await api.post('/upload/image', uploadFormData)
        const imageUrl = uploadResponse.data.imageUrl || uploadResponse.data.url
        if (imageUrl) {
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            const uploadsIndex = imageUrl.indexOf('/uploads/')
            images.push(uploadsIndex !== -1 ? imageUrl.substring(uploadsIndex) : imageUrl)
          } else {
            images.push(imageUrl)
          }
        }
      }

      const response = await api.post('/shops', {
        ...registerFormData,
        boardType: 'premium-board',
        duration: parseInt(registerFormData.duration),
        images: images,
        isFeatured: registerFormData.isFeatured || false
      })
      
      if (response.data.remainingPoints !== undefined) {
        alert(`업소가 등록되었습니다. 남은 포인트: ${response.data.remainingPoints.toLocaleString()}P`)
        if (userInfo) {
          setUserInfo({ ...userInfo, points: response.data.remainingPoints })
        }
      }
      
      setShowRegisterModal(false)
      setRegisterFormData({ 
        name: '', 
        region: '', 
        district: '', 
        category: '', 
        address: '', 
        phone: '', 
        description: '', 
        duration: 7,
        isFeatured: false
      })
      setMainImageFile(null)
      setModalImageFiles([])
      setIsCustomCategory(false)
      // 파일 input 초기화
      const fileInputs = document.querySelectorAll('input[type="file"]')
      fileInputs.forEach(input => input.value = '')
      fetchShops()
    } catch (error) {
      alert(error.response?.data?.message || '업소 등록에 실패했습니다.')
    }
  }

  const handleExtendShop = async (shopId, duration) => {
    if (!confirm(`${duration}일 연장하시겠습니까? (${duration * 30000}포인트 차감)`)) {
      return
    }

    try {
      const response = await api.patch(`/shops/${shopId}/extend`, { duration })
      if (response.data.remainingPoints !== undefined) {
        alert(`업소가 연장되었습니다. 남은 포인트: ${response.data.remainingPoints.toLocaleString()}P`)
        if (userInfo) {
          setUserInfo({ ...userInfo, points: response.data.remainingPoints })
        }
      }
      fetchShops()
    } catch (error) {
      alert(error.response?.data?.message || '업소 연장에 실패했습니다.')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) <= new Date()
  }

  const getRemainingDays = (expiresAt) => {
    if (!expiresAt) return 0
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry - now
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const filteredCompanies = companies.filter(company => {
    if (!searchTerm) return true
    if (searchType === '제목') {
      return company.name.toLowerCase().includes(searchTerm.toLowerCase())
    }
    return true
  })

  if (loading) {
    return (
      <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
        <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>로딩 중...</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <div className="board-header">
        <h1 className="page-title">프리미엄 업체</h1>
        {isLoggedIn && userInfo && userInfo.shopLevel > 0 && (
          <button 
            className="btn-write" 
            onClick={() => setShowRegisterModal(true)}
            style={{ marginLeft: 'auto' }}
          >
            업소 등록
          </button>
        )}
      </div>

      {/* 업소 목록 */}
      {shopsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>로딩 중...</div>
      ) : shops.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>등록된 업소가 없습니다.</div>
      ) : (
        <div className="shops-list" style={{ marginTop: '20px' }}>
          {shops.map(shop => (
            <div key={shop._id} className="shop-card">
              {shop.isFeatured && <div className="shop-featured-badge">추천</div>}
              
              {/* 상단 이미지 */}
              <div className="shop-card-banner">
                {shop.images && shop.images.length > 0 && shop.images[0] ? (
                  <ImageWithFallback
                    src={shop.images[0]}
                    alt={shop.name}
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      maxHeight: '400px', 
                      objectFit: 'contain',
                      display: 'block',
                      minHeight: '150px'
                    }}
                    fallbackText="이미지 없음"
                  />
                ) : (
                  <div className="shop-placeholder">이미지 없음</div>
                )}
              </div>
              
              {/* 상단 정보 블록 */}
              <div className="shop-card-info">
                <div className="info-row">
                  <span className="info-label">업소명</span>
                  <span className="info-value">{shop.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">지역</span>
                  <span className="info-value">{shop.region} {shop.district}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">종류</span>
                  <span className="info-value">{shop.category}</span>
                </div>
                {shop.exposureEndDate && isLoggedIn && userInfo && shop.createdBy && (shop.createdBy._id === userInfo._id || shop.createdBy.toString() === userInfo._id) && (
                  <div className="info-row">
                    <span className="info-label">만료일</span>
                    <span className="info-value" style={{ color: isExpired(shop.exposureEndDate) ? 'red' : 'green' }}>
                      {formatDate(shop.exposureEndDate)} ({getRemainingDays(shop.exposureEndDate) > 0 ? `${getRemainingDays(shop.exposureEndDate)}일 남음` : '만료'})
                    </span>
                  </div>
                )}
                {isLoggedIn && userInfo && shop.createdBy && (shop.createdBy._id === userInfo._id || shop.createdBy.toString() === userInfo._id) && !isExpired(shop.exposureEndDate) && (
                  <div className="info-row">
                    <span className="info-label">연장</span>
                    <div className="info-value extend-buttons-container">
                      <button 
                        className="btn-extend" 
                        onClick={() => handleExtendShop(shop._id, 7)}
                      >
                        7일 연장
                      </button>
                      <button 
                        className="btn-extend" 
                        onClick={() => handleExtendShop(shop._id, 15)}
                      >
                        15일 연장
                      </button>
                      <button 
                        className="btn-extend" 
                        onClick={() => handleExtendShop(shop._id, 30)}
                      >
                        30일 연장
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {shopsTotalPages > 1 && (
        <div className="shops-pagination" style={{ marginTop: '20px' }}>
          <button
            className="pagination-btn"
            onClick={() => setShopsPage(1)}
            disabled={shopsPage === 1}
          >
            처음
          </button>
          <button
            className="pagination-btn"
            onClick={() => setShopsPage(shopsPage - 1)}
            disabled={shopsPage === 1}
          >
            이전
          </button>
          {Array.from({ length: shopsTotalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === shopsTotalPages ||
              (page >= shopsPage - 2 && page <= shopsPage + 2)
            ) {
              return (
                <button
                  key={page}
                  className={`pagination-btn ${shopsPage === page ? 'active' : ''}`}
                  onClick={() => setShopsPage(page)}
                >
                  {page}
                </button>
              )
            } else if (page === shopsPage - 3 || page === shopsPage + 3) {
              return <span key={page} className="pagination-ellipsis">...</span>
            }
            return null
          })}
          <button
            className="pagination-btn"
            onClick={() => setShopsPage(shopsPage + 1)}
            disabled={shopsPage === shopsTotalPages}
          >
            다음
          </button>
          <button
            className="pagination-btn"
            onClick={() => setShopsPage(shopsTotalPages)}
            disabled={shopsPage === shopsTotalPages}
          >
            마지막
          </button>
        </div>
      )}

      {/* 업소 등록 모달 */}
      {showRegisterModal && (
        <div className="shop-detail-modal-overlay" onClick={() => {
          setShowRegisterModal(false)
          setMainImageFile(null)
          setModalImageFiles([])
          setIsCustomCategory(false)
        }}>
          <div className="shop-detail-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="shop-detail-modal-header">
              <h2>프리미엄업소등록 (1일당 30,000P)</h2>
              <button className="shop-detail-modal-close" onClick={() => {
                setShowRegisterModal(false)
                setMainImageFile(null)
                setModalImageFiles([])
                setIsCustomCategory(false)
              }}>
                ×
              </button>
            </div>
            <div className="shop-detail-modal-body">
              <form onSubmit={handleRegisterShop}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>기간 선택</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {[7, 15, 30].map(days => {
                      const points = days * 30000
                      const pointsText = points >= 10000 ? `${points / 10000}만포인트` : `${points}포인트`
                      return (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setRegisterFormData({ ...registerFormData, duration: days })}
                          style={{
                            padding: '10px 20px',
                            border: registerFormData.duration === days ? '2px solid #007bff' : '1px solid #444',
                            backgroundColor: registerFormData.duration === days ? '#1a3a5a' : '#1a1a1a',
                            color: '#fff',
                            cursor: 'pointer',
                            borderRadius: '5px'
                          }}
                        >
                          {days}일 ({pointsText})
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>업소명 *</label>
                  <input
                    type="text"
                    value={registerFormData.name}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>지역 *</label>
                  <select
                    value={registerFormData.region}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, region: e.target.value })}
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                    required
                  >
                    <option value="">선택하세요</option>
                    {allRegions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>구 *</label>
                  <input
                    type="text"
                    value={registerFormData.district}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, district: e.target.value })}
                    placeholder="예: 강남구"
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                    required
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>업소 종류 *</label>
                  {!isCustomCategory ? (
                    <>
                      <select
                        value={registerFormData.category}
                        onChange={(e) => {
                          if (e.target.value === '직접 입력') {
                            setIsCustomCategory(true)
                            setRegisterFormData({ ...registerFormData, category: '' })
                          } else {
                            setRegisterFormData({ ...registerFormData, category: e.target.value })
                          }
                        }}
                        style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                        required
                      >
                        <option value="">선택하세요</option>
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                        <option value="직접 입력">직접 입력</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={registerFormData.category}
                        onChange={(e) => setRegisterFormData({ ...registerFormData, category: e.target.value })}
                        placeholder="업소 종류를 직접 입력해주세요"
                        style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategory(false)
                          setRegisterFormData({ ...registerFormData, category: '유흥주점' })
                        }}
                        style={{
                          marginTop: '5px',
                          padding: '5px 10px',
                          background: '#666',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        목록에서 선택
                      </button>
                    </>
                  )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>전화번호</label>
                  <input
                    type="text"
                    value={registerFormData.phone}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, phone: e.target.value })}
                    placeholder="예: 02-1234-5678"
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>설명</label>
                  <textarea
                    value={registerFormData.description}
                    onChange={(e) => setRegisterFormData({ ...registerFormData, description: e.target.value })}
                    rows="5"
                    placeholder="업소에 대한 상세 설명을 입력해주세요"
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                  />
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>메인 이미지 (메인 페이지 표시용) *</label>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                    권장 크기: 1200px × 750px (16:10 비율)<br />
                    최대 파일 크기: 50MB (png, jpeg, jpg, gif, webp)
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    onChange={handleMainImageUpload}
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                  />
                  {mainImageFile ? (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img 
                          src={URL.createObjectURL(mainImageFile)} 
                          alt="메인 이미지 미리보기" 
                          style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
                        />
                        <button 
                          type="button" 
                          onClick={removeMainImageFile}
                          style={{ 
                            position: 'absolute', 
                            top: '5px', 
                            right: '5px', 
                            padding: '5px 10px', 
                            backgroundColor: 'red', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '3px', 
                            cursor: 'pointer' 
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '10px', color: '#888', fontSize: '12px' }}>선택된 파일 없음</div>
                  )}
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>모달 이미지 (상세보기 모달 표시용)</label>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                    최대 9개까지 업로드 가능합니다 (png, jpeg, jpg, gif, webp)
                  </p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    multiple
                    onChange={handleModalImageUpload}
                    style={{ width: '100%', padding: '10px', border: '1px solid #444', borderRadius: '5px', backgroundColor: '#1a1a1a', color: '#fff' }}
                  />
                  {modalImageFiles.length > 0 ? (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {modalImageFiles.map((file, index) => (
                        <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`모달 이미지 미리보기 ${index + 1}`} 
                            style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '5px' }}
                          />
                          <button 
                            type="button" 
                            onClick={() => removeModalImageFile(index)}
                            style={{ 
                              position: 'absolute', 
                              top: '5px', 
                              right: '5px', 
                              padding: '5px 10px', 
                              backgroundColor: 'red', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '3px', 
                              cursor: 'pointer' 
                            }}
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                      <div style={{ marginTop: '10px', color: '#888', fontSize: '12px' }}>선택된 파일 없음</div>
                    )}
                  </div>
                  <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={registerFormData.isFeatured}
                      onChange={(e) => setRegisterFormData({ ...registerFormData, isFeatured: e.target.checked })}
                      style={{ 
                        width: '20px', 
                        height: '20px', 
                        cursor: 'pointer',
                        accentColor: '#007bff'
                      }}
                    />
                    <label 
                      htmlFor="isFeatured" 
                      style={{ 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: '#fff',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      추천 업소로 설정
                    </label>
                  </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterModal(false)
                      setMainImageFile(null)
                      setModalImageFiles([])
                      setIsCustomCategory(false)
                    }}
                    style={{ padding: '10px 20px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', cursor: 'pointer', borderRadius: '5px' }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '10px 20px', border: 'none', backgroundColor: '#007bff', color: 'white', cursor: 'pointer', borderRadius: '5px' }}
                  >
                    등록
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 보증업체 카드 목록 */}
      {filteredCompanies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888', marginTop: '40px' }}>
          {searchTerm ? '검색 결과가 없습니다.' : '등록된 보증업체가 없습니다.'}
        </div>
      ) : (
        <div className="guarantee-list" style={{ marginTop: '40px' }}>
          {filteredCompanies.map((company) => (
            <div key={company._id} className="guarantee-card">
              {/* 상단 이미지/배너 - 클릭 시 블로그 모달 열기 */}
              <div 
                className="guarantee-card-banner"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleBlogVisit(company)
                }}
                style={{ cursor: 'pointer' }}
              >
                <ImageWithFallback
                  src={company.image}
                  alt={company.name}
                  fallbackText={company.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />
              </div>
              
              {/* 상단 정보 블록 */}
              <div className="guarantee-card-info">
                <div className="info-row">
                  <span className="info-label">사이트명</span>
                  <span className="info-value">{company.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">가입코드</span>
                  <span className="info-value join-code">{company.joinCode || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 블로그 모달 */}
      {showBlogModal && selectedCompany && (
        <div className="blog-modal-overlay" onClick={handleCloseBlogModal}>
          <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="blog-modal-header">
              <h2>{selectedCompany.name} 블로그</h2>
              <button className="blog-modal-close" onClick={handleCloseBlogModal}>
                ×
              </button>
            </div>
            <div className="blog-modal-body">
              <div className="blog-content-wrapper">
                {/* 메인 이미지 */}
                {selectedCompany.mainImage && (
                  <div className="blog-main-image">
                    <img 
                      src={selectedCompany.mainImage} 
                      alt="메인 이미지"
                      className="blog-main-img"
                    />
                  </div>
                )}
                
                {/* 블로그 콘텐츠 */}
                {selectedCompany.blogContent && (
                  <div className="blog-content-text">
                    {selectedCompany.blogContent.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        {index < selectedCompany.blogContent.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                
                {/* 추가 이미지들 */}
                {selectedCompany.blogImages && selectedCompany.blogImages.length > 0 && (
                  <div className="blog-images-grid">
                    {selectedCompany.blogImages.map((imageUrl, index) => (
                      <div key={index} className="blog-image-item">
                        <img 
                          src={imageUrl} 
                          alt={`이미지 ${index + 1}`}
                          className="blog-sub-img"
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 블로그 콘텐츠가 없을 때 */}
                {!selectedCompany.blogContent && !selectedCompany.mainImage && (!selectedCompany.blogImages || selectedCompany.blogImages.length === 0) && (
                  <div className="blog-empty-message">
                    블로그 콘텐츠가 아직 등록되지 않았습니다.
                  </div>
                )}
              </div>
              
              <div className="blog-modal-footer">
                {selectedCompany.url && (
                  <button 
                    className="btn-open-external"
                    onClick={() => window.open(selectedCompany.url, '_blank')}
                  >
                    사이트 바로가기
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </button>
                )}
                <button 
                  className="btn-close-modal"
                  onClick={handleCloseBlogModal}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default GuaranteePage
