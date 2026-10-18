"use client";

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, Eye, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToCandidatesCollection, subscribeToInterviews } from '@/lib/firebase';
import { toast } from 'sonner';

type InterviewRecord = {
  id: string;
  candidateId: string;
  candidateName: string;
  phone: string;
  email: string;
  interviewDateTime: string | null;
  position: string;
  interviewStatus: 'pending' | 'accept' | 'reject' | '2nd Interview' | 'KIV';
  recruiterRemarks: Array<{ name: string; remark: string }>;
  hiringManagerRemarks: Array<{ name: string; remark: string }>;
  departmentManagerRemarks: Array<{ name: string; remark: string }>;
};

const statusLabels = {
  pending: 'Pending',
  accept: 'Accept',
  reject: 'Reject',
  KIV: 'Keep In View',
} as const;

const formatRemarks = (remarks: Array<{ name: string; remark: string }>) =>
  remarks.length > 0
    ? remarks.map((item) => `${item.name}: ${item.remark}`).join('\n')
    : '-';

const formatInterviewDate = (dateTime: string | null) => {
  if (!dateTime) return '-';

  const date = new Date(dateTime);
  return Number.isNaN(date.getTime())
    ? dateTime
    : date.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
};

function InterviewTable({ records, candidateContacts }: {
  records: InterviewRecord[];
  candidateContacts: Record<string, { phone: string; email: string }>;
}) {
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-100 dark:bg-blue-900/20">
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Name</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Phone</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Email</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Interview Date/Time</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Recruiter Remark</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Department Manager Remark</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Hiring Manager Remark</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Job Position</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length > 0 ? (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.candidateName || '-'}</TableCell>
                <TableCell>{candidateContacts[record.candidateId]?.phone || '-'}</TableCell>
                <TableCell>{candidateContacts[record.candidateId]?.email || '-'}</TableCell>
                <TableCell>{formatInterviewDate(record.interviewDateTime)}</TableCell>
                <TableCell className="max-w-[260px] whitespace-pre-wrap break-words">
                  {formatRemarks(record.recruiterRemarks)}
                </TableCell>
                <TableCell className="max-w-[260px] whitespace-pre-wrap break-words">
                  {formatRemarks(record.departmentManagerRemarks)}
                </TableCell>
                <TableCell className="max-w-[260px] whitespace-pre-wrap break-words">
                  {formatRemarks(record.hiringManagerRemarks)}
                </TableCell>
                <TableCell>{record.position || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline">{statusLabels[record.interviewStatus as keyof typeof statusLabels] ?? record.interviewStatus}</Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8">
                <p className="text-muted-foreground">No interview records found</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function InterviewTracking() {
  const { hasPermission } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [candidateContacts, setCandidateContacts] = useState<Record<string, { phone: string; email: string }>>({});

  useEffect(() => {
    const unsubscribeInterviews = subscribeToInterviews(
      (records) => {
        setInterviews(records.map((record) => ({
          id: record.id,
          candidateId: record.candidateId ?? '',
          candidateName: record.candidateName ?? '',
          phone: '',
          email: '',
          interviewDateTime: record.interview_datetime ?? null,
          position: record.position ?? '',
          interviewStatus: record.interview_status ?? 'pending',
          recruiterRemarks: record.recruiter_remark ?? [],
          hiringManagerRemarks: record.hiringmanager_remark ?? [],
          departmentManagerRemarks: record.departmentmanager_remark ?? [],
        })));
      },
      (error) => {
        console.error(error);
        toast.error('Unable to load interview records from Firebase.');
      }
    );
    const unsubscribeCandidates = subscribeToCandidatesCollection(
      (records) => {
        setCandidateContacts(Object.fromEntries(records.map((candidate) => [
          candidate.id,
          { phone: candidate.phone ?? '', email: candidate.email ?? '' },
        ])));
      },
      (error) => {
        console.error(error);
        toast.error('Unable to load candidate contact details.');
      }
    );

    return () => {
      unsubscribeInterviews();
      unsubscribeCandidates();
    };
  }, []);

  const pending = interviews.filter((record) => record.interviewStatus === 'pending');
  const accepted = interviews.filter((record) => record.interviewStatus === 'accept');
  const rejected = interviews.filter((record) => record.interviewStatus === 'reject');
  const keepInView = interviews.filter((record) => record.interviewStatus === 'KIV');

  if (!hasPermission('Hiring Matrix Approval', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don&apos;t have permission to access this feature.</p>
      </div>
    );
  }

  const tabs = [
    { value: 'pending', label: 'Pending', count: pending.length, icon: Clock, records: pending },
    { value: 'accept', label: 'Accept', count: accepted.length, icon: CheckCircle, records: accepted },
    { value: 'reject', label: 'Reject', count: rejected.length, icon: XCircle, records: rejected },
    { value: 'KIV', label: 'Keep In View', count: keepInView.length, icon: Eye, records: keepInView },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interview Tracking</h1>
        <p className="text-muted-foreground">Track interview records by their current status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {tabs.map(({ label, count, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="pending">
            <TabsList>
              {tabs.map(({ value, label, count }) => (
                <TabsTrigger key={value} value={value}>
                  {label} ({count})
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map(({ value, records }) => (
              <TabsContent key={value} value={value} className="mt-6">
                <InterviewTable records={records} candidateContacts={candidateContacts} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
