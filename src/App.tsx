import { Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProgressProvider } from './contexts/ProgressContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CatalogPage from './pages/CatalogPage'
import BlockDetailPage from './pages/BlockDetailPage'
import PlaygroundPage from './pages/PlaygroundPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ResourcesPage from './pages/ResourcesPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/practice" element={<CatalogPage />} />
            <Route path="/practice/:certSlug/:blockSlug" element={<BlockDetailPage />} />
            <Route path="/playground" element={<PlaygroundPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </ProgressProvider>
    </AuthProvider>
  )
}
