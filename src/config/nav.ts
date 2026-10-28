import { LayoutDashboard, Building2, ArrowLeftRight, GitCompareArrows, UsersRound } from 'lucide-react';
export const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'OVERVIEW' },
  { to: '/organizations', label: 'Organizations', icon: Building2 },
  { to: '/movement', label: 'Joiners & Leavers', icon: ArrowLeftRight, group: 'WORKFORCE INSIGHTS' },
  { to: '/switches', label: 'Agency Switches', icon: GitCompareArrows },
  { to: '/directory', label: 'Employee Directory', icon: UsersRound, group: 'PEOPLE' },
];
