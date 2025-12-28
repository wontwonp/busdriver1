import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './GuaranteeCompanyManagement.css'

const GuaranteeCompanyManagement = () => {
  const [companies, setCompanies] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [newTagName, setNewTagName] = useState('')
  
  const [formData, setFormData] = useState({
    siteName: '',
    siteUrl: '',
    joinCode: '',
    guaranteeAmount: '',
    gameTypes: [],
    features: [],
    slogan: '',
    promotionText: '',
    detailDescription: '',
    tableRowCount: 0,
    tableRows: [],
    tags: [],
    active: true,
    order: 0
  })
  
  const [mainImage, setMainImage] = useState(null)
  const [detailImages, setDetailImages] = useState([])
  const [mainImagePreview, setMainImagePreview] = useState('')
  const [detailImagePreviews, setDetailImagePreviews] = useState([])

  useEffect(() => {
    fetchCompanies()
    fetchTags()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/guarantee-companies')
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'guaranteeAmount') {
      // 숫자만 추출하고 컴마 제거
      const numericValue = value.replace(/[^0-9]/g, '')
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const formatGuaranteeAmount = (value) => {
    if (!value) return ''
    const numericValue = String(value).replace(/[^0-9]/g, '')
    if (numericValue === '') return ''
    return parseInt(numericValue).toLocaleString()
  }

  const handleGameTypeChange = (e) => {
    const value = e.target.value
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        gameTypes: [...prev.gameTypes, value]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        gameTypes: prev.gameTypes.filter(type => type !== value)
      }))
    }
  }

  const handleFeaturesChange = (e) => {
    const value = e.target.value
    // 슬래시로 구분하여 배열로 변환
    const featuresArray = value.split('/').map(f => f.trim()).filter(f => f.length > 0)
    setFormData(prev => ({
      ...prev,
      features: featuresArray
    }))
  }

  const handleTableRowCountChange = (e) => {
    let value = e.target.value
    
    // 빈 값이면 0으로 설정
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        tableRowCount: 0,
        tableRows: []
      }))
      return
    }
    
    // 숫자만 추출
    const numericValue = value.replace(/[^0-9]/g, '')
    
    // 0으로 시작하는 경우 0 제거 (단, 0만 있는 경우는 유지)
    let processedValue = numericValue
    if (numericValue.length > 1 && numericValue.startsWith('0')) {
      processedValue = numericValue.replace(/^0+/, '')
    }
    
    // 빈 값이 되면 0으로 설정
    if (processedValue === '') {
      processedValue = '0'
    }
    
    const count = parseInt(processedValue) || 0
    
    // 1-10 범위 제한
    const limitedCount = Math.min(Math.max(count, 0), 10)
    
    const newRows = []
    for (let i = 1; i <= limitedCount; i++) {
      newRows.push({
        title: formData.tableRows[i - 1]?.title || '',
        content: formData.tableRows[i - 1]?.content || ''
      })
    }
    
    setFormData(prev => ({
      ...prev,
      tableRowCount: limitedCount,
      tableRows: newRows
    }))
  }

  const handleTableRowChange = (index, field, value) => {
    const newRows = [...formData.tableRows]
    newRows[index] = {
      ...newRows[index],
      [field]: value
    }
    setFormData(prev => ({
      ...prev,
      tableRows: newRows
    }))
  }

  const handleMainImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setMainImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setMainImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDetailImagesChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3)
    setDetailImages(files)
    const previews = []
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        previews.push(reader.result)
        if (previews.length === files.length) {
          setDetailImagePreviews(previews)
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        if (key === 'gameTypes' || key === 'features' || key === 'tags') {
          formDataToSend.append(key, JSON.stringify(formData[key]))
        } else if (key === 'guaranteeAmount') {
          // 컴마 제거 후 숫자만 전송
          const numericValue = String(formData[key]).replace(/,/g, '')
          formDataToSend.append(key, numericValue)
        } else if (key === 'tableRows') {
          formData.tableRows.forEach((row, index) => {
            formDataToSend.append(`tableRow${index + 1}Title`, row.title || '')
            formDataToSend.append(`tableRow${index + 1}Content`, row.content || '')
          })
        } else {
          formDataToSend.append(key, formData[key])
        }
      })
      
      formDataToSend.append('tableRowCount', formData.tableRowCount)
      
      if (mainImage) {
        formDataToSend.append('mainImage', mainImage)
      }
      
      detailImages.forEach((img, index) => {
        formDataToSend.append('detailImages', img)
      })

      if (editingCompany) {
        await api.put(`/guarantee-companies/${editingCompany._id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/guarantee-companies', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      resetForm()
      fetchCompanies()
      alert(editingCompany ? '보증업체가 수정되었습니다' : '보증업체가 생성되었습니다')
    } catch (error) {
      console.error('보증업체 저장 실패:', error)
      alert('보증업체 저장에 실패했습니다')
    }
  }

  const handleEdit = (company) => {
    setEditingCompany(company)
    setFormData({
      siteName: company.siteName || '',
      siteUrl: company.siteUrl || '',
      joinCode: company.joinCode || '',
      guaranteeAmount: company.guaranteeAmount ? String(company.guaranteeAmount) : '',
      gameTypes: company.gameTypes || [],
      features: company.features || [],
      slogan: company.slogan || '',
      promotionText: company.promotionText || '',
      detailDescription: company.detailDescription || '',
      tableRowCount: company.tableRows?.length || 0,
      tableRows: company.tableRows || [],
      tags: company.tags?.map(t => t._id || t) || [],
      active: company.active !== false,
      order: company.order || 0
    })
    // 메인 이미지 미리보기 설정 (서버 경로인 경우 URL로 변환)
    if (company.mainImage) {
      if (company.mainImage.startsWith('http')) {
        setMainImagePreview(company.mainImage)
      } else {
        setMainImagePreview(`http://localhost:4001${company.mainImage}`)
      }
    } else {
      setMainImagePreview('')
    }
    // 상세 이미지 미리보기 설정
    if (company.detailImages && company.detailImages.length > 0) {
      const detailPreviews = company.detailImages.map(img => 
        img.startsWith('http') ? img : `http://localhost:4001${img}`
      )
      setDetailImagePreviews(detailPreviews)
    } else {
      setDetailImagePreviews([])
    }
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/guarantee-companies/${id}`)
      fetchCompanies()
      alert('보증업체가 삭제되었습니다')
    } catch (error) {
      console.error('보증업체 삭제 실패:', error)
      alert('보증업체 삭제에 실패했습니다')
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      alert('태그 이름을 입력해주세요')
      return
    }

    try {
      await api.post('/guarantee-companies/tags', { name: newTagName.trim() })
      setNewTagName('')
      fetchTags()
      alert('태그가 생성되었습니다')
    } catch (error) {
      console.error('태그 생성 실패:', error)
      alert(error.response?.data?.message || '태그 생성에 실패했습니다')
    }
  }

  const handleDeleteTag = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await api.delete(`/guarantee-companies/tags/${id}`)
      fetchTags()
      alert('태그가 삭제되었습니다')
    } catch (error) {
      console.error('태그 삭제 실패:', error)
      alert('태그 삭제에 실패했습니다')
    }
  }

  const resetForm = () => {
    setFormData({
      siteName: '',
      siteUrl: '',
      joinCode: '',
      guaranteeAmount: '',
      gameTypes: [],
      features: [],
      slogan: '',
      promotionText: '',
      detailDescription: '',
      tableRowCount: 0,
      tableRows: [],
      tags: [],
      active: true,
      order: 0
    })
    setMainImage(null)
    setDetailImages([])
    setMainImagePreview('')
    setDetailImagePreviews([])
    setEditingCompany(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="loading">로딩 중...</div>
  }

  return (
    <div className="guarantee-company-management">
      <div className="page-header">
        <h1>보증업체 관리</h1>
        <div className="header-actions">
          <button className="btn-create" onClick={() => setShowForm(true)}>
            보증업체 추가
          </button>
        </div>
      </div>

      <div className="tag-management">
          <h2>태그 관리</h2>
          <div className="tag-form">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="태그 이름"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
            />
            <button onClick={handleCreateTag}>태그 추가</button>
          </div>
          <div className="tag-list">
            {tags.map(tag => (
              <div key={tag._id} className="tag-item">
                <span>{tag.name}</span>
                <button onClick={() => handleDeleteTag(tag._id)}>삭제</button>
              </div>
            ))}
          </div>
        </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <div className="form-header">
              <h2>{editingCompany ? '보증업체 수정' : '보증업체 추가'}</h2>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>기본 정보</h3>
                <div className="form-group">
                  <label>사이트명 *</label>
                  <input
                    type="text"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleInputChange}
                    required
                    maxLength={20}
                  />
                  <small className="char-count">
                    {formData.siteName.length}/20
                    {formData.siteName.length >= 18 && (
                      <span className="warning-text"> ⚠️ 사이트명이 길어 잘릴 수 있습니다</span>
                    )}
                  </small>
                </div>
                <div className="form-group">
                  <label>사이트주소 *</label>
                  <input
                    type="url"
                    name="siteUrl"
                    value={formData.siteUrl}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>가입코드 *</label>
                  <input
                    type="text"
                    name="joinCode"
                    value={formData.joinCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>보증금 (원)</label>
                  <input
                    type="text"
                    name="guaranteeAmount"
                    value={formatGuaranteeAmount(formData.guaranteeAmount)}
                    onChange={handleInputChange}
                    onBlur={(e) => {
                      // blur 시에도 포맷팅 유지
                      const numericValue = e.target.value.replace(/[^0-9]/g, '')
                      setFormData(prev => ({
                        ...prev,
                        guaranteeAmount: numericValue
                      }))
                    }}
                    placeholder="예: 100000000"
                    style={{ textAlign: 'right' }}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>게임 종류</h3>
                <div className="checkbox-group">
                  {['스포츠', '카지노', '미니게임', '슬롯', '포커', '홀덤'].map(type => (
                    <label key={type}>
                      <input
                        type="checkbox"
                        value={type}
                        checked={formData.gameTypes.includes(type)}
                        onChange={handleGameTypeChange}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <h3>특장점 (슬래시로 구분)</h3>
                <div className="form-group">
                  <label>특장점을 슬래시(/)로 구분하여 입력하세요</label>
                  <input
                    type="text"
                    value={Array.isArray(formData.features) ? formData.features.join(' / ') : ''}
                    onChange={handleFeaturesChange}
                    placeholder="예: 첫증40% / 돌발10% / 높은배당"
                  />
                  {formData.features && formData.features.length > 0 && (
                    <div className="features-preview">
                      <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
                        입력된 특장점: {formData.features.join(' / ')}
                      </small>
                      {formData.features.some(f => f.length > 12) && (
                        <small className="warning-text" style={{ display: 'block', marginTop: '4px', color: '#ff6b6b' }}>
                          ⚠️ 일부 특장점이 길어 잘릴 수 있습니다 (권장: 12자 이하)
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>메인 이미지</h3>
                <div className="form-group">
                  <label>메인 이미지</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMainImageChange}
                  />
                  {mainImagePreview && (
                    <img src={mainImagePreview} alt="미리보기" className="image-preview" />
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>상세 내용</h3>
                <div className="form-group">
                  <label>상세 이미지 (최대 3장)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDetailImagesChange}
                  />
                  <div className="image-preview-grid">
                    {detailImagePreviews.map((preview, index) => (
                      <img key={index} src={preview} alt={`상세 ${index + 1}`} className="image-preview" />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>상세 설명</label>
                  <textarea
                    name="detailDescription"
                    value={formData.detailDescription}
                    onChange={handleInputChange}
                    rows="6"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>표 데이터</h3>
                <div className="form-group">
                  <label>표 행 개수 (1-10)</label>
                  <input
                    type="text"
                    value={formData.tableRowCount || ''}
                    onChange={handleTableRowCountChange}
                    onFocus={(e) => {
                      // 포커스 시 0이면 선택 상태로 만들어서 바로 덮어쓸 수 있게
                      if (e.target.value === '0') {
                        e.target.select()
                      }
                    }}
                    placeholder="1-10 사이의 숫자"
                  />
                </div>
                {formData.tableRows.map((row, index) => (
                  <div key={index} className="table-row-input">
                    <div className="form-group">
                      <label>{index + 1}제목</label>
                      <input
                        type="text"
                        value={row.title || ''}
                        onChange={(e) => handleTableRowChange(index, 'title', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>{index + 1}내용</label>
                      <textarea
                        value={row.content || ''}
                        onChange={(e) => handleTableRowChange(index, 'content', e.target.value)}
                        rows="3"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-section">
                <h3>태그</h3>
                <div className="tag-selector">
                  {tags.map(tag => (
                    <label key={tag._id} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.tags.includes(tag._id)}
                        onChange={() => handleTagToggle(tag._id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-section">
                <div className="form-group">
                  <label className="active-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    />
                    활성화
                  </label>
                </div>
                <div className="form-group">
                  <label>정렬 순서</label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>카드 미리보기</h3>
                <div className="card-preview-container">
                  <div className="card-preview">
                    <div className="preview-header">
                      <div className="preview-logo">
                        <h2 className="preview-name" title={formData.siteName}>
                          {formData.siteName || '사이트명'}
                        </h2>
                      </div>
                      <div className="preview-badges">
                        {formData.features && formData.features.length > 0 ? (
                          formData.features.slice(0, 6).map((feature, idx) => (
                            <span key={idx} className="preview-badge" title={feature}>
                              {feature}
                            </span>
                          ))
                        ) : (
                          <span className="preview-badge-placeholder">특장점</span>
                        )}
                      </div>
                    </div>
                    {mainImagePreview && (
                      <div className="preview-banner">
                        <img src={mainImagePreview} alt="미리보기" />
                      </div>
                    )}
                    {formData.promotionText && (
                      <div className="preview-promotion">
                        {formData.promotionText}
                      </div>
                    )}
                  </div>
                  <div className="preview-warnings">
                    {formData.siteName.length >= 18 && (
                      <div className="warning-item">
                        <span className="warning-icon">⚠️</span>
                        <span>사이트명이 길어 카드에서 잘릴 수 있습니다</span>
                      </div>
                    )}
                    {formData.features && formData.features.some(f => f.length > 12) && (
                      <div className="warning-item">
                        <span className="warning-icon">⚠️</span>
                        <span>일부 특장점이 길어 잘릴 수 있습니다 (권장: 12자 이하)</span>
                      </div>
                    )}
                    {formData.features && formData.features.length > 6 && (
                      <div className="warning-item">
                        <span className="warning-icon">ℹ️</span>
                        <span>특장점은 최대 6개만 표시됩니다 (현재: {formData.features.length}개)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">{editingCompany ? '수정' : '생성'}</button>
                <button type="button" onClick={resetForm}>취소</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="companies-list">
        <table className="data-table">
          <thead>
            <tr>
              <th>사이트명</th>
              <th>사이트주소</th>
              <th>가입코드</th>
              <th>태그</th>
              <th>활성</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company._id}>
                <td>{company.siteName}</td>
                <td>{company.siteUrl}</td>
                <td>{company.joinCode}</td>
                <td>
                  {company.tags?.map(tag => (
                    <span key={tag._id || tag} className="tag-badge">
                      {typeof tag === 'object' ? tag.name : tag}
                    </span>
                  ))}
                </td>
                <td>{company.active ? '활성' : '비활성'}</td>
                <td>
                  <button onClick={() => handleEdit(company)}>수정</button>
                  <button onClick={() => handleDelete(company._id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GuaranteeCompanyManagement

