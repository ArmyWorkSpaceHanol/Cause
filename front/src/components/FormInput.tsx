import React, { useState } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export default function FormInput({ label, type, ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (visible ? 'text' : 'password') : (type as any)

  return (
    <label className="form-input">
      {label && <span className="form-label">{label}</span>}
      <div className="input-wrap">
        <input {...(rest as any)} type={inputType} className="input-field" />
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
            onClick={() => setVisible((v) => !v)}
          >
            <svg className={visible ? 'icon visible' : 'icon hidden'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg className={visible ? 'icon hidden' : 'icon visible'} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
              <path d="M4 4l16 16" />
            </svg>
          </button>
        )}
      </div>
    </label>
  )
}
