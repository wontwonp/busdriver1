import React from 'react'
import PageLayout from '../components/PageLayout'
import BoardGuide from '../components/BoardGuide'
import './GeneralPromoPage.css'

const GeneralPromoPage = () => {
  return (
    <PageLayout>
      <div className="general-promo-page">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">일반홍보</h1>
            <p className="page-subtitle">일반 홍보 게시판</p>
          </div>

          <div className="promo-list">
            <div className="promo-item">
              <h3 className="promo-title">홍보 제목</h3>
              <p className="promo-desc">홍보 내용이 여기에 표시됩니다.</p>
            </div>
          </div>

          {/* 게시판 가이드 (페이지 하단) */}
          <BoardGuide boardKey="general-promo" />
        </div>
      </div>
    </PageLayout>
  )
}

export default GeneralPromoPage
