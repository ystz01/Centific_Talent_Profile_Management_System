import { useState } from 'react';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { mockJobPositions } from '../data/mockData';
import { JobPosition } from '../types';
import { toast } from 'sonner';

export function JobPositions() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Job Positions', 'write');
  const [jobs, setJobs] = useState<JobPosition[]>(mockJobPositions);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [newJob, setNewJob] = useState({
    positionName: '',
    requiredCandidates: 1,
    skillsNeeded: '',
    salaryRange: '',
    department: '',
  });

  const handleCreateJob = () => {
    if (!newJob.positionName || !newJob.skillsNeeded || !newJob.salaryRange || !newJob.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    const job: JobPosition = {
      id: `job-${jobs.length + 1}`,
      positionName: newJob.positionName,
      requiredCandidates: newJob.requiredCandidates,
      skillsNeeded: newJob.skillsNeeded.split(',').map(s => s.trim()),
      salaryRange: newJob.salaryRange,
      department: newJob.department,
      createdBy: user?.name || '',
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Open',
    };

    setJobs([...jobs, job]);
    setDialogOpen(false);
    setNewJob({
      positionName: '',
      requiredCandidates: 1,
      skillsNeeded: '',
      salaryRange: '',
      department: '',
    });
    toast.success('Job position created successfully');
  };

  const handleViewJob = (job: JobPosition) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  if (!hasPermission('Job Positions', 'read')) {
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
          <h1 className="text-3xl font-bold">Job Positions</h1>
          <p className="text-muted-foreground">
            {canWrite ? 'Create and manage job positions' : 'View available job positions'}
          </p>
        </div>
        {canWrite && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Job Position</DialogTitle>
                <DialogDescription>
                  Fill in the details for the new job position
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="positionName">Position Name *</Label>
                    <Input
                      id="positionName"
                      placeholder="e.g., Senior Software Engineer"
                      value={newJob.positionName}
                      onChange={(e) => setNewJob({ ...newJob, positionName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredCandidates">Required Candidates *</Label>
                    <Input
                      id="requiredCandidates"
                      type="number"
                      min="1"
                      value={newJob.requiredCandidates}
                      onChange={(e) => setNewJob({ ...newJob, requiredCandidates: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      placeholder="e.g., Engineering"
                      value={newJob.department}
                      onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salaryRange">Salary Range *</Label>
                    <Input
                      id="salaryRange"
                      placeholder="e.g., $120,000 - $150,000"
                      value={newJob.salaryRange}
                      onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skillsNeeded">Skills Needed * (comma-separated)</Label>
                  <Textarea
                    id="skillsNeeded"
                    placeholder="e.g., React, TypeScript, Node.js, AWS"
                    value={newJob.skillsNeeded}
                    onChange={(e) => setNewJob({ ...newJob, skillsNeeded: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob}>
                  Create Job
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Job Positions ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Required Candidates</TableHead>
                <TableHead>Salary Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.positionName}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell>{job.requiredCandidates}</TableCell>
                  <TableCell>{job.salaryRange}</TableCell>
                  <TableCell>
                    <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.createdBy}</TableCell>
                  <TableCell>{job.createdDate}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewJob(job)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Job Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJob?.positionName}</DialogTitle>
            <DialogDescription>Job Position Details</DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{selectedJob.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Required Candidates</p>
                  <p className="font-medium">{selectedJob.requiredCandidates}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Salary Range</p>
                  <p className="font-medium">{selectedJob.salaryRange}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedJob.status === 'Open' ? 'default' : 'secondary'}>
                    {selectedJob.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{selectedJob.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created Date</p>
                  <p className="font-medium">{selectedJob.createdDate}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Skills Needed</p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skillsNeeded.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
