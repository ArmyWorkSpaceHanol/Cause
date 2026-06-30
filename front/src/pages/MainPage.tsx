import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Account } from '../data/accounts'

const bookColors = ['blue', 'violet', 'pink', 'emerald', 'amber'] as const

type BookColor = (typeof bookColors)[number]

type StudyBook = {
  id: string
  title: string
  subtitle: string
  category: string
  color: BookColor
}

type StudyBookCreateForm = {
  formName: 'CauseStudyBookCreateForm'
  schemaVersion: '1.0'
  requestId: string
  createdAt: string
  locale: 'ko-KR'
  user: {
    username: string
    displayName: string
    role: Account['role']
  }
  studyBook: {
    title: string
    topic: string
    periodText: string
    description: string
  }
  gptInstruction: {
    intent: 'create_study_plan'
    outputFormat: 'json'
    requiredSections: string[]
  }
}

type StudyBookApiResponse = {
  book?: {
    id?: string
    title?: string
    subtitle?: string
    category?: string
  }
  gpt?: {
    status: 'completed' | 'skipped'
    content?: string
    reason?: string
  }
  error?: string
}

type Props = {
  account: Account
  onLogout: () => void
}

const initialBooks: StudyBook[] = [
  { id: '1', title: 'TypeScript 마스터', subtitle: '타입 시스템 완전 정복', category: '프론트엔드', color: 'blue' },
  { id: '2', title: 'React Hooks 깊게 보기', subtitle: '상태와 효과를 설계하는 법', category: 'UI', color: 'violet' },
  { id: '3', title: 'CSS 레이아웃의 기술', subtitle: '반응형과 애니메이션 디자인', category: '스타일링', color: 'pink' },
  { id: '4', title: '코드 품질과 테스트', subtitle: '안정적인 개발을 위한 습관', category: '개발자', color: 'emerald' },
  { id: '5', title: '서비스 운영 체크리스트', subtitle: '배포와 모니터링 정복', category: '운영', color: 'amber' }
]

export default function MainPage({ account, onLogout }: Props) {
  const [streakDays, setStreakDays] = useState(1)
  const [typedLength, setTypedLength] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'bookshelf'>('typing')
  const [books, setBooks] = useState<StudyBook[]>(initialBooks)
  const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalCategory, setModalCategory] = useState('')
  const [modalPeriod, setModalPeriod] = useState('')
  const [isAddingBook, setIsAddingBook] = useState(false)
  const [addBookError, setAddBookError] = useState('')
  const modalTitleRef = useRef<HTMLInputElement | null>(null)
  const isBookshelfVisible = phase === 'bookshelf'

  const openAddBookModal = () => {
    setAddBookError('')
    setIsModalOpen(true)
  }

  const closeAddBookModal = () => {
    if (isAddingBook) return
    setAddBookError('')
    setIsModalOpen(false)
  }

  const fullText = `${account.displayName}님 환영합니다.\n${streakDays}일 연속 로그인입니다.`
  const displayedLines = fullText.slice(0, typedLength).split('\n')

  useEffect(() => {
    const storageKeyCount = `cause-login-streak:${account.username}`
    const storageKeyDate = `cause-login-date:${account.username}`
    const storedCount = Number(window.localStorage.getItem(storageKeyCount) ?? 0)
    const storedDate = window.localStorage.getItem(storageKeyDate)
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

    const nextCount = storedDate === today ? Math.max(1, storedCount) : storedDate === yesterday ? storedCount + 1 : 1

    window.localStorage.setItem(storageKeyCount, String(nextCount))
    window.localStorage.setItem(storageKeyDate, today)
    setStreakDays(nextCount)
  }, [account.username])

  useEffect(() => {
    if (phase !== 'typing') return undefined

    if (typedLength < fullText.length) {
      const timer = window.setTimeout(() => setTypedLength((value) => value + 1), 72)
      return () => window.clearTimeout(timer)
    }

    const transitionTimer = window.setTimeout(() => setPhase('bookshelf'), 1050)
    return () => window.clearTimeout(transitionTimer)
  }, [typedLength, fullText, phase])

  const buildStudyBookForm = (title: string, category: string, period: string): StudyBookCreateForm => {
    const trimmedTitle = title.trim()
    const trimmedCategory = category.trim()
    const trimmedPeriod = period.trim()
    const topic = trimmedCategory || '새로운 목표'
    const periodText = trimmedPeriod || '기간 미정'

    return {
      formName: 'CauseStudyBookCreateForm',
      schemaVersion: '1.0',
      requestId: `study-book-${Date.now()}`,
      createdAt: new Date().toISOString(),
      locale: 'ko-KR',
      user: {
        username: account.username,
        displayName: account.displayName,
        role: account.role,
      },
      studyBook: {
        title: trimmedTitle,
        topic,
        periodText,
        description: trimmedPeriod ? `공부 기간: ${trimmedPeriod}` : '새로운 공부 목표가 책으로 추가되었습니다.',
      },
      gptInstruction: {
        intent: 'create_study_plan',
        outputFormat: 'json',
        requiredSections: ['bookSummary', 'dailyPlan', 'milestones', 'recommendedResources', 'firstAction'],
      },
    }
  }

  const handleAddBook = async (title: string, category: string, period: string) => {
    setAddBookError('')

    const form = buildStudyBookForm(title, category, period)
    if (!form.studyBook.title) {
      setAddBookError('제목을 입력하세요.')
      return false
    }

    setIsAddingBook(true)
    try {
      const response = await fetch('/api/study-books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = (await response.json()) as StudyBookApiResponse
      if (!response.ok) {
        throw new Error(data.error || '책 추가 요청에 실패했습니다.')
      }

      setBooks((prev) => [
        ...prev,
        {
          id: data.book?.id || form.requestId,
          title: data.book?.title || form.studyBook.title,
          subtitle: data.book?.subtitle || form.studyBook.description,
          category: data.book?.category || form.studyBook.topic,
          color: bookColors[prev.length % bookColors.length],
        },
      ])

      if (data.gpt?.content) {
        console.log('GPT 학습 계획:', data.gpt.content)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : '서버 오류로 책을 추가하지 못했습니다.'
      setAddBookError(message)
      return false
    } finally {
      setIsAddingBook(false)
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      // focus the title input when modal opens
      setTimeout(() => modalTitleRef.current?.focus(), 120)
    }
  }, [isModalOpen])

  return (
    <main className={`main-page library-page ${isBookshelfVisible ? 'is-library-open' : ''}`}>
      <div className="library-aurora" aria-hidden="true" />

      {/* decorative side book removed per request */}

      <section className={`welcome-stage ${isBookshelfVisible ? 'hidden' : 'visible'}`} aria-live="polite" aria-hidden={isBookshelfVisible}>
        <p className="eyebrow">Cause Study Library</p>
        <div className="typing-panel">
          {displayedLines.map((line, index) => (
            <span key={index} className="typing-line">
              {line}
              {index === displayedLines.length - 1 && <span className="typing-cursor" />}
              <br />
            </span>
          ))}
        </div>
      </section>

        <section className={`bookshelf-stage ${isBookshelfVisible ? 'visible' : 'hidden'}`} aria-hidden={!isBookshelfVisible}>
        <header className="library-header">
          <div>
            <p className="eyebrow">Personal Knowledge Shelf</p>
            <h1>오늘 공부할 책을 골라보세요.</h1>
            <p className="library-description">학습 주제를 책등처럼 분류해 한눈에 보고, 클릭해서 내용을 펼칠 수 있습니다.</p>
          </div>

          <Link to="/profile" className="profile-book" aria-label={`${account.displayName} 프로필 책 열기`}>
            <span className="profile-book-label">Profile</span>
            <span className="profile-book-avatar" aria-hidden="true">
              {account.profileImage ? <img src={account.profileImage} alt="" /> : (account.displayName || account.username).slice(0, 1).toUpperCase()}
            </span>
            <strong>{account.displayName}</strong>
            <small>사용자 프로필 책</small>
          </Link>
        </header>

        {/* add button moved into the shelf as the last spine card */}

        <div className="shelf-unit" aria-label="공부 항목 책장">
          <div className="book-row">
            {books.map((book) => (
              <button
                key={book.id}
                type="button"
                className={`book-spine-card ${book.color}`}
                onClick={() => setSelectedBook(book)}
                aria-label={`${book.title} 책 펼치기`}
              >
                <span className="book-category">{book.category}</span>
                <strong>{book.title}</strong>
                <small>{book.subtitle}</small>
              </button>
            ))}

            <button
              type="button"
              className="book-spine-card add-card"
              onClick={openAddBookModal}
              aria-label="책 추가하기"
            >
              <span className="book-category">추가</span>
              <strong>새 공부 항목</strong>
              <small>버튼을 눌러 항목을 추가하세요</small>
            </button>
          </div>
        </div>
         <div className="main-footer">
          <div className="status-badge">{streakDays}일 연속 로그인</div>
          <button type="button" onClick={onLogout} className="logout-link">
            로그아웃
          </button>
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
                <p className="book-category">{selectedBook.category}</p>
                <h2>{selectedBook.title}</h2>
                <p>{selectedBook.subtitle}</p>
                <p className="page-label">선택한 공부 항목의 첫 페이지입니다.</p>
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

      {isModalOpen && (
        <div className="book-reader-backdrop" onClick={closeAddBookModal}>
          <div className="book-reader" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="close-reader" onClick={closeAddBookModal} disabled={isAddingBook}>
              닫기
            </button>
            <div className="book-spread">
              <article className="book-page left-page">
                <h2>새 공부 항목 추가</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const added = await handleAddBook(modalTitle, modalCategory, modalPeriod)
                    if (!added) return
                    setModalTitle('')
                    setModalCategory('')
                    setModalPeriod('')
                    closeAddBookModal()
                  }}
                >
                  <label>
                    제목
                    <input ref={modalTitleRef} value={modalTitle} onChange={(e) => setModalTitle(e.target.value)} />
                  </label>
                  <label>
                    주제
                    <input value={modalCategory} onChange={(e) => setModalCategory(e.target.value)} />
                  </label>
                  <label>
                    공부 기간
                    <input value={modalPeriod} onChange={(e) => setModalPeriod(e.target.value)} placeholder="예: 2주, 2026-07-01 ~ 2026-07-14" />
                  </label>
                  {addBookError && (
                    <div className="auth-error" role="alert">
                      {addBookError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={closeAddBookModal} disabled={isAddingBook}>
                      취소
                    </button>
                    <button type="submit" disabled={isAddingBook}>
                      {isAddingBook ? '전송 중...' : '추가'}
                    </button>
                  </div>
                </form>
              </article>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
