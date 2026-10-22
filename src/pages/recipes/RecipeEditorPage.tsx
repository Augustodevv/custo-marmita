import { ArrowLeft, Camera, Copy, ImageOff, Scale, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { InfoTip } from '@/components/common/InfoTip'
import { ItemPicker } from '@/components/common/ItemPicker'
import { NumberField } from '@/components/common/NumberField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { priceRecipe } from '@/lib/calc/analysis'
import { calcRecipeCost } from '@/lib/calc/recipe'
import { costPerBaseUnit, packagingUnitCost } from '@/lib/calc/units'
import { formatBRL, formatBRLUnit, formatNumber, formatPercent } from '@/lib/format'
import { resizeImage } from '@/lib/image'
import {
  ingredientCategoryLabels,
  packagingTypeLabels,
  perDisplayUnit,
  recipeCategoryLabels,
} from '@/lib/labels'
import { baseUnitOf } from '@/lib/calc/units'
import type { Recipe, RecipeCategory, RecipeSize } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { usePricingContext } from '../pricing/usePricingContext'
import { RecipeThumb } from './RecipeThumb'

type Draft = Omit<Recipe, 'id' | 'createdAt'>

const emptyDraft: Draft = {
  name: '',
  category: 'fit',
  size: 'M',
  targetWeight: 350,
  items: [],
  packaging: [],
}

const SIZE_HINT: Record<RecipeSize, string> = { P: '≈ 250 g', M: '≈ 350 g', G: '≈ 450 g' }

export function RecipeEditorPage() {
  const { id } = useParams()
  const recipe = useAppStore((s) => s.recipes.find((r) => r.id === id))
  if (id && id !== 'nova' && !recipe) {
    return (
      <div className="py-16 text-center">
        <p className="font-semibold">Ficha não encontrada.</p>
        <Button variant="link" asChild>
          <Link to="/fichas">Voltar para as fichas</Link>
        </Button>
      </div>
    )
  }
  // key: reinicia o rascunho ao navegar entre fichas (ex.: depois de duplicar)
  return <RecipeEditor key={recipe?.id ?? 'nova'} recipe={recipe} />
}

function toDraft(r: Recipe): Draft {
  const { id: _id, createdAt: _c, ...rest } = r
  return structuredClone(rest)
}

function Section({ title, action, children }: { title: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 sm:px-6">
        <CardTitle className="text-base">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="px-4 sm:px-6">{children}</CardContent>
    </Card>
  )
}

function RecipeEditor({ recipe }: { recipe?: Recipe }) {
  const ingredients = useAppStore((s) => s.ingredients)
  const packagingList = useAppStore((s) => s.packaging)
  const addRecipe = useAppStore((s) => s.addRecipe)
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe)
  const deleteRecipe = useAppStore((s) => s.deleteRecipe)
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const original = useMemo(() => (recipe ? toDraft(recipe) : emptyDraft), [recipe])
  const [d, setD] = useState<Draft>(original)
  const [submitted, setSubmitted] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const saving = useRef(false)

  const dirty = JSON.stringify(d) !== JSON.stringify(original)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    return dirty && !saving.current && currentLocation.pathname !== nextLocation.pathname
  })

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))
  const cost = calcRecipeCost(d, ingredients, packagingList)
  const ctx = usePricingContext()
  const pricing = priceRecipe({ ...d, id: recipe?.id ?? 'rascunho', createdAt: '' }, ctx)
  const ingMap = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients])
  const packMap = useMemo(() => new Map(packagingList.map((p) => [p.id, p])), [packagingList])

  const nameError = !d.name.trim()
  const qtyError = d.items.some((i) => !(i.qty > 0)) || d.packaging.some((p) => !(p.qty > 0))
  const weightDiff = d.targetWeight > 0 ? (cost.totalWeight - d.targetWeight) / d.targetWeight : 0

  const save = () => {
    setSubmitted(true)
    if (nameError || qtyError) {
      toast.error('Confira os campos destacados antes de salvar.')
      return
    }
    saving.current = true
    const data = { ...d, name: d.name.trim(), sample: false }
    if (recipe) {
      updateRecipe(recipe.id, data)
      toast.success('Ficha técnica salva!')
      navigate('/fichas')
    } else {
      addRecipe(data)
      toast.success('Ficha técnica criada!')
      navigate('/fichas')
    }
  }

  const onPhoto = async (file?: File) => {
    if (!file) return
    try {
      set('photo', await resizeImage(file))
    } catch {
      toast.error('Não foi possível usar essa imagem.')
    }
  }

  const ingredientOptions = ingredients
    .filter((i) => !d.items.some((it) => it.ingredientId === i.id))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name, 'pt-BR'))
    .map((i) => {
      const u = perDisplayUnit(costPerBaseUnit(i), baseUnitOf(i.unit))
      return {
        id: i.id,
        label: i.name,
        group: ingredientCategoryLabels[i.category],
        detail: `${formatBRL(u.value)}/${u.unit}`,
      }
    })

  const packagingOptions = packagingList
    .filter((p) => !d.packaging.some((pk) => pk.packagingId === p.id))
    .map((p) => ({
      id: p.id,
      label: p.name,
      group: packagingTypeLabels[p.type],
      detail: formatBRLUnit(packagingUnitCost(p)),
    }))

  const summary = (
    <Card className="gap-3 py-5">
      <CardHeader className="px-5">
        <CardTitle className="text-base">Custo da porção</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-5 text-sm">
        <Row label={<>Insumos (CMV) <InfoTip term="cmv" /></>} value={formatBRL(cost.ingredientsCost)} />
        <Row label="Embalagens" value={formatBRL(cost.packagingCost)} />
        <div className="border-t pt-3">
          <Row
            label={<>Custo direto <InfoTip term="custoDireto" /></>}
            value={<span className="text-xl font-bold text-primary">{formatBRL(cost.directCost)}</span>}
          />
        </div>
        <Row
          label={<span className="flex items-center gap-1.5"><Scale className="size-4" /> Peso da porção</span>}
          value={`${formatNumber(cost.totalWeight, 0)} g`}
        />
        {d.targetWeight > 0 && cost.items.length > 0 && Math.abs(weightDiff) > 0.05 && (
          <p className="rounded-md bg-warning/15 px-3 py-2 text-xs text-foreground">
            Os ingredientes somam {formatNumber(cost.totalWeight, 0)} g, mas o peso planejado é{' '}
            {formatNumber(d.targetWeight, 0)} g ({weightDiff > 0 ? '+' : ''}
            {formatPercent(weightDiff * 100, 0)}).
          </p>
        )}
        {cost.ingredientsCost > 0 && (
          <div className="grid gap-1.5 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">O que pesa mais no custo</p>
            {[...cost.items]
              .sort((a, b) => b.cost - a.cost)
              .slice(0, 5)
              .map((it) => {
                const pct = (it.cost / cost.ingredientsCost) * 100
                return (
                  <div key={it.ingredientId} className="grid gap-0.5">
                    <div className="flex justify-between gap-2 text-xs">
                      <span className="truncate">{it.name}</span>
                      <span className="tabular-nums text-muted-foreground">{formatPercent(pct, 0)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
          </div>
        )}
        <div className="grid gap-2 border-t pt-3">
          <Row label="Custo total (com fixos e entrega)" value={formatBRL(pricing.cost.total)} />
          <Row
            label={`Preço sugerido (${formatPercent(pricing.desiredMargin, 0)} de margem)`}
            value={<span className="text-primary">{pricing.suggested.ok ? formatBRL(pricing.suggested.price) : '—'}</span>}
          />
          <p className="text-xs text-muted-foreground">
            Detalhes, preço praticado e canais em{' '}
            <Link to="/precificacao" className="font-medium text-primary underline-offset-2 hover:underline">
              Precificação
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="pb-20 lg:pb-0">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/fichas">
            <ArrowLeft /> Fichas
          </Link>
        </Button>
        {recipe && (
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={dirty}
              title={dirty ? 'Salve antes de duplicar' : undefined}
              onClick={() => {
                const id = duplicateRecipe(recipe.id)
                if (id) {
                  toast.success('Ficha duplicada. Ajuste a variação e salve.')
                  navigate(`/fichas/${id}`)
                }
              }}
            >
              <Copy /> Duplicar ficha
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              aria-label="Excluir ficha"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </div>

      <h1 className="mb-5 text-2xl font-bold tracking-tight">
        {recipe ? 'Editar ficha técnica' : 'Nova ficha técnica'}
      </h1>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="grid gap-4">
          <Section title="Dados da marmita">
            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="relative">
                  <RecipeThumb photo={d.photo} name={d.name} className="size-24" />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void onPhoto(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </div>
                <div className="flex flex-col justify-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Camera /> {d.photo ? 'Trocar foto' : 'Adicionar foto'}
                  </Button>
                  {d.photo && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => set('photo', undefined)}>
                      <ImageOff /> Remover
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">Opcional</p>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="r-name">Nome da marmita</Label>
                <Input
                  id="r-name"
                  value={d.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Ex.: Frango grelhado com arroz integral e brócolis"
                  aria-invalid={submitted && nameError}
                />
                {submitted && nameError && <p className="text-xs text-destructive">Informe o nome</p>}
              </div>

              <div className="grid gap-1.5">
                <Label>Categoria</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(recipeCategoryLabels) as RecipeCategory[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('category', c)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                        d.category === c
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'hover:bg-secondary',
                      )}
                    >
                      {recipeCategoryLabels[c]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] items-start gap-4">
                <div className="grid gap-1.5">
                  <Label>Tamanho</Label>
                  <div className="inline-flex rounded-lg border p-0.5">
                    {(['P', 'M', 'G'] as RecipeSize[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        title={SIZE_HINT[s]}
                        onClick={() => set('size', s)}
                        className={cn(
                          'h-8 w-11 rounded-md text-sm font-semibold transition-colors',
                          d.size === s ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary',
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <NumberField
                  label="Peso planejado"
                  suffix="g"
                  value={d.targetWeight}
                  onValueChange={(v) => set('targetWeight', v ?? 0)}
                  decimals={0}
                />
              </div>
            </div>
          </Section>

          <Section
            title={`Ingredientes (${d.items.length})`}
            action={
              <span className="text-sm font-semibold text-primary tabular-nums">
                {formatBRL(cost.ingredientsCost)}
              </span>
            }
          >
            <p className="mb-3 text-xs text-muted-foreground">
              Informe a quantidade <strong>pronta</strong> que vai na marmita. A perda no preparo já está no
              custo de cada ingrediente.
            </p>
            {d.items.length > 0 && (
              <ul className="mb-3 divide-y rounded-lg border">
                {d.items.map((it, idx) => {
                  const ing = ingMap.get(it.ingredientId)
                  const line = cost.items[idx]
                  const base = ing ? baseUnitOf(ing.unit) : 'g'
                  return (
                    <li key={it.ingredientId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 p-3 sm:grid-cols-[1fr_110px_90px_auto]">
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-medium', !ing && 'text-destructive')}>
                          {line?.name}
                        </p>
                        {ing && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {(() => {
                              const u = perDisplayUnit(costPerBaseUnit(ing), base)
                              return `${formatBRL(u.value)}/${u.unit} pronto`
                            })()}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive sm:order-last"
                        aria-label={`Remover ${line?.name}`}
                        onClick={() => set('items', d.items.filter((_, i) => i !== idx))}
                      >
                        <Trash2 />
                      </Button>
                      <NumberField
                        aria-label={`Quantidade de ${line?.name}`}
                        suffix={base}
                        value={it.qty}
                        positive
                        required
                        showErrors={submitted}
                        decimals={base === 'un' ? 2 : 1}
                        onValueChange={(v) =>
                          set(
                            'items',
                            d.items.map((x, i) => (i === idx ? { ...x, qty: v ?? 0 } : x)),
                          )
                        }
                      />
                      <p className="text-right text-sm font-semibold tabular-nums">{formatBRL(line?.cost ?? 0)}</p>
                    </li>
                  )
                })}
              </ul>
            )}
            <ItemPicker
              label="Adicionar ingrediente"
              placeholder="Buscar ingrediente…"
              options={ingredientOptions}
              emptyText={
                <>
                  Cadastre ingredientes primeiro em{' '}
                  <Link to="/ingredientes" className="text-primary underline">
                    Ingredientes
                  </Link>
                  .
                </>
              }
              onPick={(ingredientId) => {
                const ing = ingMap.get(ingredientId)
                const qty = ing && baseUnitOf(ing.unit) === 'un' ? 1 : 100
                set('items', [...d.items, { ingredientId, qty }])
              }}
            />
          </Section>

          <Section
            title={`Embalagens (${d.packaging.length})`}
            action={
              <span className="text-sm font-semibold text-primary tabular-nums">
                {formatBRL(cost.packagingCost)}
              </span>
            }
          >
            {d.packaging.length > 0 && (
              <ul className="mb-3 divide-y rounded-lg border">
                {d.packaging.map((pk, idx) => {
                  const p = packMap.get(pk.packagingId)
                  const line = cost.packagingItems[idx]
                  return (
                    <li key={pk.packagingId} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 p-3 sm:grid-cols-[1fr_110px_90px_auto]">
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-medium', !p && 'text-destructive')}>{line?.name}</p>
                        {p && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatBRLUnit(packagingUnitCost(p))} cada
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive sm:order-last"
                        aria-label={`Remover ${line?.name}`}
                        onClick={() => set('packaging', d.packaging.filter((_, i) => i !== idx))}
                      >
                        <Trash2 />
                      </Button>
                      <NumberField
                        aria-label={`Quantidade de ${line?.name}`}
                        suffix="un"
                        value={pk.qty}
                        positive
                        required
                        showErrors={submitted}
                        decimals={0}
                        onValueChange={(v) =>
                          set(
                            'packaging',
                            d.packaging.map((x, i) => (i === idx ? { ...x, qty: v ?? 0 } : x)),
                          )
                        }
                      />
                      <p className="text-right text-sm font-semibold tabular-nums">{formatBRL(line?.cost ?? 0)}</p>
                    </li>
                  )
                })}
              </ul>
            )}
            <ItemPicker
              label="Adicionar embalagem"
              placeholder="Buscar embalagem…"
              options={packagingOptions}
              emptyText={
                <>
                  Cadastre embalagens em{' '}
                  <Link to="/embalagens" className="text-primary underline">
                    Embalagens
                  </Link>
                  .
                </>
              }
              onPick={(packagingId) => set('packaging', [...d.packaging, { packagingId, qty: 1 }])}
            />
          </Section>

          <Section title="Observações">
            <Textarea
              value={d.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Modo de preparo, validade, informações para a etiqueta…"
              rows={3}
            />
          </Section>

          <div className="hidden justify-end gap-2 lg:flex">
            <Button variant="outline" asChild>
              <Link to="/fichas">Cancelar</Link>
            </Button>
            <Button onClick={save}>Salvar ficha</Button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-8">{summary}</aside>
      </div>

      {/* Barra fixa no celular: custo em tempo real + salvar */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t bg-background/95 px-4 py-2.5 backdrop-blur md:bottom-0 md:left-64 lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">Custo direto · {formatNumber(cost.totalWeight, 0)} g</p>
            <p className="text-lg leading-tight font-bold text-primary tabular-nums">{formatBRL(cost.directCost)}</p>
          </div>
          <Button onClick={save}>Salvar ficha</Button>
        </div>
      </div>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(o) => !o && blocker.state === 'blocked' && blocker.reset()}
        title="Sair sem salvar?"
        description="As alterações desta ficha serão perdidas."
        confirmLabel="Sair sem salvar"
        onConfirm={() => blocker.state === 'blocked' && blocker.proceed()}
      />
      {recipe && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Excluir "${recipe.name}"?`}
          description="A ficha técnica será apagada. Essa ação não pode ser desfeita."
          confirmLabel="Excluir"
          onConfirm={() => {
            saving.current = true
            deleteRecipe(recipe.id)
            navigate('/fichas')
          }}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1 text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}
