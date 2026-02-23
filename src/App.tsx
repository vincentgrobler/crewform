// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 CrewForm

import { Routes, Route } from 'react-router-dom'
import { RootLayout } from '@/layouts/RootLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Agents } from '@/pages/Agents'
import { Teams } from '@/pages/Teams'
import { Tasks } from '@/pages/Tasks'
import { Marketplace } from '@/pages/Marketplace'
import { Settings } from '@/pages/Settings'
import { Auth } from '@/pages/Auth'

export function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<RootLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
