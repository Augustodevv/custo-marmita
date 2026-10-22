import type { AppData } from '@/store/useAppStore'

export const BACKUP_APP = 'custo-marmita'
export const BACKUP_VERSION = 1

interface BackupFile {
  app: typeof BACKUP_APP
  version: number
  exportedAt: string
  data: AppData
}

export function makeBackup(data: AppData, now = new Date()): string {
  const file: BackupFile = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data }
  return JSON.stringify(file, null, 2)
}

export function backupFileName(date: string): string {
  return `custo-marmita-backup-${date}.json`
}

export type ParsedBackup = { ok: true; data: AppData; exportedAt?: string } | { ok: false; error: string }

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const LISTS = ['ingredients', 'packaging', 'recipes'] as const

/**
 * Lê e valida um backup. Campos que não existiam em versões antigas recebem os
 * valores padrão, então backups antigos continuam funcionando.
 */
export function parseBackup(text: string, defaults: AppData): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'O arquivo não é um JSON válido.' }
  }
  if (!isObj(raw)) return { ok: false, error: 'Formato de arquivo desconhecido.' }
  // Aceita o arquivo exportado ({ app, data }) ou o objeto de dados puro
  const data = raw.app === BACKUP_APP && isObj(raw.data) ? raw.data : raw
  for (const key of LISTS) {
    const list = data[key]
    if (!Array.isArray(list)) return { ok: false, error: `Backup incompleto: falta a lista "${key}".` }
    if (!list.every((i) => isObj(i) && typeof i.id === 'string' && typeof i.name === 'string')) {
      return { ok: false, error: `Backup corrompido: itens inválidos em "${key}".` }
    }
  }
  const merged: AppData = {
    ...defaults,
    ...(data as Partial<AppData>),
    costs: { ...defaults.costs, ...(isObj(data.costs) ? data.costs : {}) },
    fees: { ...defaults.fees, ...(isObj(data.fees) ? data.fees : {}) },
    pricing: { ...defaults.pricing, ...(isObj(data.pricing) ? data.pricing : {}) },
    settings: { ...defaults.settings, ...(isObj(data.settings) ? data.settings : {}) },
    plan: isObj(data.plan) ? (data.plan as AppData['plan']) : {},
    kits: Array.isArray(data.kits) ? (data.kits as AppData['kits']) : [],
  }
  return {
    ok: true,
    data: merged,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : undefined,
  }
}
