export type Account = {
  username: string
  password: string
  role: 'developer' | 'user'
  displayName: string
}

export const accounts: Account[] = [
  {
    username: 'dev_admin',
    password: 'CauseDev123!',
    role: 'developer',
    displayName: 'Cause 개발자'
  }
]
