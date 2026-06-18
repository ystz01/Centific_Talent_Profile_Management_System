import { RoleDashboard } from '../components/role-dashboard';

export default function HiringManagerPage() {
  return (
    <RoleDashboard
      title="Hiring Manager Dashboard"
      description="Prioritize interviews, compare candidates, and make hiring decisions faster."
      accent="bg-emerald-500"
      metrics={[
        { label: 'Interviews Today', value: '6', note: 'Across two hiring panels' },
        { label: 'Finalists', value: '9', note: 'Under active evaluation' },
        { label: 'Approvals Needed', value: '3', note: 'Offers waiting on signoff' },
        { label: 'Decision SLA', value: '2.4d', note: 'Average turnaround' },
      ]}
      focusTitle="Decision Queue"
      focusDescription="Candidates that need review or next-step scheduling."
      focusItems={[
        { title: 'Alicia Reyes', description: 'Strong fit for senior frontend role.', tag: 'Ready', meta: 'Panel feedback consolidated' },
        { title: 'Marcus Lim', description: 'Needs one more technical interview.', tag: 'Review', meta: 'Pending availability' },
        { title: 'Priya Nair', description: 'Offer discussion can begin after salary alignment.', tag: 'Hot', meta: 'Preferred candidate' },
      ]}
      activityTitle="Interview Flow"
      activityDescription="What is happening across scheduled interviews."
      activityItems={[
        { title: 'Panel interviews scheduled', description: '3 sessions confirmed for tomorrow.', tag: 'Today', meta: 'Interview kit shared' },
        { title: 'Feedback submitted', description: '2 interviewers completed scorecards.', tag: 'Recent', meta: 'No blockers raised' },
        { title: 'Offer draft prepared', description: 'Comp package reviewed for final approval.', tag: 'Action', meta: 'Needs leadership signoff' },
      ]}
      primaryAction={{ label: 'Review Interview Queue', href: '/home' }}
      secondaryAction={{ label: 'Open Candidate Profile', href: '/home' }}
    />
  );
}
