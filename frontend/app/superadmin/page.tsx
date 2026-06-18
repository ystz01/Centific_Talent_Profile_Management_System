import { RoleDashboard } from '../components/role-dashboard';

export default function SuperAdminPage() {
  return (
    <RoleDashboard
      title="Super Admin Dashboard"
      description="Oversee platform access, configuration, and system-wide governance."
      accent="bg-violet-500"
      navItems={[
        { label: 'Dashboard', href: '/superadmin', description: 'Platform-wide overview' },
        { label: 'User Management', href: '/home', description: 'Manage users and roles' },
        { label: 'Permissions', href: '/home', description: 'Control feature access' },
        { label: 'System Settings', href: '/home', description: 'Configure global options' },
        { label: 'Audit Logs', href: '/home', description: 'Review security events' },
      ]}
      metrics={[
        { label: 'Active Users', value: '248', note: 'Across all roles' },
        { label: 'Open Alerts', value: '5', note: 'Security and workflow notices' },
        { label: 'System Health', value: '99.9%', note: 'Uptime this month' },
        { label: 'Pending Access', value: '8', note: 'Role change requests' },
      ]}
      focusTitle="Governance Queue"
      focusDescription="System-wide tasks that require admin oversight."
      focusItems={[
        { title: 'Access request audit', description: 'Review elevated access approvals.', tag: 'Security', meta: '2 requests flagged' },
        { title: 'Role permissions', description: 'Verify new permission sets for hiring teams.', tag: 'Config', meta: 'Policy update pending' },
        { title: 'System notice', description: 'Monitor background sync health and logs.', tag: 'Monitor', meta: 'No incidents reported' },
      ]}
      activityTitle="Platform Activity"
      activityDescription="Current admin actions and infrastructure status."
      activityItems={[
        { title: 'New user provisioning', description: '4 accounts created for hiring team members.', tag: 'Today', meta: 'MFA enforced' },
        { title: 'Audit export generated', description: 'Security log report compiled for review.', tag: 'Recent', meta: 'Ready for download' },
        { title: 'Policy rollout', description: 'Updated workflow rules pushed to all teams.', tag: 'Live', meta: 'Version 2.3 active' },
      ]}
      primaryAction={{ label: 'Open Admin Console', href: '/home' }}
      secondaryAction={{ label: 'Review Permissions', href: '/home' }}
    />
  );
}
