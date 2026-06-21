import React from 'react'
import AuthLayout from '../components/AuthLayout'
import LinkText from '../components/LinkText'

export default function FindAccountPage() {
  return (
    <AuthLayout eyebrow="Account Help" title="계정 찾기" description="계정 복구 흐름도 모바일 중심의 간결한 경험으로 확장할 예정입니다.">
      <div className="info auth-state-card">
        <span className="auth-pill">Support</span>
        <h2>아이디/비밀번호 찾기 준비 중</h2>
        <p>현재는 관리자 데모 계정으로 로그인해 최신 책장 UI를 확인해 주세요.</p>
        <LinkText to="/" className="return-link">로그인으로 돌아가기</LinkText>
      </div>
    </AuthLayout>
  )
}
