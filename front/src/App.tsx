import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import FindAccountPage from './pages/FindAccountPage'
import SignupPage from './pages/SignupPage'
import MainPage from './pages/MainPage'
import { type Account } from './data/accounts'

export default function App() {
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={setCurrentAccount} />} />
        <Route path="/find" element={<FindAccountPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/main"
          element={
            currentAccount ? (
              <MainPage account={currentAccount} onLogout={() => setCurrentAccount(null)} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
