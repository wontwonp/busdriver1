import axios from 'axios'

// 현재 호스트를 기반으로 API URL 설정
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // localhost가 아니면 현재 호스트의 4001 포트 사용
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:4001/api`
    }
  }
  // 로컬 개발 환경에서는 4001 포트 사용
  return 'http://localhost:4001/api'
}

const API_BASE_URL = getApiBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 쿠키 전송을 위해 필요
})

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use(
  (config) => {
    // 경로에 따라 적절한 토큰 선택
    const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    const adminToken = localStorage.getItem('adminToken')
    const userToken = localStorage.getItem('token')
    
    // 관리자 경로면 adminToken만, 일반 사용자 경로면 userToken만 사용
    // 서로 다른 토큰을 섞어서 사용하면 인증 실패 발생
    const token = isAdminPath ? adminToken : userToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동으로 multipart/form-data로 설정)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 401 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isAdminPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
      
      // /auth/me 같은 인증 확인 API는 401이 발생해도 로그아웃하지 않음 (토큰 만료 등)
      // 실제 인증이 필요한 API에서만 로그아웃 처리
      const isAuthCheckEndpoint = requestUrl.includes('/auth/me') || requestUrl.includes('/auth/verify')
      
      if (!isAuthCheckEndpoint) {
        // 관리자 페이지인 경우 관리자 로그인으로, 아니면 홈으로
        if (isAdminPath) {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminInfo')
          window.location.href = '/admin/login'
        } else {
          // 일반 사용자 페이지에서만 로그아웃 처리
          // 단, 로그인 페이지나 공개 페이지에서는 처리하지 않음
          const publicPaths = ['/', '/login', '/signup']
          const currentPath = window.location.pathname
          if (!publicPaths.includes(currentPath)) {
            localStorage.removeItem('token')
            localStorage.removeItem('isLoggedIn')
            localStorage.removeItem('userInfo')
            // 로그인 페이지로 리다이렉트하지 않고 에러만 표시
            console.warn('인증 실패: 로그인이 필요합니다.')
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

