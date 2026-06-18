"use client";

import { useState } from 'react';
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
import { mockShortlistedCandidates, mockJobPositions } from '@/data/mockData';
import { ShortlistedCandidate } from '@/types';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function ShortlistedPool() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Shortlisted Pool', 'write');
  const isHiringManager = user?.role === 'Hiring Manager';
  const canManageCandidates = canWrite && isHiringManager;
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>(mockShortlistedCandidates);
  const [selectedJob, setSelectedJob] = useState<string>('all');

  const filteredCandidates = selectedJob === 'all'
    ? candidates
    : candidates.filter(c => c.jobId === selectedJob);

  const getStrength = (candidate: ShortlistedCandidate) => candidate.recruiterRemark || '-';

  const getGaps = (candidate: ShortlistedCandidate) => candidate.hiringManagerRemark || '-';

  const getDecisionStatus = (candidate: ShortlistedCandidate) => {
    if (candidate.hiringManagerDecision === 'Approve to Hire') return 'Approved';
    if (candidate.hiringManagerDecision === 'Reject') return 'Rejected';
    return 'Pending';
  };

  const handleApprove = (id: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              status: 'Approved' as const,
              hiringManagerDecision: 'Approve to Hire',
            }
          : c
      )
    );
    toast.success('Candidate approved');
  };

  const handleReject = (id: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id
          ? {
              ...c,
              status: 'Rejected' as const,
              hiringManagerDecision: 'Reject',
            }
          : c
      )
    );
    toast.error('Candidate rejected');
  };

  if (!hasPermission('Shortlisted Pool', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don't have permission to access this feature.</p>
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
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                {mockJobPositions.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.positionName}
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
                      <TableCell className="max-w-[200px]">
                        <p className="truncate">{getStrength(candidate)}</p>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate">{getGaps(candidate)}</p>
                      </TableCell>
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
                    <TableCell colSpan={canManageCandidates ? 8 : 7} className="text-center py-8">
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
