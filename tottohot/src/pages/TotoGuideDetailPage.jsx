import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import PageLayout from '../components/PageLayout'
import './TotoGuideDetailPage.css'
import moment from 'moment'

const TotoGuideDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGuide()
  }, [id])

  const fetchGuide = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/toto-guide/public/${id}`)
      setGuide(response.data.guide)
    } catch (error) {
      console.error('가이드 로딩 실패:', error)
      if (error.response?.status === 404) {
        setError('가이드를 찾을 수 없습니다.')
      } else {
        setError('가이드를 불러올 수 없습니다.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="toto-guide-detail-container">
          <div className="loading-message">로딩 중...</div>
        </div>
      </PageLayout>
    )
  }

  if (error || !guide) {
    return (
      <PageLayout>
        <div className="toto-guide-detail-container">
          <div className="error-message">{error || '가이드를 찾을 수 없습니다.'}</div>
          <Link to="/toto-guide" className="btn-back">목록으로</Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="toto-guide-detail-container">
        <div className="toto-guide-detail">
          {/* 메인 이미지 */}
          {guide.mainImage && (
            <div className="guide-main-image">
              <img src={`http://localhost:4001${guide.mainImage}`} alt={guide.title} />
            </div>
          )}

          {/* 제목 띠 - 글 길이에 맞게 조절 */}
          <div 
            className="guide-title-bar"
            style={{ 
              backgroundColor: guide.titleColor || '#39ff14',
              width: 'fit-content',
              padding: '15px 20px',
              borderRadius: '8px',
              marginBottom: '30px',
              maxWidth: '100%'
            }}
          >
            <h1 style={{ color: '#000', margin: 0, fontWeight: 800, fontSize: '28px' }}>
              {guide.title}
            </h1>
          </div>

          {/* 메타 정보 */}
          <div className="guide-meta">
            {guide.category && (
              <span className="guide-category">{guide.category}</span>
            )}
            <span className="guide-date">{moment(guide.createdAt).format('YYYY.MM.DD')}</span>
          </div>

          {/* 내용 */}
          <div className="guide-content">
            <div className="guide-content-text">
              {guide.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < guide.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 목록으로 버튼 */}
          <div className="guide-actions">
            <Link to="/toto-guide" className="btn-back">목록으로</Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default TotoGuideDetailPage
