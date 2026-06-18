"use client";

import { useState } from 'react';
import { Search, Clock, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type CandidateStatus = 'Hired' | 'Offer' | 'Interview' | 'Screening' | 'Rejected';

interface Candidate {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  experience: string;
  uploadedDate: string;
  education: string;
  skills: string[];
  status: CandidateStatus;
  matchScore?: number;
}

interface Interview {
  id: string;
  candidateId: string;
  date: string;
  time: string;
  type: string;
  interviewer: string;
  status: 'Completed' | 'Scheduled';
  feedback?: string;
}

const mockCandidates: Candidate[] = [
  {
    id: 'cand-1',
    name: 'Alicia Reyes',
    position: 'Senior Frontend Engineer',
    email: 'alicia.reyes@example.com',
    phone: '+1 555-0101',
    experience: '6 years',
    uploadedDate: '2026-04-01',
    education: 'BSc Computer Science',
    skills: ['React', 'TypeScript', 'Next.js', 'AWS', 'Leadership'],
    status: 'Interview',
    matchScore: 94,
  },
  {
    id: 'cand-2',
    name: 'Marcus Lim',
    position: 'Full Stack Developer',
    email: 'marcus.lim@example.com',
    phone: '+1 555-0102',
    experience: '4 years',
    uploadedDate: '2026-04-03',
    education: 'BSc Software Engineering',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
    status: 'Screening',
    matchScore: 89,
  },
  {
    id: 'cand-3',
    name: 'Priya Nair',
    position: 'Software Engineer',
    email: 'priya.nair@example.com',
    phone: '+1 555-0103',
    experience: '5 years',
    uploadedDate: '2026-04-06',
    education: 'MSc Computer Science',
    skills: ['TypeScript', 'Next.js', 'AWS', 'Testing'],
    status: 'Offer',
    matchScore: 92,
  },
];

const mockInterviews: Interview[] = [
  {
    id: 'int-1',
    candidateId: 'cand-1',
    date: '2026-04-08',
    time: '10:30 AM',
    type: 'Technical',
    interviewer: 'John Smith',
    status: 'Completed',
    feedback: 'Strong system design and communication skills.',
  },
  {
    id: 'int-2',
    candidateId: 'cand-1',
    date: '2026-04-10',
    time: '02:00 PM',
    type: 'Panel',
    interviewer: 'Sarah Lee',
    status: 'Scheduled',
  },
  {
    id: 'int-3',
    candidateId: 'cand-2',
    date: '2026-04-05',
    time: '11:00 AM',
    type: 'Screening',
    interviewer: 'Mia Wong',
    status: 'Completed',
    feedback: 'Good practical experience, needs more cloud exposure.',
  },
];

export default function CandidateProfilePage() {
  const canWrite = true;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate>(mockCandidates[0]);

  const filteredCandidates = mockCandidates.filter((candidate: Candidate) =>
    candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const candidateInterviews = mockInterviews.filter(
    (interview: Interview) => interview.candidateId === selectedCandidate.id
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hired': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Offer': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Interview': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Screening': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (!hasPermission('Candidate Profiles', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You don't have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Profiles</h1>
        <p className="text-muted-foreground">View detailed candidate information and interview history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredCandidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelectedCandidate(candidate)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedCandidate.id === candidate.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="font-medium">{candidate.name}</div>
                <div className="text-sm opacity-80">{candidate.position}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedCandidate.name}</CardTitle>
                <p className="text-muted-foreground mt-1">{selectedCandidate.position}</p>
              </div>
              <Badge className={getStatusColor(selectedCandidate.status)}>
                {selectedCandidate.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="history">Interview History</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedCandidate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedCandidate.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Experience</p>
                    <p className="font-medium">{selectedCandidate.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Uploaded Date</p>
                    <p className="font-medium">{selectedCandidate.uploadedDate}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Education</p>
                  <p className="font-medium">{selectedCandidate.education}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedCandidate.matchScore && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">AI Match Score</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${selectedCandidate.matchScore}%` }}
                        />
                      </div>
                      <span className="text-xl font-bold text-primary">
                        {selectedCandidate.matchScore}%
                      </span>
                    </div>
                  </div>
                )}

                {canWrite && (
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Download Resume
                    </Button>
                    <Button>
                      Update Profile
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {candidateInterviews.length > 0 ? (
                  candidateInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="p-4 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{interview.date} at {interview.time}</span>
                        </div>
                        <Badge variant="outline">{interview.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interviewer: {interview.interviewer}
                      </p>
                      <p className="text-sm">
                        <span className={`font-medium ${
                          interview.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {interview.status}
                        </span>
                      </p>
                      {interview.feedback && (
                        <div className="mt-2 p-3 bg-secondary rounded">
                          <p className="text-sm">{interview.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No interview history available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Textarea
                  placeholder="Add notes about this candidate..."
                  rows={8}
                  readOnly={!canWrite}
                  defaultValue="Strong technical background with excellent communication skills. Demonstrated deep knowledge of React ecosystem during initial screening."
                />
                {canWrite && (
                  <div className="flex justify-end">
                    <Button>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Save Notes
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
