import React, { useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  eyebrow?: string
  title?: string
  description?: string
}

export default function AuthLayout({ children, eyebrow = 'Cause Library', title = 'Cause', description = '오늘의 학습을 책장처럼 정리하고 이어가세요.' }: Props) {

  return (
    <main className="auth-root">
      <div className="auth-background" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <section className="auth-shell" aria-label="인증 화면">
        <div className="auth-hero-panel">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 className="service-title">{title}</h1>
          <p className="auth-description">{description}</p>
          <div className="mobile-preview" aria-hidden="true">
            {[ 'blue', 'pink', 'green' ].map((c) => (
              <div key={c} className={`preview-book ${c}`} aria-hidden />
            ))}
          </div>
        </div>

        <div className="auth-card">{children}</div>
      </section>
    </main>
  )
}