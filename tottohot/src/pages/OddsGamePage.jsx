import React from 'react'
import PageLayout from '../components/PageLayout'
import './OddsGamePage.css'

const OddsGamePage = () => {
  return (
    <PageLayout>
      <div className="odds-game-page">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">오즈게임</h1>
            <p className="page-subtitle">오즈 게임 및 베팅 정보</p>
          </div>

          <div className="game-list">
            <div className="game-item">
              <h3 className="game-title">게임명</h3>
              <p className="game-desc">게임 설명이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default OddsGamePage

