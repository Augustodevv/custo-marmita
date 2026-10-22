import { Menu, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useApplyTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { Logo } from './Logo'
import { navItems } from './nav'

function ThemeToggle({ isDark, className }: { isDark: boolean; className?: string }) {
  const setTheme = useAppStore((s) => s.setTheme)
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={isDark ? 'Usar modo claro' : 'Usar modo escuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}

function SideNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="grid gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/80 hover:bg-secondary hover:text-sidebar-foreground',
            )
          }
        >
          <Icon className="size-4.5" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const isDark = useApplyTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const mobileItems = navItems.filter((n) => n.mobile)
  const moreActive = !mobileItems.some((n) =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to),
  )

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-dvh">
      {/* Menu lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar px-4 py-5 md:flex">
        <Logo className="mb-6 px-2" />
        <SideNavLinks />
        <div className="mt-auto flex items-center justify-between px-2 text-xs text-muted-foreground">
          <span>Dados salvos neste aparelho</span>
          <ThemeToggle isDark={isDark} />
        </div>
      </aside>

      {/* Topo (celular) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/85 px-4 py-2.5 backdrop-blur md:hidden">
        <Logo />
        <ThemeToggle isDark={isDark} />
      </header>

      <main className="px-4 pt-5 pb-28 sm:px-6 md:ml-64 md:px-8 md:pt-8 md:pb-12">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Barra inferior (celular) */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {mobileItems.map(({ to, short, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-5" />
              {short}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
              moreActive ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            <Menu className="size-5" />
            Mais
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="px-0">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SideNavLinks onNavigate={() => setMoreOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
