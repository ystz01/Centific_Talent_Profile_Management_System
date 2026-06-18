import { Navbar } from '@/components/navbar';
import { ProfileManagement } from '../pages/profilemanagement';

export default function ProfileRoute() {
  return (
    <Navbar>
      <ProfileManagement />
    </Navbar>
  );
}
