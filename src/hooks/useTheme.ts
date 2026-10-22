import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Aplica a classe `dark` no <html> conforme a preferência salva (claro, escuro ou do sistema). */
export function useApplyTheme() {
  const pref = useAppStore((s) => s.settings.theme)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const isDark = pref === 'dark' || (pref === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#141c18' : '#f9faf7')
  }, [isDark])

  return isDark
}
