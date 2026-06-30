import React, { useEffect, useRef, useState } from 'react'

type Props = {
  children: React.ReactNode
  eyebrow?: string
  title?: string
  description?: string
}

type PaperParticle = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  width: number
  height: number
  angle: number
  angularVelocity: number
  restitution: number
  bounceCount: number
  age: number
  ttl: number
  opacity: number
  phase: number
  settled: boolean
  color: string
  shape: 'sheet' | 'strip' | 'shard'
}

const previewBooks = [
  { color: 'blue', label: '파란 책' },
  { color: 'pink', label: '분홍 책' },
  { color: 'green', label: '초록 책' },
]

const paperColors = ['#fff7ed', '#fef3c7', '#dbeafe', '#fce7f3', '#ecfeff']
const particleShapes: PaperParticle['shape'][] = ['sheet', 'strip', 'shard']
const particlesPerBurst = 30
const maxPaperParticles = 110
const gravity = 820
const fadeDuration = 1.5

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export default function AuthLayout({ children, eyebrow = 'Cause Library', title = 'Cause', description = '오늘의 학습을 책장처럼 정리하고 이어가세요.' }: Props) {
  const shellRef = useRef<HTMLElement>(null)
  const particleIdRef = useRef(0)
  const particlesRef = useRef<PaperParticle[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameRef = useRef<number | null>(null)
  const [particles, setParticles] = useState<PaperParticle[]>([])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const stepPhysics = (timestamp: number) => {
    const shell = shellRef.current
    if (!shell) {
      animationFrameRef.current = null
      return
    }

    const lastFrame = lastFrameRef.current ?? timestamp
    const dt = Math.min((timestamp - lastFrame) / 1000, 0.032)
    lastFrameRef.current = timestamp

    const shellRect = shell.getBoundingClientRect()
    const floorY = shellRect.height - 8
    const leftWall = 8
    const rightWall = shellRect.width - 8
    const ceiling = 8
    const nextParticles = particlesRef.current.map((particle) => ({ ...particle }))
    const settledParticles = nextParticles.filter((particle) => particle.settled)

    for (const particle of nextParticles) {
      particle.age += dt

      if (!particle.settled) {
        const airDamping = Math.pow(0.988, dt * 60)
        const verticalDamping = Math.pow(0.996, dt * 60)
        const spinDamping = Math.pow(0.992, dt * 60)
        const wind = Math.sin(timestamp * 0.0018 + particle.phase) * 24
        let touchedSurface = false

        particle.vx = (particle.vx + wind * dt) * airDamping
        particle.vy = (particle.vy + gravity * dt) * verticalDamping
        particle.angularVelocity *= spinDamping
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
        particle.angle += particle.angularVelocity * dt

        if (particle.x - particle.radius < leftWall) {
          particle.x = leftWall + particle.radius
          particle.vx = Math.abs(particle.vx) * 0.48
          particle.angularVelocity *= 0.72
        }

        if (particle.x + particle.radius > rightWall) {
          particle.x = rightWall - particle.radius
          particle.vx = -Math.abs(particle.vx) * 0.48
          particle.angularVelocity *= 0.72
        }

        if (particle.y - particle.radius < ceiling) {
          particle.y = ceiling + particle.radius
          particle.vy = Math.abs(particle.vy) * 0.32
        }

        if (particle.y + particle.radius > floorY) {
          particle.y = floorY - particle.radius
          particle.vy = -Math.abs(particle.vy) * particle.restitution
          particle.vx *= 0.68
          particle.angularVelocity *= 0.7
          particle.bounceCount += 1
          touchedSurface = true
        }

        for (const settledParticle of settledParticles) {
          const dx = particle.x - settledParticle.x
          const dy = particle.y - settledParticle.y
          const distance = Math.hypot(dx, dy) || 1
          const minDistance = particle.radius + settledParticle.radius * 0.82

          if (distance < minDistance) {
            const overlap = minDistance - distance
            const nx = dx / distance
            const ny = dy / distance
            const normalVelocity = particle.vx * nx + particle.vy * ny

            particle.x += nx * overlap
            particle.y += ny * overlap

            if (normalVelocity < 0) {
              particle.vx -= (1 + particle.restitution) * normalVelocity * nx
              particle.vy -= (1 + particle.restitution) * normalVelocity * ny
            }

            particle.vx *= 0.72
            particle.vy *= 0.58
            particle.angularVelocity *= 0.74
            particle.bounceCount += 1
            touchedSurface = true
          }
        }

        const speed = Math.hypot(particle.vx, particle.vy)
        if (touchedSurface && particle.age > 0.45 && (speed < 92 || particle.bounceCount >= 7)) {
          particle.settled = true
          particle.vx = 0
          particle.vy = 0
          particle.angularVelocity = 0
          settledParticles.push(particle)
        }
      }

      if (particle.age > particle.ttl - fadeDuration) {
        particle.opacity = clamp((particle.ttl - particle.age) / fadeDuration, 0, 1)
      }
    }

    const visibleParticles = nextParticles.filter((particle) => particle.age < particle.ttl && particle.opacity > 0.01)
    particlesRef.current = visibleParticles
    setParticles(visibleParticles)

    if (visibleParticles.length > 0) {
      animationFrameRef.current = window.requestAnimationFrame(stepPhysics)
      return
    }

    animationFrameRef.current = null
    lastFrameRef.current = null
  }

  const startPhysics = () => {
    if (animationFrameRef.current !== null) return

    lastFrameRef.current = null
    animationFrameRef.current = window.requestAnimationFrame(stepPhysics)
  }

  const burstPaper = (event: React.MouseEvent<HTMLButtonElement>) => {
    const shell = shellRef.current
    if (!shell) return

    const shellRect = shell.getBoundingClientRect()
    const bookRect = event.currentTarget.getBoundingClientRect()
    const originX = bookRect.left + bookRect.width / 2 - shellRect.left
    const originY = bookRect.top + bookRect.height * 0.42 - shellRect.top

    const createdParticles = Array.from({ length: particlesPerBurst }, () => {
      const launchAngle = randomBetween(-170, -10) * (Math.PI / 180)
      const launchSpeed = randomBetween(220, 560)
      const width = randomBetween(7, 15)
      const shape = particleShapes[Math.floor(Math.random() * particleShapes.length)]
      const height = shape === 'strip' ? width * randomBetween(1.7, 2.5) : width * randomBetween(0.8, 1.35)

      return {
        id: particleIdRef.current++,
        x: originX,
        y: originY,
        vx: Math.cos(launchAngle) * launchSpeed + randomBetween(-48, 48),
        vy: Math.sin(launchAngle) * launchSpeed + randomBetween(-90, -20),
        radius: Math.max(width, height) * 0.48,
        width,
        height,
        angle: randomBetween(-34, 34),
        angularVelocity: randomBetween(-520, 520),
        restitution: randomBetween(0.14, 0.28),
        bounceCount: 0,
        age: 0,
        ttl: randomBetween(8.5, 12),
        opacity: 1,
        phase: randomBetween(0, Math.PI * 2),
        settled: false,
        color: paperColors[Math.floor(Math.random() * paperColors.length)],
        shape,
      }
    })

    const nextParticles = [...particlesRef.current, ...createdParticles].slice(-maxPaperParticles)
    particlesRef.current = nextParticles
    setParticles(nextParticles)

    startPhysics()
  }

  return (
    <main className="auth-root">
      <div className="auth-background" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <section className="auth-shell" ref={shellRef} aria-label="인증 화면">
        <div className="auth-hero-panel">
          <p className="auth-eyebrow">{eyebrow}</p>
          <h1 className="service-title">{title}</h1>
          <p className="auth-description">{description}</p>
          <div className="mobile-preview" aria-label="책 미리보기">
            {previewBooks.map((book) => (
              <button
                key={book.color}
                className={`preview-book ${book.color}`}
                type="button"
                onClick={burstPaper}
                aria-label={`${book.label}에서 종이 파티클 터뜨리기`}
              />
            ))}
          </div>
        </div>

        <div className="auth-card">{children}</div>
        <div className="paper-burst-layer" aria-hidden="true">
          {particles.map((particle) => (
            <span
              key={particle.id}
              className={`paper-particle ${particle.shape}`}
              style={
                {
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  width: `${particle.width}px`,
                  height: `${particle.height}px`,
                  background: particle.color,
                  opacity: particle.opacity,
                  transform: `translate3d(-50%, -50%, 0) rotate(${particle.angle}deg)`,
                }
              }
            />
          ))}
        </div>
      </section>
    </main>
  )
}
