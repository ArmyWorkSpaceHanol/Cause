import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const initialBooks: StudyBook[] = [
  { id: '1', title: 'TypeScript 마스터', subtitle: '타입 시스템 완전 정복', category: '프론트엔드' },
  { id: '2', title: 'React Hooks 깊게 보기', subtitle: '상태와 효과를 설계하는 법', category: 'UI' },
  { id: '3', title: 'CSS 레이아웃의 기술', subtitle: '반응형과 애니메이션 디자인', category: '스타일링' },
  { id: '4', title: '코드 품질과 테스트', subtitle: '안정적인 개발을 위한 습관', category: '개발자' },
  { id: '5', title: '서비스 운영 체크리스트', subtitle: '배포와 모니터링 정복', category: '운영' }
]

export default function MainPage({ account, onLogout }: Props) {
  const navigate = useNavigate()
  const [streakDays, setStreakDays] = useState(1)
  const [typedLength, setTypedLength] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'bookshelf'>('typing')
  const [books, setBooks] = useState<StudyBook[]>(initialBooks)
  const [newBookTitle, setNewBookTitle] = useState('')
  const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null)

  const fullText = `${account.displayName}님 환영합니다.\n${streakDays}일 연속 로그인 중입니다.`
  const displayedLines = fullText.slice(0, typedLength).split('\n')

  useEffect(() => {
    const storageKeyCount = `cause-login-streak:${account.username}`
    const storageKeyDate = `cause-login-date:${account.username}`
    const storedCount = Number(window.localStorage.getItem(storageKeyCount) ?? 0)
    const storedDate = window.localStorage.getItem(storageKeyDate)
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const nextCount = storedDate === today
      ? Math.max(1, storedCount)
      : storedDate === yesterday
      ? storedCount + 1
      : 1

    window.localStorage.setItem(storageKeyCount, String(nextCount))
    window.localStorage.setItem(storageKeyDate, today)
    setStreakDays(nextCount)
  }, [account.username])

  useEffect(() => {
    if (phase !== 'typing') return undefined

    if (typedLength < fullText.length) {
      const timer = window.setTimeout(() => setTypedLength((value) => value + 1), 90)
      return () => window.clearTimeout(timer)
    }

    const transitionTimer = window.setTimeout(() => setPhase('bookshelf'), 1200)
    return () => window.clearTimeout(transitionTimer)
  }, [typedLength, fullText, phase])

  const handleAddBook = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newBookTitle.trim()) return

    const nextBook: StudyBook = {
      id: Date.now().toString(),
      title: newBookTitle.trim(),
      subtitle: '새로운 공부 목표가 책으로 추가되었습니다.',
      category: '새로운 목표'
    }

    setBooks((prev) => [nextBook, ...prev])
    setNewBookTitle('')
  }

  return (
    <main className="main-page library-page">
      <div className={`book-scene ${phase === 'bookshelf' ? 'scene-ready' : ''}`} />

      <section className="main-content library-layout">
        <div className={`welcome-card ${phase === 'bookshelf' ? 'hidden' : 'visible'}`}>
          <p className="lead">서재에 오신 것을 환영합니다</p>
          <div className="typing-text">
            {displayedLines.map((line, index) => (
              <span key={index} className="typing-line">
                {line}
                {index === displayedLines.length - 1 && <span className="typing-cursor" />}
                <br />
              </span>
            ))}
          </div>
          <p className="subtext">잠시 후 당신의 책장이 열립니다. 준비된 공부를 골라보세요.</p>
        </div>

        <div className={`shelf-card ${phase === 'bookshelf' ? 'visible' : 'hidden'}`}>
          <div className="shelf-top">
            <div>
              <p className="shelf-title">나의 책장</p>
              <p className="shelf-desc">공부할 항목을 책으로 보며 관리해보세요.</p>
            </div>
            <Link to="/profile" className="book-card profile-book">
              <div className="book-chip profile-chip">프로필</div>
              <h3>내 정보 보기</h3>
              <p>우측 상단 책을 클릭하면 프로필로 이동합니다.</p>
              <span className="book-action">열기</span>
            </Link>
          </div>

          <div className="add-book-panel">
            <form className="add-book-form" onSubmit={handleAddBook}>
              <input
                value={newBookTitle}
                onChange={(e) => setNewBookTitle(e.target.value)}
                placeholder="추가할 공부 항목을 입력하세요"
                aria-label="새 공부 항목"
              />
              <button type="submit">책 추가</button>
            </form>
          </div>

          <div className="book-shelf">
            {books.map((book) => (
              <button key={book.id} type="button" className="book-card study-book" onClick={() => setSelectedBook(book)}>
                <div className="book-chip">{book.category}</div>
                <h3>{book.title}</h3>
                <p>{book.subtitle}</p>
                <span className="book-action">책 펼치기</span>
              </button>
            ))}
          </div>

          <div className="main-footer">
            <div className="status-badge">{streakDays}일 연속 로그인 중</div>
            <button type="button" onClick={onLogout} className="logout-link">
              로그아웃
            </button>
          </div>
        </div>
      </section>

      {selectedBook && (
        <div className="book-reader-backdrop" onClick={() => setSelectedBook(null)}>
          <div className="book-reader" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-reader" onClick={() => setSelectedBook(null)}>
              닫기
            </button>
            <div className="book-spread">
              <article className="book-page left-page">
                <h2>{selectedBook.title}</h2>
                <p>{selectedBook.subtitle}</p>
                <p className="page-label">책장을 넘겨 보세요.</p>
              </article>
              <article className="book-page right-page">
                <div className="page-section">
                  <p>이 책은 현재 학습 목표를 설명합니다.</p>
                  <p>카테고리: {selectedBook.category}</p>
                  <p>책을 클릭하면 공부 내용을 더욱 자세히 확인할 수 있습니다.</p>
                </div>
              </article>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
