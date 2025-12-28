import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'
import api from '../utils/api'
import './MainContent.css'

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const [bestPosts, setBestPosts] = useState({
    weekly: [],
    monthly: []
  })
  const [freeBoardPosts, setFreeBoardPosts] = useState([])
  const [reviewBoardPosts, setReviewBoardPosts] = useState([])

  // 데이터 가져오기
  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'weekly' || activeTab === 'monthly') {
        // 베스트 게시글 가져오기
        try {
          // 날짜 범위 계산
          const now = new Date()
          let startDate = new Date()
          
          if (activeTab === 'weekly') {
            startDate.setDate(now.getDate() - 7) // 일주일 전
          } else if (activeTab === 'monthly') {
            startDate.setMonth(now.getMonth() - 1) // 한달 전
          }
          
          const startDateStr = startDate.toISOString().split('T')[0]
          
          // 자유게시판과 후기게시판 게시글 모두 가져오기
          const [freeResponse, reviewResponse] = await Promise.all([
            api.get(`/posts?boardType=free-board&limit=50&startDate=${startDateStr}&sort=likes`),
            api.get(`/posts?boardType=review-board&limit=50&startDate=${startDateStr}&sort=likes`)
          ])
          
          // 두 게시판 게시글 합치기
          let allPosts = [
            ...(freeResponse.data.posts || []),
            ...(reviewResponse.data.posts || [])
          ]
          
          // 좋아요 순으로 정렬 (없으면 조회수로)
          allPosts.sort((a, b) => {
            const aLikes = a.likes || 0
            const bLikes = b.likes || 0
            
            if (aLikes !== bLikes) {
              return bLikes - aLikes // 좋아요 많은 순
            }
            
            // 좋아요가 같으면 조회수로 정렬
            const aViews = a.views || 0
            const bViews = b.views || 0
            return bViews - aViews
          })
          
          // 상위 9개만 선택
          const bestPosts = allPosts.slice(0, 9)
          
          setBestPosts(prev => ({
            ...prev,
            [activeTab]: bestPosts
          }))
        } catch (error) {
          console.error('베스트 게시글 로딩 실패:', error)
          // 날짜 필터가 지원되지 않으면 전체 게시글에서 정렬
          try {
            const [freeResponse, reviewResponse] = await Promise.all([
              api.get(`/posts?boardType=free-board&limit=50`),
              api.get(`/posts?boardType=review-board&limit=50`)
            ])
            
            let allPosts = [
              ...(freeResponse.data.posts || []),
              ...(reviewResponse.data.posts || [])
            ]
            
            // 좋아요 순으로 정렬 (없으면 조회수로)
            allPosts.sort((a, b) => {
              const aLikes = a.likes || 0
              const bLikes = b.likes || 0
              
              if (aLikes !== bLikes) {
                return bLikes - aLikes
              }
              
              const aViews = a.views || 0
              const bViews = b.views || 0
              return bViews - aViews
            })
            
            const bestPosts = allPosts.slice(0, 9)
            
            setBestPosts(prev => ({
              ...prev,
              [activeTab]: bestPosts
            }))
          } catch (fallbackError) {
            console.error('베스트 게시글 로딩 실패 (fallback):', fallbackError)
            setBestPosts(prev => ({
              ...prev,
              [activeTab]: []
            }))
          }
        }
      } else if (activeTab === 'free') {
        // 자유게시판 최신글 (9개 가져오기)
        const response = await api.get('/posts?boardType=free-board&limit=9&page=1')
        setFreeBoardPosts(response.data.posts || [])
      } else if (activeTab === 'review') {
        // 후기게시판 최신글 (9개 가져오기)
        const response = await api.get('/posts?boardType=review-board&limit=9&page=1')
        setReviewBoardPosts(response.data.posts || [])
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
      // 에러 발생 시 빈 배열로 설정
      if (activeTab === 'free') {
        setFreeBoardPosts([])
      } else if (activeTab === 'review') {
        setReviewBoardPosts([])
      } else {
        setBestPosts(prev => ({
          ...prev,
          [activeTab]: []
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const guaranteeCompanies = []

  return (
    <main className="main-content">
      <section className="best-section">
        <div className="best-tabs">
          <button 
            className={`best-tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            주간베스트
          </button>
          <button 
            className={`best-tab ${activeTab === 'monthly' ? 'active' : ''}`}
            onClick={() => setActiveTab('monthly')}
          >
            월간베스트
          </button>
          <button 
            className={`best-tab ${activeTab === 'free' ? 'active' : ''}`}
            onClick={() => setActiveTab('free')}
          >
            자유게시판
          </button>
          <button 
            className={`best-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            후기게시판
          </button>
        </div>

        <div className="best-content">
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : (
            <article className="best-article">
              {(activeTab === 'weekly' || activeTab === 'monthly') && (
                <>
                  <div className="best-images">
                    {bestPosts[activeTab].length > 0 ? (
                      bestPosts[activeTab].slice(0, 4).map((post, index) => (
                        <Link key={post._id || post.id} to={`/post/${post._id || post.id}`} className="best-image-item">
                          <ImageWithFallback
                            src={post.images && post.images[0] ? post.images[0] : ''}
                            alt={post.title}
                            fallbackText={`${index + 1}. ${post.title.substring(0, 15)}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div className="best-stats">
                            <span className="stat-item">
                              <span className="stat-icon">👍</span>
                              <span className="stat-value">{post.likes || 0}</span>
                            </span>
                            <span className="stat-item">
                              <span className="stat-icon">💬</span>
                              <span className="stat-value">{post.commentCount || 0}</span>
                            </span>
                            <span className="stat-item">
                              <span className="stat-icon">👁️</span>
                              <span className="stat-value">{post.views || 0}</span>
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="no-posts">게시글이 없습니다.</div>
                    )}
                  </div>
                  <ul className="best-list">
                    {bestPosts[activeTab].slice(4, 9).map((post, index) => (
                      <li key={post._id || post.id}>
                        <Link to={`/post/${post._id || post.id}`}>
                          {index + 5}. {post.title}
                        </Link>
                        <span className="likes">+{post.likes || 0}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {activeTab === 'free' && (
                <>
                  <div className="best-images">
                    {freeBoardPosts.length > 0 ? (
                      freeBoardPosts.slice(0, 4).map((post, index) => (
                        <Link key={post._id || post.id} to={`/post/${post._id || post.id}`} className="best-image-item">
                          <ImageWithFallback
                            src={post.images && post.images[0] ? post.images[0] : ''}
                            alt={post.title}
                            fallbackText={`${index + 1}. ${post.title.substring(0, 15)}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div className="best-stats">
                            <span className="stat-item">
                              <span className="stat-icon">👍</span>
                              <span className="stat-value">{post.likes || 0}</span>
                            </span>
                            <span className="stat-item">
                              <span className="stat-icon">💬</span>
                              <span className="stat-value">{post.commentCount || 0}</span>
                            </span>
                            <span className="stat-item">
                              <span className="stat-icon">👁️</span>
                              <span className="stat-value">{post.views || 0}</span>
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="no-posts">게시글이 없습니다.</div>
                    )}
                  </div>
                  <ul className="best-list">
                    {freeBoardPosts.slice(4, 9).map((post, index) => (
                      <li key={post._id || post.id}>
                        <Link to={`/post/${post._id || post.id}`}>
                          {index + 5}. {post.title}
                        </Link>
                        <span className="likes">+{post.likes || 0}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {activeTab === 'review' && (
                <>
                  <div className="best-images">
                    {reviewBoardPosts.length > 0 ? (
                      reviewBoardPosts.slice(0, 4).map((post, index) => (
                        <Link key={post._id || post.id} to={`/post/${post._id || post.id}`} className="best-image-item">
                          <ImageWithFallback
                            src={post.images && post.images[0] ? post.images[0] : ''}
                            alt={post.title}
                            fallbackText={`${index + 1}. ${post.title.substring(0, 15)}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div className="best-stats">
                            <span className="stat-item">
                              <span className="stat-icon">👍</span>
                              <span className="stat-value">{post.likes || 0}</span>
                            </span>
                            <span className="stat-item">
                              <span className="stat-icon">💬</span>
                              <span className="stat-value">{post.commentCount || 0}</span>
                            </span>
                            <span className="stat-item">
                              <span className="stat-icon">👁️</span>
                              <span className="stat-value">{post.views || 0}</span>
                            </span>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="no-posts">게시글이 없습니다.</div>
                    )}
                  </div>
                  <ul className="best-list">
                    {reviewBoardPosts.slice(4, 9).map((post, index) => (
                      <li key={post._id || post.id}>
                        <Link to={`/post/${post._id || post.id}`}>
                          {index + 5}. {post.title}
                        </Link>
                        <span className="likes">+{post.likes || 0}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </article>
          )}
        </div>
      </section>

      {guaranteeCompanies.length > 0 && (
        <section className="guarantee-section">
          <h2 className="section-title">보증 카지노업체</h2>
          <div className="guarantee-grid">
            {guaranteeCompanies.map((company, index) => (
              <a key={index} href="#company" className="guarantee-item">
                <ImageWithFallback
                  src={company.image}
                  alt={company.name}
                  fallbackText={company.name.substring(0, 20)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <button className="guarantee-btn">{company.name}</button>
              </a>
            ))}
          </div>
        </section>
      )}

    </main>
  )
}

export default MainContent
