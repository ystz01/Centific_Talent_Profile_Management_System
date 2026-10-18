"use client";

import { useEffect, useState } from 'react';
import { Search, Clock, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToCandidatesCollection,
  subscribeToInterviews,
  updateCandidateNotes,
  updateCandidateProfile,
} from '@/lib/firebase';
import { toast } from 'sonner';

type CandidateStatus = 'Approve to Hire' | 'Hired' | '2nd Interview' | 'KIV' | 'Reject' | 'Recommendation';

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
  resumeUrl?: string;
  location?: string;
  educationLevel?: string;
  linkedin?: string;
  github?: string;
  languages?: string[];
  projects?: Array<{ title: string; description: string }>;
  leadershipActivities?: string[];
  awards?: string[];
  recruiterNotes?: Array<{ name: string; note: string }>;
  hiringManagerNotes?: Array<{ name: string; note: string }>;
  departmentManagerNotes?: Array<{ name: string; note: string }>;
}

interface Interview {
  id: string;
  candidateId: string;
  position: string;
  date: string;
  time: string;
  type: string;
  interviewer: string;
  status: string;
  recruiterRemarks: Array<{ name: string; remark: string }>;
  hiringManagerRemarks: Array<{ name: string; remark: string }>;
  departmentManagerRemarks: Array<{ name: string; remark: string }>;
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
    status: '2nd Interview',
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
    status: 'KIV',
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
    status: 'Approve to Hire',
    matchScore: 92,
  },
];

export default function CandidateProfilePage() {
  const { user } = useAuth();
  const canUpdateProfile = user?.role !== 'Department Manager';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate>(mockCandidates[0]);
  const [candidates, setCandidates] = useState<Candidate[]>(mockCandidates);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    return subscribeToCandidatesCollection(
      (records) => {
        const liveCandidates: Candidate[] = records.map((candidate) => ({
          id: candidate.id,
          name: candidate.name ?? 'Unnamed candidate',
          position: candidate.location ?? 'Location not provided',
          email: candidate.email ?? '',
          phone: candidate.phone ?? '',
          experience: `${candidate.years_of_experience ?? 0} years`,
          uploadedDate: candidate.created_at ?? '—',
          education: candidate.highest_education ?? '—',
          skills: Array.isArray(candidate.skills) ? candidate.skills : [],
          status: candidate.status && ['Approve to Hire', 'Hired', '2nd Interview', 'KIV', 'Reject', 'Recommendation'].includes(candidate.status)
            ? candidate.status as CandidateStatus
            : 'Recommendation',
          resumeUrl: candidate.resume_url ?? '',
          location: candidate.location ?? '',
          educationLevel: candidate.education_level ?? '',
          linkedin: candidate.linkedin ?? '',
          github: candidate.github ?? '',
          languages: Array.isArray(candidate.languages) ? candidate.languages : [],
          projects: Array.isArray(candidate.projects)
            ? candidate.projects.map((project) => ({
                title: project.title ?? '',
                description: project.description ?? '',
              }))
            : [],
          leadershipActivities: Array.isArray(candidate.leadership_activities) ? candidate.leadership_activities : [],
          awards: Array.isArray(candidate.awards) ? candidate.awards : [],
          recruiterNotes: (candidate.recruiter_notes ?? []).map((note) => ({
            name: note.name ?? '',
            note: note.note ?? '',
          })),
          hiringManagerNotes: (candidate.hiringmanager_notes ?? []).map((note) => ({
            name: note.name ?? '',
            note: note.note ?? '',
          })),
          departmentManagerNotes: (candidate.departmentmanager_notes ?? []).map((note) => ({
            name: note.name ?? '',
            note: note.note ?? '',
          })),
        }));

        if (liveCandidates.length > 0) {
          setSelectedCandidate((current) =>
            liveCandidates.find((candidate) => candidate.id === current.id) ?? liveCandidates[0]
          );
        }
        setCandidates(liveCandidates);
      },
      (error) => {
        console.error(error);
        toast.error('Unable to load candidates from Firebase.');
      }
    );
  }, []);

  useEffect(() => subscribeToInterviews(
    (records) => setInterviews(records.map((record) => ({
      id: record.id,
      candidateId: record.candidateId ?? '',
      position: record.position ?? '-',
      date: record.interview_datetime ?? '',
      time: '',
      type: record.interview_type ?? '-',
      interviewer: record.interviewer ?? '-',
      status: record.interview_status ?? 'pending',
      recruiterRemarks: record.recruiter_remark ?? [],
      hiringManagerRemarks: record.hiringmanager_remark ?? [],
      departmentManagerRemarks: record.departmentmanager_remark ?? [],
    }))),
    (error) => {
      console.error(error);
      toast.error('Unable to load interview history.');
    }
  ), []);

  const candidateInterviews = interviews.filter(
    (interview: Interview) => interview.candidateId === selectedCandidate.id
  );
  const getCandidateStatus = (candidate: Candidate) => {
    const interview = interviews.find((item) => item.candidateId === candidate.id);
    return ({
      accept: 'Accept',
      reject: 'Reject',
      KIV: 'Keep In View',
      '2nd Interview': '2nd Interview',
    }[interview?.status ?? ''] ?? candidate.status);
  };
  const filteredCandidates = candidates.filter((candidate: Candidate) => {
    const matchesSearch =
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || getCandidateStatus(candidate) === statusFilter);
  });
  const currentInterviewStatus = candidateInterviews[0]?.status;
  const profileStatus = currentInterviewStatus
    ? ({
        pending: 'Pending',
        accept: 'Accept',
        reject: 'Reject',
        '2nd Interview': '2nd Interview',
        KIV: 'Keep In View',
      }[currentInterviewStatus] ?? currentInterviewStatus)
    : selectedCandidate.status;

  const updateSelectedCandidate = (updates: Partial<Candidate>) => {
    setSelectedCandidate((current) => ({ ...current, ...updates }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateCandidateProfile(selectedCandidate.id, {
        name: selectedCandidate.name,
        email: selectedCandidate.email,
        phone: selectedCandidate.phone,
        location: selectedCandidate.location ?? '',
        education_level: selectedCandidate.educationLevel ?? '',
        highest_education: selectedCandidate.education,
        linkedin: selectedCandidate.linkedin ?? '',
        github: selectedCandidate.github ?? '',
      });
      setCandidates((current) => current.map((candidate) =>
        candidate.id === selectedCandidate.id ? selectedCandidate : candidate
      ));
      setEditingProfile(false);
      toast.success('Candidate profile updated.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to update candidate profile.');
    }
  };

  const currentNotes = user?.role === 'Recruiter'
    ? (selectedCandidate.recruiterNotes ?? [])
    : user?.role === 'Hiring Manager'
      ? (selectedCandidate.hiringManagerNotes ?? [])
      : (selectedCandidate.departmentManagerNotes ?? []);
  const ownNote = currentNotes.find((note) => note.name === user?.name);

  const handleSaveNote = async () => {
    if (!user || !noteText.trim()) return;
    try {
      await updateCandidateNotes(
        selectedCandidate.id,
        user.role === 'Recruiter'
          ? 'recruiter'
          : user.role === 'Hiring Manager'
            ? 'hiringmanager'
            : 'departmentmanager',
        user.name,
        { name: user.name, note: noteText.trim() }
      );
      const updates = user.role === 'Recruiter'
        ? { recruiterNotes: [...(selectedCandidate.recruiterNotes ?? []).filter((note) => note.name !== user.name), { name: user.name, note: noteText.trim() }] }
        : user.role === 'Hiring Manager'
          ? { hiringManagerNotes: [...(selectedCandidate.hiringManagerNotes ?? []).filter((note) => note.name !== user.name), { name: user.name, note: noteText.trim() }] }
          : { departmentManagerNotes: [...(selectedCandidate.departmentManagerNotes ?? []).filter((note) => note.name !== user.name), { name: user.name, note: noteText.trim() }] };
      updateSelectedCandidate(updates);
      setNoteText('');
      toast.success('Note saved.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to save note.');
    }
  };

  const handleRemoveNote = async () => {
    if (!user || !ownNote) return;
    await updateCandidateNotes(
      selectedCandidate.id,
      user.role === 'Recruiter'
        ? 'recruiter'
        : user.role === 'Hiring Manager'
          ? 'hiringmanager'
          : 'departmentmanager',
      user.name,
      null
    );
    updateSelectedCandidate(user.role === 'Recruiter'
      ? { recruiterNotes: (selectedCandidate.recruiterNotes ?? []).filter((note) => note.name !== user.name) }
      : user.role === 'Hiring Manager'
        ? { hiringManagerNotes: (selectedCandidate.hiringManagerNotes ?? []).filter((note) => note.name !== user.name) }
        : { departmentManagerNotes: (selectedCandidate.departmentManagerNotes ?? []).filter((note) => note.name !== user.name) });
    setNoteText('');
    toast.success('Note removed.');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Profiles</h1>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Filter by interview status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Keep In View">Keep In View</SelectItem>
                <SelectItem value="Accept">Accept</SelectItem>
                <SelectItem value="Reject">Reject</SelectItem>
                <SelectItem value="2nd Interview">2nd Interview</SelectItem>
              </SelectContent>
            </Select>
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
                <div className="text-xs opacity-70">{getCandidateStatus(candidate)}</div>
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
              <Badge variant="outline">
                {profileStatus}
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
                    {editingProfile ? (
                      <Input value={selectedCandidate.email} onChange={(event) => updateSelectedCandidate({ email: event.target.value })} />
                    ) : <p className="font-medium">{selectedCandidate.email}</p>}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {editingProfile ? (
                      <Input value={selectedCandidate.phone} onChange={(event) => updateSelectedCandidate({ phone: event.target.value })} />
                    ) : <p className="font-medium">{selectedCandidate.phone}</p>}
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
                  {editingProfile ? (
                    <Input value={selectedCandidate.education} onChange={(event) => updateSelectedCandidate({ education: event.target.value })} />
                  ) : <p className="font-medium">{selectedCandidate.education}</p>}
                  {selectedCandidate.educationLevel && (
                    <p className="text-sm text-muted-foreground">{selectedCandidate.educationLevel}</p>
                  )}
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

                {(selectedCandidate.languages?.length || selectedCandidate.awards?.length || selectedCandidate.leadershipActivities?.length) ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedCandidate.languages && selectedCandidate.languages.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Languages</p>
                        <p className="font-medium">{selectedCandidate.languages.join(', ')}</p>
                      </div>
                    )}
                    {selectedCandidate.awards && selectedCandidate.awards.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Awards</p>
                        <p className="font-medium">{selectedCandidate.awards.join(', ')}</p>
                      </div>
                    )}
                    {selectedCandidate.leadershipActivities && selectedCandidate.leadershipActivities.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Leadership activities</p>
                        <p className="font-medium">{selectedCandidate.leadershipActivities.join(', ')}</p>
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="flex gap-2 pt-4">
                  {selectedCandidate.resumeUrl ? (
                    <Button variant="outline" asChild>
                      <a href={selectedCandidate.resumeUrl} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        View and Download Resume
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      Resume unavailable
                    </Button>
                  )}
                  {canUpdateProfile && (
                    <Button onClick={editingProfile ? handleSaveProfile : () => setEditingProfile(true)}>
                      {editingProfile ? 'Save Changes' : 'Update Profile'}
                    </Button>
                  )}
                  {editingProfile && (
                    <Button variant="outline" onClick={() => setEditingProfile(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
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
                          <span className="font-medium">{interview.date ? new Date(interview.date).toLocaleString() : 'Date not set'}</span>
                        </div>
                        <Badge variant="outline">{interview.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Interview Position: {interview.position}
                      </p>
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
                      <p className="text-sm">Recruiter: {interview.recruiterRemarks.map((item) => `(${item.name}): ${item.remark}`).join(' | ') || '-'}</p>
                      <p className="text-sm">Hiring Manager: {interview.hiringManagerRemarks.map((item) => `(${item.name}): ${item.remark}`).join(' | ') || '-'}</p>
                      <p className="text-sm">Department Manager: {interview.departmentManagerRemarks.map((item) => `(${item.name}): ${item.remark}`).join(' | ') || '-'}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No interview history available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                {(selectedCandidate.recruiterNotes ?? []).map((note) => (
                  <p key={`recruiter-${note.name}-${note.note}`} className="whitespace-pre-wrap text-sm">
                    Recruiter ({note.name}): {note.note}
                  </p>
                ))}
                {(selectedCandidate.hiringManagerNotes ?? []).map((note) => (
                  <p key={`hiring-manager-${note.name}-${note.note}`} className="whitespace-pre-wrap text-sm">
                    Hiring Manager ({note.name}): {note.note}
                  </p>
                ))}
                {(selectedCandidate.departmentManagerNotes ?? []).map((note) => (
                  <p key={`department-manager-${note.name}-${note.note}`} className="whitespace-pre-wrap text-sm">
                    Department Manager ({note.name}): {note.note}
                  </p>
                ))}
                <Textarea
                  rows={8}
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder={ownNote ? 'Edit your note...' : 'Add notes about this candidate...'}
                />
                <div className="flex justify-end">
                  {ownNote && (
                    <Button variant="outline" className="mr-2" onClick={handleRemoveNote}>
                      Remove Note
                    </Button>
                  )}
                  <Button onClick={handleSaveNote} disabled={!noteText.trim()}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Save Notes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
