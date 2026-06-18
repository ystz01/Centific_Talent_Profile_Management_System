"use client";

import { useState } from 'react';
import { Calendar, Clock, User, Video, Plus, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mockInterviews, mockShortlistedCandidates } from '@/data/mockData';
import { Interview } from '@/types';
import { toast } from 'sonner';

export function Interviews() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Interview Management', 'write');
  const isHiringManager = user?.role === 'Hiring Manager';
  const [interviews, setInterviews] = useState<Interview[]>(mockInterviews);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [newInterview, setNewInterview] = useState({
    candidateId: '',
    interviewDate: '',
    interviewTime: '',
    interviewType: 'Technical' as 'Phone' | 'Technical' | 'HR' | 'Final',
  });
  const [decision, setDecision] = useState({
    decision: '' as 'Approve to Hire' | '2nd Interview' | 'Reject' | 'KIV' | 'Recommendation' | '',
    remark: '',
  });

  const scheduledInterviews = interviews.filter(i => i.status === 'Scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'Completed');

  const handleScheduleInterview = () => {
    if (!newInterview.candidateId || !newInterview.interviewDate || !newInterview.interviewTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    const candidate = mockShortlistedCandidates.find(c => c.candidateId === newInterview.candidateId);
    if (!candidate) return;

    const interview: Interview = {
      id: `int-${interviews.length + 1}`,
      candidateId: newInterview.candidateId,
      candidateName: candidate.candidateName,
      position: candidate.jobPosition,
      interviewer: user?.name || '',
      date: newInterview.interviewDate,
      time: newInterview.interviewTime,
      type: newInterview.interviewType,
      status: 'Scheduled',
    };

    setInterviews([...interviews, interview]);
    setDialogOpen(false);
    setNewInterview({
      candidateId: '',
      interviewDate: '',
      interviewTime: '',
      interviewType: 'Technical',
    });
    toast.success('Interview scheduled successfully');
  };

  const handleOpenDecisionDialog = (interview: Interview) => {
    setSelectedInterview(interview);
    setDecisionDialogOpen(true);
  };

  const handleMakeDecision = () => {
    if (!decision.decision) {
      toast.error('Please select a decision');
      return;
    }

    if (!selectedInterview) return;

    // Update interview with decision
    setInterviews(prev =>
      prev.map(i =>
        i.id === selectedInterview.id
          ? {
              ...i,
              feedback: decision.remark,
              status: 'Completed' as const,
            }
          : i
      )
    );

    setDecisionDialogOpen(false);
    setDecision({ decision: '', remark: '' });
    toast.success(`Decision: ${decision.decision}`);
  };

  const InterviewCard = ({ interview }: { interview: Interview }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{interview.candidateName}</h3>
              <p className="text-sm text-muted-foreground">{interview.position}</p>
            </div>
            <Badge variant="outline">
              {interview.type}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {interview.date}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {interview.time}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <User className="h-4 w-4" />
              Interviewer: {interview.interviewer}
            </div>
          </div>

          {interview.feedback && (
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium mb-1">Feedback/Remark:</p>
              <p className="text-sm text-muted-foreground">{interview.feedback}</p>
            </div>
          )}

          <div className="flex gap-2">
            {interview.status === 'Scheduled' && (
              <>
                <Button variant="outline" size="sm" className="flex-1">
                  <Video className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
                {isHiringManager && (
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
            {interview.status === 'Completed' && interview.feedback && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Decision recorded
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!hasPermission('Interview Management', 'read')) {
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
          <h1 className="text-3xl font-bold">Interview Management</h1>
          <p className="text-muted-foreground">Schedule and track candidate interviews</p>
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
                      {mockShortlistedCandidates.map((candidate) => (
                        <SelectItem key={candidate.candidateId} value={candidate.candidateId}>
                          {candidate.candidateName} - {candidate.jobPosition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interviewType">Interview Type *</Label>
                  <Select
                    value={newInterview.interviewType}
                    onValueChange={(value: any) => setNewInterview({ ...newInterview, interviewType: value })}
                  >
                    <SelectTrigger id="interviewType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Phone">Phone Interview</SelectItem>
                      <SelectItem value="Technical">Technical Interview</SelectItem>
                      <SelectItem value="HR">HR Interview</SelectItem>
                      <SelectItem value="Final">Final Interview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
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

      <Tabs defaultValue="scheduled" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInterviews.length})
          </TabsTrigger>
        </TabsList>

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
              Make a decision for {selectedInterview?.candidateName}'s interview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="decision">Decision *</Label>
              <Select
                value={decision.decision}
                onValueChange={(value: any) => setDecision({ ...decision, decision: value })}
              >
                <SelectTrigger id="decision">
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approve to Hire">Approve to Hire</SelectItem>
                  <SelectItem value="2nd Interview">2nd Interview</SelectItem>
                  <SelectItem value="Reject">Reject</SelectItem>
                  <SelectItem value="KIV">Keep In View (KIV)</SelectItem>
                  <SelectItem value="Recommendation">Recommendation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="remark">Remark</Label>
              <Textarea
                id="remark"
                placeholder="Add your remarks about the interview..."
                value={decision.remark}
                onChange={(e) => setDecision({ ...decision, remark: e.target.value })}
                rows={4}
              />
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
    </div>
  );
}
