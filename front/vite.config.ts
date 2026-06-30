import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash, randomInt, randomUUID } from 'node:crypto'

type StudyBookCreateForm = {
  formName?: string
  schemaVersion?: string
  requestId?: string
  createdAt?: string
  locale?: string
  user?: {
    username?: string
    displayName?: string
    role?: string
  }
  studyBook?: {
    title?: string
    topic?: string
    periodText?: string
    description?: string
  }
  gptInstruction?: {
    intent?: string
    outputFormat?: string
    requiredSections?: string[]
  }
}

type SendCodeRequest = {
  email?: string
}

type VerifyCodeRequest = {
  email?: string
  code?: string
}

type SignupRequest = {
  username?: string
  displayName?: string
  email?: string
  password?: string
}

type EmailVerificationRecord = {
  email: string
  salt: string
  codeHash: string
  expiresAt: number
  resendAvailableAt: number
  attempts: number
  verified: boolean
}

type ServerAccount = {
  username: string
  displayName: string
  email: string
  role: 'user'
}

const emailVerificationRecords = new Map<string, EmailVerificationRecord>()
const signedUpAccounts = new Map<string, ServerAccount>()
const reservedUsernames = new Set(['dev_admin'])
const verificationCodeTtlMs = 10 * 60 * 1000
const verificationCodeCooldownMs = 60 * 1000
const maxVerificationAttempts = 5

const readJsonBody = <T = Record<string, unknown>>(req: any) =>
  new Promise<T>((resolve, reject) => {
    let body = ''

    req.on('data', (chunk: { toString: () => string }) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        resolve((body ? JSON.parse(body) : {}) as T)
      } catch {
        reject(new Error('요청 본문이 올바른 JSON 형식이 아닙니다.'))
      }
    })

    req.on('error', reject)
  })

const sendJson = (res: any, statusCode: number, data: unknown) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(data))
}

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const normalizeEmailAddress = (value: unknown) => normalizeText(value).toLowerCase()

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const createVerificationCode = () => randomInt(0, 1_000_000).toString().padStart(6, '0')

const hashVerificationCode = (code: string, salt: string) =>
  createHash('sha256').update(`${salt}:${code}`).digest('hex')

const createAuthApiPlugin = () => ({
  name: 'cause-auth-api',
  configureServer(server: any) {
    server.middlewares.use('/api/auth/send-code', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'POST 요청만 지원합니다.' })
        return
      }

      try {
        const body = await readJsonBody<SendCodeRequest>(req)
        const email = normalizeEmailAddress(body.email)

        if (!isValidEmail(email)) {
          sendJson(res, 400, { error: '올바른 이메일 형식을 입력하세요.' })
          return
        }

        const now = Date.now()
        const existingRecord = emailVerificationRecords.get(email)

        if (existingRecord && existingRecord.resendAvailableAt > now) {
          const retryAfterSeconds = Math.ceil((existingRecord.resendAvailableAt - now) / 1000)
          sendJson(res, 429, { error: `${retryAfterSeconds}초 후에 다시 전송할 수 있습니다.`, retryAfterSeconds })
          return
        }

        const code = createVerificationCode()
        const salt = randomUUID()
        emailVerificationRecords.set(email, {
          email,
          salt,
          codeHash: hashVerificationCode(code, salt),
          expiresAt: now + verificationCodeTtlMs,
          resendAvailableAt: now + verificationCodeCooldownMs,
          attempts: 0,
          verified: false,
        })

        console.info(`[Cause auth] Verification code for ${email}: ${code}`)

        sendJson(res, 200, {
          sent: true,
          expiresInSeconds: verificationCodeTtlMs / 1000,
          cooldownSeconds: verificationCodeCooldownMs / 1000,
          devCode: process.env.NODE_ENV === 'production' ? undefined : code,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '인증코드 전송 중 오류가 발생했습니다.'
        sendJson(res, 500, { error: message })
      }
    })

    server.middlewares.use('/api/auth/verify-code', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'POST 요청만 지원합니다.' })
        return
      }

      try {
        const body = await readJsonBody<VerifyCodeRequest>(req)
        const email = normalizeEmailAddress(body.email)
        const code = normalizeText(body.code)
        const record = emailVerificationRecords.get(email)
        const now = Date.now()

        if (!isValidEmail(email) || !code) {
          sendJson(res, 400, { verified: false, error: '이메일과 인증코드를 입력하세요.' })
          return
        }

        if (!record) {
          sendJson(res, 400, { verified: false, error: '먼저 인증코드를 전송해주세요.' })
          return
        }

        if (record.expiresAt <= now) {
          emailVerificationRecords.delete(email)
          sendJson(res, 400, { verified: false, error: '인증코드가 만료되었습니다. 다시 전송해주세요.' })
          return
        }

        if (record.attempts >= maxVerificationAttempts) {
          emailVerificationRecords.delete(email)
          sendJson(res, 429, { verified: false, error: '인증 시도 횟수를 초과했습니다. 코드를 다시 전송해주세요.' })
          return
        }

        const isMatched = hashVerificationCode(code, record.salt) === record.codeHash
        if (!isMatched) {
          record.attempts += 1
          const remainingAttempts = Math.max(0, maxVerificationAttempts - record.attempts)
          sendJson(res, 400, { verified: false, error: `인증코드가 일치하지 않습니다. 남은 시도: ${remainingAttempts}회` })
          return
        }

        record.verified = true
        sendJson(res, 200, { verified: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : '인증코드 검증 중 오류가 발생했습니다.'
        sendJson(res, 500, { verified: false, error: message })
      }
    })

    server.middlewares.use('/api/auth/signup', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'POST 요청만 지원합니다.' })
        return
      }

      try {
        const body = await readJsonBody<SignupRequest>(req)
        const username = normalizeText(body.username)
        const displayName = normalizeText(body.displayName) || username
        const email = normalizeEmailAddress(body.email)
        const password = normalizeText(body.password)
        const verificationRecord = emailVerificationRecords.get(email)

        if (!username) {
          sendJson(res, 400, { error: '아이디를 입력하세요.' })
          return
        }

        if (!isValidEmail(email)) {
          sendJson(res, 400, { error: '올바른 이메일 형식을 입력하세요.' })
          return
        }

        if (password.length < 8) {
          sendJson(res, 400, { error: '비밀번호는 최소 8자 이상이어야 합니다.' })
          return
        }

        if (!verificationRecord?.verified || verificationRecord.expiresAt <= Date.now()) {
          sendJson(res, 400, { error: '이메일 인증을 완료해주세요.' })
          return
        }

        if (reservedUsernames.has(username) || signedUpAccounts.has(username)) {
          sendJson(res, 409, { error: '이미 사용 중인 아이디입니다.' })
          return
        }

        const isEmailUsed = [...signedUpAccounts.values()].some((account) => account.email === email)
        if (isEmailUsed) {
          sendJson(res, 409, { error: '이미 가입된 이메일입니다.' })
          return
        }

        const account: ServerAccount = {
          username,
          displayName,
          email,
          role: 'user',
        }

        signedUpAccounts.set(username, account)
        emailVerificationRecords.delete(email)
        sendJson(res, 200, { account })
      } catch (err) {
        const message = err instanceof Error ? err.message : '회원가입 처리 중 오류가 발생했습니다.'
        sendJson(res, 500, { error: message })
      }
    })
  },
})

const createGptStudyPlanForm = (form: StudyBookCreateForm) => {
  const title = normalizeText(form.studyBook?.title)
  const topic = normalizeText(form.studyBook?.topic) || '새로운 목표'
  const periodText = normalizeText(form.studyBook?.periodText) || '기간 미정'
  const displayName = normalizeText(form.user?.displayName) || '사용자'

  return {
    formName: 'CauseGPTStudyPlanForm',
    schemaVersion: '1.0',
    locale: form.locale || 'ko-KR',
    intent: form.gptInstruction?.intent || 'create_study_plan',
    userContext: {
      username: normalizeText(form.user?.username),
      displayName,
      role: normalizeText(form.user?.role) || 'user',
    },
    studyGoal: {
      title,
      topic,
      periodText,
      description: normalizeText(form.studyBook?.description),
    },
    responseContract: {
      outputFormat: form.gptInstruction?.outputFormat || 'json',
      language: 'Korean',
      requiredSections: form.gptInstruction?.requiredSections || ['bookSummary', 'dailyPlan', 'milestones', 'recommendedResources', 'firstAction'],
      dailyPlanItemShape: {
        day: 'number',
        topic: 'string',
        tasks: 'string[]',
        estimatedMinutes: 'number',
        checkPoint: 'string',
      },
    },
  }
}

const requestStudyPlanFromGPT = async (form: StudyBookCreateForm) => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_KEY
  if (!apiKey) {
    return {
      status: 'skipped' as const,
      reason: 'OPENAI_API_KEY가 설정되어 있지 않아 GPT 호출을 건너뜁니다.',
    }
  }

  const gptForm = createGptStudyPlanForm(form)
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: '너는 Cause 서비스의 학습 계획 생성기다. 사용자가 보낸 Form을 해석해 반드시 JSON만 응답한다.',
        },
        {
          role: 'user',
          content: JSON.stringify(gptForm),
        },
      ],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GPT 응답 에러: ${response.status} ${text}`)
  }

  const data = await response.json()
  return {
    status: 'completed' as const,
    content: data.choices?.[0]?.message?.content || '',
  }
}

const studyBookApiPlugin = () => ({
  name: 'cause-study-book-api',
  configureServer(server: any) {
    server.middlewares.use('/api/study-books', async (req: any, res: any) => {
      if (req.method !== 'POST') {
        sendJson(res, 405, { error: 'POST 요청만 지원합니다.' })
        return
      }

      try {
        const form = await readJsonBody<StudyBookCreateForm>(req)
        const title = normalizeText(form.studyBook?.title)
        const category = normalizeText(form.studyBook?.topic) || '새로운 목표'
        const periodText = normalizeText(form.studyBook?.periodText)

        if (form.formName !== 'CauseStudyBookCreateForm') {
          sendJson(res, 400, { error: '지원하지 않는 Form 형식입니다.' })
          return
        }

        if (!title) {
          sendJson(res, 400, { error: '책 제목을 입력하세요.' })
          return
        }

        const gpt = await requestStudyPlanFromGPT(form)
        sendJson(res, 200, {
          book: {
            id: form.requestId || `study-book-${Date.now()}`,
            title,
            category,
            subtitle: periodText && periodText !== '기간 미정' ? `공부 기간: ${periodText}` : '새로운 공부 목표가 책으로 추가되었습니다.',
          },
          gpt,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : '책 추가 처리 중 오류가 발생했습니다.'
        sendJson(res, 500, { error: message })
      }
    })
  },
})

export default defineConfig({
  plugins: [react(), createAuthApiPlugin(), studyBookApiPlugin()],
  server: { port: 3000 }
})
