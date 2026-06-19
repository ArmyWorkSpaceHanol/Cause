import React from 'react'
import AuthLayout from '../components/AuthLayout'
import LinkText from '../components/LinkText'

export default function SignupPage() {
  return (
    <AuthLayout>
      <div className="info">
        <p>회원가입 페이지 (임시)</p>
        <LinkText to="/">로그인으로 돌아가기</LinkText>
      </div>
    </AuthLayout>
  )
}
