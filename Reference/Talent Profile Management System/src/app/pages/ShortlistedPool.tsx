import { useState } from 'react';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { mockShortlistedCandidates, mockJobPositions } from '../data/mockData';
import { ShortlistedCandidate } from '../types';
import { toast } from 'sonner';
import { Badge } from '../components/ui/badge';

export function ShortlistedPool() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Shortlisted Pool', 'write');
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>(mockShortlistedCandidates);
  const [selectedJob, setSelectedJob] = useState<string>('all');

  const filteredCandidates = selectedJob === 'all'
    ? candidates
    : candidates.filter(c => c.jobId === selectedJob);

  const handleApproveForInterview = (id: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'Interview Scheduled' as const } : c
      )
    );
    toast.success('Candidate approved for interview scheduling');
  };

  const handleReject = (id: string) => {
    setCandidates(prev =>
      prev.map(c =>
        c.id === id ? { ...c, status: 'Rejected' as const } : c
      )
    );
    toast.error('Candidate rejected');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Interview Scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Interview Completed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
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
          <p className="text-muted-foreground">Review and manage shortlisted candidates for job positions</p>
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
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-100 dark:bg-blue-900/20">
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">NO</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Name</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Phone</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Email</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Interview Date/TIME</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Hire Y/N</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Hiring Manager Remark</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Job Requisition</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Centific talent acquisition Remark</TableHead>
                  <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Recruiter</TableHead>
                  {canWrite && (
                    <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Actions</TableHead>
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
                      <TableCell>
                        {candidate.interviewDate && candidate.interviewTime
                          ? `${candidate.interviewDate} ${candidate.interviewTime}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {candidate.hiringManagerDecision === 'Approve to Hire' ? (
                          <span className="text-green-600 font-bold">Y</span>
                        ) : candidate.hiringManagerDecision === 'Reject' ? (
                          <span className="text-red-600 font-bold">N</span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate">{candidate.hiringManagerRemark || '-'}</p>
                      </TableCell>
                      <TableCell>{candidate.jobPosition}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate">{candidate.recruiterRemark || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      {canWrite && candidate.status === 'Shortlisted' && (
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveForInterview(candidate.id)}
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
                      {canWrite && candidate.status !== 'Shortlisted' && (
                        <TableCell>
                          <span className="text-sm text-muted-foreground">-</span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 11 : 10} className="text-center py-8">
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
