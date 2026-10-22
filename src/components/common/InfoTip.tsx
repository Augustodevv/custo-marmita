import { CircleHelp } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { glossary, type GlossaryKey } from '@/lib/glossary'
import { cn } from '@/lib/utils'

interface InfoTipProps {
  term?: GlossaryKey
  title?: string
  text?: string
  className?: string
}

/** Ícone "?" que abre uma explicação. Usa Popover (toque) em vez de hover para funcionar no celular. */
export function InfoTip({ term, title, text, className }: InfoTipProps) {
  const entry = term ? glossary[term] : undefined
  const t = title ?? entry?.title
  const body = text ?? entry?.text
  return (
    <Popover>
      <PopoverTrigger
        type="button"
        aria-label={`O que é ${t ?? 'isso'}?`}
        className={cn(
          'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          className,
        )}
      >
        <CircleHelp className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm leading-relaxed" side="top">
        {t && <p className="mb-1 font-semibold">{t}</p>}
        <p className="text-muted-foreground">{body}</p>
      </PopoverContent>
    </Popover>
  )
}
