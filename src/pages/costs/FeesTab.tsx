import { CreditCard, Plus, Store, Target, Trash2, Truck } from 'lucide-react'
import { InfoTip } from '@/components/common/InfoTip'
import { NumberField } from '@/components/common/NumberField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { channelFeePercent } from '@/lib/calc/pricing'
import { formatPercent } from '@/lib/format'
import { newId } from '@/lib/id'
import { paymentLabels } from '@/lib/labels'
import type { ChannelPayment, PaymentMethod, SalesChannel } from '@/lib/types'
import { useAppStore } from '@/store/useAppStore'

const CARD_METHODS: PaymentMethod[] = ['pix', 'debito', 'credito']

export function FeesTab() {
  const fees = useAppStore((s) => s.fees)
  const pricing = useAppStore((s) => s.pricing)
  const setFees = useAppStore((s) => s.setFees)
  const setPricing = useAppStore((s) => s.setPricing)

  const updateChannel = (id: string, patch: Partial<SalesChannel>) =>
    setFees({ channels: fees.channels.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Imposto sobre a venda</CardTitle>
            <CardDescription>
              Simples Nacional costuma ficar entre 4% e 6% da venda. MEI paga o DAS fixo: deixe 0% aqui e lance o
              DAS nos custos fixos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumberField
              aria-label="Imposto sobre a venda"
              suffix="%"
              value={fees.salesTaxPercent}
              max={50}
              decimals={2}
              onValueChange={(v) => setFees({ salesTaxPercent: v ?? 0 })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" /> Taxas da maquininha
            </CardTitle>
            <CardDescription>Percentual que a maquininha ou o banco descontam de cada venda.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            {CARD_METHODS.map((m) => (
              <NumberField
                key={m}
                label={paymentLabels[m]}
                suffix="%"
                value={fees.cardFees[m]}
                max={30}
                decimals={2}
                onValueChange={(v) => setFees({ cardFees: { ...fees.cardFees, [m]: v ?? 0 } })}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="size-4" /> Entrega própria
            </CardTitle>
            <CardDescription>
              Custo médio por marmita quando você mesmo entrega (combustível, motoboy). Entra só nos canais marcados
              com "Eu entrego".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NumberField
              aria-label="Custo de entrega por marmita"
              prefix="R$"
              value={fees.deliveryCostPerMeal}
              onValueChange={(v) => setFees({ deliveryCostPerMeal: v ?? 0 })}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4" /> Metas de margem
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <NumberField
              label={
                <span className="flex items-center gap-1">
                  Margem desejada <InfoTip term="margem" />
                </span>
              }
              suffix="%"
              value={pricing.defaultMargin}
              max={90}
              decimals={1}
              hint="Padrão para novas fichas"
              onValueChange={(v) => setPricing({ defaultMargin: v ?? 0 })}
            />
            <NumberField
              label="Alerta abaixo de"
              suffix="%"
              value={pricing.minMarginAlert}
              max={90}
              decimals={1}
              hint="Marmitas abaixo disso ficam em vermelho"
              onValueChange={(v) => setPricing({ minMarginAlert: v ?? 0 })}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="size-4" /> Canais de venda
          </CardTitle>
          <CardDescription>
            Cada canal tem a sua comissão e forma de pagamento. iFood: plano básico ≈ 12% e plano entrega ≈ 23%,
            mais ≈ 3,2% do pagamento online. Confira o seu contrato.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Canal principal</Label>
            <Select value={pricing.primaryChannelId} onValueChange={(v) => setPricing({ primaryChannelId: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fees.channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Onde você vende mais. O "preço que pratico hoje" das marmitas é o deste canal.
            </p>
          </div>

          {fees.channels.map((c) => (
            <div key={c.id} className="grid gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={c.name}
                  aria-label="Nome do canal"
                  placeholder="Ex.: Rappi"
                  onChange={(e) => updateChannel(c.id, { name: e.target.value })}
                />
                {c.id === pricing.primaryChannelId && <Badge variant="secondary">Principal</Badge>}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover ${c.name}`}
                  disabled={fees.channels.length <= 1}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    const channels = fees.channels.filter((x) => x.id !== c.id)
                    setFees({ channels })
                    if (pricing.primaryChannelId === c.id) setPricing({ primaryChannelId: channels[0].id })
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Comissão do canal"
                  suffix="%"
                  value={c.feePercent}
                  max={60}
                  decimals={2}
                  onValueChange={(v) => updateChannel(c.id, { feePercent: v ?? 0 })}
                />
                <div className="grid gap-1.5">
                  <Label>Pagamento</Label>
                  <Select
                    value={c.payment}
                    onValueChange={(v) => updateChannel(c.id, { payment: v as ChannelPayment })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(paymentLabels) as ChannelPayment[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {paymentLabels[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={c.ownDelivery}
                    onCheckedChange={(v) => updateChannel(c.id, { ownDelivery: v })}
                  />
                  Eu entrego
                </label>
                <span className="text-sm text-muted-foreground">
                  Total de taxas:{' '}
                  <strong className="text-foreground tabular-nums">{formatPercent(channelFeePercent(fees, c))}</strong>
                </span>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="w-fit border-dashed"
            onClick={() =>
              setFees({
                channels: [
                  ...fees.channels,
                  { id: newId(), name: '', feePercent: 0, payment: 'pix', ownDelivery: false },
                ],
              })
            }
          >
            <Plus /> Adicionar canal
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
