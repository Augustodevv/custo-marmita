import {
  Calculator,
  Carrot,
  ClipboardList,
  LayoutDashboard,
  Package,
  PackageOpen,
  Receipt,
  Settings,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  short: string
  icon: LucideIcon
  /** Aparece direto na barra inferior do celular */
  mobile?: boolean
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', short: 'Início', icon: LayoutDashboard, mobile: true },
  { to: '/ingredientes', label: 'Ingredientes', short: 'Ingredientes', icon: Carrot, mobile: true },
  { to: '/embalagens', label: 'Embalagens', short: 'Embalagens', icon: Package },
  { to: '/fichas', label: 'Fichas Técnicas', short: 'Fichas', icon: ClipboardList, mobile: true },
  { to: '/custos', label: 'Custos Fixos', short: 'Custos', icon: Receipt },
  { to: '/precificacao', label: 'Precificação', short: 'Preços', icon: Calculator, mobile: true },
  { to: '/kits', label: 'Kits e Combos', short: 'Kits', icon: PackageOpen },
  { to: '/compras', label: 'Compras e Estoque', short: 'Compras', icon: ShoppingCart },
  { to: '/configuracoes', label: 'Configurações', short: 'Ajustes', icon: Settings },
]
