import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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

const readJsonBody = (req: any) =>
  new Promise<StudyBookCreateForm>((resolve, reject) => {
    let body = ''

    req.on('data', (chunk: { toString: () => string }) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
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
        const form = await readJsonBody(req)
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
  plugins: [react(), studyBookApiPlugin()],
  server: { port: 3000 }
})
