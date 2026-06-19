import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Account } from '../data/accounts'

type StudyBook = {
  id: string
  title: string
  subtitle: string
  category: string
}

type Props = {
  account: Account
  onLogout: () => void
}

const studyBooks: StudyBook[] = [
  { id: '1', title: 'TypeScript 마스터', subtitle: '타입 시스템 완전 정복', category: '프론트엔드' },
  { id: '2', title: 'React Hooks 깊게 보기', subtitle: '상태와 효과를 설계하는 법', category: 'UI' },
  { id: '3', title: 'CSS 레이아웃의 기술', subtitle: '반응형과 애니메이션 디자인', category: '스타일링' },
  { id: '4', title: '코드 품질과 테스트', subtitle: '안정적인 개발을 위한 습관', category: '개발자' },
  { id: '5', title: '서비스 운영 체크리스트', subtitle: '배포와 모니터링 정복', category: '운영' }
]

export default function MainPage({ account, onLogout }: Props) {
  const [bookOpen, setBookOpen] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const fullText = `${account.displayName}님 환영합니다`

  useEffect(() => {
    const timeout = window.setTimeout(() => setBookOpen(true), 80)
    return () => window.clearTimeout(timeout)
  }, [])

  useEffect(() => {
    if (isPaused) return undefined

    const delay = isDeleting ? 50 : 120
    const timer = window.setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < fullText.length) {
          setDisplayText(fullText.slice(0, displayText.length + 1))
        } else {
          setIsPaused(true)
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(fullText.slice(0, displayText.length - 1))
        } else {
          setIsPaused(true)
        }
      }
    }, delay)

    return () => window.clearTimeout(timer)
  }, [displayText, fullText, isDeleting, isPaused])

  useEffect(() => {
    if (!isPaused) return undefined

    const pauseTime = displayText.length === fullText.length ? 1200 : 800
    const timer = window.setTimeout(() => {
      setIsPaused(false)
      setIsDeleting((prev) => !prev)
    }, pauseTime)

    return () => window.clearTimeout(timer)
  }, [displayText.length, fullText.length, isPaused])

  return (
    <main className="main-page">
      <div className={`book-animation ${bookOpen ? 'open' : ''}`}>
        <div className="book-cover left" />
        <div className="book-cover right" />
        <div className="book-spine" />
      </div>
      <section className="main-content library-layout">
        <div className="welcome-card">
          <p className="lead">서재에 오신 것을 환영합니다</p>
          <h2 className="typing-text">
            {displayText}
            <span className="typing-cursor" />
          </h2>
          <p className="subtext">오늘의 공부 계획을 책장에서 선택하고 바로 시작해보세요.</p>
        </div>

        <div className="shelf-card">
          <div className="shelf-header">
            <span className="shelf-dot" />
            <span className="shelf-dot" />
            <span className="shelf-dot" />
          </div>
          <div className="book-shelf">
            {studyBooks.map((book) => (
              <button
                key={book.id}
                className="book-card"
                type="button"
                onClick={() => window.alert(`${book.title} 공부를 시작합니다.`)}
              >
                <div className="book-chip">{book.category}</div>
                <h3>{book.title}</h3>
                <p>{book.subtitle}</p>
                <span className="book-action">열기</span>
              </button>
            ))}
          </div>
        </div>

        <div className="main-footer">
          <div className="admin-badge">개발자 계정</div>
          <Link to="/" onClick={onLogout} className="logout-link">
            로그아웃
          </Link>
        </div>
      </section>
    </main>
  )
}
