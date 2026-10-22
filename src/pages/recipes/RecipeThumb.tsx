import { UtensilsCrossed } from 'lucide-react'
import { cn } from '@/lib/utils'

export function RecipeThumb({ photo, name, className }: { photo?: string; name: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-accent text-primary',
        className,
      )}
    >
      {photo ? (
        <img src={photo} alt={name} className="size-full object-cover" />
      ) : (
        <UtensilsCrossed className="size-1/3" />
      )}
    </div>
  )
}
