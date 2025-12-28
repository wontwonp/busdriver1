import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import './ShopDetailPage.css'

const ShopDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    fetchShop()
  }, [id])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchShop = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/shops/${id}`)
      setShop(response.data)
    } catch (error) {
      console.error('업소 상세 정보 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
        <div className="shop-detail-loading">로딩 중...</div>
      </PageLayout>
    )
  }

  if (!shop) {
    return (
      <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
        <div className="shop-detail-empty">업소를 찾을 수 없습니다.</div>
      </PageLayout>
    )
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <div className="shop-detail-container">
        <Link to="/shops" className="back-link">
          <i className="fas fa-arrow-left"></i> 목록으로
        </Link>

        <div className="shop-detail-header">
          {shop.isFeatured && <span className="featured-badge">추천 업소</span>}
          <h1 className="shop-detail-name">{shop.name}</h1>
          <div className="shop-detail-meta">
            <span className="shop-location">
              <i className="fas fa-map-marker-alt"></i>
              {shop.region} {shop.district}
            </span>
            <span className="shop-category-badge">{shop.category}</span>
            {shop.rating > 0 && (
              <span className="shop-rating">
                <i className="fas fa-star"></i>
                {shop.rating.toFixed(1)} ({shop.reviewCount}개 리뷰)
              </span>
            )}
          </div>
        </div>

        {shop.images && shop.images.length > 0 && (
          <div className="shop-detail-images">
            {shop.images.map((image, index) => (
              <img key={index} src={image} alt={`${shop.name} ${index + 1}`} />
            ))}
          </div>
        )}

        <div className="shop-detail-content">
          <div className="shop-detail-section">
            <h2>업소 정보</h2>
            <div className="shop-info-grid">
              <div className="info-item">
                <label>주소</label>
                <span>{shop.address}</span>
              </div>
              {shop.phone && (
                <div className="info-item">
                  <label>전화번호</label>
                  <span>{shop.phone}</span>
                </div>
              )}
              <div className="info-item">
                <label>지역</label>
                <span>{shop.region} {shop.district}</span>
              </div>
              <div className="info-item">
                <label>업소 종류</label>
                <span>{shop.category}</span>
              </div>
              <div className="info-item">
                <label>조회수</label>
                <span>{shop.viewCount || 0}</span>
              </div>
            </div>
          </div>

          {shop.description && (
            <div className="shop-detail-section">
              <h2>상세 설명</h2>
              <p className="shop-description">{shop.description}</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

export default ShopDetailPage
