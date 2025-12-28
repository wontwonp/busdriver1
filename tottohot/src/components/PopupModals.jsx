import React, { useState, useEffect } from 'react'
import ImageWithFallback from './ImageWithFallback'
import './PopupModals.css'

const PopupModals = ({ onClose }) => {
  const [closedPopups, setClosedPopups] = useState({
    guideline: false,
    signup: false,
    telegram: false
  })

  const handleClose = (popupName) => {
    setClosedPopups(prev => ({ ...prev, [popupName]: true }))
  }

  const handleDontShow = (popupName) => {
    localStorage.setItem(`popup_${popupName}_hidden`, 'true')
    handleClose(popupName)
  }

  useEffect(() => {
    if (closedPopups.guideline && closedPopups.signup && closedPopups.telegram) {
      onClose()
    }
  }, [closedPopups, onClose])

  if (closedPopups.guideline && closedPopups.signup && closedPopups.telegram) {
    return null
  }

  return (
    <div className="popup-overlay">
      {!closedPopups.guideline && (
        <div className="popup-modal popup-guideline">
          <button className="popup-close" onClick={() => handleClose('guideline')}>×</button>
          <a href="#guideline-event" className="popup-link">
            <ImageWithFallback
              src=""
              alt="가이드라인 이벤트"
              fallbackText="가이드라인 이벤트"
              style={{ width: '100%', height: 'auto', minHeight: '400px' }}
            />
          </a>
          <button className="popup-dont-show" onClick={() => handleDontShow('guideline')}>
            다시 보지 않기
          </button>
        </div>
      )}

      {!closedPopups.signup && (
        <div className="popup-modal popup-signup">
          <button className="popup-close" onClick={() => handleClose('signup')}>×</button>
          <a href="#signup-event" className="popup-link">
            <ImageWithFallback
              src=""
              alt="회원가입 이벤트"
              fallbackText="회원가입 이벤트"
              style={{ width: '100%', height: 'auto', minHeight: '400px' }}
            />
          </a>
          <button className="popup-dont-show" onClick={() => handleDontShow('signup')}>
            다시 보지 않기
          </button>
        </div>
      )}

      {!closedPopups.telegram && (
        <div className="popup-modal popup-telegram">
          <button className="popup-close" onClick={() => handleClose('telegram')}>×</button>
          <a href="#telegram-event" className="popup-link">
            <ImageWithFallback
              src=""
              alt="텔레그램 채널 이벤트"
              fallbackText="텔레그램 채널 이벤트"
              style={{ width: '100%', height: 'auto', minHeight: '400px' }}
            />
          </a>
          <button className="popup-dont-show" onClick={() => handleDontShow('telegram')}>
            다시 보지 않기
          </button>
        </div>
      )}
    </div>
  )
}

export default PopupModals

