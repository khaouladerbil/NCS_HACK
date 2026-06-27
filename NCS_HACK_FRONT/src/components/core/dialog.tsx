"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { AnimatePresence, motion, type Transition, type Variants } from "motion/react"

import { cn } from "@/lib/utils"

type DialogContextValue = {
  open: boolean
  setOpen: (value: boolean) => void
}

const DialogContext = createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used inside Dialog")
  }

  return context
}

function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  variants,
  transition,
}: {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variants?: Variants
  transition?: Transition
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen

  const setOpen = useCallback((value: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(value)
    }
    onOpenChange?.(value)
  }, [controlledOpen, onOpenChange])

  const value = useMemo(() => ({ open, setOpen }), [open, setOpen])

  return (
    <DialogMotionContext.Provider value={{ variants, transition }}>
      <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
    </DialogMotionContext.Provider>
  )
}

const DialogMotionContext = createContext<{
  variants?: Variants
  transition?: Transition
} | null>(null)

function DialogTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext()

  return (
    <button
      type="button"
      className={className}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) setOpen(true)
      }}
      {...props}
    >
      {children}
    </button>
  )
}

function DialogContent({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const { open, setOpen } = useDialogContext()
  const motionConfig = useContext(DialogMotionContext)
  const variants = motionConfig?.variants ?? {
    initial: { opacity: 0, scale: 0.95, y: 40 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 40 },
  }
  const transition = motionConfig?.transition ?? {
    type: "spring",
    bounce: 0,
    duration: 0.25,
  }

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, setOpen])

  if (typeof document === "undefined") return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className={cn(
              "relative z-10 w-full max-w-md rounded-[1.25rem] bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.2)]",
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1.5", className)} {...props} />
}

function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold text-zinc-900", className)} {...props} />
}

function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-zinc-600", className)} {...props} />
}

function DialogClose({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useDialogContext()

  return (
    <button
      type="button"
      className={cn("absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900", className)}
      onClick={(event) => {
        props.onClick?.(event)
        if (!event.defaultPrevented) setOpen(false)
      }}
      {...props}
    >
      {children ?? <X className="size-4" />}
    </button>
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
}
