import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './PenaltyManagement.css'
import moment from 'moment'

const PenaltyManagement = () => {
  const [penalties, setPenalties] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [selectedTab, setSelectedTab] = useState('전체')
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    userId: '',
    username: '',
    nickname: '',
    penaltyType: '계정차단',
    reason: '',
    points: 0
  })

  useEffect(() => {
    fetchPenalties()
    fetchUsers()
  }, [currentPage, selectedTab, searchTerm])

  const fetchUsers = async () => {
    try {
      // TODO: 사용자 목록 API가 있다면 사용
      // const response = await api.get('/users')
      // setUsers(response.data.users || [])
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error)
    }
  }

  const fetchPenalties = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20
      }
      
      if (selectedTab !== '전체') {
        params.penaltyType = selectedTab
      }
      
      if (searchTerm) {
        params.searchType = '닉네임'
        params.searchTerm = searchTerm
      }
      
      const response = await api.get('/penalties', { params })
      setPenalties(response.data.penalties || [])
      setTotalPages(response.data.pagination?.total || 1)
      setTotalItems(response.data.pagination?.count || 0)
    } catch (error) {
      console.error('패널티 조회 오류:', error)
      alert('패널티를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchPenalties()
  }

  const handleCreate = () => {
    setFormData({
      userId: '',
      username: '',
      nickname: '',
      penaltyType: '계정차단',
      reason: '',
      points: 0
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.reason) {
      alert('필수 정보를 입력해주세요.')
      return
    }
    
    if (formData.penaltyType === '포인트차감' && (!formData.points || formData.points <= 0)) {
      alert('포인트 차감 시 포인트를 입력해주세요.')
      return
    }
    
    try {
      await api.post('/penalties', formData)
      alert('패널티가 등록되었습니다.')
      setShowForm(false)
      fetchPenalties()
    } catch (error) {
      alert(error.response?.data?.message || '패널티 등록에 실패했습니다.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await api.delete(`/penalties/${id}`)
      alert('패널티가 삭제되었습니다.')
      fetchPenalties()
    } catch (error) {
      alert(error.response?.data?.message || '패널티 삭제에 실패했습니다.')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return moment(dateString).format('YYYY.MM.DD HH:mm')
  }

  return (
    <div className="penalty-management">
      <div className="management-header">
        <h1>패널티 관리</h1>
        <button className="btn-create" onClick={handleCreate}>
          패널티 등록
        </button>
      </div>

      {/* 탭 메뉴 */}
      <div className="penalty-tabs">
        <button
          className={`tab-btn ${selectedTab === '전체' ? 'active' : ''}`}
          onClick={() => {
            setSelectedTab('전체')
            setCurrentPage(1)
          }}
        >
          전체
        </button>
        <button
          className={`tab-btn ${selectedTab === '계정차단' ? 'active' : ''}`}
          onClick={() => {
            setSelectedTab('계정차단')
            setCurrentPage(1)
          }}
        >
          계정차단
        </button>
        <button
          className={`tab-btn ${selectedTab === '작성권한박탈' ? 'active' : ''}`}
          onClick={() => {
            setSelectedTab('작성권한박탈')
            setCurrentPage(1)
          }}
        >
          작성권한박탈
        </button>
        <button
          className={`tab-btn ${selectedTab === '포인트차감' ? 'active' : ''}`}
          onClick={() => {
            setSelectedTab('포인트차감')
            setCurrentPage(1)
          }}
        >
          포인트차감
        </button>
      </div>

      {/* 검색 */}
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="닉네임 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn-search">검색</button>
      </form>

      {/* 패널티 목록 */}
      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>번호</th>
                  <th>닉네임</th>
                  <th>페널티</th>
                  <th>사유</th>
                  <th>포인트</th>
                  <th>날짜</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {penalties.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="no-data">패널티 내역이 없습니다.</td>
                  </tr>
                ) : (
                  penalties.map((penalty, index) => (
                    <tr key={penalty._id}>
                      <td>{totalItems - (currentPage - 1) * 20 - index}</td>
                      <td>{penalty.nickname || penalty.username}</td>
                      <td>{penalty.penaltyType}</td>
                      <td>{penalty.reason}</td>
                      <td>{penalty.points > 0 ? `${penalty.points.toLocaleString()}P` : '-'}</td>
                      <td>{formatDate(penalty.createdAt)}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(penalty._id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 페이지네이션 */}
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              이전
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        </>
      )}

      {/* 패널티 등록 모달 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>패널티 등록</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>회원명 (필수)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="회원명 입력"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>닉네임</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="닉네임 입력 (선택)"
                />
              </div>

              <div className="form-group">
                <label>패널티 타입 (필수)</label>
                <select
                  value={formData.penaltyType}
                  onChange={(e) => setFormData({ ...formData, penaltyType: e.target.value, points: e.target.value === '포인트차감' ? formData.points : 0 })}
                  required
                >
                  <option value="계정차단">계정차단</option>
                  <option value="작성권한박탈">작성권한박탈</option>
                  <option value="포인트차감">포인트차감</option>
                </select>
              </div>

              {formData.penaltyType === '포인트차감' && (
                <div className="form-group">
                  <label>차감 포인트 (필수)</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                    placeholder="차감할 포인트 입력"
                    min="1"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>사유 (필수)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="패널티 사유 입력"
                  rows="4"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn-submit">
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PenaltyManagement



