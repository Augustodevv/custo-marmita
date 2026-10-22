import { BookOpen, ClipboardList, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { InfoTip } from '@/components/common/InfoTip'
import { PageHeader } from '@/components/common/PageHeader'
import { Segmented } from '@/components/common/Segmented'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isExtra } from '@/lib/calc/analysis'
import { calcRecipeCost } from '@/lib/calc/recipe'
import { formatBRL, formatNumber } from '@/lib/format'
import { recipeCategoryColors, recipeCategoryLabels } from '@/lib/labels'
import type { Recipe, RecipeCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { DishCatalogDialog } from './DishCatalogDialog'
import { RecipeThumb } from './RecipeThumb'

export function RecipesPage() {
  const recipes = useAppStore((s) => s.recipes)
  const ingredients = useAppStore((s) => s.ingredients)
  const packaging = useAppStore((s) => s.packaging)
  const duplicateRecipe = useAppStore((s) => s.duplicateRecipe)
  const deleteRecipe = useAppStore((s) => s.deleteRecipe)
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const showExtras = params.get('tipo') === 'adicionais'
  const [category, setCategory] = useState<RecipeCategory | 'todas'>('todas')
  const [deleting, setDeleting] = useState<Recipe | undefined>()
  const [catalogOpen, setCatalogOpen] = useState(false)

  const ofKind = useMemo(() => recipes.filter((r) => isExtra(r) === showExtras), [recipes, showExtras])
  const extrasCount = recipes.filter(isExtra).length
  const newLink = showExtras ? '/fichas/nova?tipo=adicional' : '/fichas/nova'

  const rows = useMemo(
    () =>
      ofKind
        .filter((r) => showExtras || category === 'todas' || r.category === category)
        .map((r) => ({ recipe: r, cost: calcRecipeCost(r, ingredients, packaging) })),
    [ofKind, ingredients, packaging, category, showExtras],
  )

  return (
    <>
      <PageHeader
        title="Fichas técnicas"
        description="A receita de cada marmita e de cada adicional, com a quantidade de cada ingrediente e o custo da porção."
        actions={
          <>
            <Button variant="outline" onClick={() => setCatalogOpen(true)}>
              <BookOpen /> Catálogo de pratos
            </Button>
            <Button asChild>
              <Link to={newLink}>
                <Plus /> {showExtras ? 'Novo adicional' : 'Nova ficha'}
              </Link>
            </Button>
          </>
        }
      />

      <Segmented
        aria-label="Tipo"
        className="mb-4 w-full sm:w-auto"
        value={showExtras ? 'adicionais' : 'marmitas'}
        onChange={(v) => setParams(v === 'adicionais' ? { tipo: 'adicionais' } : {}, { replace: true })}
        options={[
          { value: 'marmitas', label: `Marmitas (${recipes.length - extrasCount})` },
          { value: 'adicionais', label: `Adicionais e extras (${extrasCount})` },
        ]}
      />

      {!showExtras && ofKind.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['todas', ...Object.keys(recipeCategoryLabels)] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c as RecipeCategory | 'todas')}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary',
              )}
            >
              {c === 'todas' ? 'Todas' : recipeCategoryLabels[c as RecipeCategory]}
            </button>
          ))}
        </div>
      )}

      {ofKind.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={showExtras ? 'Nenhum adicional cadastrado' : 'Nenhuma ficha técnica'}
          description={
            showExtras
              ? 'Cadastre o que você vende junto com a marmita: proteína extra, ovo, salada, sobremesa, suco…'
              : 'Monte a receita de cada marmita para descobrir quanto ela custa de verdade.'
          }
          action={
            <Button asChild>
              <Link to={newLink}>
                <Plus /> {showExtras ? 'Criar o primeiro adicional' : 'Criar a primeira ficha'}
              </Link>
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma ficha nessa categoria.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map(({ recipe: r, cost }) => (
            <Card key={r.id} className="gap-0 overflow-hidden p-0">
              <Link to={`/fichas/${r.id}`} className="flex gap-3 p-4 transition-colors hover:bg-muted/40">
                <RecipeThumb photo={r.photo} name={r.name} className="size-20" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 leading-snug font-semibold">{r.name}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    {isExtra(r) ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
                        Adicional
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 font-medium',
                          recipeCategoryColors[r.category],
                        )}
                      >
                        {recipeCategoryLabels[r.category]}
                      </span>
                    )}
                    <span className="rounded-full border px-2 py-0.5 font-medium">
                      {!isExtra(r) && `${r.size} · `}
                      {formatNumber(cost.totalWeight, 0)} g
                    </span>
                  </div>
                </div>
              </Link>
              <div className="grid grid-cols-3 border-t text-center text-sm">
                <div className="p-2.5">
                  <p className="flex h-5 items-center justify-center gap-0.5 text-[11px] text-muted-foreground">
                    CMV <InfoTip term="cmv" className="size-4" />
                  </p>
                  <p className="font-semibold tabular-nums">{formatBRL(cost.ingredientsCost)}</p>
                </div>
                <div className="border-x p-2.5">
                  <p className="flex h-5 items-center justify-center text-[11px] text-muted-foreground">
                    Embalagem
                  </p>
                  <p className="font-semibold tabular-nums">{formatBRL(cost.packagingCost)}</p>
                </div>
                <div className="p-2.5">
                  <p className="flex h-5 items-center justify-center text-[11px] text-muted-foreground">
                    Custo direto
                  </p>
                  <p className="font-bold text-primary tabular-nums">{formatBRL(cost.directCost)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-1 border-t px-2 py-1.5">
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/fichas/${r.id}`}>
                    <Pencil /> Editar
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const id = duplicateRecipe(r.id)
                    if (id) navigate(`/fichas/${id}`)
                  }}
                >
                  <Copy /> Duplicar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleting(r)}
                >
                  <Trash2 /> Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <DishCatalogDialog open={catalogOpen} onOpenChange={setCatalogOpen} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title={`Excluir "${deleting?.name ?? ''}"?`}
        description={`${deleting && isExtra(deleting) ? 'O adicional será apagado' : 'A ficha técnica será apagada'}. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={() => deleting && deleteRecipe(deleting.id)}
      />
    </>
  )
}
