import { Navbar } from '@/components/navbar';
import { JobPositions } from '../pages/jobpositions';

export default function JobPositionsRoute() {
  return (
    <Navbar>
      <JobPositions />
    </Navbar>
  );
}
