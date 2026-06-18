import { Navbar } from '@/components/navbar';
import { UserManagement } from '../pages/usermanagement';

export default function UserManagementRoute() {
  return (
    <Navbar>
      <UserManagement />
    </Navbar>
  );
}
