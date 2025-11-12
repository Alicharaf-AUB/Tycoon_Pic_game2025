import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import NotFoundPage from './pages/NotFoundPage'
import ErrorBoundary from './components/ErrorBoundary'
import AppPasswordGate from './components/AppPasswordGate'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppPasswordGate>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<LoginPage />} />
              <Route path="dashboard/:investorId" element={<DashboardPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppPasswordGate>
    </ErrorBoundary>
  </React.StrictMode>,
)
