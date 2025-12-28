import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage'
import ScamReportPage from './pages/ScamReportPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import SignupPage from './pages/SignupPage'
import LoginPage from './pages/LoginPage'

// 공식보증업체
import GuaranteeCompanyPage from './pages/GuaranteeCompanyPage'

// 먹튀검증
import ScamVerificationPage from './pages/ScamVerificationPage'

// 팁스터존
import SportsAnalysisPage from './pages/SportsAnalysisPage'
import TotoGuidePage from './pages/TotoGuidePage'
import TotoGuideDetailPage from './pages/TotoGuideDetailPage'

// 커뮤니티
import FreeBoardPage from './pages/FreeBoardPage'
import ReviewBoardPage from './pages/ReviewBoardPage'

// 홍보센터
import FreeMoneyPromoPage from './pages/FreeMoneyPromoPage'
import GeneralPromoPage from './pages/GeneralPromoPage'

// 포인트존
import EventPage from './pages/EventPage'
import GiftExchangePage from './pages/GiftExchangePage'
import GiftCardExchangePage from './pages/GiftCardExchangePage'
import AttendancePage from './pages/AttendancePage'
import OddsGamePage from './pages/OddsGamePage'
import PointInfoPage from './pages/PointInfoPage'

// 블랙조회
import BlackListPage from './pages/BlackListPage'
import WriteBlackListPage from './pages/WriteBlackListPage'

// 고객센터
import NoticePage from './pages/NoticePage'
import InquiryPage from './pages/InquiryPage'

// 상세페이지
import PostDetailPage from './pages/PostDetailPage'

// 글쓰기
import WriteScamReportPage from './pages/WriteScamReportPage'
import WriteSportsAnalysisPage from './pages/WriteSportsAnalysisPage'
import WriteFreeBoardPage from './pages/WriteFreeBoardPage'
import WriteReviewBoardPage from './pages/WriteReviewBoardPage'
import WriteFreeMoneyPromoPage from './pages/WriteFreeMoneyPromoPage'

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* 공식보증업체 */}
        <Route path="/guarantee-company" element={<GuaranteeCompanyPage />} />
        
        {/* 먹튀검증 */}
        <Route path="/mttip" element={<ScamReportPage />} />
        <Route path="/mttip/write" element={<WriteScamReportPage />} />
        <Route path="/scam-report" element={<ScamReportPage />} />
        <Route path="/scam-verification" element={<ScamVerificationPage />} />
        
        {/* 팁스터존 */}
        <Route path="/sports-analysis" element={<SportsAnalysisPage />} />
        <Route path="/sports-analysis/write" element={<WriteSportsAnalysisPage />} />
        <Route path="/toto-guide" element={<TotoGuidePage />} />
        <Route path="/toto-guide/:id" element={<TotoGuideDetailPage />} />
        
        {/* 커뮤니티 */}
        <Route path="/free-board" element={<FreeBoardPage />} />
        <Route path="/free-board/write" element={<WriteFreeBoardPage />} />
        <Route path="/review-board" element={<ReviewBoardPage />} />
        <Route path="/review-board/write" element={<WriteReviewBoardPage />} />
        
        {/* 블랙조회 */}
        <Route path="/black-list" element={<BlackListPage />} />
        <Route path="/black-list/write" element={<WriteBlackListPage />} />
        
        {/* 고객센터 */}
        <Route path="/notices" element={<NoticePage />} />
        <Route path="/inquiry" element={<InquiryPage />} />
        
        {/* 홍보센터 */}
        <Route path="/free-money-promo" element={<FreeMoneyPromoPage />} />
        <Route path="/free-money-promo/write" element={<WriteFreeMoneyPromoPage />} />
        <Route path="/general-promo" element={<GeneralPromoPage />} />
        
        {/* 포인트존 */}
        <Route path="/events" element={<EventPage />} />
        <Route path="/gift-exchange" element={<GiftExchangePage />} />
        <Route path="/gift-card-exchange" element={<GiftCardExchangePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/odds-game" element={<OddsGamePage />} />
        <Route path="/point-info" element={<PointInfoPage />} />
        
        {/* 상세페이지 */}
        <Route path="/post/:id" element={<PostDetailPage />} />
        
        {/* 인증 */}
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* 관리자 */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App