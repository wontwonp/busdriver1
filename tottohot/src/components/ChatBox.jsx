import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../utils/api'
import './ChatBox.css'

const ChatBox = ({ room = 'general' }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [userCount, setUserCount] = useState(0)
  const [userInfo, setUserInfo] = useState(null)
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token')
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
        
        if (!token || !isLoggedIn) {
          // 토큰이나 로그인 상태가 없으면 userInfo도 null로 설정
          setUserInfo(null)
          return
        }

        // localStorage에 저장된 userInfo가 있으면 먼저 사용
        try {
          const savedUserInfo = localStorage.getItem('userInfo')
          if (savedUserInfo) {
            const parsed = JSON.parse(savedUserInfo)
            if (parsed && (parsed._id || parsed.id)) {
              setUserInfo(parsed)
            }
          }
        } catch (e) {
          // localStorage 파싱 실패는 무시
        }

        // 서버에서 최신 정보 가져오기 (실패해도 localStorage 정보 사용)
        try {
          const response = await api.get('/auth/me')
          if (response.data) {
            setUserInfo(response.data)
            // 최신 정보를 localStorage에 저장
            localStorage.setItem('userInfo', JSON.stringify(response.data))
          }
        } catch (error) {
          // 401 에러는 조용히 처리 (이미 localStorage 정보 사용 중)
          // 401이 발생해도 localStorage의 userInfo는 유지 (토큰 만료 등으로 인한 일시적 오류일 수 있음)
          if (error.response?.status !== 401) {
            console.error('사용자 정보 로딩 실패:', error)
          }
          // 401이 발생해도 localStorage에 userInfo가 있으면 그대로 사용
          // userInfo를 null로 설정하지 않음
        }
      } catch (error) {
        console.error('사용자 정보 로딩 실패:', error)
        setUserInfo(null)
      }
    }

    fetchUserInfo()
  }, [])

  // Socket.io 연결
  useEffect(() => {
    const token = localStorage.getItem('token')
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    // userInfo가 없어도 토큰이 있으면 연결 시도 (userInfo는 나중에 로드될 수 있음)
    if (!token || !isLoggedIn) return

    // Socket.io 서버 URL 설정
    const getSocketUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          return `http://${hostname}:4001`
        }
      }
      return 'http://localhost:4001'
    }

    const socketUrl = getSocketUrl()
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    })

    newSocket.on('connect', () => {
      console.log('✅ Socket.io 연결 성공')
      setIsConnected(true)

      // userInfo가 있을 때만 채팅방 입장
      if (userInfo && (userInfo._id || userInfo.id)) {
        newSocket.emit('join-room', {
          room,
          userId: userInfo._id || userInfo.id,
          username: userInfo.username,
          nickname: userInfo.nickname || userInfo.username,
          level: userInfo.level || 1
        })
      }
    })

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.io 연결 해제')
      setIsConnected(false)
    })

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    })

    newSocket.on('user-joined', (data) => {
      setMessages(prev => [...prev, {
        _id: `system-${Date.now()}`,
        nickname: '시스템',
        message: data.message,
        messageType: 'system',
        createdAt: new Date()
      }])
      scrollToBottom()
    })

    newSocket.on('user-left', (data) => {
      setMessages(prev => [...prev, {
        _id: `system-${Date.now()}`,
        nickname: '시스템',
        message: data.message,
        messageType: 'system',
        createdAt: new Date()
      }])
      scrollToBottom()
    })

    newSocket.on('user-count', (data) => {
      setUserCount(data.count)
    })

    newSocket.on('error', (error) => {
      console.error('Socket.io 오류:', error)
      alert(error.message || '채팅 오류가 발생했습니다.')
    })

    setSocket(newSocket)

    // 채팅 히스토리 로드
    const loadHistory = async () => {
      try {
        const response = await api.get(`/chat/messages?room=${room}&limit=50`)
        if (response.data && response.data.messages) {
          setMessages(response.data.messages || [])
          scrollToBottom()
        } else if (response.data && Array.isArray(response.data)) {
          // 배열로 직접 반환되는 경우
          setMessages(response.data || [])
          scrollToBottom()
        }
      } catch (error) {
        console.error('채팅 히스토리 로딩 실패:', error)
      }
    }

    loadHistory()

    return () => {
      newSocket.close()
    }
  }, [userInfo, room])

  // userInfo가 로드되면 Socket.io에 채팅방 입장
  useEffect(() => {
    if (socket && isConnected && userInfo && (userInfo._id || userInfo.id)) {
      socket.emit('join-room', {
        room,
        userId: userInfo._id || userInfo.id,
        username: userInfo.username,
        nickname: userInfo.nickname || userInfo.username,
        level: userInfo.level || 1
      })
    }
  }, [socket, isConnected, userInfo, room])

  // 메시지 전송
  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket || !isConnected) return

    socket.emit('send-message', {
      message: newMessage.trim(),
      room
    })

    setNewMessage('')
  }

  // 스크롤을 맨 아래로
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  // 메시지가 추가될 때마다 스크롤
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 로그인하지 않은 경우 채팅창 숨김
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('token')
  // userInfo가 없어도 토큰이 있으면 채팅창 표시 (userInfo는 나중에 로드될 수 있음)
  if (!isLoggedIn) return null

  // 레벨별 색상
  const getLevelColor = (level) => {
    if (level >= 30) return '#ff6b6b'
    if (level >= 20) return '#4ecdc4'
    if (level >= 10) return '#95e1d3'
    return '#f38181'
  }

  // 시간 포맷
  const formatTime = (date) => {
    if (!date) return ''
    const d = new Date(date)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  return (
    <div className="chat-box">
      <div className="chat-header">
        <div className="chat-header-left">
          <span className="chat-title">💬 실시간 채팅</span>
          {isConnected && (
            <span className="chat-status online">●</span>
          )}
          {!isConnected && (
            <span className="chat-status offline">●</span>
          )}
          {userCount > 0 && (
            <span className="chat-user-count">({userCount}명)</span>
          )}
        </div>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">메시지가 없습니다.</div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg._id} 
              className={`chat-message ${msg.messageType === 'system' ? 'system-message' : ''}`}
            >
              {msg.messageType !== 'system' && (
                <div className="message-header">
                  <span 
                    className="message-nickname"
                    style={{ color: getLevelColor(msg.level || 1) }}
                  >
                    {msg.nickname}
                  </span>
                  {msg.level && (
                    <span className="message-level">Lv.{msg.level}</span>
                  )}
                  <span className="message-time">{formatTime(msg.createdAt)}</span>
                </div>
              )}
              <div className="message-content">{msg.message}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          className="chat-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="메시지를 입력하세요..."
          maxLength={500}
          disabled={!isConnected}
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={!newMessage.trim() || !isConnected}
        >
          전송
        </button>
      </form>
    </div>
  )
}

export default ChatBox
