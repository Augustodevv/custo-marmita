import { createHashRouter, RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppLayout } from '@/components/layout/AppLayout'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAppStore } from '@/store/useAppStore'

// HashRouter: funciona em qualquer hospedagem estática (GitHub Pages, Vercel) sem configurar o servidor.
// As telas são carregadas sob demanda para o app abrir rápido no celular.
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: () => import('@/pages/dashboard/DashboardPage').then((m) => ({ Component: m.DashboardPage })),
      },
      {
        path: 'ingredientes',
        lazy: () =>
          import('@/pages/ingredients/IngredientsPage').then((m) => ({ Component: m.IngredientsPage })),
      },
      {
        path: 'embalagens',
        lazy: () => import('@/pages/packaging/PackagingPage').then((m) => ({ Component: m.PackagingPage })),
      },
      {
        path: 'fichas',
        lazy: () => import('@/pages/recipes/RecipesPage').then((m) => ({ Component: m.RecipesPage })),
      },
      {
        path: 'fichas/:id',
        lazy: () =>
          import('@/pages/recipes/RecipeEditorPage').then((m) => ({ Component: m.RecipeEditorPage })),
      },
      {
        path: 'custos',
        lazy: () => import('@/pages/costs/CostsPage').then((m) => ({ Component: m.CostsPage })),
      },
      {
        path: 'precificacao',
        lazy: () => import('@/pages/pricing/PricingPage').then((m) => ({ Component: m.PricingPage })),
      },
      { path: 'kits', lazy: () => import('@/pages/kits/KitsPage').then((m) => ({ Component: m.KitsPage })) },
      {
        path: 'compras',
        lazy: () => import('@/pages/shopping/ShoppingPage').then((m) => ({ Component: m.ShoppingPage })),
      },
      {
        path: 'configuracoes',
        lazy: () => import('@/pages/settings/SettingsPage').then((m) => ({ Component: m.SettingsPage })),
      },
      { path: '*', lazy: () => import('@/pages/NotFoundPage').then((m) => ({ Component: m.NotFoundPage })) },
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
