"use client";

import { useEffect, useState } from 'react';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { ShortlistedCandidate } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  subscribeToOpenJobPositions,
  subscribeToShortlistedPool,
  updateShortlistedDecision,
  type FirestoreJobPosition,
} from '@/lib/firebase';

export function ShortlistedPool() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Shortlisted Pool', 'write');
  const isHiringManager = user?.role === 'Hiring Manager';
  const canManageCandidates = canWrite && isHiringManager;
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [activeJobs, setActiveJobs] = useState<Array<FirestoreJobPosition & { id: string }>>([]);

  useEffect(() => {
    return subscribeToOpenJobPositions(
      setActiveJobs,
      (error) => {
        console.error(error);
        toast.error('Unable to load active job positions.');
      }
    );
  }, []);

  useEffect(() => {
    return subscribeToShortlistedPool(
      (records) => {
        setCandidates(records.map((record) => ({
          id: record.id,
          candidateId: record.candidateId ?? '',
          candidateName: record.candidateName ?? 'Unnamed candidate',
          phone: record.phone ?? '',
          email: record.email ?? '',
          jobId: record.jobId ?? '',
          jobPosition: record.position ?? record.jobName ?? 'Unknown job',
          position: record.position ?? record.jobName ?? 'Unknown job',
          hiringManagerDecision: record.hiringManagerDecision as ShortlistedCandidate['hiringManagerDecision'] ?? null,
          hiringManagerRemark: record.hiringManagerRemark ?? undefined,
          recruiterRemark: record.recruiterRemark ?? undefined,
          strength: record.strength ?? null,
          weakness: record.weakness ?? null,
          status: record.status === 'Approved' || record.status === 'Rejected'
            ? record.status
            : 'Shortlisted',
        })));
      },
      (error) => {
        console.error(error);
        toast.error('Unable to load the shortlisted pool from Firebase.');
      }
    );
  }, []);

  const effectiveSelectedJob = selectedJob !== 'all' && activeJobs.some((job) => job.id === selectedJob)
    ? selectedJob
    : 'all';

  const filteredCandidates = effectiveSelectedJob === 'all'
    ? candidates
    : candidates.filter(c => c.jobId === effectiveSelectedJob);

  const getStrength = (candidate: ShortlistedCandidate) => candidate.strength || '-';

  const getGaps = (candidate: ShortlistedCandidate) => candidate.weakness || '-';

  const getDecisionStatus = (candidate: ShortlistedCandidate) => {
    if (candidate.hiringManagerDecision === 'Approve to Hire') return 'Approved';
    if (candidate.hiringManagerDecision === 'Reject') return 'Rejected';
    return 'Pending';
  };

  const handleApprove = async (id: string) => {
    try {
      const candidate = candidates.find((item) => item.id === id);
      await updateShortlistedDecision(id, 'Approve to Hire', candidate ? {
        id: candidate.id,
        candidateId: candidate.candidateId,
        candidateName: candidate.candidateName,
        phone: candidate.phone,
        email: candidate.email,
        jobId: candidate.jobId,
        jobName: candidate.jobPosition,
        position: candidate.position ?? candidate.jobPosition,
      } : undefined);
      toast.success('Candidate approved');
    } catch (error) {
      console.error(error);
      toast.error('Unable to approve candidate.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const candidate = candidates.find((item) => item.id === id);
      await updateShortlistedDecision(id, 'Reject', candidate ? {
        id: candidate.id,
        candidateId: candidate.candidateId,
        candidateName: candidate.candidateName,
        phone: candidate.phone,
        email: candidate.email,
        jobId: candidate.jobId,
        jobName: candidate.jobPosition,
        position: candidate.position ?? candidate.jobPosition,
      } : undefined);
      toast.error('Candidate rejected');
    } catch (error) {
      console.error(error);
      toast.error('Unable to reject candidate.');
    }
  };

  if (!hasPermission('Shortlisted Pool', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shortlisted Pool</h1>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Job:</label>
            <Select value={effectiveSelectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {activeJobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.Position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Shortlisted Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Shortlisted Candidates ({filteredCandidates.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-x-auto">
            <Table className="text-black">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-bold">NO</TableHead>
                  <TableHead className="text-black font-bold">Name</TableHead>
                  <TableHead className="text-black font-bold">Phone</TableHead>
                  <TableHead className="text-black font-bold">Email</TableHead>
                  <TableHead className="text-black font-bold">Strength</TableHead>
                  <TableHead className="text-black font-bold">Gaps</TableHead>
                  <TableHead className="text-black font-bold">Job</TableHead>
                  <TableHead className="text-black font-bold">Status</TableHead>
                  {canManageCandidates && (
                    <TableHead className="text-black font-bold">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate, index) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{candidate.candidateName}</TableCell>
                      <TableCell>{candidate.phone}</TableCell>
                      <TableCell>{candidate.email}</TableCell>
                      <TableCell className="w-[24%] align-top whitespace-normal break-words">
                        <p className="whitespace-normal break-words">{getStrength(candidate)}</p>
                      </TableCell>
                      <TableCell className="w-[24%] align-top whitespace-normal break-words">
                        <p className="whitespace-normal break-words">{getGaps(candidate)}</p>
                      </TableCell>
                      <TableCell>{candidate.position || candidate.jobPosition || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-black">
                          {getDecisionStatus(candidate)}
                        </Badge>
                      </TableCell>
                      {canManageCandidates && getDecisionStatus(candidate) === 'Pending' && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(candidate.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(candidate.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      )}
                      {canManageCandidates && getDecisionStatus(candidate) !== 'Pending' && (
                        <TableCell>
                          <span className="text-sm text-muted-foreground">-</span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManageCandidates ? 9 : 8} className="text-center py-8">
                      <p className="text-muted-foreground">No shortlisted candidates found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
