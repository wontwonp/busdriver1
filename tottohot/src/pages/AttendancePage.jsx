import React, { useState, useEffect } from 'react'
import PageLayout from '../components/PageLayout'
import './AttendancePage.css'
import api from '../utils/api'
import ImageWithFallback from '../components/ImageWithFallback'

const AttendancePage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [attendanceData, setAttendanceData] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [greeting, setGreeting] = useState('')
  const [showGreetingModal, setShowGreetingModal] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasAttendedToday, setHasAttendedToday] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [comments, setComments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const commentsPerPage = 10

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])


  // 출석체크 데이터 로드 (로그인 여부와 관계없이 인원 수는 표시)
  useEffect(() => {
    fetchAttendanceData()
    if (isLoggedIn) {
      fetchTodayComments()
    }
  }, [isLoggedIn, currentDate])

  // 오늘 날짜가 바뀌면 댓글 다시 로드
  useEffect(() => {
    if (isLoggedIn) {
      const interval = setInterval(() => {
        const now = new Date()
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        fetchCommentsForDate(todayStr)
      }, 60000) // 1분마다 체크
      return () => clearInterval(interval)
    }
  }, [isLoggedIn])

  const fetchAttendanceData = async () => {
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      // 로그인한 경우 개인 출석 정보와 인원 수 함께 가져오기
      if (isLoggedIn) {
        const response = await api.get(`/attendance?year=${year}&month=${month}`)
        if (response.data) {
          setAttendanceData(response.data)
          
          // 오늘 출석체크 여부 확인
          const today = new Date()
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
          setHasAttendedToday(!!response.data[todayStr] && !!response.data[todayStr].points)
        }
      } else {
        // 로그인하지 않은 경우 인원 수만 가져오기
        try {
          const response = await api.get(`/attendance/counts?year=${year}&month=${month}`)
          if (response.data) {
            // 인원 수만 있는 데이터를 attendanceData 형식으로 변환
            const countsData = {}
            Object.keys(response.data).forEach(date => {
              countsData[date] = {
                attendanceCount: response.data[date],
                points: null,
                greeting: null
              }
            })
            setAttendanceData(countsData)
          }
        } catch (countError) {
          console.error('출석체크 인원 수 로딩 실패:', countError)
          // 인증이 필요한 경우 빈 객체로 설정
          setAttendanceData({})
        }
      }
    } catch (error) {
      console.error('출석체크 데이터 로딩 실패:', error)
      // 에러 발생 시에도 인원 수는 가져오기 시도
      if (isLoggedIn) {
        try {
          const year = currentDate.getFullYear()
          const month = currentDate.getMonth() + 1
          const response = await api.get(`/attendance/counts?year=${year}&month=${month}`)
          if (response.data) {
            const countsData = {}
            Object.keys(response.data).forEach(date => {
              countsData[date] = {
                attendanceCount: response.data[date],
                points: null,
                greeting: null
              }
            })
            setAttendanceData(countsData)
          }
        } catch (countError) {
          console.error('출석체크 인원 수 로딩 실패:', countError)
        }
      }
    }
  }

  const fetchTodayComments = async () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    await fetchCommentsForDate(todayStr)
  }

  const fetchCommentsForDate = async (dateStr) => {
    try {
      const response = await api.get(`/attendance/comments?date=${dateStr}`)
      if (response.data) {
        setComments(response.data)
      }
    } catch (error) {
      console.error('출석체크 댓글 로딩 실패:', error)
    }
  }


  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleDateClick = async (date) => {
    if (!isLoggedIn) return
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    setSelectedDate(dateStr)
    
    try {
      const response = await api.get(`/attendance/greeting?date=${dateStr}`)
      if (response.data && response.data.greeting) {
        setGreeting(response.data.greeting)
        setShowGreetingModal(true)
      } else {
        setGreeting('인사말이 없습니다.')
        setShowGreetingModal(true)
      }
    } catch (error) {
      console.error('인사말 로딩 실패:', error)
      setGreeting('인사말을 불러올 수 없습니다.')
      setShowGreetingModal(true)
    }
  }

  const handleAttendance = async () => {
    if (!isLoggedIn) {
      alert('로그인 후 출석체크를 진행해주세요.')
      return
    }

    if (hasAttendedToday) {
      alert('오늘은 이미 출석체크를 완료하셨습니다.')
      return
    }

    if (isChecking) {
      return
    }

    setIsChecking(true)
    try {
      const response = await api.post('/attendance/check')
      if (response.data) {
        const bonusText = response.data.bonusPoints > 0 
          ? `\n보너스 포인트 ${response.data.bonusPoints}P가 지급되었습니다!` 
          : ''
        alert(`출석체크 완료!\n${response.data.points}P가 지급되었습니다.${bonusText}`)
        setHasAttendedToday(true)
        fetchAttendanceData()
        // 오늘 댓글 다시 로드
        fetchTodayComments()
        // 댓글 페이지를 첫 페이지로 리셋
        setCurrentPage(1)
      }
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message)
        if (error.response.data.message.includes('이미 출석체크')) {
          setHasAttendedToday(true)
        }
      } else {
        alert('출석체크에 실패했습니다.')
      }
    } finally {
      setIsChecking(false)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const formatDate = (date) => {
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 ${weekday}`
  }

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
  const todayDate = today.getDate()

  // 빈 날짜 생성
  const emptyDays = Array(firstDay).fill(null)
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <PageLayout>
      <div className="attendance-page">
        {/* 배너 섹션 */}
        <div className="attendance-banner">
          <div className="banner-content">
            <div className="banner-text">
              <h1>출석체크</h1>
              <p>토토톡 출석체크는 기본!!</p>
            </div>
          </div>
        </div>

        {/* 현재 시간/날짜 표시 */}
        <div className="attendance-info">
          <div className="time-display">
            <span className="current-time">현재 {formatTime(currentTime)}</span>
            <span className="separator">/</span>
            <span className="current-date" onClick={() => isLoggedIn && handleDateClick(todayDate)}>
              {formatDate(currentTime)}
            </span>
          </div>
          <div className="info-note">
            <span className="info-icon">ℹ️</span>
            <span>날짜 부분을 클릭하면 그날의 인사말을 볼 수 있습니다.</span>
          </div>
        </div>

        {/* 캘린더 네비게이션 */}
        <div className="calendar-navigation">
          <button className="nav-btn prev" onClick={handlePrevMonth}>이전</button>
          <span className="month-year">
            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
          </span>
          <button className="nav-btn next" onClick={handleNextMonth}>다음</button>
        </div>

        {/* 캘린더 그리드 */}
        <div className="attendance-calendar">
          <div className="calendar-header">
            <div className="weekday">일</div>
            <div className="weekday">월</div>
            <div className="weekday">화</div>
            <div className="weekday">수</div>
            <div className="weekday">목</div>
            <div className="weekday">금</div>
            <div className="weekday">토</div>
          </div>
          <div className="calendar-grid">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="calendar-day empty"></div>
            ))}
            {calendarDays.map((day) => {
              const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayData = attendanceData[dateKey]
              const isToday = isCurrentMonth && day === todayDate
              const dayOfWeek = (firstDay + day - 1) % 7
              const isSunday = dayOfWeek === 0
              const isSaturday = dayOfWeek === 6
              // 자신이 출석한 날짜인지 확인 (points가 있으면 출석한 것)
              const hasAttended = dayData && dayData.points !== null && dayData.points !== undefined
              
              return (
                <div
                  key={day}
                  className={`calendar-day ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''} ${hasAttended ? 'attended' : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className="day-number">{day}</div>
                  {dayData && dayData.points && (
                    <div className="day-points">{dayData.points}P</div>
                  )}
                  {dayData && dayData.attendanceCount > 0 && (
                    <div className="day-attendance-count">{dayData.attendanceCount}명</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 출석체크 버튼 */}
        {isLoggedIn && (
          <div className="attendance-button-section">
            <button 
              className={`btn-attendance ${hasAttendedToday ? 'disabled' : ''}`} 
              onClick={handleAttendance}
              disabled={hasAttendedToday || isChecking}
            >
              {isChecking ? '처리 중...' : hasAttendedToday ? '오늘 출석체크 완료' : '출석체크하기'}
            </button>
          </div>
        )}

        {/* 출석체크 댓글 섹션 */}
        {isLoggedIn && (
          <div className="attendance-comments-section">
            <h3 className="comments-title">오늘의 출석체크 명언</h3>
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">아직 출석체크 명언이 없습니다.</div>
              ) : (
                <>
                  {comments
                    .slice((currentPage - 1) * commentsPerPage, currentPage * commentsPerPage)
                    .map((comment) => (
                      <div key={comment._id} className="comment-item">
                        <div className="comment-author">
                          <ImageWithFallback
                            src={comment.shopLevel && comment.shopLevel > 0 
                              ? '/levels/shop.gif' 
                              : `/levels/level${comment.level || 1}.gif`}
                            alt="레벨"
                            className="comment-level-image"
                            fallbackText=""
                          />
                          <span className="comment-nickname">{comment.nickname || comment.username}</span>
                        </div>
                        <div className="comment-content">{comment.content}</div>
                        <div className="comment-time">
                          {new Date(comment.createdAt).toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    ))}
                </>
              )}
            </div>
            {comments.length > commentsPerPage && (
              <div className="comments-pagination">
                <button
                  className="comments-page-btn"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                <span className="comments-page-number">
                  {currentPage} / {Math.ceil(comments.length / commentsPerPage)}
                </span>
                <button
                  className="comments-page-btn"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(comments.length / commentsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(comments.length / commentsPerPage)}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}

        {/* 인사말 모달 */}
        {showGreetingModal && (
          <div className="greeting-modal-overlay" onClick={() => setShowGreetingModal(false)}>
            <div className="greeting-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedDate} 인사말</h3>
                <button className="close-btn" onClick={() => setShowGreetingModal(false)}>×</button>
              </div>
              <div className="modal-content">
                <p>{greeting}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  )
}

export default AttendancePage
