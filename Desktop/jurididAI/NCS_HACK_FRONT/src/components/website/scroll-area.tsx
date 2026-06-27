import { ScrollArea as BaseScrollArea, ScrollBar } from "@/components/ui/scroll-area"

type ScrollAreaProps = React.ComponentProps<typeof BaseScrollArea> & {
  type?: "scroll"
}

function ScrollArea({ type: _type, ...props }: ScrollAreaProps) {
  return <BaseScrollArea {...props} />
}

export { ScrollArea, ScrollBar }
