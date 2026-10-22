import { Database, Monitor, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { hasSampleData, useAppStore, type ThemePref } from '@/store/useAppStore'

const themes: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Do sistema', icon: Monitor },
]

export function SettingsPage() {
  const theme = useAppStore((s) => s.settings.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const clearSampleData = useAppStore((s) => s.clearSampleData)
  const loadSampleData = useAppStore((s) => s.loadSampleData)
  const hasSamples = useAppStore(hasSampleData)
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>O modo escuro ajuda a usar na cozinha com pouca luz.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors',
                    theme === value ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-secondary',
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4" /> Dados de exemplo
            </CardTitle>
            <CardDescription>
              O app vem com ingredientes, embalagens e marmitas de exemplo para você entender como funciona.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {hasSamples ? (
              <Button variant="destructive" onClick={() => setConfirmClear(true)}>
                <Trash2 /> Limpar dados de exemplo
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  loadSampleData()
                  toast.success('Dados de exemplo carregados.')
                }}
              >
                <RotateCcw /> Carregar dados de exemplo
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Limpar dados de exemplo?"
        description="Remove os ingredientes, embalagens e fichas de exemplo. Itens que você criou ou editou são mantidos."
        confirmLabel="Limpar"
        onConfirm={() => {
          clearSampleData()
          toast.success('Dados de exemplo removidos.')
        }}
      />
    </>
  )
}
