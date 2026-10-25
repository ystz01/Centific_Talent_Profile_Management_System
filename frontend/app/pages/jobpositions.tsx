"use client";

import { useEffect, useState } from 'react';
import { Plus, Edit, Eye, CheckCircle2, Ban, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatSalaryRange } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useAuth } from '@/contexts/AuthContext';
import { JobPosition } from '@/types';
import { toast } from 'sonner';
import { createJobPosition, subscribeToJobPositions, updateJobPosition, updateJobPositionStatus } from '@/lib/firebase';

type JobFormState = {
  positionName: string;
  requiredCandidates: number;
  skillsNeeded: string;
  salaryRange: string;
  department: string;
};

export function JobPositions() {
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission('Job Positions', 'write');
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusJob, setStatusJob] = useState<JobPosition | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [pageSize, setPageSize] = useState<number | 'all'>(10);
  const [customPageSize, setCustomPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);
  const [draftFilters, setDraftFilters] = useState<Record<string, string[]>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [newJob, setNewJob] = useState<JobFormState>({
    positionName: '',
    requiredCandidates: 1,
    skillsNeeded: '',
    salaryRange: '',
    department: '',
  });

  useEffect(() => {
    const unsubscribe = subscribeToJobPositions((records) => {
      setJobs(
        records.map((record) => {
          const createdDate = record.Created_date?.toDate().toISOString().split('T')[0] || '';

          return {
            id: record.id,
            positionName: record.Position,
            requiredCandidates: record.Required_Candidate,
            skillsNeeded: record.skillsNeeded || [],
            salaryRange: record.salary_range,
            department: record.Department,
            createdBy: record.Created_by,
            createdDate,
            createdTimestamp: record.Created_date?.toMillis() ?? 0,
            status: record.Status ? 'Open' : 'Closed',
          };
        })
      );
      setLoadingJobs(false);
    });

    return () => unsubscribe();
  }, []);

  const jobColumns: Array<{ key: string; label: string; values: (job: JobPosition) => string[] }> = [
    { key: 'positionName', label: 'Position', values: (job) => [job.positionName] },
    { key: 'department', label: 'Department', values: (job) => [job.department] },
    { key: 'requiredCandidates', label: 'Required Candidates', values: (job) => [String(job.requiredCandidates)] },
    { key: 'skillsNeeded', label: 'Skill Preferred', values: (job) => job.skillsNeeded },
    { key: 'salaryRange', label: 'Salary Range', values: (job) => [job.salaryRange] },
    { key: 'status', label: 'Status', values: (job) => [job.status] },
    { key: 'createdBy', label: 'Created By', values: (job) => [job.createdBy] },
    { key: 'createdDate', label: 'Created Date', values: (job) => [job.createdDate] },
  ];
  const filteredJobs = jobs
    .filter((job) => jobColumns.every((column) => {
      const selectedValues = appliedFilters[column.key] ?? [];
      return selectedValues.length === 0
        || column.values(job).some((value) =>
          selectedValues.some((selectedValue) =>
            selectedValue.localeCompare(value, undefined, { sensitivity: 'accent' }) === 0
          )
        );
    }))
    .sort((a, b) => (b.createdTimestamp ?? 0) - (a.createdTimestamp ?? 0));
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const visibleJobs = pageSize === 'all'
    ? filteredJobs
    : filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const getColumnValues = (key: string) => {
    const column = jobColumns.find((item) => item.key === key);
    const valuesByKey = new Map<string, string>();
    filteredJobs.flatMap((job) => column?.values(job) ?? []).forEach((value) => {
      const normalizedValue = value.trim().toLocaleLowerCase();
      if (!valuesByKey.has(normalizedValue)) {
        valuesByKey.set(normalizedValue, value);
      }
    });
    return [...valuesByKey.values()].sort((a, b) => a.localeCompare(b));
  };
  const applyColumnFilter = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    setFilterColumn(null);
  };

  const resetJobForm = () => {
    setNewJob({
      positionName: '',
      requiredCandidates: 1,
      skillsNeeded: '',
      salaryRange: '',
      department: '',
    });
    setEditingJobId(null);
    setFormMode('create');
  };

  const openCreateDialog = () => {
    resetJobForm();
    setDialogOpen(true);
  };

  const openEditDialog = (job: JobPosition) => {
    setFormMode('edit');
    setEditingJobId(job.id);
    setNewJob({
      positionName: job.positionName,
      requiredCandidates: job.requiredCandidates,
      skillsNeeded: job.skillsNeeded.join(', '),
      salaryRange: job.salaryRange,
      department: job.department,
    });
    setDialogOpen(true);
  };

  const openStatusDialog = (job: JobPosition) => {
    setStatusJob(job);
    setStatusDialogOpen(true);
  };

  const handleCreateJob = async () => {
    if (!newJob.positionName || !newJob.skillsNeeded || !newJob.salaryRange || !newJob.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createJobPosition({
        createdBy: user?.name || '',
        department: newJob.department,
        position: newJob.positionName,
        requiredCandidates: newJob.requiredCandidates,
        salaryRange: newJob.salaryRange,
        skillsNeeded: newJob.skillsNeeded.split(',').map((skill) => skill.trim()).filter(Boolean),
      });

      setDialogOpen(false);
      setNewJob({
        positionName: '',
        requiredCandidates: 1,
        skillsNeeded: '',
        salaryRange: '',
        department: '',
      });
      toast.success('Job position created successfully');
    } catch (error) {
      console.error('Failed to create job position:', error);
      toast.error('Failed to create job position');
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJobId) {
      return;
    }

    if (!newJob.positionName || !newJob.skillsNeeded || !newJob.salaryRange || !newJob.department) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await updateJobPosition(editingJobId, {
        department: newJob.department,
        position: newJob.positionName,
        requiredCandidates: newJob.requiredCandidates,
        salaryRange: newJob.salaryRange,
        skillsNeeded: newJob.skillsNeeded.split(',').map((skill) => skill.trim()).filter(Boolean),
      });

      setDialogOpen(false);
      resetJobForm();
      toast.success('Job position updated successfully');
    } catch (error) {
      console.error('Failed to update job position:', error);
      toast.error('Failed to update job position');
    }
  };

  const handleStatusUpdate = async (nextStatus: 'Open' | 'Closed') => {
    if (!statusJob) {
      return;
    }

    try {
      await updateJobPositionStatus(statusJob.id, nextStatus === 'Open');
      setStatusDialogOpen(false);
      setStatusJob(null);
      toast.success(`Job position marked as ${nextStatus.toLowerCase()}`);
    } catch (error) {
      console.error('Failed to update job status:', error);
      toast.error('Failed to update job status');
    }
  };

  const handleViewJob = (job: JobPosition) => {
    setSelectedJob(job);
    setViewDialogOpen(true);
  };

  if (!hasPermission('Job Positions', 'read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You do not have permission to access this feature.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Job Positions</h1>
        </div>
        {canWrite && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              resetJobForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Create Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{formMode === 'edit' ? 'Edit Job Position' : 'Create New Job Position'}</DialogTitle>
                <DialogDescription>
                  Fill in the details for the job position
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
                      placeholder="e.g., RM 5,000.00 - RM 8,000.00"
                      value={newJob.salaryRange}
                      onChange={(e) => setNewJob({ ...newJob, salaryRange: e.target.value })}
                      onBlur={(e) => setNewJob({ ...newJob, salaryRange: formatSalaryRange(e.target.value) })}
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
                <Button onClick={formMode === 'edit' ? handleUpdateJob : handleCreateJob}>
                  {formMode === 'edit' ? 'Save Changes' : 'Create Job'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Job Positions ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingJobs ? (
            <p className="py-6 text-sm text-muted-foreground">Loading job positions...</p>
          ) : null}
          <div className="min-h-[360px] overflow-x-auto">
          <Table className="min-w-[1100px] table-fixed">
            <TableHeader>
              <TableRow>
                {jobColumns.map((column) => (
                  <TableHead key={column.key} className="relative whitespace-nowrap">
                    <span>{column.label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-7 w-7"
                      aria-label={`Filter by ${column.label}`}
                      onClick={() => {
                        setFilterColumn(filterColumn === column.key ? null : column.key);
                        setDraftFilters(appliedFilters);
                      }}
                    >
                      <Filter className={`h-3.5 w-3.5 ${appliedFilters[column.key]?.length ? 'text-primary' : ''}`} />
                    </Button>
                    {filterColumn === column.key && (
                      <div className="absolute left-0 top-full z-20 mt-1 min-w-52 rounded-md border bg-background p-3 shadow-lg">
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {getColumnValues(column.key).map((value) => {
                            const checked = (draftFilters[column.key] ?? []).includes(value);
                            return (
                              <label key={value} className="flex items-center gap-2 text-sm font-normal">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(event) => {
                                    const current = draftFilters[column.key] ?? [];
                                    setDraftFilters({
                                      ...draftFilters,
                                      [column.key]: event.target.checked
                                        ? [...current, value]
                                        : current.filter((item) => item !== value),
                                    });
                                  }}
                                />
                                <span>{value || '(Blank)'}</span>
                              </label>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex justify-between gap-2 border-t pt-2">
                          <Button variant="ghost" size="sm" onClick={() => setDraftFilters({ ...draftFilters, [column.key]: [] })}>Clear</Button>
                          <Button size="sm" onClick={applyColumnFilter}>Apply Filter</Button>
                        </div>
                      </div>
                    )}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-[180px] whitespace-normal break-words font-medium [overflow-wrap:anywhere]">{job.positionName}</TableCell>
                  <TableCell className="max-w-[140px] whitespace-normal break-words [overflow-wrap:anywhere]">{job.department}</TableCell>
                  <TableCell className="whitespace-normal">{job.requiredCandidates}</TableCell>
                  <TableCell className="max-w-[190px] whitespace-normal break-words align-top [overflow-wrap:anywhere]">
                    <ul className="list-disc pl-5 text-sm">
                      {job.skillsNeeded.map((skill, index) => (
                        <li key={index}>{skill}</li>
                      ))}
                    </ul>
                  </TableCell>
                  <TableCell className="max-w-[190px] whitespace-normal break-words [overflow-wrap:anywhere]">{formatSalaryRange(job.salaryRange)}</TableCell>
                  <TableCell className="whitespace-normal">
                    <Badge variant={job.status === 'Open' ? 'default' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[140px] whitespace-normal break-words [overflow-wrap:anywhere]">{job.createdBy}</TableCell>
                  <TableCell className="whitespace-normal">{job.createdDate}</TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewJob(job)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(job)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openStatusDialog(job)}>
                            <Ban className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {visibleJobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={jobColumns.length + 1} className="h-48 text-center text-muted-foreground">
                    No job positions match the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {visibleJobs.length > 0 && Array.from({
                length: Math.max(0, Math.min(5, pageSize === 'all' ? 5 : pageSize) - visibleJobs.length),
              }).map((_, index) => (
                <TableRow key={`empty-${index}`} aria-hidden="true" className="pointer-events-none">
                  <TableCell colSpan={jobColumns.length + 1} className="h-16 text-transparent">
                    .
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows per page</span>
              <select
                className="h-9 rounded-md border bg-background px-2"
                value={pageSize === 'all' ? 'all' : [5, 10, 15].includes(pageSize) ? String(pageSize) : 'custom'}
                onChange={(event) => {
                  const value = event.target.value === 'all'
                    ? 'all'
                    : event.target.value === 'custom'
                      ? customPageSize
                      : Number(event.target.value);
                  setPageSize(value);
                  setCurrentPage(1);
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="custom">Custom</option>
                <option value="all">Show all</option>
              </select>
              {pageSize !== 'all' && ![5, 10, 15].includes(pageSize) && (
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={customPageSize}
                  onChange={(event) => {
                    const value = Math.max(1, Number(event.target.value) || 1);
                    setCustomPageSize(value);
                    setPageSize(value);
                    setCurrentPage(1);
                  }}
                  aria-label="Custom rows per page"
                />
              )}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pageSize === 'all'}
                  onChange={(event) => {
                    setPageSize(event.target.checked ? 'all' : 10);
                    setCurrentPage(1);
                  }}
                />
                Show all
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Job Status</DialogTitle>
            <DialogDescription>
              Choose whether this job position should be Open or Closed.
            </DialogDescription>
          </DialogHeader>
          {statusJob && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Current status: <span className="font-medium text-foreground">{statusJob.status}</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={statusJob.status === 'Open' ? 'default' : 'outline'}
                  onClick={() => handleStatusUpdate('Open')}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant={statusJob.status === 'Closed' ? 'default' : 'outline'}
                  onClick={() => handleStatusUpdate('Closed')}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Closed
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
