import { AppShell } from '@/components/app-shell';
import { JobPositions } from '../pages/jobpositions';

export default function JobPositionsRoute() {
  return (
    <AppShell>
      <JobPositions />
    </AppShell>
  );
}
