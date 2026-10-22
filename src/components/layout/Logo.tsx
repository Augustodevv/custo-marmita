export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
            <rect x="3" y="8" width="18" height="11" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M2 8h20M12 8v11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9 5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight">Custo Marmita</p>
          <p className="text-[11px] text-muted-foreground">Custos e precificação</p>
        </div>
      </div>
    </div>
  )
}
