'use client'
import { cn } from '@/lib/utils'
import React, { ReactNode, useEffect, useState } from 'react'

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode
  showRadialGradient?: boolean
  animate?: boolean
  speed?: number
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  animate = false,
  speed = 4,
  ...props
}: AuroraBackgroundProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!animate) return

    let animationFrame: number
    let startTime = Date.now()

    const updateAnimation = () => {
      const elapsed = Date.now() - startTime
      const normalizedSpeed = speed / 100

      // Create flowing animation effect
      setPosition({
        x: Math.sin(elapsed * 0.001 * normalizedSpeed) * 50,
        y: Math.cos(elapsed * 0.0015 * normalizedSpeed) * 50,
      })

      animationFrame = requestAnimationFrame(updateAnimation)
    }

    animationFrame = requestAnimationFrame(updateAnimation)

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [animate, speed])

  return (
    <main>
      <div
        className={cn(
          'transition-bg relative flex h-[100vh] flex-col items-center justify-center bg-zinc-50 text-slate-950 dark:bg-zinc-900',
          className
        )}
        {...props}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={
            {
              '--aurora':
                'repeating-linear-gradient(100deg,#3b82f6 10%,#a5b4fc 15%,#93c5fd 20%,#ddd6fe 25%,#60a5fa 30%)',
              '--dark-gradient':
                'repeating-linear-gradient(100deg,#000 0%,#000 7%,transparent 10%,transparent 12%,#000 16%)',
              '--white-gradient':
                'repeating-linear-gradient(100deg,#fff 0%,#fff 7%,transparent 10%,transparent 12%,#fff 16%)',
              '--blue-300': '#93c5fd',
              '--blue-400': '#60a5fa',
              '--blue-500': '#3b82f6',
              '--indigo-300': '#a5b4fc',
              '--violet-200': '#ddd6fe',
              '--black': '#000',
              '--white': '#fff',
              '--transparent': 'transparent',
            } as React.CSSProperties
          }
        >
          <div
            className={cn(
              `pointer-events-none absolute -inset-[10px] opacity-50 blur-[10px] filter will-change-transform dark:invert-0`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}
            style={{
              backgroundImage: 'var(--dark-gradient), var(--aurora)',
              backgroundSize: '300%, 200%',
              backgroundPosition: `${50 + position.x}% ${50 + position.y}%, ${
                50 - position.x
              }% ${50 - position.y}%`,
              transition: animate ? 'none' : 'background-position 0.3s ease',
            }}
          >
            <div
              className="absolute inset-0 mix-blend-difference"
              style={{
                backgroundImage: 'var(--dark-gradient), var(--aurora)',
                backgroundSize: '200%, 100%',
                backgroundAttachment: 'fixed',
                backgroundPosition: `${50 - position.y}% ${50 - position.x}%, ${
                  50 + position.y
                }% ${50 + position.x}%`,
                transition: animate ? 'none' : 'background-position 0.3s ease',
              }}
            />
          </div>
        </div>
        {children}
      </div>
    </main>
  )
}
