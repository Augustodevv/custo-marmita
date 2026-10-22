import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { CostsPage } from '@/pages/costs/CostsPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { IngredientsPage } from '@/pages/ingredients/IngredientsPage'
import { PackagingPage } from '@/pages/packaging/PackagingPage'
import { PricingPage } from '@/pages/pricing/PricingPage'
import { RecipeEditorPage } from '@/pages/recipes/RecipeEditorPage'
import { RecipesPage } from '@/pages/recipes/RecipesPage'
import { SettingsPage } from '@/pages/settings/SettingsPage'
import { ShoppingPage } from '@/pages/shopping/ShoppingPage'
import { useAppStore } from '@/store/useAppStore'

// HashRouter: funciona em qualquer hospedagem estática (GitHub Pages) sem configurar o servidor
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'ingredientes', element: <IngredientsPage /> },
      { path: 'embalagens', element: <PackagingPage /> },
      { path: 'fichas', element: <RecipesPage /> },
      { path: 'fichas/:id', element: <RecipeEditorPage /> },
      { path: 'custos', element: <CostsPage /> },
      { path: 'precificacao', element: <PricingPage /> },
      { path: 'kits', element: <ComingSoonPage title="Kits e combos" stage={3} /> },
      { path: 'compras', element: <ShoppingPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
      { path: '*', element: <ComingSoonPage title="Página não encontrada" stage={1} /> },
    ],
  },
])

export default function App() {
  const isDark = useAppStore((s) => s.settings.theme === 'dark')
  return (
    <TooltipProvider delayDuration={200}>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton theme={isDark ? 'dark' : 'light'} />
    </TooltipProvider>
  )
}
