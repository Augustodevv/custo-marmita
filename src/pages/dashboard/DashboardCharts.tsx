import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CostSlice, DashboardRow } from '@/lib/calc/dashboard'
import { formatBRL, formatPercent } from '@/lib/format'

// Ordem fixa da paleta categórica validada: a cor segue a categoria, nunca a posição
const SLICE_COLOR: Record<CostSlice['key'], string> = {
  ingredientes: 'var(--series-1)',
  embalagem: 'var(--series-2)',
  fixos: 'var(--series-3)',
  entrega: 'var(--series-4)',
  taxas: 'var(--series-5)',
  lucro: 'var(--series-6)',
}

function TooltipBox({ title, lines }: { title: string; lines: [string, string][] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-popover-foreground">{title}</p>
      {lines.map(([k, v]) => (
        <p key={k} className="flex justify-between gap-4 text-muted-foreground">
          <span>{k}</span>
          <span className="font-medium text-popover-foreground tabular-nums">{v}</span>
        </p>
      ))}
    </div>
  )
}

/** Rosca da composição do preço médio + legenda em tabela (rótulos sempre visíveis). */
export function CompositionChart({ slices, avgPrice }: { slices: CostSlice[]; avgPrice: number }) {
  const data = slices.filter((s) => s.value > 0.005)
  const total = data.reduce((a, s) => a + s.value, 0)
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
      <div className="relative mx-auto size-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={1.5}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.key} fill={SLICE_COLOR[s.key]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const s = payload[0].payload as CostSlice
                return (
                  <TooltipBox
                    title={s.label}
                    lines={[
                      ['Por marmita', formatBRL(s.value)],
                      ['Do preço', formatPercent((s.value / total) * 100)],
                    ]}
                  />
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] text-muted-foreground">Preço médio</span>
          <span className="text-lg font-bold">{formatBRL(avgPrice)}</span>
        </div>
      </div>
      <ul className="grid gap-1.5 text-sm">
        {data.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-sm" style={{ background: SLICE_COLOR[s.key] }} />
            <span className="flex-1 text-muted-foreground">{s.label}</span>
            <span className="tabular-nums">{formatBRL(s.value)}</span>
            <span className="w-14 text-right font-medium tabular-nums">
              {formatPercent((s.value / total) * 100, 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const shortName = (name: string, max = 19) => (name.length > max ? `${name.slice(0, max - 1)}…` : name)

/** Barras horizontais: margem real de cada marmita, da maior para a menor. */
export function MarginChart({ rows, minMargin }: { rows: DashboardRow[]; minMargin: number }) {
  const data = [...rows]
    .sort((a, b) => b.margin - a.margin)
    .map((r) => ({
      id: r.pricing.recipe.id,
      name: shortName(r.pricing.recipe.name),
      fullName: r.pricing.recipe.name,
      margin: Number(r.margin.toFixed(1)),
      profit: r.profit,
      price: r.price,
      source: r.priceSource,
    }))
  const min = Math.min(0, ...data.map((d) => d.margin))
  const max = Math.max(minMargin + 5, ...data.map((d) => d.margin))
  // Ticks redondos (múltiplos de 5 ou 10) cobrindo todo o intervalo
  const step = max - min > 40 ? 10 : 5
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks = Array.from({ length: (hi - lo) / step + 1 }, (_, i) => lo + i * step)
  const height = Math.max(160, data.length * 40 + 40)

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 22, right: 16, bottom: 4, left: 4 }}
          barCategoryGap={8}
        >
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis
            type="number"
            domain={[lo, hi]}
            ticks={ticks}
            interval={0}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={132}
            axisLine={false}
            tickLine={false}
            // Rótulo em uma linha só (o padrão do Recharts quebra o texto)
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy={4} textAnchor="end" fill="var(--muted-foreground)" fontSize={12}>
                {String(payload.value)}
              </text>
            )}
          />
          <ReferenceLine
            x={minMargin}
            stroke="var(--chart-axis)"
            label={{
              value: `mín. ${minMargin}%`,
              position: 'top',
              fill: 'var(--chart-axis)',
              fontSize: 11,
            }}
          />
          <ReferenceLine x={0} stroke="var(--chart-axis)" />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as (typeof data)[number]
              return (
                <TooltipBox
                  title={d.fullName}
                  lines={[
                    ['Margem real', formatPercent(d.margin)],
                    ['Lucro por marmita', formatBRL(d.profit)],
                    [`Preço ${d.source}`, formatBRL(d.price)],
                  ]}
                />
              )
            }}
          />
          <Bar dataKey="margin" fill="var(--series-1)" radius={4} maxBarSize={22} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
