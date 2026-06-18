export type Role =
  | 'Hiring Manager'
  | 'Recruiter'
  | 'Department Manager'
  | 'Super Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  skills: string[];
  education: string;
  status:
    | 'Approve to Hire'
    | '2nd Interview'
    | 'KIV'
    | 'Reject'
    | 'Recommendation';
  resumeUrl?: string;
  uploadedDate: string;
  matchScore?: number;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  interviewer: string;
  date: string;
  time: string;
  type: 'Phone' | 'Technical' | 'HR' | 'Final';
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  notes?: string;
  feedback?: string;
}

export interface JobPosition {
  id: string;
  positionName: string;
  requiredCandidates: number;
  skillsNeeded: string[];
  salaryRange: string;
  department: string;
  createdBy: string;
  createdDate: string;
  status: 'Open' | 'Closed';
}

export interface ShortlistedCandidate {
  id: string;
  candidateId: string;
  candidateName: string;
  phone: string;
  email: string;
  jobId: string;
  jobPosition: string;
  interviewDate?: string;
  interviewTime?: string;
  hiringManagerDecision?:
    | 'Approve to Hire'
    | '2nd Interview'
    | 'Reject'
    | 'KIV'
    | 'Recommendation'
    | null;
  hiringManagerRemark?: string;
  recruiterRemark?: string;
  status:
    | 'Shortlisted'
    | 'Interview Scheduled'
    | 'Interview Completed'
    | 'Approved'
    | 'Rejected';
}

export interface HiringMatrix {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  department: string;
  phone: string;
  email: string;
  interviewDate: string;
  salary: string;
  hiringManagerRemark: string;
  recruiterRemark: string;
  jobRequisition: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  requestedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

export interface Permission {
  feature: string;
  read: boolean;
  write: boolean;
}

export const rolePermissions: Record<Role, Permission[]> = {
  'Hiring Manager': [
    { feature: 'Resume Parsing', read: false, write: false },
    { feature: 'AI Matching', read: false, write: false },
    { feature: 'Searchable Talent Pool', read: true, write: true },
    { feature: 'Interview Management', read: true, write: true },
    { feature: 'Candidate Profiles', read: true, write: true },
    { feature: 'Hiring Matrix Approval', read: true, write: false },
    { feature: 'Job Positions', read: true, write: true },
    { feature: 'Shortlisted Pool', read: true, write: true },
    { feature: 'User Management', read: false, write: false },
  ],
  Recruiter: [
    { feature: 'Resume Parsing', read: true, write: true },
    { feature: 'AI Matching', read: true, write: true },
    { feature: 'Searchable Talent Pool', read: true, write: true },
    { feature: 'Interview Management', read: true, write: true },
    { feature: 'Candidate Profiles', read: true, write: true },
    { feature: 'Hiring Matrix Approval', read: true, write: false },
    { feature: 'Job Positions', read: true, write: false },
    { feature: 'Shortlisted Pool', read: true, write: false },
    { feature: 'User Management', read: false, write: false },
  ],
  'Department Manager': [
    { feature: 'Resume Parsing', read: false, write: false },
    { feature: 'AI Matching', read: false, write: false },
    { feature: 'Searchable Talent Pool', read: true, write: true },
    { feature: 'Interview Management', read: true, write: false },
    { feature: 'Candidate Profiles', read: true, write: true },
    { feature: 'Hiring Matrix Approval', read: true, write: true },
    { feature: 'Job Positions', read: true, write: false },
    { feature: 'Shortlisted Pool', read: true, write: false },
    { feature: 'User Management', read: false, write: false },
  ],
  'Super Admin': [
    { feature: 'Resume Parsing', read: true, write: false },
    { feature: 'AI Matching', read: true, write: false },
    { feature: 'Searchable Talent Pool', read: true, write: false },
    { feature: 'Interview Management', read: true, write: false },
    { feature: 'Candidate Profiles', read: true, write: false },
    { feature: 'Hiring Matrix Approval', read: true, write: false },
    { feature: 'User Management', read: true, write: true },
    { feature: 'Job Positions', read: true, write: false },
    { feature: 'Shortlisted Pool', read: true, write: false },
  ],
};
