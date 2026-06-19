import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
  to: string
  children: React.ReactNode
  className?: string
}

export default function LinkText({ to, children, className }: Props) {
  return (
    <Link to={to} className={`link-text ${className ?? ''}`}>
      {children}
    </Link>
  )
}
