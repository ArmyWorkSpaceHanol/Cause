import React from 'react'

type Props = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="auth-root">
      <div className="auth-card">
        <h1 className="service-title">Cause</h1>
        {children}
      </div>
    </div>
  )
}
