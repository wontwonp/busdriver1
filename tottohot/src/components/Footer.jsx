import React, { useState, useEffect } from 'react'
import ImageWithFallback from './ImageWithFallback'
import api from '../utils/api'
import './Footer.css'

const Footer = () => {
  const [telegramId, setTelegramId] = useState('')
  const [telegramImage, setTelegramImage] = useState('/images/telegram.png')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings')
      if (response.data) {
        if (response.data.telegramId) {
          setTelegramId(response.data.telegramId)
        }
        if (response.data.telegramImage) {
          setTelegramImage(response.data.telegramImage)
        }
      }
    } catch (error) {
      console.error('설정 로딩 실패:', error)
    }
  }

  const handleTelegramClick = (e) => {
    e.preventDefault()
    if (telegramId) {
      const id = telegramId.startsWith('@') ? telegramId.substring(1) : telegramId
      window.open(`https://t.me/${id}`, '_blank')
    } else {
      alert('텔레그램 ID가 설정되지 않았습니다')
    }
  }

  const handleAdvertiseClick = (e) => {
    e.preventDefault()
    if (telegramId) {
      const id = telegramId.startsWith('@') ? telegramId.substring(1) : telegramId
      window.open(`https://t.me/${id}`, '_blank')
    } else {
      alert('텔레그램 ID가 설정되지 않았습니다')
    }
  }

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="#notice">공지사항</a>
          <a href="#advertise" onClick={handleAdvertiseClick}>광고/제휴 문의</a>
        </div>
        <div className="footer-telegram">
          <a href="#telegram" className="telegram-link" onClick={handleTelegramClick}>
            <ImageWithFallback
              src={telegramImage}
              alt="텔레그램"
              fallbackText="T"
              style={{ width: '30px', height: '30px' }}
            />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
