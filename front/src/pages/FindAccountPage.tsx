import React from 'react'
import AuthLayout from '../components/AuthLayout'
import LinkText from '../components/LinkText'

export default function FindAccountPage() {
  return (
    <AuthLayout>
      <div className="info">
        <p>아이디/비밀번호 찾기 페이지 (임시)</p>
        <LinkText to="/">로그인으로 돌아가기</LinkText>
      </div>
    </AuthLayout>
  )
}
