import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import api from '../utils/api'
import './WriteBlackListPage.css'

const WriteBlackListPage = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    inquiryContent: '',
    name: '',
    birthDate: '',
    phoneNumber: '',
    bank: '',
    accountNumber: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    // 010-1234-5678 형식으로 포맷
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 11) return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const formatAccountNumber = (value) => {
    // 숫자만 추출하고 최대 20자리로 제한
    const numbers = value.replace(/[^\d]/g, '').slice(0, 20)
    return numbers
  }

  const handleAccountInput = (e) => {
    // 숫자만 입력 가능하도록 (최대 20자리)
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 20)
    setFormData(prev => ({
      ...prev,
      accountNumber: value
    }))
  }

  const formatBirthDate = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '')
    // YYYY-MM-DD 형식으로 포맷
    if (numbers.length <= 4) return numbers
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`
  }

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value)
    setFormData(prev => ({
      ...prev,
      phoneNumber: formatted
    }))
  }


  const handleBankChange = (e) => {
    setFormData(prev => ({
      ...prev,
      bank: e.target.value
    }))
  }

  const handleBirthDateChange = (e) => {
    const formatted = formatBirthDate(e.target.value)
    setFormData(prev => ({
      ...prev,
      birthDate: formatted
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.inquiryContent.trim()) {
      setError('조회하실 내용을 입력해주세요.')
      return
    }
    if (!formData.name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!formData.birthDate.trim()) {
      setError('생년월일을 입력해주세요.')
      return
    }
    if (!formData.phoneNumber.trim()) {
      setError('휴대폰 번호를 입력해주세요.')
      return
    }
    if (!formData.bank.trim()) {
      setError('은행을 선택해주세요.')
      return
    }
    if (!formData.accountNumber.trim()) {
      setError('계좌번호를 입력해주세요.')
      return
    }
    const accountNumberLength = formData.accountNumber.replace(/[^\d]/g, '').length
    if (accountNumberLength < 1 || accountNumberLength > 20) {
      setError('계좌번호는 1~20자리 숫자로 입력해주세요.')
      return
    }

    // 생년월일 형식 검증 (YYYY-MM-DD)
    const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthDateRegex.test(formData.birthDate)) {
      setError('생년월일을 올바른 형식으로 입력해주세요. (예: 1990-01-01)')
      return
    }

    setLoading(true)

    try {
      const postData = {
        boardKey: 'black-list',
        title: '블랙조회', // 이름 제거
        content: formData.inquiryContent,
        isSecret: true, // 무조건 비밀글
        blackListInfo: {
          name: formData.name.trim(),
          birthDate: formData.birthDate.trim(),
          phoneNumber: formData.phoneNumber.replace(/-/g, ''), // 하이픈 제거하여 저장
          bank: formData.bank.trim(),
          accountNumber: formData.accountNumber.replace(/[^\d]/g, '') // 숫자만 저장
        }
      }

      await api.post('/posts', postData)
      alert('블랙조회 글이 등록되었습니다.')
      navigate('/black-list')
    } catch (error) {
      console.error('블랙조회 글 작성 오류:', error)
      setError(error.response?.data?.message || '글 작성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="write-black-list-page">
        <div className="board-container">
          <h1 className="page-title">블랙조회 글쓰기</h1>
          
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="black-list-form">
            <div className="form-section">
              <textarea
                name="inquiryContent"
                value={formData.inquiryContent}
                onChange={handleInputChange}
                className="form-textarea"
                placeholder="조회하실 내용을 입력해주세요."
                rows={10}
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">이름</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="이름을 입력해주세요"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">생년월일</label>
              <input
                type="text"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleBirthDateChange}
                className="form-input"
                placeholder="YYYY-MM-DD (예: 1990-01-01)"
                maxLength={10}
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">휴대폰 번호</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handlePhoneChange}
                className="form-input"
                placeholder="010-1234-5678"
                maxLength={13}
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">은행</label>
              <input
                type="text"
                name="bank"
                value={formData.bank}
                onChange={handleBankChange}
                className="form-input"
                placeholder="은행명을 입력해주세요"
                required
              />
            </div>

            <div className="form-section">
              <label className="form-label">계좌번호</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleAccountInput}
                className="form-input"
                placeholder="계좌번호 20자리 숫자만 입력"
                maxLength={20}
                required
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/black-list')} className="btn-cancel">
                취소
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '등록 중...' : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PageLayout>
  )
}

export default WriteBlackListPage
