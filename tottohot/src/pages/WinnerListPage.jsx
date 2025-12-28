import React from 'react'
import PageLayout from './PageLayout'
import './LotteryPage.css'

const WinnerListPage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  
  const winners = [
    { id: 1, name: 'user1', prize: '1등 - 100,000P', date: '2025.11.28' },
    { id: 2, name: 'user2', prize: '2등 - 50,000P', date: '2025.11.27' },
    { id: 3, name: 'user3', prize: '3등 - 10,000P', date: '2025.11.26' }
  ]

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    window.location.reload()
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <h1 className="page-title">당첨자 리스트</h1>
      
      <div className="winner-list">
        {winners.map((winner) => (
          <div key={winner.id} className="winner-item">
            <div>
              <span className="winner-name">{winner.name}</span>
              <span className="winner-prize"> - {winner.prize}</span>
            </div>
            <span style={{ color: '#888' }}>{winner.date}</span>
          </div>
        ))}
      </div>
    </PageLayout>
  )
}

export default WinnerListPage

