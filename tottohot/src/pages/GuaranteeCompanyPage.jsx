import React, { useState, useEffect, useRef } from 'react'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import '../App.css'
import './GuaranteeCompanyPage.css'

const GuaranteeCompanyPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilters, setSelectedFilters] = useState([])
  const [sortBy, setSortBy] = useState('기본')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [companies, setCompanies] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef(null)

  useEffect(() => {
    fetchCompanies()
    fetchTags()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (selectedFilters.length > 0 || searchTerm) {
      fetchCompanies()
    } else {
      fetchCompanies()
    }
  }, [selectedFilters, searchTerm, sortBy])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedFilters.length > 0) {
        selectedFilters.forEach(tag => {
          const tagObj = tags.find(t => t.name === tag)
          if (tagObj) {
            params.append('tags', tagObj._id)
          }
        })
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (sortBy === '신규입점 순') {
        params.append('sort', 'newest')
      } else if (sortBy === '오래된 순') {
        params.append('sort', 'name')
      }

      const response = await api.get(`/guarantee-companies?${params.toString()}`)
      setCompanies(response.data)
    } catch (error) {
      console.error('보증업체 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await api.get('/guarantee-companies/tags/all')
      setTags(response.data)
    } catch (error) {
      console.error('태그 목록 조회 실패:', error)
    }
  }

  const handleDetailClick = (company) => {
    setSelectedCompany(company)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedCompany(null)
  }

  const toggleFilter = (tagName) => {
    if (selectedFilters.includes(tagName)) {
      setSelectedFilters(selectedFilters.filter(f => f !== tagName))
    } else {
      setSelectedFilters([...selectedFilters, tagName])
    }
  }

  const resetFilters = () => {
    setSelectedFilters([])
    setSearchTerm('')
  }

  return (
    <PageLayout>
      <div className="guarantee-company-page">
        <div className="board-container">
        {/* 상단 배너 */}
        <div className="guarantee-banner">
          <div className="banner-content">
            <h1 className="banner-title">로얄토토 공식<br /> 보증업체</h1>
            <p className="banner-description">
              먹튀 검증 NO.1 로얄토토에서 보증하는 제휴 사이트들입니다.<br />
              이용 중 사고 발생시 100% 보상을 약속 드립니다.
            </p>
            <div className="banner-badge">사고발생 100% 보상</div>
          </div>
        </div>

        {/* 필터 및 검색 섹션 */}
        <div className="filter-section">
          <div className="filter-top">
            <div className={`custom-dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
              <button 
                className="dropdown-button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span>{sortBy}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button
                    className={`dropdown-item ${sortBy === '기본' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('기본')
                      setIsDropdownOpen(false)
                    }}
                  >
                    기본
                  </button>
                  <button
                    className={`dropdown-item ${sortBy === '신규입점 순' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('신규입점 순')
                      setIsDropdownOpen(false)
                    }}
                  >
                    신규입점 순
                  </button>
                  <button
                    className={`dropdown-item ${sortBy === '오래된 순' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('오래된 순')
                      setIsDropdownOpen(false)
                    }}
                  >
                    오래된 순
                  </button>
                  <button
                    className={`dropdown-item ${sortBy === '제휴 종료' ? 'selected' : ''}`}
                    onClick={() => {
                      setSortBy('제휴 종료')
                      setIsDropdownOpen(false)
                    }}
                  >
                    제휴 종료
                  </button>
                </div>
              )}
            </div>
            <div className="search-box">
              <input
                type="text"
                className="search-input"
                placeholder="검색어를 입력해 주세요."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">🔍</button>
            </div>
          </div>
          
          <div className="filter-tags">
            {tags.map(tag => (
              <button
                key={tag._id}
                className={`filter-tag ${selectedFilters.includes(tag.name) ? 'active' : ''}`}
                onClick={() => toggleFilter(tag.name)}
              >
                {tag.name}
              </button>
            ))}
          </div>

          <div className="filter-actions">
            <p className="tag-request"># 찾으시는 게 없으신가요? 태그요청</p>
          </div>
        </div>

        {/* 보증업체 목록 */}
        {loading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <div className="companies-grid">
            {companies.length === 0 ? (
              <div className="no-results">보증업체가 없습니다.</div>
            ) : (
              companies.map(company => (
                <div 
                  key={company._id} 
                  className="company-card"
                  onClick={() => handleDetailClick(company)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="company-header">
                    <div className="company-logo">
                      <h2 className="company-name">{company.siteName}</h2>
                      {company.slogan && <p className="company-subtitle">{company.slogan}</p>}
                    </div>
                    <div className="company-badges">
                      {company.features && company.features.slice(0, 6).map((feature, idx) => (
                        <span key={idx} className="badge">{feature}</span>
                      ))}
                    </div>
                  </div>
                  
                  {company.mainImage && (
                    <div className="company-banner">
                      <img src={company.mainImage.startsWith('http') ? company.mainImage : `http://localhost:4001${company.mainImage}`} alt={company.siteName} />
                    </div>
                  )}
                  
                  <div className="company-promotion">
                    {company.promotionText && (
                      <div className="promotion-text">{company.promotionText}</div>
                    )}
                    {company.mainContent && (
                      <p className="company-description">{company.mainContent}</p>
                    )}
                  </div>

                  <div className="company-info">
                    <div className="info-row">
                      <span className="info-label">사이트 이름:</span>
                      <span className="info-value">{company.siteName}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">사이트 주소:</span>
                      <span className="info-value">{company.siteUrl}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">가입코드:</span>
                      <span className="info-value code">{company.joinCode}</span>
                    </div>
                    {company.guaranteeAmount > 0 && (
                      <div className="info-row">
                        <span className="info-label">보증금:</span>
                        <span className="info-value">{company.guaranteeAmount.toLocaleString()}원</span>
                      </div>
                    )}
                    {company.gameTypes && company.gameTypes.length > 0 && (
                      <div className="info-row">
                        <span className="info-label">게임 종류:</span>
                        <span className="info-value">{company.gameTypes.join(', ')}</span>
                      </div>
                    )}
                    <div className="company-actions">
                      <a 
                        href={company.siteUrl || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="go-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        바로가기
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        </div>

      {/* 상세보기 모달 */}
      {isModalOpen && selectedCompany && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>×</button>
            <div className="modal-header">
              <h2 className="modal-title">{selectedCompany.siteName}</h2>
              {selectedCompany.slogan && (
                <p className="modal-subtitle">{selectedCompany.slogan}</p>
              )}
            </div>
            {selectedCompany.mainImage && (
              <div className="modal-banner">
                <img src={selectedCompany.mainImage.startsWith('http') ? selectedCompany.mainImage : `http://localhost:4001${selectedCompany.mainImage}`} alt={selectedCompany.siteName} />
              </div>
            )}
            {selectedCompany.detailImages && selectedCompany.detailImages.length > 0 && (
              <div className="modal-detail-images">
                {selectedCompany.detailImages.map((img, idx) => (
                  <img key={idx} src={img.startsWith('http') ? img : `http://localhost:4001${img}`} alt={`상세 ${idx + 1}`} />
                ))}
              </div>
            )}
            <div className="modal-body">
              {selectedCompany.promotionText && (
                <div className="modal-section">
                  <h3 className="modal-section-title">프로모션</h3>
                  <div className="modal-badges">
                    {selectedCompany.features && selectedCompany.features.map((feature, idx) => (
                      <span key={idx} className="modal-badge">{feature}</span>
                    ))}
                  </div>
                  <p className="modal-promotion">{selectedCompany.promotionText}</p>
                  {selectedCompany.mainContent && (
                    <p className="modal-description">{selectedCompany.mainContent}</p>
                  )}
                </div>
              )}
              {selectedCompany.detailDescription && (
                <div className="modal-section">
                  <h3 className="modal-section-title">상세 정보</h3>
                  <p className="modal-detail-info">{selectedCompany.detailDescription}</p>
                </div>
              )}
              {selectedCompany.tableRows && selectedCompany.tableRows.length > 0 && (
                <div className="modal-section">
                  <h3 className="modal-section-title">추가 정보</h3>
                  <table className="modal-table">
                    <tbody>
                      {selectedCompany.tableRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="table-title">{row.title}</td>
                          <td className="table-content">{row.content}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="modal-section">
                <div className="modal-info-row">
                  <span className="modal-info-label">사이트 이름:</span>
                  <span className="modal-info-value">{selectedCompany.siteName}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">사이트 주소:</span>
                  <span className="modal-info-value">{selectedCompany.siteUrl}</span>
                </div>
                <div className="modal-info-row">
                  <span className="modal-info-label">가입코드:</span>
                  <span className="modal-info-value code">{selectedCompany.joinCode}</span>
                </div>
                {selectedCompany.guaranteeAmount > 0 && (
                  <div className="modal-info-row">
                    <span className="modal-info-label">보증금:</span>
                    <span className="modal-info-value">{selectedCompany.guaranteeAmount.toLocaleString()}원</span>
                  </div>
                )}
                {selectedCompany.gameTypes && selectedCompany.gameTypes.length > 0 && (
                  <div className="modal-info-row">
                    <span className="modal-info-label">게임 종류:</span>
                    <span className="modal-info-value">{selectedCompany.gameTypes.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <a 
                href={selectedCompany.siteUrl || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
                className="modal-go-btn"
              >
                바로가기
              </a>
            </div>
          </div>
        </div>
      )}
      </div>
    </PageLayout>
  )
}

export default GuaranteeCompanyPage
