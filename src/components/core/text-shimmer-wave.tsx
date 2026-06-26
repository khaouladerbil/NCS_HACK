import { cn } from "@/lib/utils"

type TextShimmerWaveProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactNode
  duration?: number
}

export function TextShimmerWave({
  children,
  className,
  duration = 1.8,
  style,
  ...props
}: TextShimmerWaveProps) {
  return (
    <span
      className={cn(
        "inline-block bg-[linear-gradient(120deg,var(--color-muted-foreground)_10%,var(--color-foreground)_48%,var(--color-muted-foreground)_82%)] bg-[length:220%_100%] bg-clip-text text-transparent animate-[text-shimmer-wave_var(--wave-duration)_linear_infinite]",
        className
      )}
      style={
        {
          ...style,
          ["--wave-duration" as string]: `${duration}s`,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </span>
  )
}
