import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './AboutManagement.css'

const AboutManagement = () => {
  const [about, setAbout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    badge: '',
    title: '',
    description: '',
    content: '',
    image: ''
  })

  useEffect(() => {
    fetchAbout()
  }, [])

  const fetchAbout = async () => {
    try {
      setLoading(true)
      const response = await api.get('/about')
      setAbout(response.data)
      setFormData({
        badge: response.data.badge || '',
        title: response.data.title || '',
        description: response.data.description || '',
        content: response.data.content || '',
        image: response.data.image || ''
      })
    } catch (error) {
      console.error('소개 정보 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put('/about', formData)
      alert('소개 정보가 저장되었습니다')
      fetchAbout()
    } catch (error) {
      console.error('소개 정보 저장 오류:', error)
      alert('저장 실패')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (loading) {
    return <div className="about-management">로딩 중...</div>
  }

  return (
    <div className="about-management">
      <div className="page-header">
        <h1 className="page-title">로얄토토 소개 관리</h1>
      </div>

      <form onSubmit={handleSubmit} className="about-form">
        <div className="form-group">
          <label htmlFor="badge">배지 텍스트</label>
          <input
            type="text"
            id="badge"
            name="badge"
            value={formData.badge}
            onChange={handleChange}
            placeholder="예: 국내 최대 규모 NO.1"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="예: 로얄토토 소개"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">간단 설명</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="예: 로얄토토은 국내 최대 규모의 방대한 정보를 보유하고 있는 먹튀 검증 커뮤니티입니다."
            className="form-textarea"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">상세 내용</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="안녕하세요. 온라인 토토사이트 먹튀검증 꽁머니 커뮤니티 로얄토토(ROYAL TOTO) 입니다..."
            className="form-textarea"
            rows="8"
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">이미지 URL</label>
          <input
            type="text"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="이미지 URL을 입력하세요"
            className="form-input"
          />
          {formData.image && (
            <div className="image-preview">
              <img src={formData.image} alt="미리보기" onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            저장하기
          </button>
        </div>
      </form>
    </div>
  )
}

export default AboutManagement

