export type Account = {
  username: string
  password: string
  role: 'developer' | 'user'
  displayName: string
  email?: string
  profileImage?: string
}

export const accounts: Account[] = [
  {
    username: 'dev_admin',
    password: 'CauseDev123!',
    role: 'developer',
    displayName: 'Cause 개발자',
    email: 'dev@cause.local'
  }
]

const storedAccountsKey = 'cause:accounts'

export function getStoredAccounts(): Account[] {
  if (typeof window === 'undefined') return []

  try {
    const rawAccounts = window.localStorage.getItem(storedAccountsKey)
    if (!rawAccounts) return []
    const parsedAccounts = JSON.parse(rawAccounts)
    return Array.isArray(parsedAccounts) ? parsedAccounts : []
  } catch {
    return []
  }
}

export function getAllAccounts() {
  return [...accounts, ...getStoredAccounts()]
}

export function saveStoredAccount(nextAccount: Account) {
  if (typeof window === 'undefined') return

  const storedAccounts = getStoredAccounts()
  const nextAccounts = [
    ...storedAccounts.filter((account) => account.username !== nextAccount.username),
    nextAccount,
  ]

  window.localStorage.setItem(storedAccountsKey, JSON.stringify(nextAccounts))
}
