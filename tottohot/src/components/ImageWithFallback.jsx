import React, { useState } from 'react'

const ImageWithFallback = ({ src, alt, fallbackText, className, style, onClick }) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = (e) => {
    // 레벨 이미지인 경우 level1.gif로 fallback 시도
    if (src && src.includes('/levels/level') && !src.includes('level1.gif')) {
      const fallbackSrc = '/levels/level1.gif'
      if (e.target.src !== fallbackSrc && e.target.src !== window.location.origin + fallbackSrc) {
        e.target.src = fallbackSrc
        return // fallback 이미지로 재시도
      }
    }
    // 모든 이미지 로드 실패는 조용하게 처리 (레벨 이미지 등 존재하지 않는 이미지 방지)
    setHasError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  if (hasError) {
    return (
      <div 
        className={className}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFD700',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '10px',
        }}
      >
        {fallbackText || alt || '이미지'}
      </div>
    )
  }

  // 이미지 URL이 상대 경로인 경우 전체 URL로 변환
  const getImageUrl = (url) => {
    if (!url || url.trim() === '') {
      return ''
    }
    
    // 이미 전체 URL인 경우 (5000 사용 시 3000으로 교체)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (url.includes('://localhost:5000')) {
        return url.replace('://localhost:5000', '://localhost:3000')
      }
      return url
    }
    
    // public 폴더의 정적 파일은 그대로 반환 (로고 등)
    if (url.startsWith('/logo') || url.startsWith('/favicon') || url.startsWith('/images/') || url.startsWith('/assets/') || url.startsWith('/levels/')) {
      return url
    }
    
    // /uploads/ 경로만 API 서버 URL로 변환
    if (url.startsWith('/uploads/')) {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        const protocol = window.location.protocol
        // localhost가 아니면 현재 호스트의 3000 포트 사용
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          const fullUrl = `${protocol}//${hostname}:3000${url}`
          return fullUrl
        } else {
          const fullUrl = `http://localhost:3000${url}`
          return fullUrl
        }
      }
    }
    
    // 그 외의 상대 경로는 그대로 반환 (public 폴더 파일)
    return url
  }

  const imageUrl = getImageUrl(src)

  // 레벨 이미지인 경우 wrapper span으로 감싸기
  const isLevelImage = className && (
    className.includes('author-level-image') || 
    className.includes('level-image') ||
    className.includes('comment-level-image') ||
    className.includes('ranking-level-image') ||
    className.includes('user-level-image') ||
    className.includes('mobile-user-level-image') ||
    (src && (src.includes('/levels/') || src.includes('level') || src.includes('mil')))
  )
  
  if (isLevelImage) {
    return (
      <span className={`level-image-wrapper ${className || ''}`} style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>
        <img
          src={imageUrl}
          alt={alt}
          className={className}
          style={style}
          onError={handleError}
          onLoad={handleLoad}
          onClick={onClick}
          loading="lazy"
          crossOrigin="anonymous"
        />
      </span>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      onLoad={handleLoad}
      onClick={onClick}
      loading="lazy"
      crossOrigin="anonymous"
    />
  )
}

export default ImageWithFallback

