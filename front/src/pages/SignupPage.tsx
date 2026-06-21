import React from 'react'
import AuthLayout from '../components/AuthLayout'
import LinkText from '../components/LinkText'

export default function SignupPage() {
  return (
    <AuthLayout eyebrow="Join Cause" title="새 책장 만들기" description="가입 기능이 열리면 나만의 학습 책장을 바로 구성할 수 있어요.">
      <div className="info auth-state-card">
        <span className="auth-pill">Coming soon</span>
        <h2>회원가입 페이지 준비 중</h2>
        <p>현재는 데모 계정으로 로그인해 모바일 최적화 책장 경험을 먼저 확인할 수 있습니다.</p>
        <LinkText to="/" className="return-link">로그인으로 돌아가기</LinkText>
      </div>
    </AuthLayout>
  )
}
