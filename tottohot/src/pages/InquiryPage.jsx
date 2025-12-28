import React, { useState } from 'react'
import PageLayout from '../components/PageLayout'
import './InquiryPage.css'

const InquiryPage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [inquiries, setInquiries] = useState([
    { id: 1, title: '문의 제목 1', date: '2025.11.28', status: '답변완료' },
    { id: 2, title: '문의 제목 2', date: '2025.11.27', status: '답변대기' }
  ])

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    window.location.reload()
  }

  return (
    <PageLayout>
      <h1 className="page-title">1:1 문의</h1>
      
      {isLoggedIn ? (
        <>
          <div className="inquiry-list">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="inquiry-item">
                <div className="inquiry-content">
                  <span className="inquiry-title">{inquiry.title}</span>
                  <span className={`inquiry-status ${inquiry.status === '답변완료' ? 'answered' : 'pending'}`}>
                    {inquiry.status}
                  </span>
                </div>
                <span className="inquiry-date">{inquiry.date}</span>
              </div>
            ))}
          </div>
          
          <button className="btn-write-inquiry">문의하기</button>
        </>
      ) : (
        <p style={{ color: '#888', textAlign: 'center' }}>로그인 후 문의를 작성하실 수 있습니다.</p>
      )}
    </PageLayout>
  )
}

export default InquiryPage

