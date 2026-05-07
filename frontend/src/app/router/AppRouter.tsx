import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { StartPage } from '@/pages/start'
import { HomePage } from '@/pages/home'
import { SelectTemplatePage } from '@/pages/contracts/new'
import { ContractCreatePage } from '@/pages/contracts/create'
import { ContractViewPage } from '@/pages/contracts/view'
import { ContractDocumentPage } from '@/pages/contracts/document'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/start" element={<StartPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/new"
          element={
            <ProtectedRoute>
              <SelectTemplatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/create/:templateKey"
          element={
            <ProtectedRoute>
              <ContractCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:id"
          element={
            <ProtectedRoute>
              <ContractViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:id/document"
          element={
            <ProtectedRoute>
              <ContractDocumentPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
