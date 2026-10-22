import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseBRNumber, toInputString } from '@/lib/format'
import { validateNumber } from '@/lib/validation'
import { cn } from '@/lib/utils'

interface NumberFieldProps {
  label?: ReactNode
  value: number | undefined
  onValueChange: (value: number | undefined) => void
  prefix?: string
  suffix?: string
  min?: number
  max?: number
  /** Não aceita zero (ex.: quantidade da embalagem, para evitar divisão por zero) */
  positive?: boolean
  required?: boolean
  decimals?: number
  placeholder?: string
  hint?: ReactNode
  className?: string
  inputClassName?: string
  id?: string
  /** Mostra o erro mesmo sem o campo ter sido tocado (ex.: após tentar salvar) */
  showErrors?: boolean
  'aria-label'?: string
}

/**
 * Campo numérico com formato brasileiro (aceita "32,90" e "1.234,56").
 * Usa teclado decimal no celular e valida negativos/zero.
 */
export function NumberField({
  label,
  value,
  onValueChange,
  prefix,
  suffix,
  min = 0,
  max,
  positive,
  required,
  decimals = 2,
  placeholder,
  hint,
  className,
  inputClassName,
  id,
  showErrors,
  ...rest
}: NumberFieldProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const [text, setText] = useState(() => toInputString(value, decimals))
  const [touched, setTouched] = useState(false)
  const focused = useRef(false)

  // Sincroniza quando o valor muda por fora (ex.: duplicar ficha), sem atrapalhar a digitação
  useEffect(() => {
    if (!focused.current) setText(toInputString(value, decimals))
  }, [value, decimals])

  const parsed = text.trim() === '' ? undefined : parseBRNumber(text)
  const invalidFormat = parsed !== undefined && Number.isNaN(parsed)
  const error = invalidFormat ? 'Número inválido' : validateNumber(parsed, { min, max, positive, required })
  const showError = (touched || showErrors) && error

  return (
    <div className={cn('grid gap-1.5', className)}>
      {label && <Label htmlFor={fieldId}>{label}</Label>}
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
            {prefix}
          </span>
        )}
        <Input
          id={fieldId}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          value={text}
          placeholder={placeholder}
          aria-invalid={showError ? true : undefined}
          aria-label={rest['aria-label']}
          className={cn('tabular-nums', prefix && 'pl-9', suffix && 'pr-12', inputClassName)}
          onFocus={(e) => {
            focused.current = true
            e.currentTarget.select()
          }}
          onChange={(e) => {
            const t = e.target.value
            setText(t)
            if (t.trim() === '') return onValueChange(undefined)
            const n = parseBRNumber(t)
            if (!Number.isNaN(n)) onValueChange(n)
          }}
          onBlur={() => {
            focused.current = false
            setTouched(true)
            if (parsed !== undefined && !Number.isNaN(parsed)) setText(toInputString(parsed, decimals))
          }}
        />
        {suffix && (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {showError ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
