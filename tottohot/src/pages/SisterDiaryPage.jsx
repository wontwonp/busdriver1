import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import ImageWithFallback from '../components/ImageWithFallback'
import './BoardPage.css'

const SisterDiaryPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [userId, setUserId] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isLoggedIn !== undefined) {
      fetchPosts()
    }
  }, [currentPage, isLoggedIn, userId, isAdmin])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    
    if (token) {
      try {
        const response = await api.get('/auth/me')
        setUserId(response.data._id)
        setIsAdmin(response.data.role === 'admin')
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error)
      }
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', {
        params: { boardType: 'sister-diary', page: currentPage, limit: 15 }
      })
      // 언니일기 게시판은 비밀글도 목록에 표시 (제목만 표시)
      setPosts(response.data.posts || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('게시글 로딩 실패:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    navigate('/')
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <h1 className="page-title">언니일기</h1>
      
      <div className="board-header">
        <div className="board-stats">
          <span>전체 게시글: {posts.length}개</span>
        </div>
        {isLoggedIn && (
          <Link to="/sister-diary/write" className="btn-write">글쓰기</Link>
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
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                      게시글이 없습니다.
                    </td>
                  </tr>
                ) : (
                  posts.map((post, index) => {
                    const isSecretPost = post.isSecret
                    
                    return (
                      <tr key={post._id}>
                        <td>{(currentPage - 1) * 15 + index + 1}</td>
                        <td>
                          <Link to={`/post/${post._id}`} className="post-title" title={post.title}>
                            {post.isNew && <span className="new-badge">N</span>}
                            {isSecretPost && <span className="secret-badge">🔒</span>}
                            {post.title.length > 15 ? `${post.title.substring(0, 15)}...` : post.title}
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
                    </tr>
                    )
                  })
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

export default SisterDiaryPage
