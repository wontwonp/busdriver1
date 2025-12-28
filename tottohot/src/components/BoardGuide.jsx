import React, { useState, useEffect } from 'react'
import api from '../utils/api'
import './BoardGuide.css'

const BoardGuide = ({ boardKey }) => {
  const [guide, setGuide] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (boardKey) {
      fetchGuide()
    }
  }, [boardKey])

  const fetchGuide = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/board-guide/public/${boardKey}`)
      if (response.data.guide) {
        setGuide(response.data.guide)
      }
    } catch (error) {
      console.error('게시판 가이드 조회 오류:', error)
      setGuide(null)
    } finally {
      setLoading(false)
    }
  }

  // 내용을 파싱하여 숫자로 시작하는 줄을 동그라미 숫자로 변환
  const parseContent = (content) => {
    if (!content) return []
    
    const lines = content.split('\n')
    const parsed = []
    
    lines.forEach((line, index) => {
      // 01, 02, 03 등의 패턴 찾기
      const numberedMatch = line.match(/^(\d{2})\s+(.+)$/)
      if (numberedMatch) {
        const [, number, text] = numberedMatch
        parsed.push({
          type: 'numbered',
          number,
          text: text.trim()
        })
      } else if (line.trim()) {
        parsed.push({
          type: 'text',
          text: line.trim()
        })
      } else {
        parsed.push({
          type: 'break'
        })
      }
    })
    
    return parsed
  }

  if (loading) {
    return null
  }

  if (!guide) {
    return null
  }

  const parsedContent = parseContent(guide.content)

  return (
    <div className="board-guide-section">
      <div 
        className="board-guide-title"
        style={{
          backgroundColor: guide.titleColor || '#39ff14',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          width: 'fit-content'
        }}
      >
        <h3 style={{ 
          color: '#000', 
          margin: 0, 
          fontWeight: 700, 
          fontSize: '18px' 
        }}>
          {guide.title}
        </h3>
      </div>
      
      <div className="board-guide-content">
        {parsedContent.map((item, index) => {
          if (item.type === 'numbered') {
            return (
              <div key={index} className="guide-numbered-item">
                <span className="guide-number-circle">{item.number}</span>
                <span className="guide-numbered-text">{item.text}</span>
              </div>
            )
          } else if (item.type === 'text') {
            return (
              <div key={index} className="guide-text-item">
                {item.text}
              </div>
            )
          } else {
            return <br key={index} />
          }
        })}
      </div>
    </div>
  )
}

export default BoardGuide

