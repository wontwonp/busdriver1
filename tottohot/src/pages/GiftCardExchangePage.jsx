import React from 'react'
import PageLayout from '../components/PageLayout'
import './GiftCardExchangePage.css'

const GiftCardExchangePage = () => {
  return (
    <PageLayout>
      <div className="gift-card-exchange-page">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">기프티콘교환</h1>
            <p className="page-subtitle">포인트로 기프티콘 교환</p>
          </div>

          <div className="gift-list">
            <div className="gift-item">
              <h3 className="gift-title">기프티콘명</h3>
              <p className="gift-point">필요 포인트: 10,000P</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default GiftCardExchangePage

