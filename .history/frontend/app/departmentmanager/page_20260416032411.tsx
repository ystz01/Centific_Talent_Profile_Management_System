import { RoleDashboard } from '../components/role-dashboard';

export default function DepartmentManagerPage() {
  return (
    <RoleDashboard
      title="Department Manager Dashboard"
      description="Track team demand, approve headcount, and monitor hiring progress."
      accent="bg-amber-500"
      metrics={[
        { label: 'Open Headcount', value: '7', note: 'Across active teams' },
        { label: 'Reqs Pending', value: '4', note: 'Awaiting your approval' },
        { label: 'Hires This Quarter', value: '11', note: 'Against target of 14' },
        { label: 'Budget Remaining', value: '$84k', note: 'Hiring budget balance' },
      ]}
      focusTitle="Team Demand"
      focusDescription="Requests and roles needing your attention this week."
      focusItems={[
        { title: 'Frontend Team', description: 'Approve 2 additional engineers for roadmap delivery.', tag: 'Urgent', meta: 'Product launch in 5 weeks' },
        { title: 'Data Team', description: 'Review request for one senior analyst.', tag: 'Pending', meta: 'Budget estimate submitted' },
        { title: 'Design Team', description: 'Confirm hiring plan for UX contractor.', tag: 'Review', meta: 'Timeline aligned with roadmap' },
      ]}
      activityTitle="Approval Activity"
      activityDescription="Recent approvals and staffing changes in your department."
      activityItems={[
        { title: 'Req approved', description: 'Backend engineer role moved to sourcing.', tag: 'Done', meta: 'Shared with recruiting' },
        { title: 'Budget updated', description: 'Compensation estimate revised for senior role.', tag: 'Info', meta: 'Finance notified' },
        { title: 'Headcount review', description: 'Quarterly hiring plan draft prepared.', tag: 'Draft', meta: 'Waiting your comments' },
      ]}
      primaryAction={{ label: 'Review Approvals', href: '/home' }}
      secondaryAction={{ label: 'View Hiring Plan', href: '/home' }}
    />
  );
}
