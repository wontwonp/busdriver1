// 이미지 에러 처리 유틸리티
export const handleImageError = (e, fallbackText = '이미지') => {
  e.target.style.display = 'none'
  const placeholder = document.createElement('div')
  placeholder.className = 'image-placeholder'
  placeholder.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #2d2d44 0%, #1a1a2e 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #8b5cf6;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    padding: 10px;
    border-radius: 5px;
  `
  placeholder.textContent = fallbackText
  if (e.target.parentElement) {
    e.target.parentElement.appendChild(placeholder)
  }
}

export const createPlaceholderImage = (width, height, text, bgColor = '#2d2d44', textColor = '#8b5cf6') => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  // 배경
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)
  
  // 텍스트
  ctx.fillStyle = textColor
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, width / 2, height / 2)
  
  return canvas.toDataURL()
}

