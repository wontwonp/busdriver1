import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import '../App.css'
import './BlackListPage.css'

const BlackListPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    checkAuth()
    fetchPosts()
    fetchNotice()
  }, [currentPage])

  const fetchNotice = async () => {
    try {
      const response = await api.get('/black-list-notice/public')
      setNotice(response.data.notice || '')
    } catch (error) {
      console.error('안내 메시지 조회 실패:', error)
    }
  }

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/posts', {
        params: { 
          boardKey: 'black-list', 
          page: currentPage, 
          limit: 20 
        }
      })
      setPosts(response.data.posts || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
      setTotalItems(response.data.pagination?.count || 0)
    } catch (error) {
      console.error('블랙조회 목록 로딩 실패:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${month}.${day} ${hours}:${minutes}`
  }

  return (
    <PageLayout>
      <div className="black-list-page">
        <div className="board-container">
          <h1 className="page-title">블랙조회</h1>
          
          {/* 안내 메시지 */}
          {notice && (
            <div className="black-list-notice">
              <div className="notice-content">{notice}</div>
            </div>
          )}
          
          <div className="list-header">
            <div className="pagination-info">
              전체 {totalItems.toLocaleString()} / {currentPage} 페이지
            </div>
            {isLoggedIn && (
              <div className="list-actions">
                <Link to="/black-list/write" className="write-btn">
                  글쓰기
                </Link>
              </div>
            )}
          </div>

          <div className="posts-table">
            <table>
              <thead>
                <tr>
                  <th className="col-num">번호</th>
                  <th className="col-title">제목</th>
                  <th className="col-author">작성자</th>
                  <th className="col-date">날짜</th>
                  <th className="col-status">상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="loading-cell">로딩 중...</td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-cell">등록된 글이 없습니다.</td>
                  </tr>
                ) : (
                  posts.map((post, index) => (
                    <tr key={post._id}>
                      <td className="col-num">
                        {totalItems - (currentPage - 1) * 20 - index}
                      </td>
                      <td className="col-title">
                        <Link to={`/post/${post._id}`}>
                          <span className="secret-icon">🔒</span>
                          {post.title}
                        </Link>
                      </td>
                      <td className="col-author">{post.author || '익명'}</td>
                      <td className="col-date">{formatDate(post.createdAt)}</td>
                      <td className="col-status">
                        {post.hasComment ? (
                          <span className="status-answered">답변완료</span>
                        ) : (
                          <span className="status-pending">답변대기</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="page-btn"
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  if (totalPages <= 10) return true
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  )
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] < page - 1 && (
                      <span className="page-ellipsis">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="page-btn"
              >
                다음
              </button>
            </div>
          )}

          <BoardGuide boardKey="black-list" />
        </div>
      </div>
    </PageLayout>
  )
}

export default BlackListPage
