import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import moment from 'moment'
import './WriteSportsAnalysisPage.css'

const WriteSportsAnalysisPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
    picks: [
      {
        id: 1,
        matchDate: '',
        team1: '',
        team2: '',
        predictedPick: ''
      }
    ],
    tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [availableMatches, setAvailableMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null) // 'team1' or 'team2'

  const categories = ['선택하세요', '축구', '야구', '농구', '배구', '하키', '기타']

  useEffect(() => {
    fetchAvailableMatches()
  }, [])

  const fetchAvailableMatches = async () => {
    try {
      const response = await api.get('/sports/matches/available')
      setAvailableMatches(response.data.matches || [])
    } catch (error) {
      console.error('경기 목록 가져오기 오류:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handlePickChange = (pickId, field, value) => {
    setFormData(prev => ({
      ...prev,
      picks: prev.picks.map(pick =>
        pick.id === pickId ? { ...pick, [field]: value } : pick
      )
    }))
  }

  const handleAddPick = () => {
    setFormData(prev => ({
      ...prev,
      picks: [
        ...prev.picks,
        {
          id: prev.picks.length + 1,
          matchDate: '',
          team1: '',
          team2: '',
          predictedPick: ''
        }
      ]
    }))
  }

  const handleRemovePick = (pickId) => {
    if (formData.picks.length > 1) {
      setFormData(prev => ({
        ...prev,
        picks: prev.picks.filter(pick => pick.id !== pickId)
      }))
    }
  }

  const handleSelectMatch = (match) => {
    // 이미 선택된 경기가 있으면 교체
    setSelectedMatch(match)
    setSelectedTeam(null) // 팀 선택 초기화
    
    // 종목과 제목 초기화 (팀 선택 전까지)
    setFormData(prev => ({
      ...prev,
      category: match.sport,
      title: '',
      picks: [{
        id: 1,
        matchDate: moment(match.matchDate).format('YYYY-MM-DD HH:mm'),
        team1: match.team1,
        team2: match.team2,
        predictedPick: ''
      }]
    }))
  }

  const handleSelectTeam = (team) => {
    if (!selectedMatch) return
    
    setSelectedTeam(team)
    
    // 종목 자동 입력
    setFormData(prev => ({
      ...prev,
      category: selectedMatch.sport,
      title: team === 'team1' 
        ? `${selectedMatch.team1} vs ${selectedMatch.team2}`
        : `${selectedMatch.team2} vs ${selectedMatch.team1}`,
      picks: [{
        id: 1,
        matchDate: moment(selectedMatch.matchDate).format('YYYY-MM-DD HH:mm'),
        team1: selectedMatch.team1,
        team2: selectedMatch.team2,
        predictedPick: team === 'team1' ? selectedMatch.team1 : selectedMatch.team2
      }]
    }))
    
    setShowMatchModal(false)
  }

  const handleClearMatch = () => {
    setSelectedMatch(null)
    setSelectedTeam(null)
    setFormData(prev => ({
      ...prev,
      category: '',
      title: '',
      picks: [{
        id: 1,
        matchDate: '',
        team1: '',
        team2: '',
        predictedPick: ''
      }]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.category || formData.category === '선택하세요') {
      setError('종목을 선택해주세요.')
      return
    }

    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.')
      return
    }

    setLoading(true)

    try {
      const postData = {
        boardKey: 'sports-analysis',
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        picks: formData.picks
      }
      
      await api.post('/posts', postData)
      
      alert('게시글이 작성되었습니다.')
      navigate('/sports-analysis')
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || '게시글 작성에 실패했습니다.'
      const errorDetails = err.response?.data?.details
      setError(errorMessage)
      console.error('게시글 작성 오류:', err)
      console.error('에러 응답:', err.response?.data)
      if (errorDetails) {
        console.error('에러 상세:', errorDetails)
      }
      alert(`게시글 작성 실패: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-sports-analysis-page">
        <div className="write-header">
          <h1 className="write-title">글쓰기</h1>
        </div>

        <form onSubmit={handleSubmit} className="write-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* 종목 선택 */}
          <div className="form-group">
            <label htmlFor="category">종목</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="category-select"
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat === '선택하세요' ? '' : cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className="form-group">
            <label htmlFor="title">
              제목<span className="required-mark">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="제목을 입력하세요"
              required
            />
          </div>

          {/* 상세 분석내용 */}
          <div className="form-group">
            <label htmlFor="content">
              상세 분석내용
              <span className="warning-text">* 경고! 무</span>
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="상세 분석 내용을 입력하세요"
              rows={15}
            />
            <div className="editor-toolbar">
              <button type="button" className="toolbar-btn">😊</button>
              <button type="button" className="toolbar-btn">🏁</button>
              <button type="button" className="toolbar-btn">▶</button>
              <button type="button" className="toolbar-btn">
                <span>🔄</span>
                <span className="toolbar-count">0</span>
              </button>
            </div>
          </div>

          {/* 추천 픽 등록 */}
          <div className="form-group picks-section">
            <div className="picks-header">
              <label>추천 픽 등록</label>
              {!selectedMatch ? (
                <button
                  type="button"
                  className="view-matches-btn"
                  onClick={() => setShowMatchModal(true)}
                >
                  경기 보기
                </button>
              ) : (
                <button
                  type="button"
                  className="clear-match-btn"
                  onClick={handleClearMatch}
                >
                  경기 선택 취소
                </button>
              )}
            </div>
            
            {selectedMatch && (
              <div className="selected-match-info">
                <div className="match-info-header">
                  <span>선택한 경기: {selectedMatch.team1} vs {selectedMatch.team2}</span>
                  <span className="match-date">{moment(selectedMatch.matchDate).format('MM-DD HH:mm')}</span>
                </div>
                {!selectedTeam && (
                  <div className="team-selection">
                    <p>예상 픽을 선택하세요:</p>
                    <div className="team-buttons">
                      <button
                        type="button"
                        className="team-btn home-team"
                        onClick={() => handleSelectTeam('team1')}
                      >
                        {selectedMatch.team1} (홈)
                      </button>
                      <span className="vs-text">VS</span>
                      <button
                        type="button"
                        className="team-btn away-team"
                        onClick={() => handleSelectTeam('team2')}
                      >
                        {selectedMatch.team2} (원정)
                      </button>
                    </div>
                  </div>
                )}
                {selectedTeam && (
                  <div className="selected-team-info">
                    <p>선택한 팀: <strong>{selectedTeam === 'team1' ? selectedMatch.team1 : selectedMatch.team2}</strong></p>
                  </div>
                )}
              </div>
            )}
            {formData.picks.map((pick, index) => (
              <div key={pick.id} className="pick-item">
                <div className="pick-header">
                  <span className="pick-number">추천 픽 {index + 1}</span>
                  {formData.picks.length > 1 && (
                    <button
                      type="button"
                      className="remove-pick-btn"
                      onClick={() => handleRemovePick(pick.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="pick-fields">
                  <input
                    type="text"
                    placeholder="경기 일정"
                    value={pick.matchDate}
                    onChange={(e) => handlePickChange(pick.id, 'matchDate', e.target.value)}
                    className="pick-field"
                  />
                  <input
                    type="text"
                    placeholder="대결 팀 1"
                    value={pick.team1}
                    onChange={(e) => handlePickChange(pick.id, 'team1', e.target.value)}
                    className="pick-field"
                  />
                  <span className="vs-text">VS</span>
                  <input
                    type="text"
                    placeholder="대결 팀 2"
                    value={pick.team2}
                    onChange={(e) => handlePickChange(pick.id, 'team2', e.target.value)}
                    className="pick-field"
                  />
                  <input
                    type="text"
                    placeholder="예상 픽"
                    value={pick.predictedPick}
                    onChange={(e) => handlePickChange(pick.id, 'predictedPick', e.target.value)}
                    className="pick-field"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 태그 */}
          <div className="form-group">
            <label htmlFor="tags">태그</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="태그를 입력하세요"
            />
            <p className="tag-instruction">콤마(,)로 구분하여 복수 태그 등록 가능</p>
          </div>

          {/* 버튼 */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate('/sports-analysis')}
            >
              취소
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? '작성 중...' : '작성완료'}
            </button>
          </div>
        </form>

        {/* 경기 선택 모달 */}
        {showMatchModal && (
          <div className="modal-overlay" onClick={() => setShowMatchModal(false)}>
            <div className="modal-content match-selection-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>경기 선택</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowMatchModal(false)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="matches-list">
                  {availableMatches.length === 0 ? (
                    <p className="no-matches">예정된 경기가 없습니다.</p>
                  ) : (
                    availableMatches.map((match) => (
                      <div
                        key={match._id}
                        className={`match-item ${selectedMatch?._id === match._id ? 'selected' : ''}`}
                        onClick={() => handleSelectMatch(match)}
                      >
                        <div className="match-sport">{match.sport}</div>
                        <div className="match-teams">
                          <span className="team-name">{match.team1}</span>
                          <span className="vs-text">VS</span>
                          <span className="team-name">{match.team2}</span>
                        </div>
                        <div className="match-date">
                          {moment(match.matchDate).format('MM-DD HH:mm')}
                        </div>
                        {match.league && (
                          <div className="match-league">{match.league}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {selectedMatch && (
                  <div className="match-selection-actions">
                    <button
                      className="btn-confirm"
                      onClick={() => setShowMatchModal(false)}
                    >
                      확인
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

export default WriteSportsAnalysisPage


