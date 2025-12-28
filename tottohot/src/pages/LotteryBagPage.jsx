import React from 'react'
import PageLayout from './PageLayout'
import './LotteryPage.css'

const LotteryBagPage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    window.location.reload()
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <h1 className="page-title">복권 가방</h1>
      <p className="page-description">
        포인트로 복권을 구매하고 당첨을 확인하세요!
      </p>
      
      <div className="lottery-bag">
        <div className="lottery-item">
          <h3>1등 복권</h3>
          <p>가격: 10,000P</p>
          <button className="btn-buy">구매하기</button>
        </div>
        <div className="lottery-item">
          <h3>2등 복권</h3>
          <p>가격: 5,000P</p>
          <button className="btn-buy">구매하기</button>
        </div>
        <div className="lottery-item">
          <h3>3등 복권</h3>
          <p>가격: 1,000P</p>
          <button className="btn-buy">구매하기</button>
        </div>
      </div>
    </PageLayout>
  )
}

export default LotteryBagPage

