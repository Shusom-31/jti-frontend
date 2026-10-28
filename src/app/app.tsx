import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SessionGate } from './guards/session-gate';
import { Shell } from '../components/layout/shell';
import { LoginScreen } from '../modules/auth';
import { OverviewScreen } from '../modules/overview';
import { OrganizationsScreen } from '../modules/organizations';
import { MovementScreen } from '../modules/movement';
import { RetentionScreen } from '../modules/retention';
import { AgencySwitchesScreen } from '../modules/switches';
import { EmployeesScreen } from '../modules/employees';
import { NotFoundScreen } from './screens/not-found-screen';
export function App() { return <BrowserRouter><Routes><Route path="/login" element={<LoginScreen />} /><Route element={<SessionGate />}><Route element={<Shell />}><Route index element={<OverviewScreen />} /><Route path="organizations" element={<OrganizationsScreen />} /><Route path="movement" element={<MovementScreen />} /><Route path="retention" element={<RetentionScreen />} /><Route path="switches" element={<AgencySwitchesScreen />} /><Route path="directory" element={<EmployeesScreen />} /><Route path="*" element={<NotFoundScreen />} /></Route></Route></Routes></BrowserRouter>; }
