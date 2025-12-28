import React, { useState, useEffect } from 'react'
import api from '../../utils/api'
import './RankingManagement.css'

const RankingManagement = () => {
  const [rankings, setRankings] = useState([])
  const [rankingType, setRankingType] = useState('level')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState([])

  useEffect(() => {
    fetchRankings()
  }, [rankingType])

  const fetchRankings = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/rankings/${rankingType}`)
      setRankings(response.data)
      setFormData(response.data.length > 0 ? response.data : Array(10).fill(null).map((_, i) => ({
        name: '',
        value: '',
        rank: i + 1
      })))
    } catch (error) {
      console.error('랭킹 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    fetchRankings()
  }

  const handleChange = (index, field, value) => {
    const newData = [...formData]
    newData[index] = { ...newData[index], [field]: value }
    setFormData(newData)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/rankings/${rankingType}`, {
        items: formData.filter(item => item.name && item.value)
      })
      alert('랭킹이 업데이트되었습니다.')
      setEditing(false)
      fetchRankings()
    } catch (error) {
      alert(error.response?.data?.message || '랭킹 업데이트에 실패했습니다.')
    }
  }

  return (
    <div className="ranking-management">
      <div className="management-header">
        <h1>랭킹 관리</h1>
        <select value={rankingType} onChange={(e) => setRankingType(e.target.value)}>
          <option value="level">레벨 랭킹</option>
          <option value="point">포인트 랭킹</option>
        </select>
      </div>

      {loading ? (
        <div className="loading">로딩 중...</div>
      ) : editing ? (
        <form onSubmit={handleSubmit} className="ranking-form">
          <div className="ranking-table">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>이름</th>
                  <th>{rankingType === 'level' ? '레벨' : '포인트'}</th>
                </tr>
              </thead>
              <tbody>
                {formData.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleChange(index, 'name', e.target.value)}
                        placeholder="이름"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.value || ''}
                        onChange={(e) => handleChange(index, 'value', e.target.value)}
                        placeholder={rankingType === 'level' ? '레벨' : '포인트'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-actions">
            <button type="submit">저장</button>
            <button type="button" onClick={handleCancel}>취소</button>
          </div>
        </form>
      ) : (
        <div className="ranking-display">
          <div className="ranking-table">
            <table>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>이름</th>
                  <th>{rankingType === 'level' ? '레벨' : '포인트'}</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((item, index) => (
                  <tr key={index}>
                    <td>{item.rank || index + 1}</td>
                    <td>{item.name}</td>
                    <td>{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleEdit} className="edit-btn">수정</button>
        </div>
      )}
    </div>
  )
}

export default RankingManagement



