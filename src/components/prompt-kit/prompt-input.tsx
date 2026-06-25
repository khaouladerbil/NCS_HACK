import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type PromptInputProps = {
  children: ReactNode
  className?: string
}

export function PromptInput({ children, className }: PromptInputProps) {
  return (
    <div
      className={cn(
        'relative flex w-full flex-col rounded-[var(--radius-lg)] border border-[var(--color-paper-300)] bg-white shadow-[var(--shadow-sm)] transition-all focus-within:border-[var(--color-espresso)] focus-within:ring-4 focus-within:ring-[rgba(246,226,127,0.35)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

type PromptInputTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string
}

export function PromptInputTextarea({
  className,
  value,
  onChange,
  ...props
}: PromptInputTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      onChange={onChange}
      className={cn(
        'min-h-24 w-full resize-none border-0 bg-transparent px-4 py-3 text-base leading-relaxed text-[var(--color-espresso)] placeholder-[var(--color-espresso-300)] focus:outline-none focus:ring-0',
        className,
      )}
      {...props}
    />
  )
}

type PromptInputActionsProps = {
  children: ReactNode
  className?: string
}

export function PromptInputActions({ children, className }: PromptInputActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 border-t border-[var(--color-paper-200)] px-3 py-2',
        className,
      )}
    >
      {children}
    </div>
  )
}

type PromptInputActionProps = {
  children: ReactNode
  tooltip?: string
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>['onClick']
}

export function PromptInputAction({ children, tooltip, onClick }: PromptInputActionProps) {
  return (
    <div className="group relative flex items-center">
      <button type="button" onClick={onClick} className="contents">
        {children}
      </button>
      {tooltip ? (
        <span className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 scale-75 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--color-espresso)] px-2 py-1 text-xs text-[var(--color-paper)] opacity-0 shadow-md transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
          {tooltip}
        </span>
      ) : null}
    </div>
  )
}
