'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Calendar, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToCandidatesCollection,
  subscribeToHiringMatrices,
  subscribeToInterviews,
  type FirestoreCandidate,
  type FirestoreHiringMatrix,
  type FirestoreInterview,
} from '@/lib/firebase';
import { toast } from 'sonner';

type CandidateRecord = FirestoreCandidate & { id: string };
type InterviewRecord = FirestoreInterview & { id: string };
type MatrixRecord = FirestoreHiringMatrix & { id: string };

function isUpcoming(interview: InterviewRecord) {
  if (!interview.interview_datetime) return false;
  const date = new Date(interview.interview_datetime).getTime();
  return Number.isFinite(date) && date >= Date.now();
}

function formatInterviewDate(value?: string | null) {
  if (!value) return 'Time not set';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : value;
}

export function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [matrices, setMatrices] = useState<MatrixRecord[]>([]);
  const [recentCandidatePageSize, setRecentCandidatePageSize] = useState<number | 'all'>('all');
  const [customRecentCandidatePageSize, setCustomRecentCandidatePageSize] = useState(20);

  useEffect(() => subscribeToCandidatesCollection(setCandidates, () => toast.error('Unable to load candidates.')), []);
  useEffect(() => subscribeToInterviews(setInterviews, () => toast.error('Unable to load interviews.')), []);
  useEffect(() => subscribeToHiringMatrices(setMatrices, () => toast.error('Unable to load hiring matrix.')), []);

  const activeCandidates = candidates.filter((candidate) => candidate.status?.toLowerCase() === 'active');
  const upcomingInterviews = useMemo(() => {
    const upcoming = interviews.filter(isUpcoming);
    if (user?.role === 'Recruiter') {
      return upcoming.filter((interview) => interview.interviewer?.trim() === user.name.trim());
    }
    return upcoming;
  }, [interviews, user]);

  const pendingApproval =
    user?.role === 'Department Manager'
      ? matrices.filter((matrix) => matrix.approval_status === 'pending').length
      : interviews.filter((interview) => interview.interview_status === 'pending').length;

  const recentCandidates = recentCandidatePageSize === 'all'
    ? activeCandidates
    : activeCandidates.slice(0, recentCandidatePageSize);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{activeCandidates.length}</div></CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          role="link"
          tabIndex={0}
          onClick={() => router.push('/interviews')}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              router.push('/interviews');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{upcomingInterviews.length}</div></CardContent>
        </Card>
        {user?.role !== 'Recruiter' && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{pendingApproval}</div></CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Recent Candidates</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <label htmlFor="recent-candidate-page-size" className="sr-only">Candidates to show</label>
              <select
                id="recent-candidate-page-size"
                className="h-9 rounded-md border bg-background px-2"
                value={recentCandidatePageSize === 'all'
                  ? 'all'
                  : [5, 10, 15].includes(recentCandidatePageSize)
                    ? String(recentCandidatePageSize)
                    : 'custom'}
                onChange={(event) => {
                  const value = event.target.value === 'all'
                    ? 'all'
                    : event.target.value === 'custom'
                      ? customRecentCandidatePageSize
                      : Number(event.target.value);
                  setRecentCandidatePageSize(value);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="custom">Custom</option>
                <option value="all">Show all</option>
              </select>
              {recentCandidatePageSize !== 'all'
                && ![5, 10, 15].includes(recentCandidatePageSize) && (
                  <Input
                    type="number"
                    min="1"
                    className="w-20"
                    value={customRecentCandidatePageSize}
                    onChange={(event) => {
                      const value = Math.max(1, Number(event.target.value) || 1);
                      setCustomRecentCandidatePageSize(value);
                      setRecentCandidatePageSize(value);
                    }}
                    aria-label="Custom number of candidates to show"
                  />
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.email}</p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
              {recentCandidates.length === 0 && <p className="text-sm text-muted-foreground">No active candidates</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming Interviews</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.slice(0, 5).map((interview) => (
                <div key={interview.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{interview.candidateName ?? 'Unnamed candidate'}</p>
                    <p className="text-sm text-muted-foreground">{interview.interview_type ?? 'Interview'}</p>
                  </div>
                  <p className="text-right text-sm">{formatInterviewDate(interview.interview_datetime)}</p>
                </div>
              ))}
              {upcomingInterviews.length === 0 && <p className="text-sm text-muted-foreground">No upcoming interviews</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
