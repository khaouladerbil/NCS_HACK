import { cn } from "@/lib/utils"

type TextEffectProps = React.HTMLAttributes<HTMLSpanElement> & {
  children: React.ReactNode
  per?: "char" | "word"
  preset?: "fade"
}

export function TextEffect({
  children,
  className,
  per = "word",
  preset = "fade",
  ...props
}: TextEffectProps) {
  if (typeof children !== "string") {
    return (
      <span className={className} {...props}>
        {children}
      </span>
    )
  }

  const units = per === "char" ? Array.from(children) : children.split(" ")

  return (
    <span className={cn("inline-block", className)} {...props}>
      {units.map((unit, index) => {
        const content = per === "char" ? (unit === " " ? "\u00A0" : unit) : unit

        return (
          <span
            key={`${unit}-${index}`}
            className={cn(
              "inline-block will-change-transform",
              preset === "fade" && "animate-[text-effect-fade_220ms_ease-out_both]"
            )}
            style={{ animationDelay: `${index * 12}ms` }}
          >
            {content}
            {per === "word" ? "\u00A0" : null}
          </span>
        )
      })}
    </span>
  )
}
