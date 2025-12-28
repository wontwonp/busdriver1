import React, { useState, useEffect } from 'react'
import './ScrollButtons.css'

const ScrollButtons = () => {
  const [showTopButton, setShowTopButton] = useState(false)
  const [showBottomButton, setShowBottomButton] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // 상단으로 스크롤 버튼 표시 (스크롤이 일정 이상 내려갔을 때)
      setShowTopButton(scrollTop > 300)

      // 하단으로 스크롤 버튼 표시 (하단에 도달하지 않았을 때)
      setShowBottomButton(scrollTop + windowHeight < documentHeight - 100)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // 초기 상태 확인

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {showTopButton && (
        <button 
          className="scroll-button scroll-to-top" 
          onClick={scrollToTop}
          aria-label="맨 위로"
        >
          ↑
        </button>
      )}
      {showBottomButton && (
        <button 
          className="scroll-button scroll-to-bottom" 
          onClick={scrollToBottom}
          aria-label="맨 아래로"
        >
          ↓
        </button>
      )}
    </>
  )
}

export default ScrollButtons
