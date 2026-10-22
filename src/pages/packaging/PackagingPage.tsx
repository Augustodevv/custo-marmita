import { Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { NumberField } from '@/components/common/NumberField'
import { validateNumber } from '@/lib/validation'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { packagingUnitCost } from '@/lib/calc/units'
import { formatBRL, formatBRLUnit, formatNumber } from '@/lib/format'
import { packagingTypeLabels } from '@/lib/labels'
import type { Packaging, PackagingType } from '@/lib/types'
import { useAppStore } from '@/store/useAppStore'

export function PackagingPage() {
  const packaging = useAppStore((s) => s.packaging)
  const recipes = useAppStore((s) => s.recipes)
  const deletePackaging = useAppStore((s) => s.deletePackaging)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Packaging | undefined>()
  const [deleting, setDeleting] = useState<Packaging | undefined>()

  const usage = (id: string) => recipes.filter((r) => r.packaging.some((p) => p.packagingId === id)).length

  const order = Object.keys(packagingTypeLabels)
  const sorted = [...packaging].sort(
    (a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.name.localeCompare(b.name, 'pt-BR'),
  )

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Embalagens e descartáveis"
        description="Pote, tampa, sacola, talher, etiqueta… informe o preço do pacote e quantas unidades vêm nele."
        actions={
          <Button onClick={openNew}>
            <Plus /> Nova embalagem
          </Button>
        }
      />

      {packaging.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhuma embalagem cadastrada"
          description="O custo do pote, tampa e etiqueta faz diferença no preço final. Cadastre-os aqui."
          action={
            <Button onClick={openNew}>
              <Plus /> Cadastrar a primeira
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((p) => (
            <Card key={p.id} className="flex-row items-center gap-3 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                <Package className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {packagingTypeLabels[p.type]} · {formatBRL(p.packPrice)} / {formatNumber(p.packQty, 0)} un
                </p>
                <p className="mt-0.5 text-sm font-bold text-primary tabular-nums">
                  {formatBRLUnit(packagingUnitCost(p))}{' '}
                  <span className="text-xs font-medium text-muted-foreground">por unidade</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
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
          ))}
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

function PackagingForm({ packaging, onDone }: { packaging?: Packaging; onDone: () => void }) {
  const addPackaging = useAppStore((s) => s.addPackaging)
  const updatePackaging = useAppStore((s) => s.updatePackaging)
  const [name, setName] = useState(packaging?.name ?? '')
  const [type, setType] = useState<PackagingType>(packaging?.type ?? 'pote')
  const [packPrice, setPackPrice] = useState<number | undefined>(packaging?.packPrice)
  const [packQty, setPackQty] = useState<number | undefined>(packaging?.packQty ?? 100)
  const [submitted, setSubmitted] = useState(false)

  const errors = [
    name.trim() ? null : 'nome',
    validateNumber(packPrice, { required: true }),
    validateNumber(packQty, { required: true, positive: true }),
  ]
  const valid = errors.every((e) => e === null)
  const unitCost = packagingUnitCost({ packPrice: packPrice ?? 0, packQty: packQty ?? 0 })

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        setSubmitted(true)
        if (!valid) return
        const data = { name: name.trim(), type, packPrice: packPrice ?? 0, packQty: packQty ?? 1 }
        if (packaging) updatePackaging(packaging.id, { ...data, sample: false })
        else addPackaging(data)
        onDone()
      }}
    >
      <DialogHeader>
        <DialogTitle>{packaging ? 'Editar embalagem' : 'Nova embalagem'}</DialogTitle>
        <DialogDescription>O custo por unidade é calculado automaticamente.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="pk-name">Nome</Label>
        <Input
          id="pk-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Pote 750 ml com divisória"
          aria-invalid={submitted && !name.trim()}
          autoFocus
        />
        {submitted && !name.trim() && <p className="text-xs text-destructive">Informe o nome</p>}
      </div>
      <div className="grid gap-1.5">
        <Label>Tipo</Label>
        <Select value={type} onValueChange={(v) => setType(v as PackagingType)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(packagingTypeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <NumberField
          label="Preço do pacote"
          prefix="R$"
          value={packPrice}
          onValueChange={setPackPrice}
          required
          showErrors={submitted}
        />
        <NumberField
          label="Unidades no pacote"
          value={packQty}
          onValueChange={setPackQty}
          positive
          required
          decimals={0}
          showErrors={submitted}
        />
      </div>
      <div className="rounded-xl bg-primary/10 p-4">
        <p className="text-xs font-medium text-muted-foreground uppercase">Custo por unidade</p>
        <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{formatBRLUnit(unitCost)}</p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  )
}
