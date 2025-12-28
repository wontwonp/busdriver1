import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import api from '../utils/api'
import './ScamReportPage.css'
import moment from 'moment'

const ScamReportPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('title')
  const [currentPage, setCurrentPage] = useState(1)
  const [posts, setPosts] = useState([])
  const [boardTabs, setBoardTabs] = useState([
    { id: 'all', label: '전체글', count: 0 },
    { id: 'notice', label: '공지사항', count: 0 },
    { id: 'best', label: '베스트글', count: 0 },
    { id: 'normal', label: '일반글', count: 0 }
  ])
  const [boardNotices, setBoardNotices] = useState([])
  const [pagination, setPagination] = useState({ current: 1, total: 1, count: 0 })
  const [loading, setLoading] = useState(true)

  // 게시글 목록 조회
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const params = {
        boardKey: 'mttip',
        page: currentPage,
        limit: 10
      }
      
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim()
        params.searchType = searchType
      }
      
      const response = await api.get('/posts', { params })
      
      setPosts(response.data.posts)
      setPagination(response.data.pagination)
      
      // 탭별 개수 업데이트 (전체 개수는 pagination에서 가져옴)
      // 실제로는 별도 API 호출이 필요하지만, 여기서는 간단히 처리
    } catch (error) {
      console.error('게시글 목록 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 게시판 공지사항 조회
  const fetchBoardNotices = async () => {
    try {
      const response = await api.get('/notices')
      setBoardNotices(response.data)
    } catch (error) {
      console.error('공지사항 조회 오류:', error)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [currentPage, searchTerm, searchType])

  useEffect(() => {
    fetchBoardNotices()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPosts()
  }

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentPage(1)
  }

  const formatDate = (date) => {
    const postDate = moment(date)
    const today = moment().startOf('day')
    const postDateStart = postDate.startOf('day')
    
    if (postDateStart.isSame(today)) {
      // 오늘 날짜면 시간만 표시
      return postDate.format('HH:mm')
    } else {
      // 오늘이 지나면 날짜 표시
      return postDate.format('YYYY.MM.DD')
    }
  }

  return (
    <PageLayout>
      <div className="scam-report-page">
        <div className="board-container">
        {/* 게시판 헤더 */}
        <div className="board-header">
          <div className="board-title-area">
            <h2 className="board-title">먹튀 사이트 신고</h2>
            <p className="board-subtitle">먹튀사이트를 신고하고 다른 회원들을 보호하세요</p>
          </div>
        </div>

        {/* 검색 영역 */}
        <div className="board-search">
          <form onSubmit={handleSearch} className="search-form">
            <select 
              className="search-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="title">제목</option>
              <option value="siteName">사이트명</option>
              <option value="siteUrl">사이트주소</option>
              <option value="titleContent">제목+내용</option>
              <option value="author">글쓴이</option>
              <option value="authorCode">글쓴이(코)</option>
            </select>
            <input
              type="text"
              className="search-input"
              placeholder="검색어를 입력해 주세요."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn">
              <span className="search-icon">🔍</span>
            </button>
          </form>
        </div>


        {/* 게시글 목록 */}
        <div className="board-list">
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>게시글이 없습니다.</div>
          ) : (
            <table className="post-table">
              <thead>
                <tr>
                  <th className="col-num">번호</th>
                  <th className="col-title">제목</th>
                  <th className="col-site-name">사이트명</th>
                  <th className="col-site-url">사이트주소</th>
                  <th className="col-scam-amount">피해금액</th>
                  <th className="col-author">닉네임</th>
                  <th className="col-date">날짜</th>
                  <th className="col-views">조회수</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // 전체 일반 게시글 수 계산 (전체 게시글 수에서 공지글 수 추정)
                  const totalCount = pagination?.count || 0
                  const noticeCountInCurrentPage = posts.filter(p => p.isNotice).length
                  const estimatedTotalNotices = noticeCountInCurrentPage > 0 ? Math.ceil((totalCount / 10) * noticeCountInCurrentPage) : 0
                  const totalNonNoticePosts = Math.max(0, totalCount - estimatedTotalNotices)
                  
                  return posts.map((post, index) => {
                    // 공지글이 아닌 게시글만 카운팅 (역순 번호 매기기 - 최신글이 큰 번호)
                    if (post.isNotice) {
                      return (
                        <tr key={post._id} className="notice-row">
                          <td className="col-num">공지</td>
                          <td className="col-title">
                            <Link to={`/post/${post._id}`} className="post-title-link">
                              {post.title}
                            </Link>
                          </td>
                          <td className="col-site-name">{post.siteName || '-'}</td>
                          <td className="col-site-url">{post.siteUrl || '-'}</td>
                          <td className="col-scam-amount">
                            {post.scamAmount ? `${post.scamAmount.toLocaleString()}원` : '-'}
                          </td>
                          <td className="col-author">{post.author}</td>
                          <td className="col-date">{formatDate(post.createdAt)}</td>
                          <td className="col-views">{post.views.toLocaleString()}</td>
                        </tr>
                      )
                    }
                    
                    // 역순 번호 계산
                    const nonNoticePostsBeforeCurrent = posts.slice(0, index).filter(p => !p.isNotice)
                    const displayNumber = totalNonNoticePosts - (currentPage - 1) * 10 - nonNoticePostsBeforeCurrent.length
                    
                    return (
                      <tr key={post._id}>
                        <td className="col-num">{displayNumber}</td>
                        <td className="col-title">
                          <Link to={`/post/${post._id}`} className="post-title-link">
                            {post.title}
                          </Link>
                        </td>
                        <td className="col-site-name">{post.siteName || '-'}</td>
                        <td className="col-site-url">{post.siteUrl || '-'}</td>
                        <td className="col-scam-amount">
                          {post.scamAmount ? `${post.scamAmount.toLocaleString()}원` : '-'}
                        </td>
                        <td className="col-author">{post.author}</td>
                        <td className="col-date">{formatDate(post.createdAt)}</td>
                        <td className="col-views">{post.views.toLocaleString()}</td>
                      </tr>
                    )
                  })
                })()}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        <div className="board-pagination">
          <button
            className="pagination-btn prev"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(10, pagination.total) }, (_, i) => {
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
            onClick={() => setCurrentPage(prev => Math.min(pagination.total, prev + 1))}
            disabled={currentPage === pagination.total}
          >
            다음
          </button>
        </div>

        {/* 글쓰기 버튼 */}
        <div className="board-actions">
          <Link to="/mttip/write">
            <button className="write-btn">글쓰기</button>
          </Link>
        </div>

        {/* 게시판 가이드 (페이지 하단) */}
        <BoardGuide boardKey="mttip" />
      </div>
      </div>
    </PageLayout>
  )
}

export default ScamReportPage

