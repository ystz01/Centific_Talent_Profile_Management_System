import { AppShell } from '@/components/app-shell';
import { Dashboard } from '../pages/dashboard';

export default function DashboardRoute() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
