import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import ImageWithFallback from '../components/ImageWithFallback'
import './BoardPage.css'

const RecruitmentPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasShopLevel, setHasShopLevel] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')

  const locations = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기도', '충청북도', '충청남도', '전라남도', '경상북도', '경상남도',
    '강원도', '전라북도', '제주도'
  ]

  useEffect(() => {
    checkAuth()
    fetchPosts()
  }, [currentPage, selectedLocation])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setCurrentUserId(response.data._id)
        setIsAdmin(response.data.role === 'admin')
        setHasShopLevel(response.data.shopLevel && response.data.shopLevel > 0)
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error)
      }
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = { boardType: 'recruitment', page: currentPage, limit: 15 }
      if (selectedLocation) {
        params.location = selectedLocation
      }
      console.log('게시글 조회 파라미터:', params)
      const response = await api.get('/posts', { params })
      console.log('게시글 조회 결과:', response.data)
      setPosts(response.data.posts || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteRecruitment = async (postId) => {
    if (!window.confirm('구인을 완료 처리하시겠습니까?')) {
      return
    }

    try {
      await api.patch(`/posts/${postId}/complete-recruitment`)
      alert('구인 완료 처리되었습니다.')
      fetchPosts()
    } catch (error) {
      console.error('구인 완료 처리 실패:', error)
      alert('구인 완료 처리에 실패했습니다.')
    }
  }

  const handleLogin = () => {
    navigate('/')
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <h1 className="page-title">구인(매니저&실장)</h1>
      
      <div className="location-filter-top">
        <label htmlFor="location-filter">지역</label>
        <select
          id="location-filter"
          value={selectedLocation}
          onChange={(e) => {
            setSelectedLocation(e.target.value)
            setCurrentPage(1) // 필터 변경 시 첫 페이지로
          }}
        >
          <option value="">전체</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>
      
      <div className={`board-header ${isLoggedIn && hasShopLevel ? '' : 'no-button'}`}>
        <div className="board-stats">
          <span>전체 게시글: {posts.length}개</span>
        </div>
        {isLoggedIn && hasShopLevel && (
          <Link to="/recruitment/write" className="btn-write">글쓰기</Link>
        )}
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="board-list">
            <table>
              <thead>
                <tr>
                  <th>번호</th>
                  <th>제목</th>
                  <th>작성자</th>
                  <th>작성일</th>
                  <th>조회</th>
                  <th>추천</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                      게시글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((post, index) => (
                    <tr key={post._id}>
                      <td>{(currentPage - 1) * 15 + index + 1}</td>
                      <td>
                        <Link to={`/post/${post._id}`} className="post-title" title={post.title}>
                          {post.isNew && <span className="new-badge">N</span>}
                          {post.isRecruitmentCompleted && <span className="completed-badge">[구인완료]</span>}
                          {(() => {
                            let displayTitle = post.title
                            // 제목에서 [위치] 패턴 찾기
                            const locationMatch = displayTitle.match(/^\[([^\]]+)\]\s*(.+)$/)
                            if (locationMatch) {
                              const location = locationMatch[1]
                              const titleWithoutLocation = locationMatch[2]
                              return (
                                <>
                                  <span className="location-badge-small">[{location}]</span> {titleWithoutLocation.length > 15 ? `${titleWithoutLocation.substring(0, 15)}...` : titleWithoutLocation}
                                </>
                              )
                            }
                            return displayTitle.length > 15 ? `${displayTitle.substring(0, 15)}...` : displayTitle
                          })()}
                          {post.commentCount > 0 && (
                            <span className="comment-count"> +{post.commentCount}</span>
                          )}
                        </Link>
                      </td>
                      <td>
                        <div className="author-with-level">
                          {post.author && (post.author.level !== undefined || post.author.shopLevel !== undefined) && (
                            <ImageWithFallback
                              src={post.author.shopLevel && post.author.shopLevel > 0 
                                ? '/levels/shop.gif' 
                                : `/levels/level${post.author.level || 1}.gif`}
                              alt="레벨"
                              className="author-level-image"
                              fallbackText=""
                              style={{ display: 'block', visibility: 'visible', width: '50px', height: '50px' }}
                            />
                          )}
                          <span>{post.author?.nickname || post.author?.username || '익명'}</span>
                        </div>
                      </td>
                      <td>{(() => {
                        const date = new Date(post.createdAt);
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${month}.${day}`;
                      })()}</td>
                      <td>{post.views || 0}</td>
                      <td>{post.likes || 0}</td>
                      <td>
                        {post.isRecruitmentCompleted ? (
                          <span className="completed-status">구인완료</span>
                        ) : (
                          <>
                            <span className="recruiting-status">구인중</span>
                            {isLoggedIn && (isAdmin || (post.author?._id === currentUserId)) && (
                              <button
                                className="btn-complete-recruitment"
                                onClick={() => handleCompleteRecruitment(post._id)}
                                style={{ marginLeft: '8px' }}
                              >
                                구인완료
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="board-pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <span className="page-number">{currentPage} / {totalPages}</span>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        </>
      )}
    </PageLayout>
  )
}

export default RecruitmentPage
