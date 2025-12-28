import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from './PageLayout'
import api from '../utils/api'
import './PointBaccaratPage.css'

const PointBaccaratPage = ({ type }) => {
  const navigate = useNavigate()
  const gameType = `speed-baccarat-${type}`
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const [userPoints, setUserPoints] = useState(0)
  const [gameId, setGameId] = useState('--')
  const [gameRound, setGameRound] = useState(null) // 게임 회차 (예: 1414)
  const [betStatus, setBetStatus] = useState('베팅 종료')
  const [timer, setTimer] = useState('--')
  const [timerSeconds, setTimerSeconds] = useState(0) // 남은 시간(초)
  const [timerBarWidth, setTimerBarWidth] = useState(0) // 타이머 바 너비 (%)
  const [activeTab, setActiveTab] = useState('my-betting-list')
  const [selectedChip, setSelectedChip] = useState(1000)
  const [betAmounts, setBetAmounts] = useState({
    pp: 0, // Player Pair
    p: 0,  // Player
    t: 0,  // Tie
    b: 0,  // Banker
    bp: 0  // Banker Pair
  })
  const [totalBetAmount, setTotalBetAmount] = useState(0)
  const [myBettingList, setMyBettingList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentRound, setCurrentRound] = useState(null)
  const [iframeLoading, setIframeLoading] = useState(true)
  const [iframeError, setIframeError] = useState(false)
  const [isBettingPanelOpen, setIsBettingPanelOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // 외부 게임 iframe에서 parent로 보내는 postMessage를 감지해서 DB에 저장
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        let data = event.data

        // 문자열이면 JSON 파싱 시도
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch {
            // JSON 아니면 무시
            return
          }
        }

        if (
          data &&
          typeof data === 'object' &&
          (data.game_id || data.game_no || data.game_daily_no) &&
          data.game_status &&
          data.result_winner
        ) {
          // 게임 결과 데이터 로그 출력
          console.log('[게임 결과 수신]', {
            game_id: data.game_id,
            game_no: data.game_no,
            game_daily_no: data.game_daily_no,
            game_status: data.game_status,
            result_winner: data.result_winner
          })
          const payload = {
            game_id: data.game_id,
            game_no: data.game_no,
            game_daily_no: data.game_daily_no,
            game_datetime: data.game_datetime,
            game_status: data.game_status,
            player_card1: data.player_card1,
            player_card2: data.player_card2,
            player_card3: data.player_card3,
            banker_card1: data.banker_card1,
            banker_card2: data.banker_card2,
            banker_card3: data.banker_card3,
            player_pair: data.player_pair,
            banker_pair: data.banker_pair,
            result_winner: data.result_winner,
            gameType,
            insert_datetime: data.insert_datetime,
          }

          api.post('/game-rounds/save-result', payload)
            .then((response) => {
              console.log(`[게임 결과 저장 성공] 회차: ${payload.game_daily_no || payload.game_no}, 결과: ${payload.result_winner}`)
            })
            .catch((error) => {
              console.error(`[게임 결과 저장 실패] 회차: ${payload.game_daily_no || payload.game_no}`, error)
              // 저장 실패는 무시 (게임 진행에는 영향 없음)
            })
        }
      } catch {
        // 에러는 무시
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [gameType])

  // 마카오 바카라 게임 URL (exchangetrade.cc에서 제공)
  const gameUrl = 'https://exchangetrade.cc/game/baccarat/?game_table=baccarat_m'
  
  // iframe 로드 상태 관리
  useEffect(() => {
    const iframe = document.getElementById('baccarat-embed')
    if (!iframe) return
    
    let loadTimeout
    let checkInterval
    let isLoaded = false
    
    // iframe이 로드되면 로딩 상태 해제
    const checkLoad = () => {
      if (isLoaded) return
      
      // iframe이 로드되었는지 확인
      try {
        // iframe의 contentWindow에 접근 가능한지 확인
        if (iframe.contentWindow) {
          isLoaded = true
          setIframeLoading(false)
          setIframeError(false)
          if (checkInterval) clearInterval(checkInterval)
          if (loadTimeout) clearTimeout(loadTimeout)
        }
      } catch (e) {
        // CORS 오류는 정상 (외부 사이트이므로)
        // iframe load 이벤트가 발생하면 로딩 완료로 간주
        isLoaded = true
        setIframeLoading(false)
        setIframeError(false)
        if (checkInterval) clearInterval(checkInterval)
        if (loadTimeout) clearTimeout(loadTimeout)
      }
    }
    
    // iframe load 이벤트 리스너
    iframe.addEventListener('load', checkLoad)
    
    // 5초 후에도 로딩 중이면 강제로 로딩 상태 해제 (이미지 로딩 실패는 무시)
    loadTimeout = setTimeout(() => {
      if (!isLoaded) {
        // 이미지 로딩 실패는 게임 기능에 영향을 주지 않으므로 로딩 완료로 처리
        isLoaded = true
        setIframeLoading(false)
        setIframeError(false)
        if (checkInterval) clearInterval(checkInterval)
      }
    }, 5000)
    
    // 주기적으로 iframe 로드 상태 확인 (1초마다)
    checkInterval = setInterval(() => {
      if (isLoaded) {
        clearInterval(checkInterval)
        return
      }
      try {
        if (iframe.contentWindow && iframe.contentDocument) {
          checkLoad()
        }
      } catch (e) {
        // CORS 오류는 무시
      }
    }, 1000)
    
    return () => {
      if (loadTimeout) clearTimeout(loadTimeout)
      if (checkInterval) clearInterval(checkInterval)
      iframe.removeEventListener('load', checkLoad)
    }
  }, [])

  // 포인트 조회
  const fetchUserPoints = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await api.get('/auth/me')
      if (response.data) {
        setUserPoints(response.data.points || 0)
      }
    } catch (error) {
      console.error('포인트 조회 실패:', error)
    }
  }, [])

  // 게임 정보 조회
  const fetchGameInfo = useCallback(async () => {
    try {
      // 게임 ID 생성 (실제로는 API에서 받아와야 함)
      const newGameId = `${Date.now()}`
      setGameId(newGameId)
      
      // 라운드 생성
      if (isLoggedIn && currentRound) {
        await api.post('/game-rounds', {
          roundId: currentRound,
          gameType
        }).catch(err => console.error('라운드 생성 실패:', err))
      }
    } catch (error) {
      console.error('게임 정보 조회 실패:', error)
    }
  }, [isLoggedIn, currentRound, gameType])


  // 나의 베팅 내역 조회
  const fetchMyBettingList = useCallback(async () => {
    if (!isLoggedIn) {
      setMyBettingList([])
      return
    }
    
    try {
      const response = await api.get('/bets/my', {
        params: { gameType, limit: 100 } // 더 많은 배팅 내역 조회
      })
      // 배팅 데이터에 회차 정보 추가
      const betsWithRound = (response.data.bets || []).map(bet => {
        // roundId에서 회차 추출
        let roundNumber = null
        if (bet.roundId) {
          // roundId 형식: speed-baccarat-1-round-1210
          const match = bet.roundId.match(/round-(\d+)/)
          if (match) {
            roundNumber = parseInt(match[1])
          } else {
            // roundId가 타임스탬프 기반이면 배팅 시점의 게임 회차 계산
            const betDate = new Date(bet.createdAt)
            const startOfDay = new Date(betDate.getFullYear(), betDate.getMonth(), betDate.getDate())
            const minutesSinceStart = Math.floor((betDate - startOfDay) / 1000 / 60)
            roundNumber = minutesSinceStart + 1
          }
        }
        return {
          ...bet,
          roundNumber
        }
      })
      setMyBettingList(betsWithRound)
    } catch (error) {
      console.error('베팅 내역 조회 실패:', error)
      if (error.response?.status === 401) {
        // 인증 오류 시 빈 배열로 설정
        setMyBettingList([])
      } else {
        // 기타 오류도 빈 배열로 설정하여 로딩 상태 해제
        setMyBettingList([])
      }
    }
  }, [gameType, isLoggedIn])

  // 자동 정산 결과를 유저 화면에 반영하기 위해 주기적으로 포인트/내 배팅 내역 새로고침
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(() => {
      fetchUserPoints()
      fetchMyBettingList()
    }, 5000) // 5초마다 갱신

    return () => clearInterval(interval)
  }, [isLoggedIn, fetchUserPoints, fetchMyBettingList])

   useEffect(() => {
    if (isLoggedIn) {
      fetchUserPoints()
      // 회차 기반으로 라운드 ID 생성 (게임 정보 시뮬레이션과 동일한 로직)
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const minutesSinceStart = Math.floor((now - startOfDay) / 1000 / 60)
      const currentRoundNumber = minutesSinceStart + 1
      const roundId = `${gameType}-round-${currentRoundNumber}`
      setCurrentRound(roundId)
    }
  }, [isLoggedIn, fetchUserPoints, gameType])

  useEffect(() => {
    if (currentRound) {
      fetchGameInfo()
    }
  }, [currentRound, fetchGameInfo])


  useEffect(() => {
    fetchMyBettingList()
  }, [fetchMyBettingList])

  // 배팅 내역이 변경되면 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1)
  }, [myBettingList.length])

  // 타이머 (베팅 시간 카운트다운)
  useEffect(() => {
    let interval
    if (timerSeconds > 0) {
      const minutes = Math.floor(timerSeconds / 60)
      const seconds = timerSeconds % 60
      setTimer(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      
      // 타이머 바 너비 계산 (60초 기준, 최대 100%)
      const maxSeconds = 60
      const width = Math.min((timerSeconds / maxSeconds) * 100, 100)
      setTimerBarWidth(width)
      
      // 10초 이하일 때 배팅 불가
      if (timerSeconds <= 10) {
        setBetStatus('베팅 종료')
      } else if (timerSeconds > 10 && betStatus === '베팅 종료') {
        setBetStatus('베팅 가능')
      }
      
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimer('--')
            setBetStatus('베팅 종료')
            setTimerBarWidth(0)
            
            // 타이머가 0이 되면 20초 후에 자동으로 게임 결과 처리 시도
            // 타이머 종료 시점의 회차를 계산하여 다음 회차를 정산
            const now = new Date()
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            const minutesSinceStart = Math.floor((now - startOfDay) / 1000 / 60)
            const timerEndRoundNumber = minutesSinceStart
            
            // 정산할 회차는 타이머 종료 시점의 회차 + 1 (다음 회차)
            const settleRoundNumber = timerEndRoundNumber + 1
            const roundToSettle = `${gameType}-round-${settleRoundNumber}`
            
            console.log('⏰ 타이머 종료 시점 회차:', timerEndRoundNumber, '→ 정산할 회차:', settleRoundNumber)
            console.log('⏰ 타이머 종료, 20초 후 자동 정산 시작 - 라운드 ID:', roundToSettle)
            
            if (handleAutoSettleRef.current && roundToSettle) {
              // 20초 지연 후 자동 정산 시작
              setTimeout(() => {
                if (handleAutoSettleRef.current) {
                  console.log('🔄 handleAutoSettle 호출 (타이머 종료 후 20초)')
                  console.log('📊 정산할 회차:', settleRoundNumber, '라운드 ID:', roundToSettle)
                  handleAutoSettleRef.current(roundToSettle)
                } else {
                  console.warn('⚠️ handleAutoSettleRef.current가 null입니다')
                }
              }, 20000) // 20초 지연
            } else {
              console.warn('⚠️ 자동 정산 불가: handleAutoSettleRef 또는 roundToSettle이 없습니다')
            }
            
            return 0
          }
          const newSeconds = prev - 1
          const newMinutes = Math.floor(newSeconds / 60)
          const newSecs = newSeconds % 60
          setTimer(`${String(newMinutes).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`)
          
          // 타이머 바 업데이트
          const width = Math.min((newSeconds / 60) * 100, 100)
          setTimerBarWidth(width)
          
          // 10초 이하일 때 배팅 불가
          if (newSeconds <= 10) {
            setBetStatus('베팅 종료')
          }
          
          return newSeconds
        })
      }, 1000)
    } else {
      setTimer('--')
      setTimerBarWidth(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timerSeconds, betStatus])
  
  // 바카라 카드 점수 계산 함수 (일반 함수로 정의하여 호이스팅 문제 방지)
  const calculateBaccaratScore = (cards) => {
    if (!cards || cards.length === 0) return 0
    let total = 0
    cards.forEach(card => {
      // 카드 형식: "s6", "h11", "d5" 등 (suit + value)
      const value = parseInt(card.replace(/[^0-9]/g, '')) || 0
      // 10, J, Q, K는 0점
      if (value >= 10) {
        total += 0
      } else {
        total += value
      }
    })
    return total % 10
  }
  
  // 자동 정산 처리 (타이머가 0이 되었을 때)
  const handleAutoSettleRef = useRef(null)
  const handleAutoSettle = useCallback(async (roundIdToSettle) => {
    const roundId = roundIdToSettle || currentRound
    if (!roundId) {
      console.log('자동 정산: 라운드 ID가 없습니다.')
      return
    }
    
    try {
      console.log('⏰ 자동 정산 시작:', roundId)
      
      // 타이머가 0이 되었을 때는 이전 회차의 결과를 처리해야 함
      // 라운드 ID에서 회차 추출
      let currentRoundNumber = null
      const roundIdMatch = roundId.match(/round-(\d+)$/)
      if (roundIdMatch) {
        currentRoundNumber = parseInt(roundIdMatch[1])
      } else {
        // 라운드 ID에 회차가 없으면 현재 시간 기반으로 계산
        const now = new Date()
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const minutesSinceStart = Math.floor((now - startOfDay) / 1000 / 60)
        currentRoundNumber = minutesSinceStart
      }
      
      console.log('📊 처리할 회차:', currentRoundNumber, '라운드 ID:', roundId)
      
      // postMessage로 결과를 받을 때까지 최대 10초 대기
      let gameResultReceived = false
      const waitForResult = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null)
        }, 10000) // 10초 대기
        
        // postMessage로 결과가 오면 resolve
        const messageHandler = (event) => {
          try {
            let data = event.data
            
            // 문자열인 경우 파싱
            if (typeof data === 'string') {
              try {
                data = JSON.parse(data)
              } catch (e) {
                return
              }
            }
            
            if (data && typeof data === 'object') {
              // 게임 결과 데이터인지 확인
              const hasGameData = data.game_id || data.game_no || data.game_status || data.game_daily_no
              
              if (hasGameData) {
                // 회차 매칭 확인 (game_daily_no 우선, 없으면 game_no)
                const resultRound = data.game_daily_no || data.game_no
                const isMatchingRound = resultRound === String(currentRoundNumber) || 
                                       resultRound === currentRoundNumber ||
                                       parseInt(resultRound) === currentRoundNumber
                
                // 게임 상태가 '완료'인 경우만 처리
                const isCompleted = data.game_status === '완료' || 
                                   data.game_status === 'finished' || 
                                   data.game_status === 'complete'
                
                // 완료된 게임 결과는 항상 캐시에 저장
                if (isCompleted && resultRound) {
                  const roundKey = String(resultRound)
                  gameResultsCacheRef.current.set(roundKey, data)
                  console.log(`💾 게임 결과 캐시 저장 (회차 ${roundKey}):`, data)
                }
                
                if (isMatchingRound && isCompleted) {
                  console.log('✅✅✅ 매칭되는 게임 결과 발견:', data)
                  clearTimeout(timeout)
                  window.removeEventListener('message', messageHandler)
                  gameResultReceived = true
                  resolve(data)
                } else {
                  console.log('ℹ️ 게임 결과는 있지만 회차/상태가 맞지 않음:', {
                    resultRound,
                    currentRoundNumber,
                    isMatchingRound,
                    isCompleted,
                    game_status: data.game_status
                  })
                }
              }
            }
          } catch (error) {
            console.error('❌ 메시지 핸들러 에러:', error)
          }
        }
        
        window.addEventListener('message', messageHandler)
        
        // timeout이 끝나면 리스너 제거
        setTimeout(() => {
          window.removeEventListener('message', messageHandler)
        }, 10000)
      })
      
      const gameResult = await waitForResult
      console.log('📥 게임 결과 수신 상태:', gameResult ? '성공' : '실패', gameResult)
      
      let result = null
      let playerCards = []
      let bankerCards = []
      let playerScore = null
      let bankerScore = null
      
      // gameResult가 없어도 캐시에서 먼저 확인
      if (!gameResult) {
        console.log('🔍 postMessage로 결과를 받지 못함, 캐시에서 즉시 조회...')
        // 캐시의 모든 항목 확인 (최근 10개 회차)
        const cacheEntries = Array.from(gameResultsCacheRef.current.entries())
        // 회차 번호로 정렬 (내림차순)
        cacheEntries.sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
        
        // 최근 10개 항목 확인
        for (let i = 0; i < Math.min(10, cacheEntries.length); i++) {
          const [roundKey, cachedData] = cacheEntries[i]
          if (cachedData && cachedData.result_winner && 
              (cachedData.game_status === '완료' || cachedData.game_status === 'finished' || cachedData.game_status === 'complete')) {
            console.log(`✅ 캐시에서 완료된 게임 결과 발견 (회차 ${roundKey}):`, cachedData)
            
            // 해당 회차에 배팅이 있는지 확인하고 바로 결과 처리
            const cachedRoundNumber = parseInt(roundKey)
            const cachedRoundId = `${gameType}-round-${cachedRoundNumber}`
            
            try {
              // 게임 결과 데이터를 먼저 저장
              try {
                await api.post('/game-rounds/save-result', {
                  game_id: cachedData.game_id,
                  game_no: cachedData.game_no,
                  game_daily_no: cachedData.game_daily_no,
                  game_datetime: cachedData.game_datetime,
                  game_status: cachedData.game_status,
                  player_card1: cachedData.player_card1,
                  player_card2: cachedData.player_card2,
                  player_card3: cachedData.player_card3,
                  banker_card1: cachedData.banker_card1,
                  banker_card2: cachedData.banker_card2,
                  banker_card3: cachedData.banker_card3,
                  player_pair: cachedData.player_pair,
                  banker_pair: cachedData.banker_pair,
                  result_winner: cachedData.result_winner,
                  gameType: gameType,
                  insert_datetime: cachedData.insert_datetime
                })
                console.log('✅ 게임 결과 저장 완료 (회차:', roundKey, ')')
              } catch (saveError) {
                console.error('게임 결과 저장 실패 (처리는 계속 진행):', saveError)
              }
              
              // 게임 결과 데이터를 서버로 전송하여 처리
              try {
                const processResponse = await api.post('/game-rounds/process-result', {
                  game_id: cachedData.game_id,
                  game_no: cachedData.game_no,
                  game_daily_no: cachedData.game_daily_no,
                  game_datetime: cachedData.game_datetime,
                  game_status: cachedData.game_status,
                  player_card1: cachedData.player_card1,
                  player_card2: cachedData.player_card2,
                  player_card3: cachedData.player_card3,
                  banker_card1: cachedData.banker_card1,
                  banker_card2: cachedData.banker_card2,
                  banker_card3: cachedData.banker_card3,
                  player_pair: cachedData.player_pair,
                  banker_pair: cachedData.banker_pair,
                  result_winner: cachedData.result_winner,
                  gameType: gameType
                })
                
                console.log('✅ 게임 결과 처리 완료 (배팅한 회차만 처리됨):', processResponse.data)
                
                // 포인트 및 배팅 내역 갱신
                await fetchUserPoints()
                await fetchMyBettingList()
                
                // 결과 처리가 완료되었으므로 바로 return하여 중복 처리 방지
                return
              } catch (processError) {
                console.error('❌ 게임 결과 처리 API 호출 실패:', processError)
                // 에러가 발생해도 기존 로직으로 계속 진행
              }
              
              // result_winner 추출 (로컬 변수에도 저장)
              const winner = String(cachedData.result_winner).toLowerCase().trim()
              if (winner === 'player' || winner === '플레이어') {
                result = 'player'
              } else if (winner === 'banker' || winner === '뱅커') {
                result = 'banker'
              } else if (winner === 'tie' || winner === '타이') {
                result = 'tie'
              }
              
              if (result) {
                // 카드 정보 수집
                if (cachedData.player_card1) playerCards.push(cachedData.player_card1)
                if (cachedData.player_card2) playerCards.push(cachedData.player_card2)
                if (cachedData.player_card3) playerCards.push(cachedData.player_card3)
                
                if (cachedData.banker_card1) bankerCards.push(cachedData.banker_card1)
                if (cachedData.banker_card2) bankerCards.push(cachedData.banker_card2)
                if (cachedData.banker_card3) bankerCards.push(cachedData.banker_card3)
                
                // 점수 계산
                if (playerCards.length > 0) {
                  playerScore = calculateBaccaratScore(playerCards)
                }
                if (bankerCards.length > 0) {
                  bankerScore = calculateBaccaratScore(bankerCards)
                }
                
                console.log('✅ 캐시에서 결과 추출 및 처리 완료:', result, '회차:', roundKey)
                break
              }
            } catch (error) {
              console.error('❌ 게임 결과 처리 실패:', error)
              // 에러가 발생해도 계속 진행
            }
          }
        }
      }
      
      if (gameResult && (gameResult.game_status === '완료' || gameResult.game_status === 'finished' || gameResult.game_status === 'complete')) {
        // postMessage로 받은 결과 사용 - 바로 결과 처리 API 호출
        console.log('✅ postMessage로 게임 결과 수신, 바로 처리 시작:', gameResult)
        
        try {
          // 게임 결과 데이터를 먼저 저장
          try {
            await api.post('/game-rounds/save-result', {
              game_id: gameResult.game_id,
              game_no: gameResult.game_no,
              game_daily_no: gameResult.game_daily_no,
              game_datetime: gameResult.game_datetime,
              game_status: gameResult.game_status,
              player_card1: gameResult.player_card1,
              player_card2: gameResult.player_card2,
              player_card3: gameResult.player_card3,
              banker_card1: gameResult.banker_card1,
              banker_card2: gameResult.banker_card2,
              banker_card3: gameResult.banker_card3,
              player_pair: gameResult.player_pair,
              banker_pair: gameResult.banker_pair,
              result_winner: gameResult.result_winner,
              gameType: gameType,
              insert_datetime: gameResult.insert_datetime
            })
            console.log('✅ 게임 결과 저장 완료 (회차:', gameResult.game_daily_no, ')')
          } catch (saveError) {
            console.error('게임 결과 저장 실패 (처리는 계속 진행):', saveError)
          }
          
          // 게임 결과 데이터를 서버로 전송하여 처리 (배팅한 회차만 처리됨)
          try {
            const processResponse = await api.post('/game-rounds/process-result', {
              game_id: gameResult.game_id,
              game_no: gameResult.game_no,
              game_daily_no: gameResult.game_daily_no,
              game_datetime: gameResult.game_datetime,
              game_status: gameResult.game_status,
              player_card1: gameResult.player_card1,
              player_card2: gameResult.player_card2,
              player_card3: gameResult.player_card3,
              banker_card1: gameResult.banker_card1,
              banker_card2: gameResult.banker_card2,
              banker_card3: gameResult.banker_card3,
              player_pair: gameResult.player_pair,
              banker_pair: gameResult.banker_pair,
              result_winner: gameResult.result_winner,
              gameType: gameType
            })
            
            console.log('✅ 게임 결과 처리 완료 (배팅한 회차만 처리됨):', processResponse.data)
            
            // 포인트 및 배팅 내역 갱신
            await fetchUserPoints()
            await fetchMyBettingList()
            
            console.log('✅ postMessage 결과 처리 완료, 다음 단계로 진행')
            // 결과 처리가 완료되었으므로 바로 return하여 중복 처리 방지
            return
          } catch (processError) {
            console.error('❌ 게임 결과 처리 API 호출 실패:', processError)
            // 에러가 발생해도 기존 로직으로 계속 진행
          }
          
          // result_winner 추출 (로컬 변수에도 저장)
          if (gameResult.result_winner) {
            const winner = String(gameResult.result_winner).toLowerCase().trim()
            if (winner === 'player' || winner === '플레이어') {
              result = 'player'
            } else if (winner === 'banker' || winner === '뱅커') {
              result = 'banker'
            } else if (winner === 'tie' || winner === '타이') {
              result = 'tie'
            }
          }
          
          // process-result API가 성공적으로 호출되었으므로 바로 return
          // (포인트 및 배팅 내역 갱신은 process-result API 내부에서 이미 처리됨)
          return
        } catch (error) {
          console.error('❌ 게임 결과 처리 실패:', error)
          // 에러가 발생해도 기존 로직으로 계속 진행
        }
      }
      
      // postMessage로 결과를 받지 못했거나 결과가 없으면 캐시에서 조회
      if (!result) {
        console.warn('⚠️⚠️⚠️ postMessage로 결과를 받지 못함, 캐시에서 조회 시도...')
        console.warn('⚠️ 게임 결과 데이터:', gameResult)
        console.warn('⚠️ 회차:', currentRoundNumber, '라운드 ID:', roundId)
        
        // 캐시에서 현재 회차 결과 조회
        const cachedResult = gameResultsCacheRef.current.get(String(currentRoundNumber))
        if (cachedResult) {
          console.log('✅ 캐시에서 게임 결과 발견:', cachedResult)
          
          // 캐시된 결과에서 추출
          if (cachedResult.result_winner) {
            const winner = String(cachedResult.result_winner).toLowerCase().trim()
            if (winner === 'player' || winner === '플레이어') {
              result = 'player'
            } else if (winner === 'banker' || winner === '뱅커') {
              result = 'banker'
            } else if (winner === 'tie' || winner === '타이') {
              result = 'tie'
            }
          }
          
          if (!result && cachedResult.game_result) {
            const resultText = String(cachedResult.game_result).toUpperCase()
            if (resultText.includes('PLAYER') || resultText.includes('플레이어')) {
              result = 'player'
            } else if (resultText.includes('BANKER') || resultText.includes('뱅커')) {
              result = 'banker'
            } else if (resultText.includes('TIE') || resultText.includes('타이')) {
              result = 'tie'
            }
          }
          
          // 카드 정보 수집
          if (cachedResult.player_card1) playerCards.push(cachedResult.player_card1)
          if (cachedResult.player_card2) playerCards.push(cachedResult.player_card2)
          if (cachedResult.player_card3) playerCards.push(cachedResult.player_card3)
          
          if (cachedResult.banker_card1) bankerCards.push(cachedResult.banker_card1)
          if (cachedResult.banker_card2) bankerCards.push(cachedResult.banker_card2)
          if (cachedResult.banker_card3) bankerCards.push(cachedResult.banker_card3)
          
          // 점수 계산
          if (playerCards.length > 0) {
            playerScore = calculateBaccaratScore(playerCards)
          }
          if (bankerCards.length > 0) {
            bankerScore = calculateBaccaratScore(bankerCards)
          }
          
          // 점수로 결과 추출
          if (!result && playerScore !== null && bankerScore !== null) {
            if (playerScore > bankerScore) result = 'player'
            else if (bankerScore > playerScore) result = 'banker'
            else result = 'tie'
          }
          
          console.log('✅ 캐시에서 결과 추출 성공:', result)
        } else {
          // 캐시의 모든 항목 확인 (최근 완료된 게임 결과 찾기)
          console.log('🔍 캐시 전체 검색 중...')
          const cacheEntries = Array.from(gameResultsCacheRef.current.entries())
          // 회차 번호로 정렬 (내림차순 - 최신순)
          cacheEntries.sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
          
          let foundResult = null
          // 최근 20개 항목 확인
          for (let i = 0; i < Math.min(20, cacheEntries.length); i++) {
            const [roundKey, cachedData] = cacheEntries[i]
            if (cachedData && cachedData.result_winner && 
                (cachedData.game_status === '완료' || cachedData.game_status === 'finished' || cachedData.game_status === 'complete')) {
              foundResult = cachedData
              console.log(`✅ 캐시에서 완료된 게임 결과 발견 (회차 ${roundKey}):`, foundResult)
              break
            }
          }
          
          if (foundResult) {
            // 캐시된 결과에서 추출
            const winner = String(foundResult.result_winner).toLowerCase().trim()
            if (winner === 'player' || winner === '플레이어') {
              result = 'player'
            } else if (winner === 'banker' || winner === '뱅커') {
              result = 'banker'
            } else if (winner === 'tie' || winner === '타이') {
              result = 'tie'
            }
            
            // 카드 정보 수집
            if (foundResult.player_card1) playerCards.push(foundResult.player_card1)
            if (foundResult.player_card2) playerCards.push(foundResult.player_card2)
            if (foundResult.player_card3) playerCards.push(foundResult.player_card3)
            
            if (foundResult.banker_card1) bankerCards.push(foundResult.banker_card1)
            if (foundResult.banker_card2) bankerCards.push(foundResult.banker_card2)
            if (foundResult.banker_card3) bankerCards.push(foundResult.banker_card3)
            
            // 점수 계산
            if (playerCards.length > 0) {
              playerScore = calculateBaccaratScore(playerCards)
            }
            if (bankerCards.length > 0) {
              bankerScore = calculateBaccaratScore(bankerCards)
            }
            
            console.log('✅ 캐시에서 결과 추출 성공:', result)
          } else {
            console.warn('⚠️ 캐시에도 결과가 없습니다. 재시도 중...')
            
            // 추가 대기 시간 후 다시 확인 (최대 2회 시도, 3초 → 2초로 단축)
            let retryCount = 0
            const maxRetries = 2
            
            while (retryCount < maxRetries && !result) {
              retryCount++
              console.log(`🔄 재시도 ${retryCount}/${maxRetries}...`)
              
              // 2초 대기 후 다시 확인
              await new Promise(resolve => setTimeout(resolve, 2000))
              
              // 최근 회차들 다시 확인
              for (let offset = 0; offset <= 2; offset++) {
                const checkRound1 = String(parseInt(currentRoundNumber) + offset)
                const checkRound2 = String(parseInt(currentRoundNumber) - offset)
                
                const retryCached1 = gameResultsCacheRef.current.get(checkRound1)
                const retryCached2 = gameResultsCacheRef.current.get(checkRound2)
                
                const retryCachedResult = retryCached1 || retryCached2
                if (retryCachedResult && retryCachedResult.result_winner) {
                  const winner = String(retryCachedResult.result_winner).toLowerCase().trim()
                  if (winner === 'player' || winner === '플레이어') {
                    result = 'player'
                  } else if (winner === 'banker' || winner === '뱅커') {
                    result = 'banker'
                  } else if (winner === 'tie' || winner === '타이') {
                    result = 'tie'
                  }
                  
                  if (result) {
                    console.log('✅ 재시도로 캐시에서 결과 발견:', result)
                    break
                  }
                }
              }
              
              if (result) break
            }
          }
        }
        
        // 모든 시도 후에도 결과를 받지 못하면 중단
        if (!result) {
          console.error('❌❌❌ 모든 시도 실패, 자동 정산 중단')
          console.error('❌ 관리자가 수동으로 결과를 입력해야 합니다.')
          // alert 제거: 사용자에게 메시지창 표시하지 않음
          // alert(`게임 결과를 자동으로 받아오지 못했습니다.\n회차 ${currentRoundNumber}의 결과는 관리자가 수동으로 입력해야 합니다.`)
          return // 자동 정산 중단
        }
      }
      
      console.log('✅✅✅ 게임 결과 추출 성공:', result)
      console.log('🎲 게임 결과 처리 시작:', result, '회차:', currentRoundNumber)
      
      // 게임 결과 처리 API 호출
      const response = await api.post(`/game-rounds/${roundId}/result`, {
        result,
        gameType,
        roundNumber: currentRoundNumber,
        playerCards: playerCards,
        bankerCards: bankerCards,
        playerScore: playerScore,
        bankerScore: bankerScore
      })
      
      console.log('✅ 게임 결과 처리 완료:', response.data)
      
      // 포인트 및 배팅 내역 갱신
      await fetchUserPoints()
      await fetchMyBettingList()
      
      // 다음 라운드 준비 (다음 회차 기반)
      const nextRoundNumber = currentRoundNumber + 1
      const nextRoundId = `${gameType}-round-${nextRoundNumber}`
      setCurrentRound(nextRoundId)
      
      console.log('🔄 자동 정산 완료, 다음 라운드:', nextRoundId)
    } catch (error) {
      console.error('❌ 자동 정산 실패:', error)
      console.error('❌ 에러 상세:', error.response?.data || error.message)
      
      // 에러가 발생해도 다음 라운드로 진행
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const minutesSinceStart = Math.floor((now - startOfDay) / 1000 / 60)
      const nextRoundNumber = minutesSinceStart + 1
      const nextRoundId = `${gameType}-round-${nextRoundNumber}`
      setCurrentRound(nextRoundId)
    }
  }, [currentRound, gameType, fetchUserPoints, fetchMyBettingList])
  
  // handleAutoSettle을 ref에 저장
  useEffect(() => {
    handleAutoSettleRef.current = handleAutoSettle
  }, [handleAutoSettle])
  
  // 타이머 종료 시점의 회차를 저장하기 위한 ref
  const timerEndRoundRef = useRef(null)
  
  // 주기적으로 게임 결과 확인 (타이머가 0이 되었을 때)
  useEffect(() => {
    if (timerSeconds === 0 && handleAutoSettleRef.current) {
      // 타이머 종료 시점의 현재 회차 계산
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const minutesSinceStart = Math.floor((now - startOfDay) / 1000 / 60)
      const timerEndRoundNumber = minutesSinceStart
      
      // 타이머 종료 시점의 회차 저장
      timerEndRoundRef.current = timerEndRoundNumber
      
      // 정산할 회차는 타이머 종료 시점의 회차 + 1 (다음 회차)
      const settleRoundNumber = timerEndRoundNumber + 1
      const roundIdToSettle = `${gameType}-round-${settleRoundNumber}`
      
      console.log('⏰ 타이머 종료 시점 회차:', timerEndRoundNumber, '→ 정산할 회차:', settleRoundNumber)
      console.log('⏰ 타이머 종료, 20초 후 자동 정산 시작:', roundIdToSettle)
      
      // 20초 지연 후 자동 정산 (게임 결과가 생성될 시간을 줌)
      const timeoutId = setTimeout(() => {
        if (handleAutoSettleRef.current) {
          console.log('🔄 handleAutoSettle 호출 (타이머 종료 후 20초)')
          console.log('📊 정산할 회차:', settleRoundNumber, '라운드 ID:', roundIdToSettle)
          handleAutoSettleRef.current(roundIdToSettle)
        }
      }, 20000) // 20초 후 정산
      
      return () => clearTimeout(timeoutId)
    }
  }, [timerSeconds, gameType])

  // 게임 결과 처리
  const handleGameResultRef = useRef(null)
  const handleGameResult = useCallback(async (data) => {
    try {
      const { result, roundId } = data
      if (!result || !['player', 'banker', 'tie', 'player-pair', 'banker-pair'].includes(result)) return

      const targetRoundId = roundId || currentRound
      if (!targetRoundId) return

      await api.post(`/game-rounds/${targetRoundId}/result`, {
        result,
        playerCards: data.playerCards,
        bankerCards: data.bankerCards,
        playerScore: data.playerScore,
        bankerScore: data.bankerScore
      })

      await fetchUserPoints()
      await fetchMyBettingList()
      setBetAmounts({ pp: 0, p: 0, t: 0, b: 0, bp: 0 })
      setTotalBetAmount(0)
    } catch (error) {
      console.error('게임 결과 처리 실패:', error)
    }
  }, [currentRound, fetchUserPoints, fetchMyBettingList])

  // handleGameResult를 ref에 저장
  useEffect(() => {
    handleGameResultRef.current = handleGameResult
  }, [handleGameResult])

  // 게임 결과창에서 결과 파싱 (#history 구조 기반)
  // 히스토리 부분을 주기적으로 조회하여 최신 결과를 가져옴
  const parseGameResult = useCallback(() => {
    try {
      const iframe = document.getElementById('baccarat-embed')
      if (!iframe) {
        return null
      }
      
      let iframeDoc = null
      try {
        iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      } catch (e) {
        // CORS 오류는 정상적인 동작이므로 로그 출력 안 함
        return null
      }
      
      if (!iframeDoc) {
        console.log('iframe document를 찾을 수 없습니다.')
        return null
      }
      
      // #history 요소 찾기
      const historyElement = iframeDoc.getElementById('history')
      if (!historyElement) {
        console.log('#history 요소를 찾을 수 없습니다.')
        return null
      }
      
      // 첫 번째 <li> 요소 찾기 (가장 최근 결과)
      const firstLi = historyElement.querySelector('ul > li:first-child')
      if (!firstLi) {
        console.log('결과 항목을 찾을 수 없습니다.')
        return null
      }
      
      // 회차 추출 (첫 번째 <dt>)
      const roundDt = firstLi.querySelector('dl > dt:first-child')
      if (!roundDt) {
        console.log('회차 정보를 찾을 수 없습니다.')
        return null
      }
      
      const roundText = roundDt.textContent.trim()
      const roundMatch = roundText.match(/(\d+)회/)
      if (!roundMatch) {
        console.log('회차 형식이 올바르지 않습니다:', roundText)
        return null
      }
      
      const roundNumber = parseInt(roundMatch[1])
      console.log('회차 발견:', roundNumber)
      
      // 결과 추출 (class가 red, blue, green인 <dt>)
      const resultDt = firstLi.querySelector('dt.red, dt.blue, dt.green')
      if (!resultDt) {
        console.log('결과 정보를 찾을 수 없습니다.')
        return null
      }
      
      const resultText = resultDt.textContent.trim().toUpperCase()
      let result = null
      
      if (resultText.includes('PLAYER WIN')) {
        result = 'player'
      } else if (resultText.includes('BANKER WIN')) {
        result = 'banker'
      } else if (resultText.includes('TIE')) {
        result = 'tie'
      }
      
      if (!result) {
        console.log('결과를 파싱할 수 없습니다:', resultText)
        return null
      }
      
      console.log('결과 발견:', result)
      
      // 점수 추출 (마지막 <dt>)
      const scoreDt = firstLi.querySelector('dl > dt:last-child')
      let playerScore = null
      let bankerScore = null
      
      if (scoreDt) {
        const scoreText = scoreDt.textContent.trim()
        const scoreMatch = scoreText.match(/(\d+)\/(\d+)/)
        if (scoreMatch) {
          playerScore = parseInt(scoreMatch[1])
          bankerScore = parseInt(scoreMatch[2])
          console.log('점수 발견:', playerScore, '/', bankerScore)
        }
      }
      
      // 카드 정보 추출 (선택사항)
      const playerCards = []
      const bankerCards = []
      
      const playerDd = firstLi.querySelector('dd.player')
      if (playerDd) {
        const playerCardImages = playerDd.querySelectorAll('img')
        playerCardImages.forEach(img => {
          const src = img.getAttribute('src') || ''
          // 카드 이미지 파일명에서 정보 추출 (예: img_card_s7.png -> s7)
          const cardMatch = src.match(/img_card_([a-z])(\d+)\.png/)
          if (cardMatch) {
            playerCards.push(`${cardMatch[1]}${cardMatch[2]}`)
          }
        })
      }
      
      const bankerDd = firstLi.querySelector('dd.banker')
      if (bankerDd) {
        const bankerCardImages = bankerDd.querySelectorAll('img')
        bankerCardImages.forEach(img => {
          const src = img.getAttribute('src') || ''
          const cardMatch = src.match(/img_card_([a-z])(\d+)\.png/)
          if (cardMatch) {
            bankerCards.push(`${cardMatch[1]}${cardMatch[2]}`)
          }
        })
      }
      
      if (roundNumber && result) {
        const gameResult = {
          round: roundNumber,
          result,
          playerCards,
          bankerCards,
          playerScore,
          bankerScore
        }
        console.log('게임 결과 파싱 성공:', gameResult)
        return gameResult
      }
      
      console.log('게임 결과 파싱 실패: 회차 또는 결과를 찾을 수 없음')
      return null
    } catch (error) {
      console.error('게임 결과 파싱 중 오류:', error)
      return null
    }
  }, [])
  
  // 처리된 결과 추적 (중복 처리 방지)
  const processedResultsRef = useRef(new Set())
  const lastProcessedRoundRef = useRef(null)
  const lastProcessedGameIdRef = useRef(null)
  
  // postMessage로 받은 게임 결과 처리
  const processGameResultFromMessage = useCallback(async (data) => {
    try {
      console.log('🎮 게임 결과 처리 시작:', data)
      
      // game_id 또는 game_no로 중복 확인
      const gameId = data.game_id || data.game_no || null
      if (gameId && lastProcessedGameIdRef.current === gameId) {
        console.log('⏭️ 이미 처리된 게임 ID:', gameId)
        return
      }
      
      // 게임 상태가 '완료'인 경우만 처리
      if (data.game_status !== '완료' && data.game_status !== 'finished' && data.game_status !== 'complete') {
        console.log('⏳ 게임이 아직 완료되지 않았습니다:', data.game_status)
        return
      }
      
      // 회차 추출 (game_daily_no 우선, 없으면 game_no)
      const roundNumber = data.game_daily_no || data.game_no || null
      if (!roundNumber) {
        console.warn('⚠️ 회차 정보가 없습니다:', data)
        return
      }
      
      console.log('📊 회차 정보:', roundNumber)
      
      // 결과 추출 - result_winner 필드 우선 확인
      let result = null
      
      // result_winner 필드 확인 (가장 우선)
      if (data.result_winner) {
        const winner = String(data.result_winner).toLowerCase().trim()
        if (winner === 'player') {
          result = 'player'
        } else if (winner === 'banker') {
          result = 'banker'
        } else if (winner === 'tie') {
          result = 'tie'
        }
      }
      
      // game_result 필드 확인
      if (!result && data.game_result) {
        const resultText = String(data.game_result).toUpperCase()
        if (resultText.includes('PLAYER') || resultText.includes('플레이어')) {
          result = 'player'
        } else if (resultText.includes('BANKER') || resultText.includes('뱅커')) {
          result = 'banker'
        } else if (resultText.includes('TIE') || resultText.includes('타이')) {
          result = 'tie'
        }
      }
      
      // winner 필드 확인
      if (!result && data.winner) {
        const winner = String(data.winner).toLowerCase().trim()
        if (winner === 'player' || winner.includes('player')) {
          result = 'player'
        } else if (winner === 'banker' || winner.includes('banker')) {
          result = 'banker'
        } else if (winner === 'tie' || winner.includes('tie')) {
          result = 'tie'
        }
      }
      
      // 카드 정보 수집
      const playerCards = []
      const bankerCards = []
      
      if (data.player_card1) playerCards.push(data.player_card1)
      if (data.player_card2) playerCards.push(data.player_card2)
      if (data.player_card3) playerCards.push(data.player_card3)
      
      if (data.banker_card1) bankerCards.push(data.banker_card1)
      if (data.banker_card2) bankerCards.push(data.banker_card2)
      if (data.banker_card3) bankerCards.push(data.banker_card3)
      
      // 점수 계산
      let playerScore = null
      let bankerScore = null
      
      if (playerCards.length > 0) {
        playerScore = calculateBaccaratScore(playerCards)
      } else if (data.player_score !== undefined) {
        playerScore = data.player_score
      }
      
      if (bankerCards.length > 0) {
        bankerScore = calculateBaccaratScore(bankerCards)
      } else if (data.banker_score !== undefined) {
        bankerScore = data.banker_score
      }
      
      // 점수로 결과 추출 (결과가 없고 점수가 있을 경우)
      if (!result && playerScore !== null && bankerScore !== null) {
        if (playerScore > bankerScore) {
          result = 'player'
        } else if (bankerScore > playerScore) {
          result = 'banker'
        } else {
          result = 'tie'
        }
        console.log('📊 점수로 결과 추출:', result, `(플레이어: ${playerScore}, 뱅커: ${bankerScore})`)
      }
      
      if (!result) {
        console.warn('⚠️ 결과를 추출할 수 없습니다. 데이터:', data)
        console.warn('⚠️ 사용 가능한 필드:', Object.keys(data))
        return
      }
      
      console.log('게임 결과 처리 시작 - 회차:', roundNumber, '결과:', result, '게임 ID:', gameId)
      console.log('플레이어 카드:', playerCards, '점수:', playerScore)
      console.log('뱅커 카드:', bankerCards, '점수:', bankerScore)
      
      // 라운드 ID 생성 (회차와 게임 타입 기반으로 고정)
      // 같은 회차는 같은 라운드 ID를 사용하여 중복 방지
      const targetRoundId = `${gameType}-round-${roundNumber}`
      console.log('🆔 라운드 ID:', targetRoundId)
      
      // 결과 처리 (회차 정보 포함)
      const response = await api.post(`/game-rounds/${targetRoundId}/result`, {
        result,
        gameType,
        roundNumber: roundNumber, // 회차 정보 전달
        playerCards: playerCards,
        bankerCards: bankerCards,
        playerScore: playerScore,
        bankerScore: bankerScore
      })
      
      console.log('게임 결과 처리 완료:', response.data)
      
      // 처리된 게임 ID 기록
      if (gameId) {
        lastProcessedGameIdRef.current = gameId
      }
      if (roundNumber) {
        lastProcessedRoundRef.current = roundNumber
      }
      
      // 포인트 및 배팅 내역 갱신
      await fetchUserPoints()
      await fetchMyBettingList()
      
      // 다음 라운드 준비 (다음 회차 기반)
      const nextRoundNumber = parseInt(roundNumber) + 1
      const nextRoundId = `${gameType}-round-${nextRoundNumber}`
      setCurrentRound(nextRoundId)
      
      console.log('🔄 다음 라운드 준비 완료:', nextRoundId)
    } catch (error) {
      console.error('❌ 게임 결과 처리 실패:', error)
      console.error('❌ 에러 상세:', error.response?.data || error.message)
      console.error('❌ 에러 스택:', error.stack)
    }
  }, [currentRound, gameType, fetchUserPoints, fetchMyBettingList])
  
  // processGameResultFromMessage를 ref에 저장
  const processGameResultFromMessageRef = useRef(null)
  useEffect(() => {
    processGameResultFromMessageRef.current = processGameResultFromMessage
    console.log('✅ processGameResultFromMessageRef 설정 완료')
  }, [processGameResultFromMessage])
  
  // 게임 결과 모니터링 및 처리 (히스토리 조회 기반)
  useEffect(() => {
    console.log('게임 결과 모니터링 시작 (히스토리 조회 기반)')
    
    // 주기적으로 히스토리 부분을 조회하여 최신 결과를 가져옴
    const checkHistoryResult = () => {
      try {
        const iframe = document.getElementById('baccarat-embed')
        if (!iframe) {
          return
        }
        
        let iframeDoc = null
        try {
          iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        } catch (e) {
          // CORS 오류는 정상적인 동작이므로 로그 출력 안 함
          return
        }
        
        if (!iframeDoc) {
          return
        }
        
        // #history 요소 찾기
        const historyElement = iframeDoc.getElementById('history')
        if (!historyElement) {
          return
        }
        
        // 첫 번째 <li> 요소 찾기 (가장 최근 결과)
        const firstLi = historyElement.querySelector('ul > li:first-child')
        if (!firstLi) {
          return
        }
        
        // 회차 추출 (첫 번째 <dt>)
        const roundDt = firstLi.querySelector('dl > dt:first-child')
        if (!roundDt) {
          return
        }
        
        const roundText = roundDt.textContent.trim()
        const roundMatch = roundText.match(/(\d+)회/)
        if (!roundMatch) {
          return
        }
        
        const roundNumber = parseInt(roundMatch[1])
        
        // 이미 처리된 회차인지 확인
        if (lastProcessedRoundRef.current === roundNumber) {
          return
        }
        
        // 결과 추출 (class가 red, blue, green인 <dt>)
        const resultDt = firstLi.querySelector('dt.red, dt.blue, dt.green')
        if (!resultDt) {
          return
        }
        
        const resultText = resultDt.textContent.trim().toUpperCase()
        let result = null
        
        if (resultText.includes('PLAYER WIN')) {
          result = 'player'
        } else if (resultText.includes('BANKER WIN')) {
          result = 'banker'
        } else if (resultText.includes('TIE')) {
          result = 'tie'
        }
        
        if (!result) {
          return
        }
        
        // 카드 정보 추출
        const playerCards = []
        const bankerCards = []
        
        const playerDd = firstLi.querySelector('dd.player')
        if (playerDd) {
          const playerCardImages = playerDd.querySelectorAll('img')
          playerCardImages.forEach(img => {
            const src = img.getAttribute('src') || ''
            // 카드 이미지 파일명에서 정보 추출 (예: img_card_s7.png -> s7)
            const cardMatch = src.match(/img_card_([a-z])(\d+)\.png/)
            if (cardMatch) {
              playerCards.push(`${cardMatch[1]}${cardMatch[2]}`)
            }
          })
        }
        
        const bankerDd = firstLi.querySelector('dd.banker')
        if (bankerDd) {
          const bankerCardImages = bankerDd.querySelectorAll('img')
          bankerCardImages.forEach(img => {
            const src = img.getAttribute('src') || ''
            const cardMatch = src.match(/img_card_([a-z])(\d+)\.png/)
            if (cardMatch) {
              bankerCards.push(`${cardMatch[1]}${cardMatch[2]}`)
            }
          })
        }
        
        // 점수 계산
        const playerScore = playerCards.length > 0 ? calculateBaccaratScore(playerCards) : null
        const bankerScore = bankerCards.length > 0 ? calculateBaccaratScore(bankerCards) : null
        
        console.log('📜 히스토리에서 게임 결과 발견:', {
          roundNumber,
          result,
          playerCards,
          bankerCards,
          playerScore,
          bankerScore
        })
        
        // 게임 결과 처리
        if (processGameResultFromMessageRef.current) {
          const gameResultData = {
            game_daily_no: String(roundNumber),
            game_no: String(roundNumber),
            game_status: '완료',
            result_winner: result,
            player_card1: playerCards[0] || null,
            player_card2: playerCards[1] || null,
            player_card3: playerCards[2] || null,
            banker_card1: bankerCards[0] || null,
            banker_card2: bankerCards[1] || null,
            banker_card3: bankerCards[2] || null,
            player_score: playerScore,
            banker_score: bankerScore
          }
          
          processGameResultFromMessageRef.current(gameResultData).catch(error => {
            console.error('❌ 히스토리 결과 처리 중 에러:', error)
          })
        }
        
      } catch (error) {
        // CORS 오류는 정상적인 동작이므로 로그 출력 안 함
        // 다른 에러만 로그 출력
        if (!error.message || !error.message.includes('cross-origin')) {
          console.error('❌ 히스토리 조회 중 에러:', error)
        }
      }
    }
    
    // 2초마다 히스토리 조회 (게임이 진행 중일 때 자주 조회)
    const intervalId = setInterval(checkHistoryResult, 2000)
    
    return () => {
      clearInterval(intervalId)
    }
  }, [])
  
  // 게임 결과 데이터 저장 (postMessage로 받은 모든 결과)
  const gameResultsCacheRef = useRef(new Map())
  
  // iframe postMessage 리스너 및 게임 정보 파싱
  useEffect(() => {
    console.log('🎧 postMessage 리스너 등록 시작')
    
    const handleMessage = (event) => {
      try {
        let data = event.data
        
        // 문자열인 경우 파싱 시도
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data)
          } catch (e) {
            // JSON이 아니면 무시
            return
          }
        }

        // 히스토리 데이터 확인 (배열 형태로 여러 결과가 올 수 있음)
        if (data && typeof data === 'object') {
          // 히스토리 배열인 경우
          if (Array.isArray(data) && data.length > 0) {
            console.log('📜 히스토리 데이터 수신:', data.length, '개 결과')
            
            // 각 히스토리 결과를 캐시에 저장
            data.forEach((historyItem) => {
              if (historyItem && historyItem.roundNumber) {
                const roundNumber = String(historyItem.roundNumber || historyItem.round || historyItem.game_daily_no || historyItem.game_no)
                if (roundNumber) {
                  gameResultsCacheRef.current.set(roundNumber, {
                    ...historyItem,
                    cachedAt: Date.now()
                  })
                  console.log('💾 히스토리 결과 캐시 저장:', roundNumber, historyItem)
                }
              }
            })
            return
          }
          
          // 단일 게임 결과 데이터 확인 및 캐시 저장
          const hasGameFields = data.game_id || data.game_no || data.game_status || data.result_winner || data.game_daily_no
          
          if (hasGameFields) {
            // 회차 추출
            const roundNumber = data.game_daily_no || data.game_no
            if (roundNumber) {
              // 결과를 캐시에 저장 (회차별로)
              gameResultsCacheRef.current.set(String(roundNumber), {
                ...data,
                cachedAt: Date.now()
              })
              console.log('💾 게임 결과 캐시 저장:', roundNumber, data)
            }
            
            console.log('✅✅✅ 게임 결과 데이터 발견:', data)
            console.log('📋 데이터 상세:', {
              game_id: data.game_id,
              game_no: data.game_no,
              game_daily_no: data.game_daily_no,
              game_status: data.game_status,
              result_winner: data.result_winner,
              player_card1: data.player_card1,
              banker_card1: data.banker_card1
            })
            
            // processGameResultFromMessage 함수 호출
            if (processGameResultFromMessageRef.current) {
              console.log('🔄 게임 결과 처리 함수 호출 시작')
              // 비동기 함수이므로 await 없이 호출 (에러는 함수 내부에서 처리)
              processGameResultFromMessageRef.current(data).catch(error => {
                console.error('❌ 게임 결과 처리 함수 호출 중 에러:', error)
                console.error('❌ 에러 스택:', error.stack)
              })
            } else {
              console.error('❌❌❌ processGameResultFromMessageRef.current가 null입니다!')
            }
            return // 게임 결과 데이터는 여기서 처리 완료
          }
        }

        if (data.type === 'GAME_START' || data.type === 'ROUND_START') {
          setBetStatus('베팅 가능')
          if (data.gameId) setGameId(data.gameId)
          if (data.roundId) setCurrentRound(data.roundId)
          if (data.round) setGameRound(data.round)
          if (data.remainingTime) setTimerSeconds(data.remainingTime)
        } else if (data.type === 'GAME_END' || data.type === 'ROUND_END') {
          setBetStatus('베팅 종료')
        } else if (data.type === 'GAME_RESULT') {
          if (handleGameResultRef.current) {
            handleGameResultRef.current(data)
          }
        } else if (data.type === 'GAME_INFO') {
          // 게임 정보 업데이트
          if (data.round) setGameRound(data.round)
          if (data.remainingTime !== undefined) setTimerSeconds(data.remainingTime)
          if (data.gameId) setGameId(data.gameId)
        }
      } catch (error) {
        console.error('메시지 처리 오류:', error)
      }
    }

    // 게임 정보 시뮬레이션 (실제 게임 API가 없을 경우를 대비)
    const simulateGameInfo = () => {
      // 게임 회차 계산 (하루 1440회, 1분 단위)
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const minutesSinceStart = Math.floor((now - startOfDay) / 1000 / 60)
      const currentRoundNumber = minutesSinceStart + 1
      
      // 다음 회차까지 남은 시간 계산
      const secondsUntilNext = 60 - (now.getSeconds())
      const remainingSeconds = secondsUntilNext > 10 ? secondsUntilNext : 0
      
      // 회차 기반으로 라운드 ID 업데이트
      const roundId = `${gameType}-round-${currentRoundNumber}`
      setCurrentRound(roundId)
      
      setGameRound(currentRoundNumber)
      setTimerSeconds(remainingSeconds)
      setGameId(`${currentRoundNumber}회차`)
      
      if (remainingSeconds > 10) {
        setBetStatus('베팅 가능')
      } else {
        setBetStatus('베팅 종료')
      }
    }

    // 초기 게임 정보 설정
    simulateGameInfo()
    
    // 1초마다 게임 정보 업데이트
    const gameInfoInterval = setInterval(simulateGameInfo, 1000)

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(gameInfoInterval)
    }
  }, [])


  // 칩 선택
  const handleChipSelect = (amount) => {
    setSelectedChip(amount)
  }

  // 베팅 버튼 클릭
  const handleBetButtonClick = (side) => {
    if (betStatus !== '베팅 가능') {
      alert('베팅 가능한 시간이 아닙니다.')
      return
    }

    if (!isLoggedIn) {
      alert('로그인이 필요합니다.')
      navigate('/')
      return
    }

    if (userPoints < selectedChip) {
      alert('포인트가 부족합니다.')
      return
    }

    setBetAmounts(prev => {
      const newAmounts = { ...prev }
      newAmounts[side] = (newAmounts[side] || 0) + selectedChip
      const total = Object.values(newAmounts).reduce((sum, val) => sum + val, 0)
      setTotalBetAmount(total)
      return newAmounts
    })
  }

  // 베팅하기
  const handleBetSubmit = async () => {
    // 10초 이하일 때 배팅 불가
    if (timerSeconds <= 10) {
      alert('베팅 마감 시간이 10초 이하입니다. 베팅할 수 없습니다.')
      return
    }

    if (totalBetAmount === 0) {
      alert('베팅할 항목을 선택해주세요.')
      return
    }

    if (userPoints < totalBetAmount) {
      alert('포인트가 부족합니다.')
      return
    }

    if (!currentRound) {
      alert('게임이 시작되지 않았습니다.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 라운드가 없으면 먼저 생성
      if (currentRound) {
        try {
          await api.post('/game-rounds', {
            roundId: currentRound,
            gameType
          }).catch(() => {}) // 이미 존재하면 무시
        } catch (e) {
          console.log('라운드 생성 실패 (이미 존재할 수 있음):', e)
        }
      }
      
      // 각 베팅 타입별로 배팅 처리
      const betPromises = []
      
      if (betAmounts.pp > 0) {
        betPromises.push(api.post('/bets', {
          gameType,
          roundId: currentRound,
          betType: 'player-pair',
          betAmount: betAmounts.pp
        }))
      }
      if (betAmounts.p > 0) {
        betPromises.push(api.post('/bets', {
          gameType,
          roundId: currentRound,
          betType: 'player',
          betAmount: betAmounts.p
        }))
      }
      if (betAmounts.t > 0) {
        betPromises.push(api.post('/bets', {
          gameType,
          roundId: currentRound,
          betType: 'tie',
          betAmount: betAmounts.t
        }))
      }
      if (betAmounts.b > 0) {
        betPromises.push(api.post('/bets', {
          gameType,
          roundId: currentRound,
          betType: 'banker',
          betAmount: betAmounts.b
        }))
      }
      if (betAmounts.bp > 0) {
        betPromises.push(api.post('/bets', {
          gameType,
          roundId: currentRound,
          betType: 'banker-pair',
          betAmount: betAmounts.bp
        }))
      }

      const responses = await Promise.all(betPromises)
      const lastResponse = responses[responses.length - 1]
      
      if (lastResponse?.data?.remainingPoints !== undefined) {
        setUserPoints(lastResponse.data.remainingPoints)
      } else {
        await fetchUserPoints()
      }

      alert('베팅이 완료되었습니다.')
      setBetAmounts({ pp: 0, p: 0, t: 0, b: 0, bp: 0 })
      setTotalBetAmount(0)
      setIsBettingPanelOpen(false) // 배팅 완료 시 슬라이드 패널 닫기
      await fetchMyBettingList()
    } catch (error) {
      const errorMessage = error.response?.data?.message || '베팅에 실패했습니다.'
      setError(errorMessage)
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 리셋
  const handleReset = () => {
    setBetAmounts({ pp: 0, p: 0, t: 0, b: 0, bp: 0 })
    setTotalBetAmount(0)
  }

  const handleLogin = () => {
    navigate('/')
  }

  const getBetTypeLabel = (type) => {
    const labels = {
      'player-pair': 'Player Pair',
      'player': 'Player',
      'tie': 'Tie',
      'banker': 'Banker',
      'banker-pair': 'Banker Pair',
      'pp': 'Player Pair',
      'p': 'Player',
      't': 'Tie',
      'b': 'Banker',
      'bp': 'Banker Pair'
    }
    return labels[type] || type
  }

  const getStatusColor = (status) => {
    return status === '베팅 가능' ? 'fc-primary' : 'fc-danger'
  }

  return (
    <PageLayout isLoggedIn={isLoggedIn} onLogin={handleLogin}>
      <div id="contents" className="speed-baccarat-page">
        {/* Left Side - Game Container */}
        <div className="game-container">
          {/* Visual Sub */}

          {/* Game Iframe */}
          <section className="speed-baccarat-wrap">
          {iframeLoading && (
            <div className="iframe-loading">
              <div className="loading-spinner"></div>
              <p>게임을 불러오는 중...</p>
            </div>
          )}
          {iframeError && (
            <div className="iframe-error">
              <p>게임을 불러올 수 없습니다.</p>
              <button onClick={() => {
                setIframeError(false)
                setIframeLoading(true)
                const iframe = document.getElementById('baccarat-embed')
                if (iframe) {
                  iframe.src = gameUrl + '?t=' + Date.now()
                }
              }}>다시 시도</button>
            </div>
          )}
          <div id="gameWrapper" className="game-wrapper">
            <iframe 
              id="baccarat-embed" 
              src={gameUrl}
              title="바카라 비디오" 
              scrolling="no" 
              allow="autoplay; fullscreen; camera; microphone; encrypted-media"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => {
              setIframeLoading(false)
              setIframeError(false)
              
              // iframe 내부의 로고 숨기기 시도 (CORS로 인해 실패할 수 있음)
              const hideLogo = () => {
                try {
                  const iframe = document.getElementById('baccarat-embed')
                  if (!iframe) return
                  
                  // contentDocument 접근 시도 (CORS로 인해 실패할 수 있음)
                  try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                    if (iframeDoc) {
                      // .logo 클래스 요소 숨기기
                      const logoElements = iframeDoc.querySelectorAll('.logo, [class*="logo"], img[src*="logo"]')
                      logoElements.forEach(el => {
                        el.style.display = 'none'
                        el.style.visibility = 'hidden'
                        el.style.opacity = '0'
                        el.style.height = '0'
                        el.style.width = '0'
                      })
                      
                      // img 태그 중 logo_m.png 숨기기
                      const logoImages = iframeDoc.querySelectorAll('img[src*="logo_m"], img[src*="logo"]')
                      logoImages.forEach(img => {
                        img.style.display = 'none'
                        img.style.visibility = 'hidden'
                        img.style.opacity = '0'
                        img.style.height = '0'
                        img.style.width = '0'
                      })
                    }
                  } catch (e) {
                    // CORS 오류는 정상적인 동작이므로 로그 출력 안 함
                  }
                  
                  // postMessage로 숨김 요청 (iframe이 지원하는 경우)
                  try {
                    iframe.contentWindow?.postMessage({
                      type: 'HIDE_LOGO',
                      action: 'hide'
                    }, '*')
                  } catch (e) {
                    // 무시
                  }
                  
                  // CSS 주입 시도 (CORS로 인해 실패할 수 있음)
                  try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
                    if (iframeDoc) {
                      const style = iframeDoc.createElement('style')
                      style.textContent = `
                        .logo, [class*="logo"], img[src*="logo_m"], img[src*="logo"] {
                          display: none !important;
                          visibility: hidden !important;
                          opacity: 0 !important;
                          height: 0 !important;
                          width: 0 !important;
                        }
                      `
                      iframeDoc.head.appendChild(style)
                    }
                  } catch (e) {
                    // CORS 오류는 정상적인 동작이므로 로그 출력 안 함
                  }
                } catch (e) {
                  // 무시
                }
              }
              
              // 즉시 시도
              hideLogo()
              
              // 약간의 지연 후 재시도 (iframe 내부 스크립트 로드 대기)
              setTimeout(hideLogo, 500)
              setTimeout(hideLogo, 1000)
              setTimeout(hideLogo, 2000)
            }}
            onError={() => {
              setIframeLoading(false)
              setIframeError(true)
            }}
            style={{
              border: 'none',
              opacity: 1,
              height: '1550px',
              width: '840px',
              display: iframeError ? 'none' : 'block',
              backgroundColor: '#000',
              maxWidth: 'none'
            }}
            />
          </div>
        </section>
        </div>

        {/* Right Side - Game Controls Container */}
        <div className="game-controls-container">
          <div className="controls-layout">
            {/* Game Info Table */}
            <div className="controls-top">
              <div className="title-group">
                <h3 className="title">게임 상황판</h3>
              </div>

              <div className="table-info">
                <table>
                  <colgroup>
                    <col style={{ width: '120px' }} />
                    <col style={{ width: 'auto' }} />
                  </colgroup>
                  <tbody>
                    <tr>
                      <th>현재 게임번호</th>
                      <td id="game-id">{gameRound ? `${gameRound}회차` : gameId}</td>
                    </tr>
                    <tr>
                      <th>베팅 가능 여부</th>
                      <td>
                        <strong className={getStatusColor(betStatus)} id="status">
                          {betStatus === '베팅 가능' ? '🟢 베팅 가능' : '🔴 베팅 종료'}
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <th>마감까지 남은 시간</th>
                      <td id="timer">{timer}</td>
                    </tr>
                    <tr>
                      <th>보유 포인트</th>
                      <td>
                        <strong className="fc-primary" id="now_point">
                          {isLoggedIn ? `${userPoints.toLocaleString()} P` : '로그인이 필요합니다.'}
                        </strong>
                      </td>
                    </tr>
                    <tr>
                      <th>베팅 포인트</th>
                      <td>
                        <strong className="fc-danger" id="bet_amount">
                          {totalBetAmount.toLocaleString()} P
                        </strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Betting History Panel */}
            <div className="controls-bottom">
              <div className="title-group">
                <h3 className="title">나의 베팅내역</h3>
              </div>
              {/* 나의 베팅내역 패널 */}
              <div className="table-list-card" id="my-betting-list">
            <table>
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>회차</th>
                  <th>배팅</th>
                  <th>금액</th>
                  <th>정산</th>
                  <th>상태</th>
                  <th>결과</th>
                  <th>날짜</th>
                </tr>
              </thead>
              <tbody id="my-betting-list-tbody">
                {myBettingList.length === 0 ? (
                  <tr>
                    <td colSpan="7">배팅 내역이 없습니다.</td>
                  </tr>
                ) : (() => {
                  // 페이지네이션 계산
                  const totalPages = Math.ceil(myBettingList.length / itemsPerPage)
                  const startIndex = (currentPage - 1) * itemsPerPage
                  const endIndex = startIndex + itemsPerPage
                  const currentBettingList = myBettingList.slice(startIndex, endIndex)
                  
                  return (
                    <>
                      {currentBettingList.map((bet) => {
                        // 정산 금액 계산 (승리 시 배당률 곱한 금액)
                        const settlementAmount = bet.status === 'won' && bet.payout ? bet.payout : 0
                        // 상태: 대기중 / 완료
                        const statusText = bet.status === 'pending' ? '대기중' : '완료'
                        // 결과: 적중 / 미적중
                        const resultText = bet.status === 'pending' ? '-' : 
                                          bet.status === 'won' ? '적중' : '미적중'
                        
                        // 배팅 타입별 색상 클래스
                        const getBetTypeColorClass = (betType) => {
                          if (betType === 'player' || betType === 'player-pair' || betType === 'p' || betType === 'pp') {
                            return 'bet-type-player'
                          } else if (betType === 'banker' || betType === 'banker-pair' || betType === 'b' || betType === 'bp') {
                            return 'bet-type-banker'
                          } else if (betType === 'tie' || betType === 't') {
                            return 'bet-type-tie'
                          }
                          return ''
                        }
                        
                        // 상태별 색상 클래스
                        const getStatusColorClass = (status) => {
                          if (status === 'pending') {
                            return 'status-pending'
                          } else {
                            return 'status-completed'
                          }
                        }
                        
                        // 결과별 색상 클래스
                        const getResultColorClass = (status) => {
                          if (status === 'won') {
                            return 'result-hit'
                          } else if (status === 'lost') {
                            return 'result-miss'
                          }
                          return ''
                        }
                        
                        return (
                          <tr key={bet._id}>
                            <td>{bet.roundNumber ? `${bet.roundNumber}회차` : '-'}</td>
                            <td className={getBetTypeColorClass(bet.betType)}>{getBetTypeLabel(bet.betType)}</td>
                            <td>{bet.betAmount.toLocaleString()}P</td>
                            <td>{settlementAmount > 0 ? `${settlementAmount.toLocaleString()}P` : '-'}</td>
                            <td className={getStatusColorClass(bet.status)}>{statusText}</td>
                            <td className={getResultColorClass(bet.status)}>{resultText}</td>
                            <td>{new Date(bet.createdAt).toLocaleString('ko-KR', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</td>
                          </tr>
                        )
                      })}
                    </>
                  )
                })()}
                </tbody>
              </table>
              {/* pagination */}
              {myBettingList.length > itemsPerPage && (
                <div className="pagination" id="script-pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    이전
                  </button>
                  <span className="pagination-info">
                    {currentPage} / {Math.ceil(myBettingList.length / itemsPerPage)}
                  </span>
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(myBettingList.length / itemsPerPage), prev + 1))}
                    disabled={currentPage >= Math.ceil(myBettingList.length / itemsPerPage)}
                  >
                    다음
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 슬라이드 배팅 패널 (모바일용) */}
        <div className={`betting-slide-panel ${isBettingPanelOpen ? 'open' : ''}`}>
          <div className="betting-slide-panel__overlay" onClick={() => setIsBettingPanelOpen(false)}></div>
          <div className="betting-slide-panel__content">
            <div className="betting-slide-panel__header">
              <h3>베팅하기</h3>
              <button 
                className="betting-slide-panel__close"
                onClick={() => setIsBettingPanelOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="betting-slide-panel__body">
              <div className="baccarat">
                <div className="baccarat-grid">
                  {/* 첫 번째 줄: Player Pair, Banker Pair */}
                  <div className="baccarat-pair-row">
                    <div className="baccarat-pair-spacer"></div>
                    <button 
                      className={`baccarat__item baccarat__item--player-pair bet-btn ${betAmounts.pp > 0 ? 'active' : ''}`}
                      data-side="pp"
                      onClick={() => handleBetButtonClick('pp')}
                      disabled={loading || betStatus !== '베팅 가능' || !isLoggedIn || timerSeconds <= 10}
                    >
                      <span className="baccarat__title">Player Pair</span>
                      <span className="baccarat__odd">11.0</span>
                    </button>
                    <div className="baccarat-pair-spacer"></div>
                    <button 
                      className={`baccarat__item baccarat__item--banker-pair bet-btn ${betAmounts.bp > 0 ? 'active' : ''}`}
                      data-side="bp"
                      onClick={() => handleBetButtonClick('bp')}
                      disabled={loading || betStatus !== '베팅 가능' || !isLoggedIn || timerSeconds <= 10}
                    >
                      <span className="baccarat__title">Banker Pair</span>
                      <span className="baccarat__odd">11.0</span>
                    </button>
                    <div className="baccarat-pair-spacer"></div>
                  </div>
                  
                  {/* 두 번째 줄: Player, Tie, Banker */}
                  <div className="baccarat-row">
                    <button 
                      className={`baccarat__item baccarat__item--player bet-btn ${betAmounts.p > 0 ? 'active' : ''}`}
                      data-side="p"
                      onClick={() => handleBetButtonClick('p')}
                      disabled={loading || betStatus !== '베팅 가능' || !isLoggedIn || timerSeconds <= 10}
                    >
                      <span className="baccarat__title">Player</span>
                      <span className="baccarat__odd">2.0</span>
                    </button>
                    <button 
                      className={`baccarat__item baccarat__item--tie bet-btn ${betAmounts.t > 0 ? 'active' : ''}`}
                      data-side="t"
                      onClick={() => handleBetButtonClick('t')}
                      disabled={loading || betStatus !== '베팅 가능' || !isLoggedIn || timerSeconds <= 10}
                    >
                      <span className="baccarat__title">Tie</span>
                      <span className="baccarat__odd">8.0</span>
                    </button>
                    <button 
                      className={`baccarat__item baccarat__item--banker bet-btn ${betAmounts.b > 0 ? 'active' : ''}`}
                      data-side="b"
                      onClick={() => handleBetButtonClick('b')}
                      disabled={loading || betStatus !== '베팅 가능' || !isLoggedIn || timerSeconds <= 10}
                    >
                      <span className="baccarat__title">Banker</span>
                      <span className="baccarat__odd">1.95</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="chip-wrap mt-24">
                <div className="chip-row">
                  <div 
                    className={`chip chip-01 ${selectedChip === 1000 ? 'active' : ''}`}
                    data-amount="1000"
                    onClick={() => handleChipSelect(1000)}
                  >
                    1,000
                  </div>
                  <div 
                    className={`chip chip-02 ${selectedChip === 5000 ? 'active' : ''}`}
                    data-amount="5000"
                    onClick={() => handleChipSelect(5000)}
                  >
                    5,000
                  </div>
                  <div 
                    className={`chip chip-03 ${selectedChip === 10000 ? 'active' : ''}`}
                    data-amount="10000"
                    onClick={() => handleChipSelect(10000)}
                  >
                    10,000
                  </div>
                </div>
                <div className="chip-row">
                  <div 
                    className={`chip chip-04 ${selectedChip === 50000 ? 'active' : ''}`}
                    data-amount="50000"
                    onClick={() => handleChipSelect(50000)}
                  >
                    50,000
                  </div>
                  <div 
                    className={`chip chip-05 ${selectedChip === 100000 ? 'active' : ''}`}
                    data-amount="100000"
                    onClick={() => handleChipSelect(100000)}
                  >
                    100,000
                  </div>
                </div>
              </div>

              <div className="btn-group mt-24">
                <button 
                  type="button" 
                  className="btn btn-primary xl w-80 shadow-01" 
                  onClick={handleBetSubmit}
                  disabled={loading || totalBetAmount === 0 || !isLoggedIn || timerSeconds <= 10}
                >
                  베팅 하기 ({totalBetAmount.toLocaleString()}P)
                </button>
                <button 
                  type="button" 
                  className="btn xl w-20 shadow-01" 
                  onClick={handleReset}
                  disabled={loading}
                >
                  리셋
                </button>
              </div>

              <div className="text-center fc-primary mt-24">
                최소 1,000 ~ 최대 100,000
              </div>
            </div>
          </div>
        </div>

        {/* 하단 베팅 트리거 버튼 (모바일용) */}
        <button 
          className="betting-trigger-btn"
          onClick={() => setIsBettingPanelOpen(true)}
          disabled={betStatus !== '베팅 가능' || !isLoggedIn || timerSeconds <= 10}
        >
          <span className="betting-trigger-btn__icon">🎰</span>
          <span className="betting-trigger-btn__text">베팅하기</span>
          {totalBetAmount > 0 && (
            <span className="betting-trigger-btn__amount">{totalBetAmount.toLocaleString()}P</span>
          )}
        </button>
      </div>
    </PageLayout>
  )
}

export default PointBaccaratPage
