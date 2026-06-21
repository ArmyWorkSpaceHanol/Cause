import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import FormInput from '../components/FormInput'
import AuthButton from '../components/AuthButton'
import LinkText from '../components/LinkText'
import { accounts, type Account } from '../data/accounts'

type Props = {
  onLogin: (account: Account) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const matched = accounts.find((account) => account.username === username && account.password === password)
    if (!matched) {
      setError('아이디 또는 비밀번호가 일치하지 않습니다.')
      return
    }
    onLogin(matched)
    navigate('/main')
  }

  return (
    <AuthLayout description="로그인하면 환영 타이핑과 나만의 공부 책장이 열립니다.">
      <div className="auth-card-header">
        <span className="auth-pill">Welcome back</span>
        <h2>다시 학습을 시작해볼까요?</h2>
        <p>모바일에서도 편하게 이어보는 개인 학습 라이브러리</p>
      </div>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormInput name="username" label="아이디" placeholder="아이디를 입력하세요" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        <FormInput name="password" label="비밀번호" type="password" placeholder="비밀번호를 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <div className="find-links">
          <LinkText to="/find">아이디 찾기</LinkText>
          <span className="sep">·</span>
          <LinkText to="/find">비밀번호 찾기</LinkText>
        </div>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <AuthButton type="submit">로그인하고 책장 열기</AuthButton>
        <div className="signup-row">
          <span>회원가입이 필요하신가요?</span>
          <LinkText to="/signup">가입하기</LinkText>
        </div>
      </form>
    </AuthLayout>
  )
}
