import React from 'react'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import './EventPage.css'

const EventPage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  const events = [
    { id: 1, title: '토토톡X보증업체 콜라보 이벤트', date: '2025.10.31', participants: 108, status: '진행중' },
    { id: 2, title: '가이드라인 이벤트', date: '2025.09.30', participants: 112, status: '종료' },
    { id: 3, title: '보증업체 후기 이벤트', date: '2025.09.22', participants: 111, status: '종료' }
  ]

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    window.location.reload()
  }

  return (
    <PageLayout>
      <h1 className="page-title">이벤트</h1>
      
      <div className="event-list">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <div className="event-header">
              <h3>{event.title}</h3>
              <span className={`event-status ${event.status === '진행중' ? 'active' : 'ended'}`}>
                {event.status}
              </span>
            </div>
            <div className="event-info">
              <p>기간: {event.date}</p>
              <p>참여자: {event.participants}명</p>
            </div>
            {event.status === '진행중' && (
              <button className="btn-participate">참여하기</button>
            )}
          </div>
        ))}
      </div>

      {/* 게시판 가이드 (페이지 하단) */}
      <BoardGuide boardKey="royal-toto-event" />
    </PageLayout>
  )
}

export default EventPage
