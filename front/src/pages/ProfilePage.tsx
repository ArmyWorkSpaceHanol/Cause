import React, { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import AuthButton from '../components/AuthButton'
import FormInput from '../components/FormInput'
import { Account } from '../data/accounts'

type Props = {
  account: Account
  onUpdate: (account: Account) => void
  onLogout: () => void
}

const maxProfileImageSize = 2 * 1024 * 1024

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ProfilePage({ account, onUpdate, onLogout }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [username, setUsername] = useState(account.username)
  const [displayName, setDisplayName] = useState(account.displayName)
  const [email, setEmail] = useState(account.email ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [profileImage, setProfileImage] = useState(account.profileImage ?? '')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const avatarInitial = useMemo(() => {
    const source = displayName.trim() || username.trim() || 'C'
    return source.slice(0, 1).toUpperCase()
  }, [displayName, username])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError('')
    setInfo('')

    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    if (file.size > maxProfileImageSize) {
      setError('프로필 사진은 2MB 이하로 업로드해주세요.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setProfileImage(String(reader.result))
      setInfo('프로필 사진이 미리보기에 반영되었습니다.')
    }
    reader.onerror = () => setError('이미지를 불러오지 못했습니다. 다른 파일을 선택해주세요.')
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setProfileImage('')
    setInfo('프로필 사진을 제거했습니다.')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setInfo('')

    const nextUsername = username.trim()
    const nextDisplayName = displayName.trim()
    const nextEmail = email.trim()

    if (!nextUsername) {
      setError('아이디를 입력하세요.')
      return
    }

    if (!nextDisplayName) {
      setError('표시명을 입력하세요.')
      return
    }

    if (nextEmail && !validateEmail(nextEmail)) {
      setError('올바른 이메일 형식을 입력하세요.')
      return
    }

    if (password || confirm) {
      if (password.length < 8) {
        setError('새 비밀번호는 최소 8자 이상이어야 합니다.')
        return
      }

      if (password !== confirm) {
        setError('비밀번호 확인이 일치하지 않습니다.')
        return
      }
    }

    const updatedAccount: Account = {
      ...account,
      username: nextUsername,
      displayName: nextDisplayName,
      email: nextEmail,
      password: password ? password : account.password,
      profileImage,
    }

    onUpdate(updatedAccount)
    setPassword('')
    setConfirm('')
    setInfo('프로필이 저장되었습니다.')
  }

  return (
    <main className="profile-page profile-edit-page">
      <div className="library-aurora" aria-hidden="true" />

      <section className="profile-edit-shell" aria-label="프로필 수정">
        <div className="profile-edit-summary">
          <p className="eyebrow">Profile Settings</p>
          <h1>프로필 수정</h1>
          <p className="profile-edit-description">회원가입 정보와 프로필 사진을 관리하세요.</p>

          <div className="profile-photo-panel">
            <div className="profile-photo-preview" aria-label="프로필 사진 미리보기">
              {profileImage ? <img src={profileImage} alt={`${displayName || username} 프로필`} /> : <span>{avatarInitial}</span>}
            </div>
            <div className="profile-photo-actions">
              <input ref={fileInputRef} className="profile-photo-input" type="file" accept="image/*" onChange={handleImageChange} />
              <button type="button" className="secondary-button" onClick={() => fileInputRef.current?.click()}>
                사진 선택
              </button>
              <button type="button" className="logout-link" onClick={handleRemoveImage} disabled={!profileImage}>
                사진 제거
              </button>
            </div>
          </div>
        </div>

        <form className="profile-edit-form auth-form" onSubmit={handleSubmit}>
          <div className="profile-form-grid">
            <FormInput name="username" label="아이디" placeholder="사용하실 아이디" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
            <FormInput name="displayName" label="이름(표시명)" placeholder="표시될 이름" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <FormInput name="email" label="이메일" placeholder="example@domain.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
            <FormInput name="role" label="역할" value={account.role === 'developer' ? '개발자' : '사용자'} disabled />
            <FormInput name="password" label="새 비밀번호" type="password" placeholder="변경할 때만 입력" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            <FormInput name="confirm" label="새 비밀번호 확인" type="password" placeholder="새 비밀번호 확인" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {info && <div className="auth-info">{info}</div>}

          <div className="profile-actions">
            <Link to="/main" className="secondary-button">
              돌아가기
            </Link>
            <button type="button" onClick={onLogout} className="logout-link">
              로그아웃
            </button>
            <AuthButton type="submit">프로필 저장</AuthButton>
          </div>
        </form>
      </section>
    </main>
  )
}
