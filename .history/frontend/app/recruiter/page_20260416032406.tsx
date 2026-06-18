import { RoleDashboard } from '../components/role-dashboard';

export default function RecruiterPage() {
  return (
    <RoleDashboard
      title="Recruiter Dashboard"
      description="Focus on sourcing, outreach, and building strong candidate pipelines."
      accent="bg-blue-500"
      metrics={[
        { label: 'Open Roles', value: '12', note: 'Across active requisitions' },
        { label: 'New Applicants', value: '48', note: 'In the last 7 days' },
        { label: 'Shortlisted', value: '18', note: 'Ready for review' },
        { label: 'Response Rate', value: '72%', note: 'Candidate outreach replies' },
      ]}
      focusTitle="Sourcing Priorities"
      focusDescription="Jobs and campaigns that need immediate recruiter attention."
      focusItems={[
        { title: 'Senior React Engineer', description: '3 strong candidates need outreach today.', tag: 'High', meta: 'Pipeline stage: Contacted' },
        { title: 'Data Analyst', description: 'Resume batch needs screening before EOD.', tag: 'Medium', meta: '23 new applicants' },
        { title: 'UX Designer', description: 'Schedule intro calls with shortlisted profiles.', tag: 'High', meta: '2 interviews pending' },
      ]}
      activityTitle="Recruiting Activity"
      activityDescription="Latest actions and follow-ups from the talent pipeline."
      activityItems={[
        { title: 'Candidate outreach sent', description: '5 messages drafted for backend engineering role.', tag: 'Today', meta: 'Next follow-up in 24 hours' },
        { title: 'Interview request confirmed', description: 'Hiring manager approved 4 candidates for screening.', tag: 'Yesterday', meta: 'Awaiting schedule slot' },
        { title: 'Offer prep started', description: 'Compensation review ready for finalist candidate.', tag: 'This week', meta: 'HR approval pending' },
      ]}
      primaryAction={{ label: 'Open Talent Pool', href: '/home' }}
      secondaryAction={{ label: 'View Candidates', href: '/home' }}
    />
  );
}
