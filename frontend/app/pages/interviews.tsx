"use client";

import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Plus, FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Interview } from '@/types';
import { toast } from 'sonner';
import { addInterviewRemark, scheduleInterview, subscribeToInterviews, updateInterviewDecision, updateInterviewRemark } from '@/lib/firebase';

export function Interviews() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Interview Management', 'write');
  const isHiringManager = user?.role === 'Hiring Manager';
  const isDepartmentManager = user?.role === 'Department Manager';
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [newInterview, setNewInterview] = useState({
    candidateId: '',
    interviewDate: '',
    interviewTime: '',
    interviewType: 'Technical Interview' as 'Technical Interview' | 'Phone Interview' | 'HR Interview' | 'Final Interview',
  });
  const [decision, setDecision] = useState({
    decision: '' as 'accept' | '2nd Interview' | 'reject' | 'KIV' | '',
  });
  const [remarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [remarkInterview, setRemarkInterview] = useState<Interview | null>(null);
  const [remarkIndex, setRemarkIndex] = useState<number | null>(null);

  useEffect(() => {
    return subscribeToInterviews(
      (records) => {
        setInterviews(records.map((record) => ({
          id: record.id,
          candidateId: record.candidateId ?? '',
          candidateName: record.candidateName ?? '',
          position: record.position ?? '',
          interviewer: record.interviewer ?? '',
          interviewDateTime: record.interview_datetime ?? null,
          interviewType: record.interview_type ?? null,
          interviewStatus: record.interview_status ?? 'pending',
          recruiterRemarks: record.recruiter_remark ?? [],
          hiringManagerRemarks: record.hiringmanager_remark ?? [],
          departmentManagerRemarks: record.departmentmanager_remark ?? [],
        })));
      },
      (error) => {
        console.error(error);
        toast.error('Unable to load interviews from Firebase.');
      }
    );
  }, []);

  const pendingInterviews = interviews.filter(
    (interview) => !interview.interviewDateTime
      && (interview.interviewStatus === 'pending' || interview.interviewStatus === '2nd Interview')
  );
  const scheduledInterviews = interviews.filter(
    (interview) => Boolean(interview.interviewDateTime) && interview.interviewStatus === 'pending'
  );
  const completedInterviews = interviews.filter(
    (interview) => interview.interviewStatus !== 'pending'
      && interview.interviewStatus !== '2nd Interview'
  );

  const handleScheduleInterview = async () => {
    if (!newInterview.candidateId || !newInterview.interviewDate || !newInterview.interviewTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate that interview date is not in the past
    const selectedDate = new Date(newInterview.interviewDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Interview date cannot be in the past');
      return;
    }

    try {
      await scheduleInterview(newInterview.candidateId, {
        interview_datetime: `${newInterview.interviewDate}T${newInterview.interviewTime}`,
        interview_type: newInterview.interviewType,
        interviewer: user?.name || '',
      });
      setDialogOpen(false);
      setNewInterview({ candidateId: '', interviewDate: '', interviewTime: '', interviewType: 'Technical Interview' });
      toast.success('Interview scheduled successfully');
    } catch (error) {
      console.error(error);
      toast.error('Unable to schedule interview.');
    }
  };

  const handleOpenDecisionDialog = (interview: Interview) => {
    setSelectedInterview(interview);
    setDecisionDialogOpen(true);
  };

  const handleMakeDecision = async () => {
    if (!decision.decision) {
      toast.error('Please select a decision');
      return;
    }

    if (!selectedInterview) return;

    try {
      await updateInterviewDecision(selectedInterview.id, decision.decision);
      setDecisionDialogOpen(false);
      setDecision({ decision: '' });
      toast.success(`Decision: ${decision.decision}`);
    } catch (error) {
      console.error(error);
      toast.error('Unable to save interview decision.');
    }
  };

  const openRemarkDialog = (
    interview: Interview,
    role: 'recruiter' | 'hiringmanager' | 'departmentmanager',
    index: number | null = null,
    initialRemark = ''
  ) => {
    setRemarkInterview(interview);
    setRemarkIndex(index);
    setRemarkText(initialRemark);
    setRemarkDialogOpen(true);
  };

  const handleAddRemark = async () => {
    if (!remarkInterview || !remarkText.trim()) return;
    try {
      const role = isHiringManager
        ? 'hiringmanager'
        : isDepartmentManager
          ? 'departmentmanager'
          : 'recruiter';
      const entry = {
        name: user?.name || (isHiringManager ? 'Hiring Manager' : isDepartmentManager ? 'Department Manager' : 'Recruiter'),
        remark: remarkText.trim(),
      };
      if (remarkIndex === null) {
        await addInterviewRemark(remarkInterview.id, role, entry);
      } else {
        await updateInterviewRemark(remarkInterview.id, role, remarkIndex, entry);
      }
      setRemarkDialogOpen(false);
      setRemarkText('');
      setRemarkIndex(null);
      toast.success(remarkIndex === null ? 'Remark added.' : 'Remark updated.');
    } catch (error) {
      console.error(error);
      toast.error('Unable to add remark.');
    }
  };

  const InterviewCard = ({ interview }: { interview: Interview }) => {
    const interviewDate = interview.interviewDateTime
      ? new Date(interview.interviewDateTime)
      : null;
    const remarkRole = isHiringManager
      ? 'hiringmanager'
      : isDepartmentManager
        ? 'departmentmanager'
        : 'recruiter';
    const userRemarkEntries = remarkRole === 'hiringmanager'
      ? (interview.hiringManagerRemarks ?? [])
      : remarkRole === 'departmentmanager'
        ? (interview.departmentManagerRemarks ?? [])
        : (interview.recruiterRemarks ?? []);
    const userRemarkIndex = userRemarkEntries.findIndex(
      (item) => item.name === user?.name
    );
    const hasUserRemark = userRemarkIndex >= 0;
    const remarks = [...(interview.recruiterRemarks ?? []), ...(interview.hiringManagerRemarks ?? [])];
    return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{interview.candidateName}</h3>
              <p className="text-sm text-muted-foreground">{interview.position}</p>
            </div>
            <Badge variant="outline">{interview.interviewType || 'Not scheduled'}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {interviewDate ? interviewDate.toLocaleDateString() : 'Date not set'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {interviewDate ? interviewDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time not set'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <User className="h-4 w-4" />
              Interviewer: {interview.interviewer || 'Not assigned'}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <span className="h-4 w-4" />
              Status:
              <Badge variant="outline" className="text-black">
                {interview.interviewStatus}
              </Badge>
            </div>
          </div>

          {remarks.length > 0 && (
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-1">Remarks:</p>
              {(interview.recruiterRemarks ?? []).map((item, index) => (
                <p key={`recruiter-${index}`} className="text-sm text-muted-foreground">
                  Recruiter ({item.name}): {item.remark}
                </p>
              ))}
              {(interview.hiringManagerRemarks ?? []).map((item, index) => (
                <p key={`manager-${index}`} className="text-sm text-muted-foreground">
                  Hiring Manager ({item.name}): {item.remark}
                </p>
              ))}
              {(interview.departmentManagerRemarks ?? []).map((item, index) => (
                <p key={`department-manager-${index}`} className="text-sm text-muted-foreground">
                  Department Manager ({item.name}): {item.remark}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            {interview.interviewDateTime && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openRemarkDialog(
                    interview,
                    remarkRole,
                    hasUserRemark ? userRemarkIndex : null,
                    hasUserRemark ? userRemarkEntries[userRemarkIndex].remark : ''
                  )}
                >
                  {hasUserRemark ? 'Edit Remark' : 'Add Remark'}
                </Button>
                {isHiringManager && interview.interviewStatus === 'pending' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenDecisionDialog(interview)}
                  >
                    <FileCheck className="mr-2 h-4 w-4" />
                    Make Decision
                  </Button>
                )}
              </>
            )}
            {!interview.interviewDateTime && canWrite && (
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                Schedule
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  if (!hasPermission('Interview Management', 'read')) {
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
          <h1 className="text-3xl font-bold">Interview Management</h1>
        </div>
        {canWrite && user?.role === 'Recruiter' && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
                <DialogDescription>
                  Create a new interview appointment for a shortlisted candidate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="candidate">Candidate *</Label>
                  <Select
                    value={newInterview.candidateId}
                    onValueChange={(value) => setNewInterview({ ...newInterview, candidateId: value })}
                  >
                    <SelectTrigger id="candidate">
                      <SelectValue placeholder="Select candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingInterviews.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.candidateName} - {candidate.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewType">Interview Type *</Label>
                  <Select
                    value={newInterview.interviewType}
                    onValueChange={(value) => setNewInterview({ ...newInterview, interviewType: value as typeof newInterview.interviewType })}
                  >
                    <SelectTrigger id="interviewType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phone Interview">Phone Interview</SelectItem>
                      <SelectItem value="Technical Interview">Technical Interview</SelectItem>
                      <SelectItem value="HR Interview">HR Interview</SelectItem>
                      <SelectItem value="Final Interview">Final Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={newInterview.interviewDate}
                      onChange={(e) => setNewInterview({ ...newInterview, interviewDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newInterview.interviewTime}
                      onChange={(e) => setNewInterview({ ...newInterview, interviewTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleScheduleInterview}>
                  Schedule Interview
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingInterviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No interviews pending scheduling</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          {scheduledInterviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {scheduledInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No scheduled interviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedInterviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {completedInterviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No completed interviews</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Hiring Manager Decision Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Decision</DialogTitle>
            <DialogDescription>
              Make a decision for {selectedInterview?.candidateName}&apos;s interview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decision">Decision *</Label>
              <Select
                value={decision.decision}
                onValueChange={(value) => setDecision({ ...decision, decision: value as typeof decision.decision })}
              >
                <SelectTrigger id="decision">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="accept">Accept</SelectItem>
                  <SelectItem value="2nd Interview">2nd Interview</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="KIV">Keep In View (KIV)</SelectItem>
                </SelectContent>
                </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMakeDecision}>
              Submit Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={remarkDialogOpen} onOpenChange={setRemarkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{remarkIndex === null ? 'Add Remark' : 'Edit Remark'}</DialogTitle>
            <DialogDescription>
              {remarkIndex === null ? 'Add a remark' : 'Edit your remark'} for {remarkInterview?.candidateName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="interview-remark">Remark</Label>
            <Textarea
              id="interview-remark"
              value={remarkText}
              onChange={(event) => setRemarkText(event.target.value)}
              placeholder="Enter your remark..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemarkDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleAddRemark()} disabled={!remarkText.trim()}>
              {remarkIndex === null ? 'Save Remark' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
