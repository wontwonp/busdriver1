import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './UserManagement.css'
import moment from 'moment'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSuspicious, setFilterSuspicious] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [currentPage, filterSuspicious])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        filterSuspicious: filterSuspicious ? 'true' : 'false',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }
      
      const response = await api.get('/admin/users', { params })
      setUsers(response.data.users)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('회원 조회 오류:', error)
      alert('회원 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchUsers()
  }

  const handleViewDetail = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`)
      setSelectedUser(response.data)
      setShowDetailModal(true)
    } catch (error) {
      console.error('회원 상세 정보 조회 오류:', error)
      alert('회원 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`${user.isActive ? '비활성화' : '활성화'}하시겠습니까?`)) {
      return
    }

    try {
      await api.patch(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive
      })
      alert('회원 상태가 변경되었습니다.')
      fetchUsers()
    } catch (error) {
      console.error('회원 상태 변경 오류:', error)
      alert('회원 상태 변경에 실패했습니다.')
    }
  }

  const handleToggleSuspicious = async (user) => {
    const action = user.isSuspicious ? '의심 해제' : '의심 표시'
    if (!window.confirm(`${action}하시겠습니까?`)) {
      return
    }

    try {
      await api.patch(`/admin/users/${user._id}/suspicious`, {
        isSuspicious: !user.isSuspicious
      })
      alert(`회원이 ${action}되었습니다.`)
      fetchUsers()
      if (showDetailModal && selectedUser?._id === user._id) {
        setSelectedUser({ ...selectedUser, isSuspicious: !user.isSuspicious })
      }
    } catch (error) {
      console.error('회원 의심 상태 변경 오류:', error)
      alert('회원 의심 상태 변경에 실패했습니다.')
    }
  }

  const getStatusBadge = (user) => {
    if (user.isSuspicious) {
      return <span className="badge badge-danger">의심</span>
    }
    if (!user.isActive) {
      return <span className="badge badge-warning">비활성</span>
    }
    return <span className="badge badge-success">정상</span>
  }

  if (loading) {
    return <div className="user-management-loading">로딩 중...</div>
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>회원 관리</h1>
        <div className="header-actions">
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filterSuspicious}
              onChange={(e) => {
                setFilterSuspicious(e.target.checked)
                setCurrentPage(1)
              }}
            />
            부정 가입 시도 회원만 보기
          </label>
        </div>
      </div>

      <div className="user-management-toolbar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="아이디, 닉네임, 이메일로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-search">검색</button>
        </form>
      </div>

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>상태</th>
              <th>아이디</th>
              <th>닉네임</th>
              <th>이메일</th>
              <th>휴대폰</th>
              <th>가입일</th>
              <th>IP 주소</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  회원이 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr 
                  key={user._id} 
                  className={user.isSuspicious ? 'suspicious-row' : ''}
                >
                  <td>{getStatusBadge(user)}</td>
                  <td>{user.username}</td>
                  <td>{user.nickname}</td>
                  <td>{user.email || '-'}</td>
                  <td>{user.phone || '-'}</td>
                  <td>{moment(user.createdAt).format('YYYY-MM-DD HH:mm')}</td>
                  <td>{user.ipAddress || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-view"
                        onClick={() => handleViewDetail(user._id)}
                      >
                        상세
                      </button>
                      <button
                        className={`btn ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? '비활성화' : '활성화'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            이전
          </button>
          <span className="page-info">
            {currentPage} / {totalPages}
          </span>
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            다음
          </button>
        </div>
      )}

      {showDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>회원 상세 정보</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>기본 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>아이디:</label>
                    <span>{selectedUser.username}</span>
                  </div>
                  <div className="detail-item">
                    <label>닉네임:</label>
                    <span>{selectedUser.nickname}</span>
                  </div>
                  <div className="detail-item">
                    <label>이메일:</label>
                    <span>{selectedUser.email || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>휴대폰:</label>
                    <span>{selectedUser.phone || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>한줄 소개:</label>
                    <span>{selectedUser.introduction || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>추천인:</label>
                    <span>{selectedUser.referrer || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>상태 정보</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>상태:</label>
                    <span>{getStatusBadge(selectedUser)}</span>
                  </div>
                  <div className="detail-item">
                    <label>활성화:</label>
                    <span>{selectedUser.isActive ? '활성' : '비활성'}</span>
                  </div>
                  <div className="detail-item">
                    <label>의심 여부:</label>
                    <span style={{ color: selectedUser.isSuspicious ? '#ff0000' : '#4CAF50', fontWeight: 'bold' }}>
                      {selectedUser.isSuspicious ? '의심' : '정상'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>포인트:</label>
                    <span>{selectedUser.points || 0}</span>
                  </div>
                  <div className="detail-item">
                    <label>레벨:</label>
                    <span>{selectedUser.level || 1}</span>
                  </div>
                  <div className="detail-item">
                    <label>가입일:</label>
                    <span>{moment(selectedUser.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                  </div>
                  <div className="detail-item">
                    <label>마지막 로그인:</label>
                    <span>
                      {selectedUser.lastLogin 
                        ? moment(selectedUser.lastLogin).format('YYYY-MM-DD HH:mm:ss')
                        : '-'
                      }
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>IP 주소:</label>
                    <span>{selectedUser.ipAddress || '-'}</span>
                  </div>
                </div>
              </div>

              {selectedUser.isSuspicious && selectedUser.suspiciousReasons?.length > 0 && (
                <div className="detail-section">
                  <h3>의심 사유</h3>
                  <ul className="suspicious-reasons">
                    {selectedUser.suspiciousReasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className={`btn ${selectedUser.isSuspicious ? 'btn-success' : 'btn-danger'}`}
                  onClick={() => handleToggleSuspicious(selectedUser)}
                >
                  {selectedUser.isSuspicious ? '의심 해제' : '의심 표시'}
                </button>
                <button
                  className={`btn ${selectedUser.isActive ? 'btn-warning' : 'btn-success'}`}
                  onClick={() => handleToggleStatus(selectedUser)}
                >
                  {selectedUser.isActive ? '비활성화' : '활성화'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
