import { AppShell } from '@/components/app-shell';
import { UserManagement } from '../pages/usermanagement';

export default function UserManagementRoute() {
  return (
    <AppShell>
      <UserManagement />
    </AppShell>
  );
}
