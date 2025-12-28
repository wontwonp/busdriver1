import React, { useState, useEffect } from 'react'
import PageLayout from './PageLayout'
import './MoneyLogPage.css'
import api from '../utils/api'

const MoneyLogPage = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [pointLogs, setPointLogs] = useState([])
  const [pointLogsPage, setPointLogsPage] = useState(1)
  const [pointLogsTotalPages, setPointLogsTotalPages] = useState(1)
  const [loadingPointLogs, setLoadingPointLogs] = useState(false)

  useEffect(() => {
    if (isLoggedIn) {
      fetchPointLogs(1)
    }
  }, [isLoggedIn])

  const fetchPointLogs = async (page = 1) => {
    if (!isLoggedIn) {
      return
    }
    
    try {
      setLoadingPointLogs(true)
      console.log('포인트 로그 로딩 시작:', page)
      const response = await api.get(`/attendance/point-logs?page=${page}&limit=50`)
      console.log('포인트 로그 응답:', response.data)
      if (response.data) {
        setPointLogs(response.data.logs || [])
        setPointLogsPage(response.data.page || 1)
        setPointLogsTotalPages(response.data.totalPages || 1)
        console.log('포인트 로그 개수:', response.data.logs?.length || 0)
      }
    } catch (error) {
      console.error('포인트 로그 로딩 실패:', error)
      if (error.response) {
        console.error('에러 응답:', error.response.data)
        console.error('에러 상태:', error.response.status)
      }
    } finally {
      setLoadingPointLogs(false)
    }
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn}>
      <div className="money-log-page">
        <div className="money-log-header">
          <h1>머니로그</h1>
          <p>회원가입부터 현재까지의 모든 포인트 획득 및 소진 내역입니다.</p>
        </div>

        {!isLoggedIn ? (
          <div className="no-logs">로그인이 필요합니다.</div>
        ) : loadingPointLogs ? (
          <div className="loading">로딩 중...</div>
        ) : (
          <>
            <div className="point-logs-list">
              {pointLogs.length === 0 ? (
                <div className="no-logs">
                  포인트 로그가 없습니다.
                  <br />
                  <small style={{ color: '#666', marginTop: '10px', display: 'block' }}>
                    회원가입, 출석체크, 게시글 작성 등의 활동을 통해 포인트를 획득하면 여기에 기록됩니다.
                  </small>
                </div>
              ) : (
                pointLogs.map((log) => {
                  const isEarn = log.amount > 0
                  const typeLabels = {
                    'initial': '회원가입',
                    'earn': '획득',
                    'spend': '소진',
                    'bonus': '보너스',
                    'penalty': '차감',
                    'refund': '환불'
                  }
                  const categoryLabels = {
                    'register': '회원가입',
                    'attendance': '출석체크',
                    'post': '게시글 작성',
                    'shop': '업소 등록',
                    'bet': '베팅',
                    'game': '게임',
                    'admin': '관리자 지급'
                  }

                  return (
                    <div key={log._id} className={`point-log-item ${isEarn ? 'earn' : 'spend'}`}>
                      <div className="log-main">
                        <div className="log-type">
                          <span className={`type-badge ${log.type}`}>
                            {typeLabels[log.type] || log.type}
                          </span>
                          <span className="category-label">
                            {categoryLabels[log.category] || log.category}
                          </span>
                        </div>
                        <div className="log-description">{log.description}</div>
                        <div className="log-time">
                          {new Date(log.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="log-amount">
                        <span className={`amount-value ${isEarn ? 'positive' : 'negative'}`}>
                          {isEarn ? '+' : ''}{log.amount.toLocaleString()}P
                        </span>
                        <div className="balance-after">
                          잔액: {log.balanceAfter.toLocaleString()}P
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            {pointLogsTotalPages > 1 && (
              <div className="point-logs-pagination">
                <button
                  className="page-btn"
                  onClick={() => fetchPointLogs(pointLogsPage - 1)}
                  disabled={pointLogsPage === 1}
                >
                  이전
                </button>
                <span className="page-number">
                  {pointLogsPage} / {pointLogsTotalPages}
                </span>
                <button
                  className="page-btn"
                  onClick={() => fetchPointLogs(pointLogsPage + 1)}
                  disabled={pointLogsPage >= pointLogsTotalPages}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}

export default MoneyLogPage

