import React, { useState } from 'react'
import PageLayout from '../components/PageLayout'
import './PointPage.css'

const PointExchangePage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [points, setPoints] = useState(10000)

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true')
    window.location.reload()
  }

  return (
    <PageLayout>
      <h1 className="page-title">포인트 교환</h1>
      <p className="page-description">
        보유 포인트: <strong style={{ color: '#FFD700' }}>{points.toLocaleString()}P</strong>
      </p>
      
      <div className="exchange-form">
        <div className="form-group">
          <label>교환할 포인트</label>
          <input type="number" placeholder="포인트를 입력하세요" />
        </div>
        <div className="form-group">
          <label>교환 비율</label>
          <p className="exchange-rate">100P = 1원</p>
        </div>
        <button className="btn-exchange">교환하기</button>
      </div>
    </PageLayout>
  )
}

export default PointExchangePage

