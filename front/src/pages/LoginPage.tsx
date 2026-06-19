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
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit}>
        <FormInput name="username" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
        <FormInput name="password" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="find-links">
          <LinkText to="/find">아이디 찾기</LinkText>
          <span className="sep">·</span>
          <LinkText to="/find">비밀번호 찾기</LinkText>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <AuthButton type="submit">로그인</AuthButton>
        <div className="signup-row">
          <span>회원가입이 필요하신가요? </span>
          <LinkText to="/signup">가입하기</LinkText>
        </div>
      </form>
    </AuthLayout>
  )
}
