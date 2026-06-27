import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import FormInput from '../components/FormInput'
import AuthButton from '../components/AuthButton'
import LinkText from '../components/LinkText'

type FlowMode = 'username' | 'password'

export default function FindAccountPage() {
  const [mode, setMode] = useState<FlowMode>('username')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [foundId, setFoundId] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [findLoading, setFindLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()

  function validateEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  async function handleFindUsername(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setFoundId('')

    if (!validateEmail(email)) {
      setError('정확한 이메일 주소를 입력해주세요.')
      return
    }

    setFindLoading(true)
    try {
      const resp = await fetch('/api/auth/find-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await resp.json()

      if (!resp.ok) {
        throw new Error(data?.error || '아이디 찾기 실패')
      }

      setFoundId(data.username)
      setInfo('이메일로 가입된 아이디를 찾았습니다.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || '서버 오류로 아이디를 찾지 못했습니다.')
    } finally {
      setFindLoading(false)
    }
  }

  async function handleSendResetCode() {
    setError('')
    setInfo('')
    if (!validateEmail(email)) {
      setError('정확한 이메일 주소를 입력해주세요.')
      return
    }

    setSendLoading(true)
    try {
      const resp = await fetch('/api/auth/send-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error || '인증코드 전송 실패')
      }
      setCodeSent(true)
      setInfo('비밀번호 재설정용 인증 코드가 이메일로 전송되었습니다.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || '인증코드 전송에 실패했습니다.')
    } finally {
      setSendLoading(false)
    }
  }

  async function handleVerifyResetCode() {
    setError('')
    setInfo('')
    if (!code.trim()) {
      setError('인증 코드를 입력해주세요.')
      return
    }

    setVerifyLoading(true)
    try {
      const resp = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      })
      const data = await resp.json()
      if (!resp.ok || !data?.verified) {
        throw new Error(data?.error || '코드 검증 실패')
      }
      setVerified(true)
      setInfo('인증이 완료되었습니다. 새 비밀번호를 입력해주세요.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || '인증 코드가 일치하지 않습니다.')
    } finally {
      setVerifyLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!verified) {
      setError('먼저 인증 코드를 검증해주세요.')
      return
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setResetLoading(true)
    try {
      const resp = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      })
      const data = await resp.json()
      if (!resp.ok) {
        throw new Error(data?.error || '비밀번호 재설정 실패')
      }
      setInfo('비밀번호가 정상적으로 재설정되었습니다. 로그인 페이지로 이동합니다.')
      setTimeout(() => navigate('/'), 1200)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || '서버 오류로 재설정에 실패했습니다.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <AuthLayout eyebrow="Account Help" title="계정 찾기" description="아이디와 비밀번호 찾기를 모두 간편한 서버 흐름으로 지원합니다.">
      <div className="auth-card-header">
        <span className="auth-pill">Account recovery</span>
        <h2>아이디 / 비밀번호 찾기</h2>
        <p>등록된 이메일을 입력하고 인증 절차를 거쳐 계정을 복구하세요.</p>
      </div>

      <div className="find-mode-tabs" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`auth-button ${mode === 'username' ? 'active' : 'secondary-button'}`}
          onClick={() => {
            setMode('username')
            setError('')
            setInfo('')
            setCodeSent(false)
            setVerified(false)
          }}
        >
          아이디 찾기
        </button>
        <button
          type="button"
          className={`auth-button ${mode === 'password' ? 'active' : 'secondary-button'}`}
          onClick={() => {
            setMode('password')
            setError('')
            setInfo('')
            setCodeSent(false)
            setVerified(false)
          }}
        >
          비밀번호 찾기
        </button>
      </div>

      {mode === 'username' ? (
        <form className="auth-form" onSubmit={handleFindUsername}>
          <FormInput name="email" label="가입 이메일" placeholder="example@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <AuthButton type="submit" disabled={findLoading}>{findLoading ? '조회 중...' : '아이디 찾기'}</AuthButton>
          {foundId && <div className="auth-info">가입된 아이디: <strong>{foundId}</strong></div>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <FormInput name="email" label="가입 이메일" placeholder="example@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <FormInput name="code" label="인증코드" placeholder="이메일로 받은 코드" value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div style={{ width: 140 }}>
              <AuthButton type="button" onClick={handleSendResetCode} disabled={sendLoading}>{sendLoading ? '전송 중...' : '코드 전송'}</AuthButton>
            </div>
          </div>

          {codeSent && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <FormInput name="verify" label="코드 검증" placeholder="인증코드를 입력하세요" value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              <div style={{ width: 140 }}>
                <AuthButton type="button" onClick={handleVerifyResetCode} disabled={verifyLoading || verified}>{verifyLoading ? '검증 중...' : verified ? '인증 완료' : '검증'}</AuthButton>
              </div>
            </div>
          )}

          <FormInput name="newPassword" label="새 비밀번호" type="password" placeholder="새 비밀번호" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          <FormInput name="confirmPassword" label="비밀번호 확인" type="password" placeholder="새 비밀번호 확인" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" />

          {error && <div className="auth-error" role="alert">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          <AuthButton type="submit" disabled={resetLoading || !verified}>{resetLoading ? '재설정 중...' : '비밀번호 재설정'}</AuthButton>
        </form>
      )}

      <div className="signup-row">
        <span>로그인 화면으로 돌아가시겠어요?</span>
        <LinkText to="/">로그인으로 돌아가기</LinkText>
      </div>
    </AuthLayout>
  )
}
