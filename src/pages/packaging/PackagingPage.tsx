import { BookOpen, Flame, Microwave, Package, Pencil, Plus, Snowflake, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { packagingUnitCost } from '@/lib/calc/units'
import { formatBRL, formatBRLUnit, formatNumber } from '@/lib/format'
import { capacityLabel, materialLabels, packagingTypeLabels } from '@/lib/labels'
import type { Packaging, PackagingType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { CatalogDialog } from './CatalogDialog'
import { PackagingForm } from './PackagingForm'

const TYPE_ORDER = Object.keys(packagingTypeLabels) as PackagingType[]

function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PackagingPage() {
  const packaging = useAppStore((s) => s.packaging)
  const recipes = useAppStore((s) => s.recipes)
  const deletePackaging = useAppStore((s) => s.deletePackaging)
  const [formOpen, setFormOpen] = useState(false)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [editing, setEditing] = useState<Packaging | undefined>()
  const [deleting, setDeleting] = useState<Packaging | undefined>()
  const [type, setType] = useState<PackagingType | 'todas'>('todas')

  const usage = (id: string) => recipes.filter((r) => r.packaging.some((p) => p.packagingId === id)).length

  const usedTypes = TYPE_ORDER.filter((t) => packaging.some((p) => p.type === t))
  const sorted = packaging
    .filter((p) => type === 'todas' || p.type === type)
    .sort(
      (a, b) =>
        TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) ||
        (a.capacity ?? 0) - (b.capacity ?? 0) ||
        a.name.localeCompare(b.name, 'pt-BR'),
    )

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Embalagens e descartáveis"
        description="Potes de todos os tamanhos, tampas, sacolas, talheres, etiquetas… informe o preço do pacote e quantas unidades vêm nele."
        actions={
          <>
            <Button variant="outline" onClick={() => setCatalogOpen(true)}>
              <BookOpen /> Catálogo
            </Button>
            <Button onClick={openNew}>
              <Plus /> Nova embalagem
            </Button>
          </>
        }
      />

      {packaging.length > 0 && (
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['todas', ...usedTypes] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                type === t
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary',
              )}
            >
              {t === 'todas' ? 'Todas' : packagingTypeLabels[t]}
            </button>
          ))}
        </div>
      )}

      {packaging.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhuma embalagem cadastrada"
          description="O custo do pote, tampa e etiqueta faz diferença no preço final. Comece pelo catálogo com os tamanhos mais usados."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => setCatalogOpen(true)}>
                <BookOpen /> Escolher no catálogo
              </Button>
              <Button variant="outline" onClick={openNew}>
                <Plus /> Cadastrar manualmente
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => {
            const cap = capacityLabel(p)
            return (
              <Card key={p.id} className="flex-row items-start gap-3 p-4">
                <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-lg bg-secondary text-primary">
                  {cap ? (
                    <>
                      <span className="text-sm leading-none font-bold">
                        {formatNumber(p.capacity ?? 0, 0)}
                      </span>
                      <span className="text-[10px] leading-tight">{p.capacityUnit ?? 'ml'}</span>
                    </>
                  ) : (
                    <Package className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {packagingTypeLabels[p.type]} · {formatBRL(p.packPrice)} / {formatNumber(p.packQty, 0)} un
                    {p.supplier && ` · ${p.supplier}`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {p.material && <Chip>{materialLabels[p.material]}</Chip>}
                    {p.compartments && p.compartments > 1 && <Chip>{p.compartments} divisórias</Chip>}
                    {p.microwave && (
                      <Chip>
                        <Microwave className="size-3" /> Micro-ondas
                      </Chip>
                    )}
                    {p.freezer && (
                      <Chip>
                        <Snowflake className="size-3" /> Freezer
                      </Chip>
                    )}
                    {p.type === 'pote' && p.microwave === false && (
                      <Chip className="border-amber-500/40 text-amber-700 dark:text-amber-300">
                        <Flame className="size-3" /> Não vai ao micro-ondas
                      </Chip>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-primary tabular-nums">
                    {formatBRLUnit(packagingUnitCost(p))}{' '}
                    <span className="text-xs font-medium text-muted-foreground">por unidade</span>
                  </p>
                </div>
                <div className="-mt-1 -mr-2 flex shrink-0 flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar ${p.name}`}
                    onClick={() => {
                      setEditing(p)
                      setFormOpen(true)
                    }}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Excluir ${p.name}`}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(p)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          {formOpen && (
            <PackagingForm
              key={editing?.id ?? 'nova'}
              packaging={editing}
              onDone={() => setFormOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <CatalogDialog open={catalogOpen} onOpenChange={setCatalogOpen} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title={`Excluir "${deleting?.name ?? ''}"?`}
        description={
          deleting && usage(deleting.id) > 0
            ? `Ela está em ${usage(deleting.id)} ficha(s) técnica(s) e será removida delas.`
            : 'Essa ação não pode ser desfeita.'
        }
        confirmLabel="Excluir"
        onConfirm={() => deleting && deletePackaging(deleting.id)}
      />
    </>
  )
}
