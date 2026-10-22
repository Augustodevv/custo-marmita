import { Database, Download, Monitor, Moon, RotateCcw, Store, Sun, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { backupFileName, makeBackup, parseBackup } from '@/lib/backup'
import { formatDate, todayISO } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  defaultCosts,
  hasSampleData,
  initialData,
  useAppStore,
  type AppData,
  type ThemePref,
} from '@/store/useAppStore'

const themes: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Do sistema', icon: Monitor },
]

function currentData(): AppData {
  const s = useAppStore.getState()
  return {
    ingredients: s.ingredients,
    packaging: s.packaging,
    recipes: s.recipes,
    costs: s.costs,
    fees: s.fees,
    pricing: s.pricing,
    plan: s.plan,
    kits: s.kits,
    settings: s.settings,
  }
}

export function SettingsPage() {
  const settings = useAppStore((s) => s.settings)
  const setTheme = useAppStore((s) => s.setTheme)
  const setSettings = useAppStore((s) => s.setSettings)
  const clearSampleData = useAppStore((s) => s.clearSampleData)
  const loadSampleData = useAppStore((s) => s.loadSampleData)
  const replaceAll = useAppStore((s) => s.replaceAll)
  const hasSamples = useAppStore(hasSampleData)
  const counts = {
    ingredients: useAppStore((s) => s.ingredients.length),
    packaging: useAppStore((s) => s.packaging.length),
    recipes: useAppStore((s) => s.recipes.length),
  }
  const fileRef = useRef<HTMLInputElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pendingImport, setPendingImport] = useState<{ data: AppData; exportedAt?: string } | null>(null)

  const exportData = () => {
    const blob = new Blob([makeBackup(currentData())], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = backupFileName(todayISO())
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup baixado. Guarde o arquivo em local seguro.')
  }

  const onFile = async (file?: File) => {
    if (!file) return
    const parsed = parseBackup(await file.text(), initialData)
    if (!parsed.ok) {
      toast.error(parsed.error)
      return
    }
    setPendingImport({ data: parsed.data, exportedAt: parsed.exportedAt })
  }

  return (
    <>
      <PageHeader title="Configurações" />
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4" /> Seu negócio
            </CardTitle>
            <CardDescription>Aparece no cardápio do dia e nos PDFs.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="biz-name">Nome</Label>
              <Input
                id="biz-name"
                value={settings.businessName}
                onChange={(e) => setSettings({ businessName: e.target.value })}
                placeholder="Ex.: Marmitas da Ana"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="biz-wpp">WhatsApp</Label>
                <Input
                  id="biz-wpp"
                  inputMode="tel"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="biz-ig">Instagram</Label>
                <Input
                  id="biz-ig"
                  value={settings.instagram}
                  onChange={(e) => setSettings({ instagram: e.target.value })}
                  placeholder="@seuperfil"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
                    settings.theme === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-secondary',
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
              <Download className="size-4" /> Backup dos dados
            </CardTitle>
            <CardDescription>
              Os dados ficam salvos só neste aparelho. Exporte um arquivo para guardar ou para levar do
              celular para o computador (e vice-versa).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">
              Hoje: {counts.recipes} fichas, {counts.ingredients} ingredientes e {counts.packaging}{' '}
              embalagens.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportData}>
                <Download /> Exportar (JSON)
              </Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload /> Importar backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  void onFile(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4" /> Dados de exemplo
            </CardTitle>
            <CardDescription>
              O app vem com ingredientes, embalagens, marmitas e custos de exemplo para você entender como
              funciona.
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
            <Button variant="ghost" className="text-destructive" onClick={() => setConfirmReset(true)}>
              Apagar tudo
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Limpar dados de exemplo?"
        description="Remove os ingredientes, embalagens, fichas, kits e custos de exemplo. O que você criou ou editou é mantido."
        confirmLabel="Limpar"
        onConfirm={() => {
          clearSampleData()
          toast.success('Dados de exemplo removidos.')
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Apagar todos os dados?"
        description="Apaga fichas, ingredientes, embalagens, kits, estoque e custos deste aparelho. Faça um backup antes. Essa ação não pode ser desfeita."
        confirmLabel="Apagar tudo"
        onConfirm={() => {
          replaceAll({
            ...initialData,
            ingredients: [],
            packaging: [],
            recipes: [],
            kits: [],
            plan: {},
            costs: { ...defaultCosts, fixedCosts: [], labor: [] },
            settings,
          })
          toast.success('Todos os dados foram apagados.')
        }}
      />
      <ConfirmDialog
        open={!!pendingImport}
        onOpenChange={(o) => !o && setPendingImport(null)}
        destructive={false}
        title="Substituir os dados por este backup?"
        description={
          pendingImport
            ? `O backup${pendingImport.exportedAt ? ` de ${formatDate(pendingImport.exportedAt)}` : ''} tem ${pendingImport.data.recipes.length} fichas e ${pendingImport.data.ingredients.length} ingredientes. Os dados atuais deste aparelho serão substituídos.`
            : undefined
        }
        confirmLabel="Importar"
        onConfirm={() => {
          if (pendingImport) replaceAll(pendingImport.data)
          toast.success('Backup importado!')
        }}
      />
    </>
  )
}
