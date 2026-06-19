import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>

export default function AuthButton({ children, ...rest }: Props) {
  return (
    <button className="auth-button" {...rest}>
      {children}
    </button>
  )
}
