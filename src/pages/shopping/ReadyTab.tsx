import {
  CheckCircle2,
  CircleSlash,
  Copy,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Share2,
  TriangleAlert,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { NumberField } from '@/components/common/NumberField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { isExtra } from '@/lib/calc/analysis'
import { menuText, readyStatus, soldOut, type ReadyStatus } from '@/lib/calc/menu'
import { formatDate, todayISO } from '@/lib/format'
import type { Recipe } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const statusInfo: Record<ReadyStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  esgotada: {
    label: 'Esgotada',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  ultimas: {
    label: 'Últimas',
    icon: TriangleAlert,
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  disponivel: {
    label: 'Disponível',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  'sem-controle': { label: 'Sem controle', icon: CircleSlash, className: 'bg-muted text-muted-foreground' },
}

function ReadyBadge({ status }: { status: ReadyStatus }) {
  const s = statusInfo[status]
  const Icon = s.icon
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        s.className,
      )}
    >
      <Icon className="size-3" /> {s.label}
    </span>
  )
}

function ReadyRow({ recipe, alertAt }: { recipe: Recipe; alertAt: number }) {
  const adjustReady = useAppStore((s) => s.adjustReady)
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const value = recipe.readyStock
  return (
    <li className={cn('flex items-center gap-2 px-3 py-2', recipe.hidden && 'opacity-50')}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{recipe.name}</p>
        <ReadyBadge status={readyStatus(recipe, alertAt)} />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground"
        aria-label={
          recipe.hidden ? `Mostrar ${recipe.name} no cardápio` : `Ocultar ${recipe.name} do cardápio`
        }
        title={recipe.hidden ? 'Fora do cardápio' : 'No cardápio'}
        onClick={() => updateRecipe(recipe.id, { hidden: !recipe.hidden })}
      >
        {recipe.hidden ? <EyeOff /> : <Eye />}
      </Button>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Vendi 1 ${recipe.name}`}
          title="Vendi 1"
          disabled={!value}
          onClick={() => adjustReady({ [recipe.id]: -1 })}
        >
          <Minus />
        </Button>
        <Input
          inputMode="numeric"
          aria-label={`Prontas de ${recipe.name}`}
          className="h-8 w-14 text-center tabular-nums"
          value={value ?? ''}
          placeholder="—"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const t = e.target.value.replace(/\D/g, '')
            updateRecipe(recipe.id, { readyStock: t === '' ? undefined : Math.min(Number(t), 99999) })
          }}
        />
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Mais 1 ${recipe.name}`}
          onClick={() => adjustReady({ [recipe.id]: 1 })}
        >
          <Plus />
        </Button>
      </div>
    </li>
  )
}

export function ReadyTab() {
  const recipes = useAppStore((s) => s.recipes)
  const settings = useAppStore((s) => s.settings)
  const setSettings = useAppStore((s) => s.setSettings)
  const [hideSoldOut, setHideSoldOut] = useState(false)
  const [showPrices, setShowPrices] = useState(true)

  const alertAt = settings.readyAlert
  const out = soldOut(recipes)
  const marmitas = recipes.filter((r) => !isExtra(r))
  const extras = recipes.filter(isExtra)
  const text = menuText(recipes, alertAt, {
    title: settings.businessName || 'Cardápio',
    date: formatDate(todayISO()).slice(0, 5),
    hideSoldOut,
    showPrices,
  })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Cardápio copiado! Cole no WhatsApp ou no Instagram.')
    } catch {
      toast.error('Não foi possível copiar. Use o botão Compartilhar.')
    }
  }
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Cardápio do dia', text })
      } catch {
        /* cancelado */
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px] lg:items-start">
      <div className="grid gap-4">
        {out.length > 0 && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300"
          >
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>{out.length} esgotada(s):</strong> {out.map((r) => r.name).join(', ')}. Produza mais ou
              elas saem marcadas como esgotadas no cardápio.
            </span>
          </p>
        )}
        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Marmitas prontas</CardTitle>
            <CardDescription>
              Quantas você tem prontas para vender. Use − a cada venda. Deixe em branco o que não quer
              controlar e toque no olho para tirar um prato do cardápio.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <NumberField
              className="max-w-xs"
              label="Avisar “últimas unidades” quando restar até"
              suffix="un"
              value={alertAt}
              decimals={0}
              max={999}
              onValueChange={(v) => setSettings({ readyAlert: v ?? 0 })}
            />
            <ul className="divide-y rounded-lg border">
              {marmitas.map((r) => (
                <ReadyRow key={r.id} recipe={r} alertAt={alertAt} />
              ))}
            </ul>
            {extras.length > 0 && (
              <>
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Adicionais
                </p>
                <ul className="divide-y rounded-lg border">
                  {extras.map((r) => (
                    <ReadyRow key={r.id} recipe={r} alertAt={alertAt} />
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="gap-3 lg:sticky lg:top-8">
        <CardHeader>
          <CardTitle>Cardápio do dia</CardTitle>
          <CardDescription>Pronto para colar no WhatsApp, nos Status ou no Instagram.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <Switch checked={hideSoldOut} onCheckedChange={setHideSoldOut} /> Esconder esgotados
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={showPrices} onCheckedChange={setShowPrices} /> Mostrar preços
            </label>
          </div>
          <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted/60 p-3 font-sans text-[13px] leading-relaxed whitespace-pre-wrap">
            {text}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button onClick={copy}>
              <Copy /> Copiar cardápio
            </Button>
            <Button variant="outline" onClick={share}>
              <Share2 /> Compartilhar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
