import { Navbar } from '@/components/navbar';
import { Dashboard } from '../pages/dashboard';

export default function DashboardRoute() {
  return (
    <Navbar>
      <Dashboard />
    </Navbar>
  );
}
