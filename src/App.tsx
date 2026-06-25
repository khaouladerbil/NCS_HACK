import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Lenis from 'lenis'

function App() {
  const heroRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.1 })
    let frame = 0

    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }

    frame = requestAnimationFrame(raf)

    const ctx = gsap.context(() => {
      gsap.from('[data-animate="hero"]', {
        opacity: 0,
        y: 24,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
      })
    }, heroRef)

    return () => {
      cancelAnimationFrame(frame)
      ctx.revert()
      lenis.destroy()
    }
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section
        ref={heroRef}
        className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20"
      >
        <div
          data-animate="hero"
          className="inline-flex w-fit items-center rounded-full border border-border bg-card px-4 py-1 text-sm text-muted-foreground shadow-sm"
        >
          JusticePath · React 19 · Vite 8 · shadcn/ui ready
        </div>
        <div data-animate="hero" className="mt-8 max-w-3xl space-y-6">
          <h1 className="text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
            Frontend scaffold live. Prompt Kit lane ready.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            This workspace now runs a React website in this directory, points to the
            linked GitHub repository, and is configured for shadcn plus registry
            components.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <article
            data-animate="hero"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">Remote</p>
            <p className="mt-2 font-medium">khaouladerbil/NCS_HACK.git</p>
          </article>
          <article
            data-animate="hero"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">UI Stack</p>
            <p className="mt-2 font-medium">shadcn/ui + Prompt Kit</p>
          </article>
          <article
            data-animate="hero"
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <p className="text-sm text-muted-foreground">Path</p>
            <p className="mt-2 font-medium">Ready for components and app buildout</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default App
