import React, { useState, useEffect } from 'react'
import { useSearchParams, Link, useParams, useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import ImageWithFallback from '../components/ImageWithFallback'
import './ShopsPage.css'

const ShopsPage = () => {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [shops, setShops] = useState([])
  const [districts, setDistricts] = useState([])
  const [regions, setRegions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedShop, setSelectedShop] = useState(null)
  const [shopDetail, setShopDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
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
  
  const selectedRegion = searchParams.get('region') || ''
  const selectedDistrict = searchParams.get('district') || ''
  const selectedCategory = searchParams.get('category') || ''
  const searchKeyword = searchParams.get('search') || ''
  const itemsPerPage = 20

  useEffect(() => {
    checkAuth()
    fetchRegions()
    fetchCategories()
    if (isLoggedIn) {
      fetchUserInfo()
    }
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserInfo()
    }
  }, [isLoggedIn])

  useEffect(() => {
    fetchShops()
    if (selectedRegion) {
      fetchDistricts(selectedRegion)
    } else {
      setDistricts([])
    }
  }, [selectedRegion, selectedDistrict, selectedCategory, searchKeyword, currentPage])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      setUserInfo(response.data)
    } catch (error) {
      console.error('사용자 정보 로딩 실패:', error)
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
        boardType: 'shop-board',
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
    if (!confirm(`${duration}일 연장하시겠습니까? (${duration * 10000}포인트 차감)`)) {
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

  const fetchShops = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: itemsPerPage
      }
      
      if (selectedRegion) params.region = selectedRegion
      if (selectedDistrict) params.district = selectedDistrict
      if (selectedCategory) params.category = selectedCategory
      if (searchKeyword) params.search = searchKeyword
      
      const response = await api.get('/shops', { params })
      setShops(response.data.shops)
      setTotalPages(response.data.totalPages)
      setTotal(response.data.total)
      if (response.data.districts) {
        setDistricts(response.data.districts)
      }
    } catch (error) {
      console.error('업소 목록 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegionChange = (region) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (region) {
        newParams.set('region', region)
      } else {
        newParams.delete('region')
      }
      newParams.delete('district')
      newParams.set('page', '1')
      return newParams
    })
    setCurrentPage(1)
  }

  const handleDistrictChange = (district) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (district) {
        newParams.set('district', district)
      } else {
        newParams.delete('district')
      }
      newParams.set('page', '1')
      return newParams
    })
    setCurrentPage(1)
  }

  const handleCategoryChange = (category) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (category) {
        newParams.set('category', category)
      } else {
        newParams.delete('category')
      }
      newParams.set('page', '1')
      return newParams
    })
    setCurrentPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const search = formData.get('search')
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (search) {
        newParams.set('search', search)
      } else {
        newParams.delete('search')
      }
      newParams.set('page', '1')
      return newParams
    })
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      newParams.set('page', page.toString())
      return newParams
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLogin = () => {
    window.location.href = '/'
  }

  const handleImageClick = async (e, shop) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedShop(shop)
    setShowDetailModal(true)
    await fetchShopDetail(shop._id)
  }

  const handleCloseDetailModal = () => {
    setShowDetailModal(false)
    setSelectedShop(null)
    setShopDetail(null)
  }

  const fetchShopDetail = async (shopId) => {
    try {
      setDetailLoading(true)
      const response = await api.get(`/shops/${shopId}`)
      setShopDetail(response.data)
    } catch (error) {
      console.error('업소 상세 정보 로딩 실패:', error)
      alert('업소 정보를 불러올 수 없습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <div className="shops-page-container">
        <div className="board-header">
          <h1 className="page-title">업소 찾기</h1>
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
        
        {/* 필터 섹션 */}
        <div className="shops-filters">
          <div className="filter-section">
            <label>지역</label>
            <select 
              value={selectedRegion} 
              onChange={(e) => handleRegionChange(e.target.value)}
              className="filter-select"
            >
              <option value="">전체</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {selectedRegion && (
            <div className="filter-section">
              <label>구</label>
              <select 
                value={selectedDistrict} 
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="filter-select"
              >
                <option value="">전체</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-section">
            <label>업소 종류</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="filter-select"
            >
              <option value="">전체</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <form className="filter-search" onSubmit={handleSearch}>
            <input
              type="text"
              name="search"
              placeholder="업소명 또는 주소 검색"
              defaultValue={searchKeyword}
              className="filter-search-input"
            />
            <button type="submit" className="filter-search-btn">
              <i className="fas fa-search"></i>
            </button>
          </form>
        </div>

        {/* 결과 정보 */}
        <div className="shops-info">
          총 {total.toLocaleString()}개의 업소가 있습니다.
          {selectedRegion && <span className="filter-tag">지역: {selectedRegion}</span>}
          {selectedDistrict && <span className="filter-tag">구: {selectedDistrict}</span>}
          {selectedCategory && <span className="filter-tag">종류: {selectedCategory}</span>}
          {searchKeyword && <span className="filter-tag">검색: {searchKeyword}</span>}
        </div>

        {/* 업소 목록 */}
        {loading ? (
          <div className="shops-loading">로딩 중...</div>
        ) : shops.length === 0 ? (
          <div className="shops-empty">등록된 업소가 없습니다.</div>
        ) : (
          <>
            <div className="shops-list">
              {shops.map(shop => (
                <div key={shop._id} className="shop-card">
                  {shop.isFeatured && <div className="shop-featured-badge">추천</div>}
                  
                  {/* 상단 이미지 */}
                  <div className="shop-card-banner">
                    {shop.images && shop.images.length > 0 && shop.images[0] ? (
                      <ImageWithFallback
                        src={shop.images[0]}
                        alt={shop.name}
                        onClick={(e) => handleImageClick(e, shop, 0)}
                        style={{ 
                          cursor: 'pointer', 
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="shops-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  처음
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 3 || page === currentPage + 3) {
                    return <span key={page} className="pagination-ellipsis">...</span>
                  }
                  return null
                })}
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  마지막
                </button>
              </div>
            )}
          </>
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
                <h2>업소 등록 (1일당 10,000P)</h2>
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
                        const points = days * 10000
                        const pointsText = points >= 10000 ? `${points / 10000}만포인트` : `${points}포인트`
                        return (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setRegisterFormData({ ...registerFormData, duration: days })}
                            style={{
                              padding: '10px 20px',
                              border: registerFormData.duration === days ? '2px solid #007bff' : '1px solid #ddd',
                              backgroundColor: registerFormData.duration === days ? '#e7f3ff' : 'white',
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
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>지역 *</label>
                    <select
                      value={registerFormData.region}
                      onChange={(e) => setRegisterFormData({ ...registerFormData, region: e.target.value })}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>설명</label>
                    <textarea
                      value={registerFormData.description}
                      onChange={(e) => setRegisterFormData({ ...registerFormData, description: e.target.value })}
                      rows="5"
                      placeholder="업소에 대한 상세 설명을 입력해주세요"
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>메인 이미지 (메인 페이지 표시용) *</label>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      권장 크기: 1200px × 750px (16:10 비율)<br />
                      최대 파일 크기: 50MB (png, jpeg, jpg, gif, webp)
                    </p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleMainImageUpload}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                      <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>선택된 파일 없음</div>
                    )}
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>모달 이미지 (상세보기 모달 표시용)</label>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      최대 9개까지 업로드 가능합니다 (png, jpeg, jpg, gif, webp)
                    </p>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      multiple
                      onChange={handleModalImageUpload}
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}
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
                      <div style={{ marginTop: '10px', color: '#666', fontSize: '12px' }}>선택된 파일 없음</div>
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
                        color: '#333',
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
                      style={{ padding: '10px 20px', border: '1px solid #ddd', backgroundColor: 'white', cursor: 'pointer', borderRadius: '5px' }}
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

        {/* 상세보기 모달 */}
        {showDetailModal && (
          <div className="shop-detail-modal-overlay" onClick={handleCloseDetailModal}>
            <div className="shop-detail-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="shop-detail-modal-header">
                <h2>업소 상세 정보</h2>
                <button className="shop-detail-modal-close" onClick={handleCloseDetailModal}>
                  ×
                </button>
              </div>
              <div className="shop-detail-modal-body">
                {detailLoading ? (
                  <div className="shop-detail-loading">로딩 중...</div>
                ) : shopDetail ? (
                  <>
                    <div className="shop-detail-header">
                      {shopDetail.isFeatured && <span className="featured-badge">추천 업소</span>}
                      <h1 className="shop-detail-name">{shopDetail.name}</h1>
                      <div className="shop-detail-meta">
                        <span className="shop-location">
                          <i className="fas fa-map-marker-alt"></i>
                          {shopDetail.region} {shopDetail.district}
                        </span>
                        <span className="shop-category-badge">{shopDetail.category}</span>
                        {shopDetail.rating > 0 && (
                          <span className="shop-rating">
                            <i className="fas fa-star"></i>
                            {shopDetail.rating.toFixed(1)} ({shopDetail.reviewCount}개 리뷰)
                          </span>
                        )}
                      </div>
                    </div>

                    {shopDetail.images && shopDetail.images.length > 0 && (
                      <div className="shop-detail-images">
                        {shopDetail.images.map((image, index) => (
                          <ImageWithFallback
                            key={index}
                            src={image}
                            alt={`${shopDetail.name} ${index + 1}`}
                            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
                            fallbackText="이미지 없음"
                          />
                        ))}
                      </div>
                    )}

                    <div className="shop-detail-content">
                      <div className="shop-detail-section">
                        <h2>업소 정보</h2>
                        <div className="shop-info-grid">
                          <div className="info-item">
                            <label>주소</label>
                            <span>{shopDetail.address}</span>
                          </div>
                          {shopDetail.phone && (
                            <div className="info-item">
                              <label>전화번호</label>
                              <span>{shopDetail.phone}</span>
                            </div>
                          )}
                          <div className="info-item">
                            <label>지역</label>
                            <span>{shopDetail.region} {shopDetail.district}</span>
                          </div>
                          <div className="info-item">
                            <label>업소 종류</label>
                            <span>{shopDetail.category}</span>
                          </div>
                          <div className="info-item">
                            <label>조회수</label>
                            <span>{shopDetail.viewCount || 0}</span>
                          </div>
                        </div>
                      </div>

                      {shopDetail.description && (
                        <div className="shop-detail-section">
                          <h2>상세 설명</h2>
                          <p className="shop-description">{shopDetail.description}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="shop-detail-empty">업소 정보를 불러올 수 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default ShopsPage
