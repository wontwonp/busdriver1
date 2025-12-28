import React, { useEffect, useRef } from 'react'
import './NeonLogo.css'

const NeonLogo = () => {
  const koreanLogoRef = useRef(null)
  const englishLogoRef = useRef(null)
  const koreanLettersRef = useRef([])
  const englishLettersRef = useRef([])

  useEffect(() => {
    const koreanLogo = koreanLogoRef.current
    const englishLogo = englishLogoRef.current
    const koreanLetters = koreanLogo?.querySelectorAll('span') || []
    const englishLetters = englishLogo?.querySelectorAll('span') || []
    
    koreanLettersRef.current = Array.from(koreanLetters)
    englishLettersRef.current = Array.from(englishLetters)

    // 한글자씩 나타나는 애니메이션
    const animateLetters = (letters, delay = 0) => {
      letters.forEach((letter, index) => {
        const text = letter.textContent.trim()
        if (text === '' || text === ' ') return
        
        setTimeout(() => {
          letter.style.animation = 'letterAppear 0.4s ease forwards'
          letter.style.opacity = '1'
        }, delay + index * 120)
      })
    }

    // 초기화
    const init = () => {
      // 폰트 로드 대기
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          koreanLettersRef.current.forEach(letter => {
            letter.style.opacity = '0'
            letter.style.animation = 'none'
            letter.style.transform = 'translateY(30px) scale(0.5)'
            letter.style.filter = 'none'
          })
          
          englishLettersRef.current.forEach(letter => {
            const text = letter.textContent.trim()
            if (text !== '' && text !== ' ') {
              letter.style.opacity = '0'
              letter.style.animation = 'none'
              letter.style.transform = 'translateY(30px) scale(0.5)'
              letter.style.filter = 'none'
            }
          })
          
          setTimeout(() => {
            animateLetters(koreanLettersRef.current, 200)
            animateLetters(englishLettersRef.current, 1000)
          }, 100)
        })
      } else {
        // 폰트 API가 없는 경우 바로 실행
        setTimeout(() => {
          koreanLettersRef.current.forEach(letter => {
            letter.style.opacity = '0'
            letter.style.animation = 'none'
            letter.style.transform = 'translateY(30px) scale(0.5)'
            letter.style.filter = 'none'
          })
          
          englishLettersRef.current.forEach(letter => {
            const text = letter.textContent.trim()
            if (text !== '' && text !== ' ') {
              letter.style.opacity = '0'
              letter.style.animation = 'none'
              letter.style.transform = 'translateY(30px) scale(0.5)'
              letter.style.filter = 'none'
            }
          })
          
          setTimeout(() => {
            animateLetters(koreanLettersRef.current, 200)
            animateLetters(englishLettersRef.current, 1000)
          }, 100)
        }, 500)
      }
    }

    // 재시작 함수
    const restart = () => {
      koreanLettersRef.current.forEach(letter => {
        letter.style.animation = 'none'
        letter.style.opacity = '0'
        letter.style.transform = 'translateY(30px) scale(0.5)'
        letter.style.filter = 'none'
      })
      
      englishLettersRef.current.forEach(letter => {
        const text = letter.textContent.trim()
        if (text !== '' && text !== ' ') {
          letter.style.animation = 'none'
          letter.style.opacity = '0'
          letter.style.transform = 'translateY(30px) scale(0.5)'
          letter.style.filter = 'none'
        }
      })
      
      void koreanLogo?.offsetWidth
      void englishLogo?.offsetWidth
      
      setTimeout(() => {
        animateLetters(koreanLettersRef.current, 200)
        animateLetters(englishLettersRef.current, 1000)
      }, 50)
    }

    // 자동 반복 함수
    const autoRepeat = () => {
      const koreanDelay = koreanLettersRef.current.length * 120
      const englishDelay = englishLettersRef.current.length * 120
      const totalAnimationTime = Math.max(koreanDelay, englishDelay) + 2000
      
      init()
      
      const interval = setInterval(() => {
        restart()
      }, totalAnimationTime + 1000)

      return () => clearInterval(interval)
    }

    const cleanup = autoRepeat()

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <div className="neon-logo-container">
      <div className="logo-korean" ref={koreanLogoRef}>
        <span>로</span><span>얄</span><span>토</span><span>토</span>
      </div>
      <div className="logo-english" ref={englishLogoRef}>
        <span>R</span><span>O</span><span>Y</span><span>A</span><span>L</span>
        <span style={{ marginLeft: '8px', width: '8px' }}></span>
        <span>T</span><span>O</span><span>T</span><span>O</span>
      </div>
    </div>
  )
}

export default NeonLogo


