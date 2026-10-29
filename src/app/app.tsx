import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SessionGate } from './guards/session-gate';
import { AdminGate } from './guards/admin-gate';
import { Shell } from '../components/layout/shell';
import { LoginScreen } from '../modules/auth';
import { AdminScreen } from '../modules/admin/screens/admin.screen';
import { WorkforceProvider } from '../hooks/use-workforce';
import { OverviewScreen } from '../modules/overview';
import { OrganizationsScreen } from '../modules/organizations';
import { MovementScreen } from '../modules/movement';
import { AgencySwitchesScreen } from '../modules/switches';
import { EmployeesScreen } from '../modules/employees';
import { NotFoundScreen } from './screens/not-found-screen';
function AdminWorkspace() { return <WorkforceProvider><AdminGate><AdminScreen /></AdminGate></WorkforceProvider>; }
function RetiredRetentionRoute() { const { search } = useLocation(); return <Navigate to={`/${search}`} replace />; }
export function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<LoginScreen />} />
    <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
    <Route path="/admin/*" element={<AdminWorkspace />} />
    <Route element={<SessionGate />}><Route element={<Shell />}>
      <Route index element={<OverviewScreen />} />
      <Route path="organizations" element={<OrganizationsScreen />} />
      <Route path="movement" element={<MovementScreen />} />
      <Route path="retention" element={<RetiredRetentionRoute />} />
      <Route path="switches" element={<AgencySwitchesScreen />} />
      <Route path="directory" element={<EmployeesScreen />} />
      <Route path="*" element={<NotFoundScreen />} />
    </Route></Route>
  </Routes></BrowserRouter>;
}
