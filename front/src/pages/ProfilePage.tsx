import React from 'react'
import { Link } from 'react-router-dom'
import { Account } from '../data/accounts'

type Props = {
  account: Account
  onLogout: () => void
}

export default function ProfilePage({ account, onLogout }: Props) {
  return (
    <main className="profile-page">
      <section className="profile-card">
        <h1>{account.displayName} 님의 프로필</h1>
        <div className="profile-detail">
          <p>
            <strong>아이디:</strong> {account.username}
          </p>
          <p>
            <strong>역할:</strong> {account.role === 'developer' ? '개발자' : '사용자'}
          </p>
        </div>
        <div className="profile-actions">
          <Link to="/main" className="secondary-button">
            돌아가기
          </Link>
          <button type="button" onClick={onLogout} className="primary-button">
            로그아웃
          </button>
        </div>
      </section>
    </main>
  )
}
