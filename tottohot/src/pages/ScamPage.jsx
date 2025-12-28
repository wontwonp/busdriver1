import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import './ScamPage.css'

const ScamPage = () => {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scamSites, setScamSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    siteName: '',
    reason: '',
    evidence: ''
  })

  useEffect(() => {
    checkAuth()
    fetchScamReports()
  }, [])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }

  const fetchScamReports = async () => {
    try {
      setLoading(true)
      const response = await api.get('/scam')
      setScamSites(response.data)
    } catch (error) {
      console.error('먹튀사이트 목록 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    navigate('/')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      await api.post('/scam', formData)
      alert('신고가 접수되었습니다.')
      setFormData({ siteName: '', reason: '', evidence: '' })
      setShowForm(false)
      fetchScamReports()
    } catch (error) {
      alert(error.response?.data?.message || '신고 접수에 실패했습니다.')
    }
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <h1 className="page-title">먹튀사이트 신고</h1>
      <p className="page-description">
        먹튀사이트를 신고하여 다른 회원들이 피해를 입지 않도록 도와주세요. 신고된 사이트는 검토 후 블랙리스트에 등록됩니다.
      </p>

      <div className="scam-search">
        <input
          type="text"
          placeholder="사이트명을 검색하세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <button className="search-btn">검색</button>
        {isLoggedIn && (
          <button className="btn-report" onClick={() => setShowForm(true)}>
            신고하기
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <div className="scam-table">
          <table>
            <thead>
              <tr>
                <th>번호</th>
                <th>사이트명</th>
                <th>신고일자</th>
                <th>신고사유</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {scamSites
                .filter(site => !searchQuery || site.siteName.includes(searchQuery))
                .map((site, index) => (
                <tr key={site._id}>
                  <td>{index + 1}</td>
                  <td>{site.siteName}</td>
                  <td>{new Date(site.createdAt).toLocaleDateString('ko-KR')}</td>
                  <td>{site.reason}</td>
                  <td>
                    <span className={`status-badge ${site.status === '확인완료' ? 'confirmed' : 'pending'}`}>
                      {site.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="report-form-modal" onClick={(e) => e.stopPropagation()}>
            <h2>먹튀사이트 신고하기</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>사이트명</label>
                <input
                  type="text"
                  value={formData.siteName}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  required
                  placeholder="먹튀사이트명을 입력하세요"
                />
              </div>
              <div className="form-group">
                <label>신고사유</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  required
                  placeholder="신고사유를 상세히 입력하세요"
                  rows="5"
                />
              </div>
              <div className="form-group">
                <label>증거자료 (선택)</label>
                <input
                  type="text"
                  value={formData.evidence}
                  onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                  placeholder="증거자료 URL 또는 설명"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">신고하기</button>
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export default ScamPage
