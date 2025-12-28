import React from 'react'
import PageLayout from '../components/PageLayout'
import './PointInfoPage.css'

const PointInfoPage = () => {
  return (
    <PageLayout>
      <div className="point-info-page">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">포인트안내</h1>
            <p className="page-subtitle">포인트 획득 및 사용 안내</p>
          </div>

          <div className="info-content">
            <div className="info-section">
              <h3 className="info-title">포인트 획득 방법</h3>
              <p className="info-desc">포인트 획득 방법이 여기에 표시됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

export default PointInfoPage

