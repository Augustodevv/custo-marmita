import { Flame, Plus, Trash2, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { InfoTip } from '@/components/common/InfoTip'
import { NumberField } from '@/components/common/NumberField'
import { Segmented } from '@/components/common/Segmented'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { calcFixedCosts, laborMonthly } from '@/lib/calc/fixed'
import { formatBRL, formatNumber } from '@/lib/format'
import { newId } from '@/lib/id'
import type { LaborEntry } from '@/lib/types'
import { useAppStore } from '@/store/useAppStore'

const SUGGESTIONS = [
  'Aluguel',
  'Luz',
  'Água',
  'Gás',
  'Internet',
  'Contador',
  'MEI / DAS',
  'Marketing',
  'Manutenção',
  'Outros',
]

const WORK_DAYS = 26

export function FixedCostsTab() {
  const costs = useAppStore((s) => s.costs)
  const setCosts = useAppStore((s) => s.setCosts)
  const b = calcFixedCosts(costs)

  const norm = (t: string) => t.toLocaleLowerCase('pt-BR').split(/[\s/]+/)[0]
  const existing = new Set(costs.fixedCosts.map((f) => norm(f.name)))
  // Gás tem cartão próprio; só sugere na lista se ele for informado como valor mensal
  const suggestions = SUGGESTIONS.filter((s) => !existing.has(norm(s)) && s !== 'Gás')

  const addFixed = (name = '') =>
    setCosts({ fixedCosts: [...costs.fixedCosts, { id: newId(), name, amount: 0 }] })

  const updateLabor = (id: string, patch: Partial<LaborEntry>) =>
    setCosts({ labor: costs.labor.map((l) => (l.id === id ? { ...l, ...patch } : l)) })

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contas do mês</CardTitle>
            <CardDescription>Aluguel, luz, água, internet… valores mensais aproximados.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {costs.fixedCosts.map((f) => (
              <div key={f.id} className="grid grid-cols-[1fr_120px_auto] items-start gap-2 sm:grid-cols-[1fr_160px_auto]">
                <Input
                  value={f.name}
                  aria-label="Nome do custo"
                  placeholder="Nome do custo"
                  onChange={(e) =>
                    setCosts({
                      fixedCosts: costs.fixedCosts.map((x) =>
                        x.id === f.id ? { ...x, name: e.target.value, sample: false } : x,
                      ),
                    })
                  }
                />
                <NumberField
                  aria-label={`Valor mensal de ${f.name || 'custo'}`}
                  prefix="R$"
                  value={f.amount}
                  onValueChange={(v) =>
                    setCosts({
                      fixedCosts: costs.fixedCosts.map((x) =>
                        x.id === f.id ? { ...x, amount: v ?? 0, sample: false } : x,
                      ),
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${f.name}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setCosts({ fixedCosts: costs.fixedCosts.filter((x) => x.id !== f.id) })}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="outline" size="sm" className="border-dashed" onClick={() => addFixed()}>
                <Plus /> Adicionar custo
              </Button>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addFixed(s)}
                  className="rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  + {s}
                </button>
              ))}
            </div>
            <TotalLine label="Total das contas" value={b.fixedTotal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" /> Mão de obra
            </CardTitle>
            <CardDescription>
              Inclua o seu pró-labore: seu trabalho também tem custo e precisa estar no preço.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {costs.labor.map((l) => (
              <div key={l.id} className="grid gap-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={l.name}
                    aria-label="Nome"
                    placeholder="Ex.: Ajudante de cozinha"
                    onChange={(e) => updateLabor(l.id, { name: e.target.value, sample: false })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover ${l.name}`}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setCosts({ labor: costs.labor.filter((x) => x.id !== l.id) })}
                  >
                    <Trash2 />
                  </Button>
                </div>
                <Segmented
                  aria-label="Forma de pagamento"
                  value={l.mode}
                  onChange={(mode) => updateLabor(l.id, { mode, sample: false })}
                  options={[
                    { value: 'mensal', label: 'Salário mensal' },
                    { value: 'hora', label: 'Por hora' },
                  ]}
                  className="w-full sm:w-auto"
                />
                {l.mode === 'mensal' ? (
                  <NumberField
                    label="Valor mensal"
                    prefix="R$"
                    value={l.monthly}
                    onValueChange={(v) => updateLabor(l.id, { monthly: v ?? 0, sample: false })}
                    hint="Salário + encargos, ou pró-labore"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Valor da hora"
                      prefix="R$"
                      value={l.hourlyRate}
                      onValueChange={(v) => updateLabor(l.id, { hourlyRate: v ?? 0, sample: false })}
                    />
                    <NumberField
                      label="Horas no mês"
                      suffix="h"
                      value={l.hours}
                      decimals={1}
                      onValueChange={(v) => updateLabor(l.id, { hours: v ?? 0, sample: false })}
                    />
                  </div>
                )}
                <p className="text-right text-sm text-muted-foreground">
                  No mês: <span className="font-semibold text-foreground tabular-nums">{formatBRL(laborMonthly(l))}</span>
                </p>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-fit border-dashed"
              onClick={() =>
                setCosts({
                  labor: [
                    ...costs.labor,
                    { id: newId(), name: '', mode: 'mensal', monthly: 0, hourlyRate: 0, hours: 0 },
                  ],
                })
              }
            >
              <Plus /> Adicionar pessoa
            </Button>
            <TotalLine label="Total de mão de obra" value={b.laborTotal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="size-4" /> Gás
            </CardTitle>
            <CardDescription>Informe o gasto do mês ou calcule pelo botijão.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Segmented
              aria-label="Como informar o gás"
              value={costs.gas.mode}
              onChange={(mode) => setCosts({ gas: { ...costs.gas, mode } })}
              options={[
                { value: 'botijao', label: 'Por botijão' },
                { value: 'mensal', label: 'Valor mensal' },
              ]}
              className="w-full sm:w-auto"
            />
            {costs.gas.mode === 'botijao' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Preço do botijão"
                    prefix="R$"
                    value={costs.gas.cylinderPrice}
                    onValueChange={(v) => setCosts({ gas: { ...costs.gas, cylinderPrice: v ?? 0 } })}
                  />
                  <NumberField
                    label="Rende quantas marmitas?"
                    value={costs.gas.mealsPerCylinder}
                    decimals={0}
                    positive
                    onValueChange={(v) => setCosts({ gas: { ...costs.gas, mealsPerCylinder: v ?? 0 } })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Gás por marmita:{' '}
                  <span className="font-semibold text-foreground tabular-nums">{formatBRL(b.gasPerMeal)}</span>
                </p>
              </>
            ) : (
              <NumberField
                label="Gasto mensal com gás"
                prefix="R$"
                value={costs.gas.monthly}
                onValueChange={(v) => setCosts({ gas: { ...costs.gas, monthly: v ?? 0 } })}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-8">
        <Card>
          <CardHeader>
            <CardTitle>Produção mensal</CardTitle>
            <CardDescription>Quantas marmitas você produz (ou pretende produzir) por mês.</CardDescription>
          </CardHeader>
          <CardContent>
            <NumberField
              aria-label="Produção mensal"
              suffix="marmitas"
              value={costs.monthlyProduction}
              decimals={0}
              positive
              required
              inputClassName="h-12 text-lg pr-24"
              onValueChange={(v) => setCosts({ monthlyProduction: v ?? 0 })}
              hint={
                costs.monthlyProduction > 0
                  ? `≈ ${formatNumber(costs.monthlyProduction / WORK_DAYS, 0)} por dia (${WORK_DAYS} dias de trabalho)`
                  : undefined
              }
            />
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              Rateio por marmita <InfoTip term="rateio" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <SummaryRow label="Contas do mês" value={formatBRL(b.fixedTotal)} />
            <SummaryRow label="Mão de obra" value={formatBRL(b.laborTotal)} />
            {costs.gas.mode === 'mensal' && <SummaryRow label="Gás" value={formatBRL(b.gasMonthly)} />}
            <div className="border-t pt-2">
              <SummaryRow label="Total mensal" value={<strong>{formatBRL(b.monthlyTotal)}</strong>} />
            </div>
            <SummaryRow
              label={`÷ ${formatNumber(costs.monthlyProduction, 0)} marmitas`}
              value={formatBRL(b.perMealFromMonthly)}
            />
            {costs.gas.mode === 'botijao' && <SummaryRow label="+ gás (botijão)" value={formatBRL(b.gasPerMeal)} />}
            <div className="mt-1 rounded-lg bg-primary px-3 py-2.5 text-primary-foreground">
              <p className="text-xs opacity-90">Custo fixo por marmita</p>
              <p className="text-2xl font-bold tabular-nums">{formatBRL(b.perMeal)}</p>
            </div>
            {b.missingProduction && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Informe a produção mensal para dividir os custos fixos entre as marmitas.
              </p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}

function TotalLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-t pt-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums">{formatBRL(value)}</span>
    </div>
  )
}

function SummaryRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
