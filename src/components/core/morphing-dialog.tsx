import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MorphingDialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const MorphingDialogContext =
  React.createContext<MorphingDialogContextValue | null>(null)

function useMorphingDialog() {
  const context = React.useContext(MorphingDialogContext)
  if (!context) {
    throw new Error("MorphingDialog components must be used within MorphingDialog.")
  }

  return context
}

export function MorphingDialog({
  children,
  transition: _transition,
}: {
  children: React.ReactNode
  transition?: React.CSSProperties | Record<string, unknown>
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <MorphingDialogContext.Provider value={{ open, setOpen }}>
      <div>{children}</div>
    </MorphingDialogContext.Provider>
  )
}

export function MorphingDialogTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useMorphingDialog()

  return (
    <button
      type="button"
      className={cn("text-left", className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
}

export function MorphingDialogContainer({
  children,
}: {
  children: React.ReactNode
}) {
  return createPortal(children, document.body)
}

export function MorphingDialogContent({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const { open, setOpen } = useMorphingDialog()

  React.useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full max-w-2xl overflow-hidden border border-border/70 bg-background shadow-[0_40px_120px_rgba(15,23,42,0.24)] animate-[dialog-enter_200ms_ease-out_both]",
            className
          )}
          style={style}
        >
          {children}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 size-8 rounded-full"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MorphingDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <h3 className={cn("text-base font-semibold text-foreground", className)}>{children}</h3>
}

export function MorphingDialogSubtitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

export function MorphingDialogImage({
  src,
  alt,
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={src} alt={alt} className={className} {...props} />
}

export function MorphingDialogClose({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = useMorphingDialog()

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className)}
      onClick={() => setOpen(false)}
      {...props}
    >
      <X className="size-4" />
      <span className="sr-only">Close</span>
    </Button>
  )
}
