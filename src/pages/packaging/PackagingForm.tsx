import { useState } from 'react'
import { NumberField } from '@/components/common/NumberField'
import { Segmented } from '@/components/common/Segmented'
import { Button } from '@/components/ui/button'
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { packagingUnitCost } from '@/lib/calc/units'
import { formatBRLUnit } from '@/lib/format'
import { materialLabels, packagingTypeLabels } from '@/lib/labels'
import type { Packaging, PackagingMaterial, PackagingType } from '@/lib/types'
import { validateNumber } from '@/lib/validation'
import { useAppStore } from '@/store/useAppStore'

const NO_MATERIAL = 'nenhum'

export function PackagingForm({ packaging, onDone }: { packaging?: Packaging; onDone: () => void }) {
  const addPackaging = useAppStore((s) => s.addPackaging)
  const updatePackaging = useAppStore((s) => s.updatePackaging)
  const [name, setName] = useState(packaging?.name ?? '')
  const [type, setType] = useState<PackagingType>(packaging?.type ?? 'pote')
  const [packPrice, setPackPrice] = useState<number | undefined>(packaging?.packPrice)
  const [packQty, setPackQty] = useState<number | undefined>(packaging?.packQty ?? 100)
  const [capacity, setCapacity] = useState<number | undefined>(packaging?.capacity)
  const [capacityUnit, setCapacityUnit] = useState<'g' | 'ml'>(packaging?.capacityUnit ?? 'g')
  const [material, setMaterial] = useState<PackagingMaterial | undefined>(
    packaging ? packaging.material : 'pp',
  )
  const [compartments, setCompartments] = useState(String(packaging?.compartments ?? 1))
  const [microwave, setMicrowave] = useState(packaging?.microwave ?? true)
  const [freezer, setFreezer] = useState(packaging?.freezer ?? true)
  const [supplier, setSupplier] = useState(packaging?.supplier ?? '')
  const [submitted, setSubmitted] = useState(false)

  const isPot = type === 'pote'
  const errors = [
    name.trim() ? null : 'nome',
    validateNumber(packPrice, { required: true }),
    validateNumber(packQty, { required: true, positive: true }),
    isPot ? validateNumber(capacity, { max: 10000 }) : null,
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
        const data: Omit<Packaging, 'id'> = {
          name: name.trim(),
          type,
          packPrice: packPrice ?? 0,
          packQty: packQty ?? 1,
          material,
          supplier: supplier.trim() || undefined,
          // Detalhes de pote só fazem sentido para potes
          capacity: isPot ? capacity : undefined,
          capacityUnit: isPot && capacity ? capacityUnit : undefined,
          compartments: isPot ? Number(compartments) : undefined,
          microwave: isPot ? microwave : undefined,
          freezer: isPot ? freezer : undefined,
        }
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
          placeholder="Ex.: Marmita PP 350 g com tampa"
          aria-invalid={submitted && !name.trim()}
          autoFocus
        />
        {submitted && !name.trim() && <p className="text-xs text-destructive">Informe o nome</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <div className="grid gap-1.5">
          <Label>Material</Label>
          <Select
            value={material ?? NO_MATERIAL}
            onValueChange={(v) => setMaterial(v === NO_MATERIAL ? undefined : (v as PackagingMaterial))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_MATERIAL}>Não informar</SelectItem>
              {Object.entries(materialLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPot && (
        <div className="grid gap-4 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">Detalhes do pote</p>
          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <NumberField
              label="Capacidade"
              value={capacity}
              onValueChange={setCapacity}
              decimals={0}
              max={10000}
              placeholder="Ex.: 350"
              showErrors={submitted}
              hint="Usada para avisar se a porção não cabe no pote"
            />
            <Segmented
              aria-label="Unidade da capacidade"
              className="mb-5"
              value={capacityUnit}
              onChange={setCapacityUnit}
              options={[
                { value: 'g', label: 'g' },
                { value: 'ml', label: 'ml' },
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Divisórias</Label>
            <Segmented
              aria-label="Divisórias"
              className="w-full sm:w-auto"
              value={compartments}
              onChange={setCompartments}
              options={['1', '2', '3', '4'].map((n) => ({ value: n, label: n === '1' ? 'Sem' : n }))}
            />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <label className="flex items-center gap-2">
              <Switch checked={microwave} onCheckedChange={setMicrowave} /> Vai ao micro-ondas
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={freezer} onCheckedChange={setFreezer} /> Vai ao freezer
            </label>
          </div>
        </div>
      )}

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

      <div className="grid gap-1.5">
        <Label htmlFor="pk-supplier">Fornecedor (opcional)</Label>
        <Input
          id="pk-supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Ex.: Atacadão, loja de embalagens do bairro"
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
