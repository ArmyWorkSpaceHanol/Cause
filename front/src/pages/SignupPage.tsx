import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import FormInput from '../components/FormInput'
import AuthButton from '../components/AuthButton'
import LinkText from '../components/LinkText'
import { getAllAccounts, saveStoredAccount, type Account } from '../data/accounts'

type SendCodeResponse = {
  expiresInSeconds?: number
  cooldownSeconds?: number
  devCode?: string
  error?: string
}

type VerifyCodeResponse = {
  verified?: boolean
  error?: string
}

type SignupResponse = {
  account?: Omit<Account, 'password'>
  error?: string
}

export default function SignupPage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState('')
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const navigate = useNavigate()

  function validateEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }

  function normalizeEmail(v: string) {
    return v.trim().toLowerCase()
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextEmail = e.target.value
    setEmail(nextEmail)
    setCode('')
    setCodeSent(false)
    setEmailVerified(false)
    setVerifiedEmail('')
    setInfo('')
    setError('')
  }

  async function handleSendCode() {
    setError('')
    setInfo('')
    const targetEmail = normalizeEmail(email)
    if (!validateEmail(targetEmail)) {
      setError('올바른 이메일 형식을 입력하세요.')
      return
    }
    setSendLoading(true)
    try {
      const resp = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })
      const data = (await resp.json()) as SendCodeResponse

      if (!resp.ok) {
        throw new Error(data.error || '인증코드 전송에 실패했습니다.')
      }

      setEmail(targetEmail)
      setCode('')
      setCodeSent(true)
      setEmailVerified(false)
      setVerifiedEmail('')
      setInfo(data.devCode ? `인증 코드가 전송되었습니다. 개발 모드 코드: ${data.devCode}` : '인증 코드가 이메일로 전송되었습니다.')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '인증코드 전송에 실패했습니다. 서버 설정을 확인하세요.')
    } finally {
      setSendLoading(false)
    }
  }

  async function handleVerifyCode() {
    setError('')
    setInfo('')
    const targetEmail = normalizeEmail(email)
    if (!validateEmail(targetEmail)) return setError('올바른 이메일 형식을 입력하세요.')
    if (!code.trim()) return setError('인증코드를 입력하세요.')
    setVerifyLoading(true)
    try {
      const resp = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code: code.trim() })
      })
      const data = (await resp.json()) as VerifyCodeResponse
      if (!resp.ok || !data?.verified) {
        throw new Error(data?.error || '검증 실패')
      }
      setEmailVerified(true)
      setVerifiedEmail(targetEmail)
      setInfo('이메일 인증이 완료되었습니다.')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '인증코드가 일치하지 않거나 서버 오류가 발생했습니다.')
    } finally {
      setVerifyLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    const targetEmail = normalizeEmail(email)
    if (!username.trim()) return setError('아이디를 입력하세요.')
    if (!validateEmail(targetEmail)) return setError('올바른 이메일 형식을 입력하세요.')
    if (password.length < 8) return setError('비밀번호는 최소 8자 이상이어야 합니다.')
    if (password !== confirm) return setError('비밀번호 확인이 일치하지 않습니다.')
    if (!emailVerified || verifiedEmail !== targetEmail) return setError('현재 이메일의 인증을 완료해주세요.')

    const duplicatedAccount = getAllAccounts().find((account) => account.username === username.trim() || account.email === targetEmail)
    if (duplicatedAccount?.username === username.trim()) return setError('이미 사용 중인 아이디입니다.')
    if (duplicatedAccount?.email === targetEmail) return setError('이미 가입된 이메일입니다.')

    setSignupLoading(true)
    try {
      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), displayName: displayName.trim(), email: targetEmail, password })
      })
      const data = (await resp.json()) as SignupResponse
      if (!resp.ok) throw new Error(data?.error || '회원가입 실패')
      if (data.account) {
        saveStoredAccount({ ...data.account, password })
      }
      setInfo('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.')
      setTimeout(() => navigate('/'), 900)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : '서버 오류로 가입에 실패했습니다.')
    } finally {
      setSignupLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="Join Cause" title="새 책장 만들기" description="간단한 회원가입으로 나만의 학습 공간을 만들어보세요.">
      <div className="auth-card-header">
        <span className="auth-pill">Create account</span>
        <h2>회원가입</h2>
        <p>아이디, 비밀번호, 이메일 인증을 통해 간단히 가입할 수 있습니다.</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <FormInput name="username" label="아이디" placeholder="사용하실 아이디" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        <FormInput name="displayName" label="이름(표시명)" placeholder="표시될 이름 (선택)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <FormInput name="email" label="이메일" placeholder="example@domain.com" value={email} onChange={handleEmailChange} autoComplete="email" />
          </div>
          <div style={{ width: 140 }}>
            <AuthButton type="button" onClick={handleSendCode} disabled={sendLoading}>{sendLoading ? '전송 중...' : '인증코드 전송'}</AuthButton>
          </div>
        </div>

        {codeSent && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <FormInput name="code" label="인증코드" placeholder="받은 6자리 코드" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" />
            </div>
            <div style={{ width: 140 }}>
              <AuthButton type="button" onClick={handleVerifyCode} disabled={verifyLoading || emailVerified}>{verifyLoading ? '검증 중...' : emailVerified ? '인증완료' : '검증'}</AuthButton>
            </div>
          </div>
        )}

        <FormInput name="password" label="비밀번호" type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <FormInput name="confirm" label="비밀번호 확인" type="password" placeholder="비밀번호 확인" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />

        {error && <div className="auth-error" role="alert">{error}</div>}
        {info && <div className="auth-info">{info}</div>}

        <AuthButton type="submit" disabled={signupLoading || !emailVerified}>{signupLoading ? '가입 중...' : '가입하기'}</AuthButton>

        <div className="signup-row">
          <span>이미 계정이 있으신가요?</span>
          <LinkText to="/">로그인</LinkText>
        </div>
      </form>
    </AuthLayout>
  )
}
