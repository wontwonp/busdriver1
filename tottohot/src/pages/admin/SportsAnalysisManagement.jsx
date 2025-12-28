import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './SportsAnalysisManagement.css'
import moment from 'moment'

const SportsAnalysisManagement = () => {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedSport, setSelectedSport] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState(null)
  const [formData, setFormData] = useState({
    sport: '축구',
    matchDate: '',
    team1: '',
    team2: '',
    league: '',
    isPopular: false,
    status: '예정'
  })
  const [resultData, setResultData] = useState({
    team1Score: '',
    team2Score: ''
  })
  const [scraping, setScraping] = useState(false)
  const [scrapedMatches, setScrapedMatches] = useState([])
  const [selectedMatches, setSelectedMatches] = useState(new Set())
  const [showScrapeModal, setShowScrapeModal] = useState(false)
  const [selectedScrapeSport, setSelectedScrapeSport] = useState('전체')
  const [scrapeSource, setScrapeSource] = useState('espn') // espn

  const sports = ['전체', '축구', '야구', '농구', '배구', '하키', '기타']
  const statuses = ['', '예정', '진행중', '종료']
  const scrapeSports = ['전체', '축구', '야구', '농구', '배구']

  useEffect(() => {
    fetchMatches()
  }, [currentPage, selectedSport, selectedStatus])

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: 20,
        sport: selectedSport !== '전체' ? selectedSport : undefined,
        status: selectedStatus || undefined
      }
      
      const response = await api.get('/sports/matches', { params })
      setMatches(response.data.matches)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error('경기 조회 오류:', error)
      alert('경기 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMatch(null)
    setFormData({
      sport: '축구',
      matchDate: '',
      team1: '',
      team2: '',
      league: '',
      isPopular: false,
      status: '예정'
    })
    setResultData({
      team1Score: '',
      team2Score: ''
    })
    setShowForm(true)
  }

  const handleEdit = (match) => {
    setEditingMatch(match)
    setFormData({
      sport: match.sport,
      matchDate: moment(match.matchDate).format('YYYY-MM-DDTHH:mm'),
      team1: match.team1,
      team2: match.team2,
      league: match.league || '',
      isPopular: match.isPopular || false,
      status: match.status
    })
    setResultData({
      team1Score: match.result?.team1Score || '',
      team2Score: match.result?.team2Score || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.matchDate || !formData.team1 || !formData.team2) {
      alert('필수 항목을 입력해주세요.')
      return
    }

    try {
      const submitData = { ...formData }
      
      // 결과 데이터 추가
      if (resultData.team1Score && resultData.team2Score) {
        const team1Score = parseInt(resultData.team1Score)
        const team2Score = parseInt(resultData.team2Score)
        
        let winner = 'draw'
        if (team1Score > team2Score) winner = 'team1'
        else if (team2Score > team1Score) winner = 'team2'
        
        submitData.result = {
          team1Score,
          team2Score,
          winner
        }
        submitData.status = '종료'
      }

      if (editingMatch) {
        await api.put(`/sports/matches/${editingMatch._id}`, submitData)
        alert('경기가 수정되었습니다.')
      } else {
        await api.post('/sports/matches', submitData)
        alert('경기가 생성되었습니다.')
      }
      
      setShowForm(false)
      fetchMatches()
    } catch (error) {
      console.error('경기 저장 오류:', error)
      alert(error.response?.data?.message || '경기 저장에 실패했습니다.')
    }
  }

  const handleDelete = async (matchId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      await api.delete(`/sports/matches/${matchId}`)
      alert('경기가 삭제되었습니다.')
      fetchMatches()
    } catch (error) {
      console.error('경기 삭제 오류:', error)
      alert('경기 삭제에 실패했습니다.')
    }
  }

  const handleScrape = async () => {
    try {
      setScraping(true)
      
      let allMatches = []
      
      if (selectedScrapeSport === '전체') {
        // 전체 선택 시 축구, 야구, 농구를 모두 가져옴 (배구는 ESPN API에 없음)
        const sportsToScrape = ['축구', '야구', '농구']
        
        for (const sport of sportsToScrape) {
          try {
            const response = await api.post('/livescore/scrape-espn', {
              sport: sport
            })
            if (response.data.matches && response.data.matches.length > 0) {
              allMatches = [...allMatches, ...response.data.matches]
            }
          } catch (error) {
            console.error(`${sport} 경기 가져오기 실패:`, error)
            // 개별 종목 실패해도 계속 진행
          }
        }
      } else {
        // 특정 종목 선택 시
        const response = await api.post('/livescore/scrape-espn', {
          sport: selectedScrapeSport
        })
        allMatches = response.data.matches || []
      }
      
      setScrapedMatches(allMatches)
      setShowScrapeModal(true)
      alert(`${allMatches.length}개의 경기를 가져왔습니다.`)
    } catch (error) {
      console.error('스크래핑 오류:', error)
      alert(error.response?.data?.message || '경기 정보를 가져오는데 실패했습니다.')
    } finally {
      setScraping(false)
    }
  }

  const handleToggleMatch = (index) => {
    const newSelected = new Set(selectedMatches)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedMatches(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedMatches.size === scrapedMatches.length) {
      setSelectedMatches(new Set())
    } else {
      setSelectedMatches(new Set(scrapedMatches.map((_, index) => index)))
    }
  }

  const handleImportMatches = async (isPopular = false) => {
    if (selectedMatches.size === 0) {
      alert('추가할 경기를 선택해주세요.')
      return
    }

    const matchesToImport = Array.from(selectedMatches).map(index => scrapedMatches[index])

    if (!window.confirm(`${matchesToImport.length}개의 경기를 ${isPopular ? '인기 경기로' : ''} 추가하시겠습니까?`)) {
      return
    }

    try {
      const response = await api.post('/livescore/import', {
        matches: matchesToImport,
        isPopular
      })
      
      alert(`${response.data.imported}개의 경기가 추가되었습니다.`)
      if (response.data.errors > 0) {
        alert(`중복 또는 오류로 인해 ${response.data.errors}개의 경기는 추가되지 않았습니다.`)
      }
      
      setShowScrapeModal(false)
      setScrapedMatches([])
      setSelectedMatches(new Set())
      fetchMatches()
    } catch (error) {
      console.error('경기 일괄 추가 오류:', error)
      alert(error.response?.data?.message || '경기 추가에 실패했습니다.')
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      '예정': 'badge-info',
      '진행중': 'badge-warning',
      '종료': 'badge-success'
    }
    return badges[status] || 'badge-info'
  }

  if (loading) {
    return <div className="sports-analysis-management-loading">로딩 중...</div>
  }

  return (
    <div className="sports-analysis-management">
      <div className="management-header">
        <h1>경기등록관리</h1>
        <div className="header-actions">
          <div className="scrape-controls">
            <select
              value={selectedScrapeSport}
              onChange={(e) => setSelectedScrapeSport(e.target.value)}
              className="scrape-select"
              disabled={scraping}
            >
              {scrapeSports.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
            <button className="btn-scrape" onClick={handleScrape} disabled={scraping}>
              {scraping ? '가져오는 중...' : 'ESPN API에서 가져오기'}
            </button>
          </div>
          <button className="btn-create" onClick={handleCreate}>
            경기 추가
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="filter-section">
        <div className="filter-group">
          <label>종목:</label>
          <select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-select"
          >
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>상태:</label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="filter-select"
          >
            {statuses.map(status => (
              <option key={status || 'all'} value={status}>
                {status || '전체'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 경기 목록 테이블 */}
      <div className="matches-table-container">
        <table className="matches-table">
          <thead>
            <tr>
              <th>종목</th>
              <th>경기일시</th>
              <th>대결 팀</th>
              <th>-</th>
              <th>리그</th>
              <th>상태</th>
              <th>결과</th>
              <th>인기</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {matches.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  등록된 경기가 없습니다.
                </td>
              </tr>
            ) : (
              matches.map((match) => (
                <tr key={match._id}>
                  <td>{match.sport}</td>
                  <td>{moment(match.matchDate).format('YYYY-MM-DD HH:mm')}</td>
                  <td>{match.team1} vs {match.team2}</td>
                  <td>-</td>
                  <td>{match.league || '-'}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(match.status)}`}>
                      {match.status}
                    </span>
                  </td>
                  <td>
                    {match.result ? (
                      `${match.result.team1Score} : ${match.result.team2Score}`
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {match.isPopular ? (
                      <span className="badge badge-success">인기</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEdit(match)}
                      >
                        수정
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(match._id)}
                      >
                        삭제
                      </button>
                    </div>
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

      {/* 경기 작성/수정 폼 모달 */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMatch ? '경기 수정' : '경기 추가'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>종목 *</label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                  required
                  className="form-input"
                >
                  {sports.filter(s => s !== '전체').map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>경기 일시 *</label>
                <input
                  type="datetime-local"
                  value={formData.matchDate}
                  onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>팀1 *</label>
                <input
                  type="text"
                  value={formData.team1}
                  onChange={(e) => setFormData({ ...formData, team1: e.target.value })}
                  required
                  className="form-input"
                  placeholder="팀 이름"
                />
              </div>

              <div className="form-group">
                <label>팀2 *</label>
                <input
                  type="text"
                  value={formData.team2}
                  onChange={(e) => setFormData({ ...formData, team2: e.target.value })}
                  required
                  className="form-input"
                  placeholder="팀 이름"
                />
              </div>

              <div className="form-group">
                <label>리그</label>
                <input
                  type="text"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                  className="form-input"
                  placeholder="리그명 (선택사항)"
                />
              </div>

              <div className="form-group">
                <label>상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="form-input"
                >
                  <option value="예정">예정</option>
                  <option value="진행중">진행중</option>
                  <option value="종료">종료</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                  />
                  인기 경기로 설정
                </label>
              </div>

              {/* 결과 입력 (수정 시에만) */}
              {editingMatch && (
                <div className="result-section">
                  <h3>경기 결과</h3>
                  <div className="result-inputs">
                    <div className="form-group">
                      <label>{formData.team1} 점수</label>
                      <input
                        type="number"
                        value={resultData.team1Score}
                        onChange={(e) => setResultData({ ...resultData, team1Score: e.target.value })}
                        className="form-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>{formData.team2} 점수</label>
                      <input
                        type="number"
                        value={resultData.team2Score}
                        onChange={(e) => setResultData({ ...resultData, team2Score: e.target.value })}
                        className="form-input"
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="form-hint">결과를 입력하면 자동으로 상태가 '종료'로 변경되고 예측 결과가 업데이트됩니다.</p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-cancel" onClick={() => setShowForm(false)}>
                  취소
                </button>
                <button type="submit" className="btn btn-submit">
                  {editingMatch ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 스크래핑 결과 모달 */}
      {showScrapeModal && (
        <div className="modal-overlay" onClick={() => setShowScrapeModal(false)}>
          <div className="modal-content scrape-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>스크래핑 결과</h2>
              <button
                className="modal-close"
                onClick={() => setShowScrapeModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="scrape-info">
                <p>총 {scrapedMatches.length}개의 경기를 가져왔습니다. ({selectedMatches.size}개 선택됨)</p>
                <div className="scrape-actions">
                  <button
                    className="btn btn-select-all"
                    onClick={handleSelectAll}
                  >
                    {selectedMatches.size === scrapedMatches.length ? '전체 해제' : '전체 선택'}
                  </button>
                  <button
                    className="btn btn-import"
                    onClick={() => handleImportMatches(false)}
                    disabled={selectedMatches.size === 0}
                  >
                    선택한 경기 추가 ({selectedMatches.size})
                  </button>
                  <button
                    className="btn btn-import-popular"
                    onClick={() => handleImportMatches(true)}
                    disabled={selectedMatches.size === 0}
                  >
                    선택한 경기 인기로 추가 ({selectedMatches.size})
                  </button>
                </div>
              </div>
              
              <div className="scraped-matches-list">
                <h3>가져온 경기 목록</h3>
                <div className="matches-preview">
                  {scrapedMatches.map((match, index) => (
                    <div 
                      key={index} 
                      className={`match-preview-item ${selectedMatches.has(index) ? 'selected' : ''}`}
                      onClick={() => handleToggleMatch(index)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMatches.has(index)}
                        onChange={() => handleToggleMatch(index)}
                        onClick={(e) => e.stopPropagation()}
                        className="match-checkbox"
                      />
                      <span className="match-sport">{match.sport}</span>
                      <span className="match-league">{match.league}</span>
                      <span className="match-teams">
                        {match.team1} vs {match.team2}
                      </span>
                      <span className="match-date">
                        {moment(match.matchDate).format('MM-DD HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SportsAnalysisManagement
