import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'

import Login from './pages/Login'
import AutoApply from './pages/AutoApply'
import BrowseProducts from './pages/BrowseProducts'
import AccessControl from './pages/AccessControl'
import UserPortal from './pages/UserPortal'
import SidebarLayout from './layouts/SidebarLayout'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<SidebarLayout />}>
          <Route path="/dashboard/auto-apply" element={<AutoApply />} />
          <Route path="/dashboard/menu/view" element={<BrowseProducts />} />
          <Route path="/dashboard/staff" element={<AccessControl />} />
          <Route path="/dashboard/staff/:id" element={<UserPortal />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

export default App
