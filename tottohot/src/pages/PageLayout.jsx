import React from 'react'
import Sidebar from '../components/Sidebar'
import './PageLayout.css'

const PageLayout = ({ children, isLoggedIn, onLogin }) => {
  return (
    <div className="page-layout">
      <div className="main-container">
        <Sidebar isLoggedIn={isLoggedIn} onLogin={onLogin} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  )
}

export default PageLayout

