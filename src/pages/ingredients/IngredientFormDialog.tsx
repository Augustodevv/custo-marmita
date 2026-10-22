import { useState, type ReactNode } from 'react'
import { InfoTip } from '@/components/common/InfoTip'
import { NumberField } from '@/components/common/NumberField'
import { validateNumber } from '@/lib/validation'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { baseUnitOf, costPerBaseUnit, MAX_COOKING_YIELD, MAX_LOSS_PERCENT } from '@/lib/calc/units'
import { formatBRL, formatBRLPrecise } from '@/lib/format'
import { ingredientCategoryLabels, perDisplayUnit, unitLabels } from '@/lib/labels'
import type { Ingredient, IngredientCategory, Unit } from '@/lib/types'
import { useAppStore } from '@/store/useAppStore'

interface Draft {
  name: string
  category: IngredientCategory
  packagePrice?: number
  packageQty?: number
  unit: Unit
  lossPercent?: number
  gainsWeight: boolean
  cookingYield?: number
  unitWeight?: number
}

const emptyDraft: Draft = {
  name: '',
  category: 'proteina',
  unit: 'kg',
  packageQty: 1,
  lossPercent: 0,
  gainsWeight: false,
}

function toDraft(i: Ingredient): Draft {
  return {
    name: i.name,
    category: i.category,
    packagePrice: i.packagePrice,
    packageQty: i.packageQty,
    unit: i.unit,
    lossPercent: i.lossPercent,
    gainsWeight: (i.cookingYield ?? 1) !== 1,
    cookingYield: i.cookingYield,
    unitWeight: i.unitWeight,
  }
}

interface Props {
  ingredient?: Ingredient
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IngredientFormDialog({ ingredient, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* key força reiniciar o formulário a cada abertura */}
        {open && (
          <IngredientForm
            key={ingredient?.id ?? 'novo'}
            ingredient={ingredient}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function IngredientForm({ ingredient, onDone }: { ingredient?: Ingredient; onDone: () => void }) {
  const addIngredient = useAppStore((s) => s.addIngredient)
  const updateIngredient = useAppStore((s) => s.updateIngredient)
  const updateIngredientPrice = useAppStore((s) => s.updateIngredientPrice)
  const [d, setD] = useState<Draft>(ingredient ? toDraft(ingredient) : emptyDraft)
  const [submitted, setSubmitted] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }))

  const base = baseUnitOf(d.unit)
  const cookingYield = d.gainsWeight ? (d.cookingYield ?? 1) : 1
  const errors = {
    name: d.name.trim() ? null : 'Informe o nome',
    packagePrice: validateNumber(d.packagePrice, { required: true }),
    packageQty: validateNumber(d.packageQty, { required: true, positive: true }),
    lossPercent: validateNumber(d.lossPercent, { max: MAX_LOSS_PERCENT }),
    cookingYield: d.gainsWeight
      ? validateNumber(d.cookingYield, { required: true, min: 1, max: MAX_COOKING_YIELD })
      : null,
  }
  const valid = Object.values(errors).every((e) => e === null)

  const unitCost = costPerBaseUnit({
    packagePrice: d.packagePrice ?? 0,
    packageQty: d.packageQty ?? 0,
    unit: d.unit,
    lossPercent: d.lossPercent ?? 0,
    cookingYield,
  })
  const display = perDisplayUnit(unitCost, base)

  const save = () => {
    setSubmitted(true)
    if (!valid) return
    const data = {
      name: d.name.trim(),
      category: d.category,
      packagePrice: d.packagePrice ?? 0,
      packageQty: d.packageQty ?? 0,
      unit: d.unit,
      lossPercent: d.lossPercent ?? 0,
      cookingYield: d.gainsWeight ? cookingYield : undefined,
      unitWeight: base === 'un' ? d.unitWeight : undefined,
    }
    if (ingredient) {
      // Mudança de preço pela edição também vai para o histórico
      updateIngredient(ingredient.id, { ...data, packagePrice: ingredient.packagePrice, sample: false })
      if (ingredient.packagePrice !== data.packagePrice) {
        updateIngredientPrice(ingredient.id, data.packagePrice)
      }
    } else {
      addIngredient(data)
    }
    onDone()
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <DialogHeader>
        <DialogTitle>{ingredient ? 'Editar ingrediente' : 'Novo ingrediente'}</DialogTitle>
        <DialogDescription>
          Informe o que você paga e o tamanho da embalagem. O custo do pronto é calculado na hora.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome">
          <Input
            value={d.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex.: Peito de frango"
            aria-invalid={submitted && !!errors.name}
            autoFocus
          />
          {submitted && errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </Field>
        <Field label="Categoria">
          <Select value={d.category} onValueChange={(v) => set('category', v as IngredientCategory)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ingredientCategoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <NumberField
          showErrors={submitted}
          className="col-span-2 sm:col-span-1"
          label="Preço pago"
          prefix="R$"
          value={d.packagePrice}
          onValueChange={(v) => set('packagePrice', v)}
          placeholder="32,90"
          required
        />
        <NumberField
          showErrors={submitted}
          label="Qtd. da embalagem"
          value={d.packageQty}
          onValueChange={(v) => set('packageQty', v)}
          positive
          required
          decimals={3}
        />
        <Field label="Unidade">
          <Select value={d.unit} onValueChange={(v) => set('unit', v as Unit)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(unitLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          showErrors={submitted}
          label={
            <span className="flex items-center gap-1">
              Perda no preparo <InfoTip term="fatorCorrecao" />
            </span>
          }
          suffix="%"
          value={d.lossPercent}
          onValueChange={(v) => set('lossPercent', v)}
          max={MAX_LOSS_PERCENT}
          decimals={1}
          hint="Casca, osso, aparas, água que sai ao cozinhar"
        />
        {base === 'un' && (
          <NumberField
            showErrors={submitted}
            label="Peso de 1 unidade (opcional)"
            suffix="g"
            value={d.unitWeight}
            onValueChange={(v) => set('unitWeight', v)}
            decimals={1}
            hint="Usado para somar o peso da marmita"
          />
        )}
      </div>

      <div className="rounded-lg border bg-muted/40 p-3">
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          <span className="flex items-center gap-1">
            Ganha peso ao cozinhar? (arroz, feijão, massas) <InfoTip term="indiceCoccao" />
          </span>
          <Switch checked={d.gainsWeight} onCheckedChange={(v) => set('gainsWeight', v)} />
        </label>
        {d.gainsWeight && (
          <NumberField
            showErrors={submitted}
            className="mt-3"
            label="Índice de cocção"
            suffix="×"
            value={d.cookingYield}
            onValueChange={(v) => set('cookingYield', v)}
            min={1}
            max={MAX_COOKING_YIELD}
            required
            decimals={2}
            hint="Ex.: 1 kg de arroz cru vira 2,5 kg cozido → 2,5"
          />
        )}
      </div>

      <div className="rounded-xl bg-primary/10 p-4">
        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground uppercase">
          Custo do pronto <InfoTip term="custoPronto" />
        </p>
        <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
          {formatBRL(display.value)}
          <span className="text-base font-medium"> / {display.unit}</span>
        </p>
        {base !== 'un' && (
          <p className="text-xs text-muted-foreground">
            {formatBRLPrecise(unitCost)} por {base}
          </p>
        )}
      </div>

      {submitted && !valid && (
        <p className="text-sm text-destructive">Corrija os campos destacados para salvar.</p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">Salvar</Button>
      </DialogFooter>
    </form>
  )
}
