import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import moment from 'moment'
import './SportsAnalysisPage.css'

const SportsAnalysisPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [currentPage, setCurrentPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const categories = ['전체', '축구', '야구', '농구', '배구', '하키', '기타']

  useEffect(() => {
    fetchPosts()
  }, [currentPage, selectedCategory])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'sports-analysis',
        page: currentPage,
        limit: 20,
        category: selectedCategory !== '전체' ? selectedCategory : undefined
      }
      
      const response = await api.get('/posts', { params })
      setPosts(response.data.posts || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setTotalItems(response.data.pagination?.count || 0)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      '축구': '⚽',
      '야구': '⚾',
      '농구': '🏀',
      '배구': '🏐',
      '하키': '🏒',
      '기타': '🎯'
    }
    return icons[category] || '📊'
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = moment(dateString)
    return date.format('MM.DD')
  }

  const filteredPosts = selectedCategory === '전체' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory)

  return (
    <PageLayout>
      <div className="sports-analysis-page">
        <div className="board-container">
        {/* 히어로 배너 */}
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">로얄토토 스포츠분석</h1>
            <div className="hero-description">
              <p>스포츠 분석 NO.1 로얄토토에서 제공하는 전문 분석 정보입니다.</p>
              <p>정확한 분석으로 승률을 높이고 수익을 극대화하세요.</p>
            </div>
            <button className="hero-cta-btn">분석가 지원하기</button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 게시글 목록 헤더 */}
        <div className="list-header">
          <div className="pagination-info">
            전체 {totalItems.toLocaleString()} / {currentPage} 페이지
          </div>
          <div className="list-actions">
            <button className="ranking-btn">
              <span className="icon">🏆</span>
              분석가랭킹
            </button>
            <button className="sort-btn">↑↓</button>
            <button className="search-btn">🔍</button>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="posts-table">
          {loading ? (
            <div className="loading-message">로딩 중...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="no-posts-message">등록된 게시글이 없습니다.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th className="col-num">번호</th>
                  <th className="col-title">제목</th>
                  <th className="col-author">닉네임</th>
                  <th className="col-date">날짜</th>
                  <th className="col-views">조회</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map((post) => (
                  <tr key={post._id} className={post.isNotice ? 'notice-row' : ''}>
                    <td className="col-num">
                      {post.isNotice ? (
                        <span className="notice-badge">알림</span>
                      ) : (
                        post.postNumber || '-'
                      )}
                    </td>
                    <td className="col-title">
                      <Link to={`/post/${post._id}`} className="post-link">
                        {!post.isNotice && post.category && (
                          <span className="category-icon">{getCategoryIcon(post.category)}</span>
                        )}
                        {post.title}
                        {post.commentCount > 0 && (
                          <span className="comments-count"> +{post.commentCount}</span>
                        )}
                      </Link>
                    </td>
                    <td className="col-author">{post.author?.nickname || post.author?.username || '익명'}</td>
                    <td className="col-date">{formatDate(post.createdAt)}</td>
                    <td className="col-views">{(post.views || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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

        {/* 글쓰기 버튼 */}
        <div className="write-button-container">
          <Link to="/sports-analysis/write" className="write-btn">
            글쓰기
          </Link>
        </div>
        </div>

        {/* 게시판 가이드 (페이지 하단) */}
        <BoardGuide boardKey="sports-analysis" />
      </div>
    </PageLayout>
  )
}

export default SportsAnalysisPage