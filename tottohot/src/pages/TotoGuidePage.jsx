import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import './TotoGuidePage.css'
import moment from 'moment'

const TotoGuidePage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [guides, setGuides] = useState([])
  const [fixedGuides, setFixedGuides] = useState([]) // 고정 글
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGuides()
    fetchFixedGuides()
  }, [currentPage])

  const fetchGuides = async () => {
    try {
      setLoading(true)
      const response = await api.get('/toto-guide/public', {
        params: {
          page: currentPage,
          limit: 20
        }
      })
      setGuides(response.data.guides || [])
      setTotalPages(response.data.totalPages || 1)
      setTotalItems(response.data.total || 0)
    } catch (error) {
      console.error('토토가이드 조회 오류:', error)
      // 에러가 발생해도 빈 배열로 설정하여 페이지가 정상적으로 표시되도록 함
      setGuides([])
      setTotalPages(1)
      setTotalItems(0)
      // 네트워크 오류가 아닌 경우에만 alert 표시
      if (error.response) {
        console.error('서버 응답 오류:', error.response.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchFixedGuides = async () => {
    try {
      const response = await api.get('/toto-guide/public/fixed')
      setFixedGuides(response.data.guides || [])
    } catch (error) {
      console.error('고정 글 조회 오류:', error)
      setFixedGuides([])
    }
  }

  return (
    <PageLayout>
      <div className="toto-guide-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 토토가이드</h1>
            <div className="hero-description">
              <p>토토 용어부터 수익내는 법까지 로얄토토가 전부 알려드립니다.</p>
              <p>초보자도 쉽게 이해할 수 있는 상세한 가이드를 제공합니다.</p>
            </div>
            <button className="hero-cta-btn">가이드 보기</button>
          </div>
        </div>

        {/* 리스트 헤더 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems} / {currentPage} 페이지
          </div>
          <div className="list-actions">
            <button className="refresh-btn">🔄</button>
            <button className="search-btn">🔍</button>
          </div>
        </div>

        {/* 가이드 그리드 */}
        {loading ? (
          <div className="loading-message">로딩 중...</div>
        ) : guides.length === 0 ? (
          <div className="no-guides">등록된 가이드가 없습니다.</div>
        ) : (
          <div className="guides-grid">
            {guides.map(guide => (
              <Link key={guide._id} to={`/toto-guide/${guide._id}`} className="guide-card">
                {guide.mainImage && (
                  <div className="card-thumbnail">
                    <img src={`http://localhost:4001${guide.mainImage}`} alt={guide.title} />
                  </div>
                )}
                <div className="card-content">
                  <div 
                    className="card-title-bar"
                    style={{ 
                      backgroundColor: guide.titleColor || '#39ff14',
                      width: 'fit-content',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      marginBottom: '15px',
                      maxWidth: '100%'
                    }}
                  >
                    <h3 style={{ color: '#000', margin: 0, fontWeight: 700, fontSize: '16px' }}>
                      {guide.title}
                    </h3>
                  </div>
                  {guide.category && (
                    <div className="card-category">{guide.category}</div>
                  )}
                  <div className="card-date">{moment(guide.createdAt).format('YYYY.MM.DD')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        <div className="pagination">
          <button 
            className="pagination-btn prev"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <button
            className="pagination-btn next"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>

        {/* 고정 글 (페이지 하단에 표시되는 관리글) */}
        {fixedGuides.length > 0 && (
          <div className="fixed-guides-section">
            {fixedGuides.map(guide => (
              <div key={guide._id} className="fixed-guide-item">
                <div 
                  className="fixed-guide-title"
                  style={{
                    backgroundColor: guide.titleColor || '#39ff14',
                    padding: '15px 20px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    width: 'fit-content'
                  }}
                >
                  <h3 style={{ 
                    color: '#000', 
                    margin: 0, 
                    fontWeight: 700, 
                    fontSize: '18px' 
                  }}>
                    {guide.title}
                  </h3>
                </div>
                <div 
                  className="fixed-guide-content"
                  style={{
                    padding: '20px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    color: '#fff',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {guide.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 게시판 가이드 (페이지 하단) */}
        <BoardGuide boardKey="toto-guide" />
        </div>
      </div>
    </PageLayout>
  )
}

export default TotoGuidePage