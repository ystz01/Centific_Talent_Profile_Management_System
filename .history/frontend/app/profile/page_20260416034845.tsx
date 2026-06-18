import { AppShell } from '@/components/app-shell';
import { ProfileManagement } from '../pages/profilemanagement';

export default function ProfileRoute() {
  return (
    <AppShell>
      <ProfileManagement />
    </AppShell>
  );
}
