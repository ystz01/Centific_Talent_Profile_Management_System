"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Edit2, ArrowLeft, ChevronRight } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { mockHiringMatrix } from '@/data/mockData';
import { HiringMatrix as HiringMatrixType } from '@/types';
import { toast } from 'sonner';

interface HiringMatrixFormData {
  // Required fields
  employeeName: string;
  jobTitle: string;
  startDate: string;
  employmentType: string;
  
  // Additional fields
  contractEndDate: string;
  basicSalary: string;
  billableStatus: string;
  workLocation: string;
  workingTime: string;
  workdayPattern: string;
  candidateEmail: string;
  candidateMobile: string;
  jobGrade: string;
  hireType: string;
  bgcRequired: string;
  reportingManager: string;
  leaveManager: string;
  attendanceManager: string;
  payGroup: string;
  parkingAllowance: string;
  attendanceAwards: string;
  shiftAllowance: string;
  overtimePay: string;
  annualLeave: string;
  workPassRequired: string;
  workPassType: string;
  emailRequired: string;
  emailNameCreation: string;
  departmentName: string;
  cccName: string;
  cccNo: string;
  pidNo: string;
  resumeSource: string;
  rejectionReason?: string;
}

type FormSectionKey =
  | 'required'
  | 'employment'
  | 'work'
  | 'contact'
  | 'management'
  | 'compensation'
  | 'workPass'
  | 'organization';


export function HiringMatrix() {
  const { hasPermission, user } = useAuth();
  const canCreateMatrix = user?.role === 'Hiring Manager';
  const canApprove = user?.role === 'Department Manager';
  const [matrices, setMatrices] = useState<HiringMatrixType[]>(mockHiringMatrix);
  const [pageMode, setPageMode] = useState<'list' | 'form'>('list');
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<HiringMatrixType | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [formData, setFormData] = useState<HiringMatrixFormData>({
    employeeName: '',
    jobTitle: '',
    startDate: '',
    employmentType: '',
    contractEndDate: '',
    basicSalary: '',
    billableStatus: '',
    workLocation: '30th Floor, Menara BHL, No. 51, Jalan Sultan Ahmad Shah, 10050 Georgetown, Penang, Malaysia',
    workingTime: '',
    workdayPattern: '',
    candidateEmail: '',
    candidateMobile: '',
    jobGrade: '',
    hireType: '',
    bgcRequired: '',
    reportingManager: '',
    leaveManager: '',
    attendanceManager: '',
    payGroup: '',
    parkingAllowance: '',
    attendanceAwards: '',
    shiftAllowance: '',
    overtimePay: '',
    annualLeave: '',
    workPassRequired: '',
    workPassType: '',
    emailRequired: '',
    emailNameCreation: '',
    departmentName: '',
    cccName: '',
    cccNo: '',
    pidNo: '',
    resumeSource: '',
  });
  const [activeSection, setActiveSection] = useState<FormSectionKey>('required');

  const formSections: { key: FormSectionKey; label: string }[] = [
    { key: 'required', label: 'Required Information' },
    { key: 'employment', label: 'Employment Details' },
    { key: 'work', label: 'Work Details' },
    { key: 'contact', label: 'Contact Information' },
    { key: 'management', label: 'Management & Approvals' },
    { key: 'compensation', label: 'Compensation & Benefits' },
    { key: 'workPass', label: 'Work Pass & Email' },
    { key: 'organization', label: 'Organizational Details' },
  ];
  const activeSectionIndex = formSections.findIndex((section) => section.key === activeSection);
  const isLastSection = activeSectionIndex === formSections.length - 1;

  const pendingMatrices = matrices.filter(r => r.status === 'Pending');
  const approvedMatrices = matrices.filter(r => r.status === 'Approved');
  const rejectedMatrices = matrices.filter(r => r.status === 'Rejected');

  const handleOpenFormDialog = () => {
    setFormData({
      employeeName: '',
      jobTitle: '',
      startDate: '',
      employmentType: '',
      contractEndDate: '',
      basicSalary: '',
      billableStatus: '',
      workLocation: '30th Floor, Menara BHL, No. 51, Jalan Sultan Ahmad Shah, 10050 Georgetown, Penang, Malaysia',
      workingTime: '',
      workdayPattern: '',
      candidateEmail: '',
      candidateMobile: '',
      jobGrade: '',
      hireType: '',
      bgcRequired: '',
      reportingManager: '',
      leaveManager: '',
      attendanceManager: '',
      payGroup: '',
      parkingAllowance: '',
      attendanceAwards: '',
      shiftAllowance: '',
      overtimePay: '',
      annualLeave: '',
      workPassRequired: '',
      workPassType: '',
      emailRequired: '',
      emailNameCreation: '',
      departmentName: '',
      cccName: '',
      cccNo: '',
      pidNo: '',
      resumeSource: '',
    });
    setSelectedMatrix(null);
    setActiveSection('required');
    setPageMode('form');
  };

  const handleSubmitForm = () => {
    if (!formData.employeeName || !formData.jobTitle || !formData.startDate || !formData.employmentType) {
      toast.error('Please fill in all required fields (Name, Job Title, Start Date, Employment Type)');
      return;
    }

    const newMatrix: HiringMatrixType = {
      id: `hm-${matrices.length + 1}`,
      candidateId: `cand-${matrices.length + 1}`,
      candidateName: formData.employeeName,
      position: formData.jobTitle,
      department: formData.departmentName,
      phone: formData.candidateMobile,
      email: formData.candidateEmail,
      interviewDate: formData.startDate,
      salary: formData.basicSalary,
      hiringManagerRemark: `Employment Type: ${formData.employmentType}, Work Pass: ${formData.workPassRequired}${formData.workPassRequired === 'Yes' ? ` (${formData.workPassType})` : ''}, Email Required: ${formData.emailRequired}`,
      recruiterRemark: JSON.stringify({
        billable: formData.billableStatus,
        workLocation: formData.workLocation,
        workingTime: formData.workingTime,
        workdayPattern: formData.workdayPattern,
        jobGrade: formData.jobGrade,
        hireType: formData.hireType,
        bgcRequired: formData.bgcRequired,
        reportingManager: formData.reportingManager,
        leaveManager: formData.leaveManager,
        attendanceManager: formData.attendanceManager,
        payGroup: formData.payGroup,
        parkingAllowance: formData.parkingAllowance,
        attendanceAwards: formData.attendanceAwards,
        shiftAllowance: formData.shiftAllowance,
        overtimePay: formData.overtimePay,
        annualLeave: formData.annualLeave,
        cccName: formData.cccName,
        cccNo: formData.cccNo,
        pidNo: formData.pidNo,
        resumeSource: formData.resumeSource,
      }),
      jobRequisition: '',
      status: 'Pending',
      requestedBy: user?.name || '',
      requestedDate: new Date().toISOString().split('T')[0],
    };

    setMatrices([...matrices, newMatrix]);
    setPageMode('list');
    setSelectedMatrix(null);
    toast.success('Hiring matrix created successfully');
  };

  const handleOpenDetailsDialog = (matrix: HiringMatrixType) => {
    setSelectedMatrix(matrix);
    setDetailsDialogOpen(true);
  };

  const handleApprove = (id: string) => {
    setMatrices(prev =>
      prev.map(req =>
        req.id === id ? {
          ...req,
          status: 'Approved' as const,
          approvedBy: user?.name,
          approvedDate: new Date().toISOString().split('T')[0],
        } : req
      )
    );
    setDetailsDialogOpen(false);
    toast.success('Hiring matrix approved');
  };

  const handleRejectClick = (matrix: HiringMatrixType) => {
    setSelectedMatrix(matrix);
    setRejectionReason('');
    setRejectionDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedMatrix) return;
    
    setMatrices(prev =>
      prev.map(req =>
        req.id === selectedMatrix.id ? { 
          ...req, 
          status: 'Rejected' as const,
          rejectionReason: rejectionReason 
        } : req
      )
    );
    setRejectionDialogOpen(false);
    setDetailsDialogOpen(false);
    toast.error('Hiring matrix rejected');
  };

  const handleEditRejected = (matrix: HiringMatrixType) => {
    let extraData = {};
    try {
      extraData = JSON.parse(matrix.recruiterRemark);
    } catch (e) {
      // If not JSON, ignore
    }
    
    setFormData({
      employeeName: matrix.candidateName,
      jobTitle: matrix.position,
      startDate: matrix.interviewDate,
      employmentType: matrix.hiringManagerRemark?.split('Employment Type: ')[1]?.split(',')[0] || '',
      contractEndDate: '',
      basicSalary: matrix.salary,
      billableStatus: (extraData as any).billable || '',
      workLocation: (extraData as any).workLocation || '30th Floor, Menara BHL, No. 51, Jalan Sultan Ahmad Shah, 10050 Georgetown, Penang, Malaysia',
      workingTime: (extraData as any).workingTime || '',
      workdayPattern: (extraData as any).workdayPattern || '',
      candidateEmail: matrix.email,
      candidateMobile: matrix.phone,
      jobGrade: (extraData as any).jobGrade || '',
      hireType: (extraData as any).hireType || '',
      bgcRequired: (extraData as any).bgcRequired || '',
      reportingManager: (extraData as any).reportingManager || '',
      leaveManager: (extraData as any).leaveManager || '',
      attendanceManager: (extraData as any).attendanceManager || '',
      payGroup: (extraData as any).payGroup || '',
      parkingAllowance: (extraData as any).parkingAllowance || '',
      attendanceAwards: (extraData as any).attendanceAwards || '',
      shiftAllowance: (extraData as any).shiftAllowance || '',
      overtimePay: (extraData as any).overtimePay || '',
      annualLeave: (extraData as any).annualLeave || '',
      workPassRequired: matrix.hiringManagerRemark?.includes('Work Pass: Yes') ? 'Yes' : matrix.hiringManagerRemark?.includes('Work Pass: No') ? 'No' : 'NA',
      workPassType: (extraData as any).workPassType || '',
      emailRequired: matrix.hiringManagerRemark?.includes('Email Required: Yes') ? 'Yes' : matrix.hiringManagerRemark?.includes('Email Required: No') ? 'No' : '',
      emailNameCreation: (extraData as any).emailNameCreation || '',
      departmentName: matrix.department,
      cccName: (extraData as any).cccName || '',
      cccNo: (extraData as any).cccNo || '',
      pidNo: (extraData as any).pidNo || '',
      resumeSource: (extraData as any).resumeSource || '',
    });
    setSelectedMatrix(matrix);
    setActiveSection('required');
    setPageMode('form');
  };

  const handleCancelForm = () => {
    setPageMode('list');
    setSelectedMatrix(null);
  };

  const handleNextSection = () => {
    if (isLastSection) {
      return;
    }

    const nextSection = formSections[activeSectionIndex + 1];
    if (nextSection) {
      setActiveSection(nextSection.key);
    }
  };

  const MatrixTable = ({ data, showActions, showApprovalActions }: { 
    data: HiringMatrixType[], 
    showActions: boolean,
    showApprovalActions: boolean
  }) => (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-100 dark:bg-blue-900/20">
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">NO</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Employee Name</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Job Title</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Department</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Start Date</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Salary</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Submitted By</TableHead>
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Date</TableHead>
            {(showActions || showApprovalActions) && <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((matrix, index) => (
              <TableRow key={matrix.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{matrix.candidateName}</TableCell>
                <TableCell>{matrix.position}</TableCell>
                <TableCell>{matrix.department}</TableCell>
                <TableCell>{matrix.interviewDate}</TableCell>
                <TableCell>{matrix.salary}</TableCell>
                <TableCell>{matrix.requestedBy}</TableCell>
                <TableCell>{matrix.requestedDate}</TableCell>
                {(showActions || showApprovalActions) && (
                  <TableCell>
                    <div className="flex gap-2">
                      {showApprovalActions && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetailsDialog(matrix)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </>
                      )}
                      {showActions && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRejected(matrix)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={(showActions || showApprovalActions) ? 9 : 8} className="text-center py-8">
                <p className="text-muted-foreground">No hiring matrices found</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (!hasPermission('Hiring Matrix Approval', 'read')) {
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
          <h1 className="text-3xl font-bold">Hiring Matrix</h1>
        </div>
        {canCreateMatrix && pageMode === 'list' && (
          <Button onClick={handleOpenFormDialog} size="lg">
            Create New Hiring Matrix
          </Button>
        )}
      </div>

      {pageMode === 'form' ? (
        <Card className="overflow-hidden border-muted/60 shadow-sm">
          <CardContent className="p-0">
            <div className="p-4 lg:p-8 min-h-[72vh]">
              <Button variant="ghost" className="mb-4 px-0" onClick={handleCancelForm}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to matrix list
              </Button>

              <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <div className="space-y-3">
                  {formSections.map((section, index) => (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveSection(section.key)}
                      className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-left ${activeSection === section.key ? 'border-primary bg-primary/10 font-medium' : 'bg-background hover:bg-muted/40'}`}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                        {index + 1}
                      </div>
                      <span className="flex-1">{section.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border bg-background p-6 shadow-sm">
                  <div className="mb-6 border-b pb-4">
                    <h2 className="text-2xl font-semibold">
                      {selectedMatrix ? 'Edit Hiring Matrix' : 'Create Hiring Matrix'}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {activeSection === 'required' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Required Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="employeeName">Employee Name (as per NRIC) *</Label>
                          <Input id="employeeName" value={formData.employeeName} onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title *</Label>
                          <Input id="jobTitle" value={formData.jobTitle} onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date *</Label>
                          <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employmentType">Employment Type *</Label>
                          <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                            <SelectTrigger id="employmentType"><SelectValue placeholder="Select employment type" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Full Time">Full Time</SelectItem>
                              <SelectItem value="Part Time">Part Time</SelectItem>
                              <SelectItem value="Intern">Intern</SelectItem>
                              <SelectItem value="Contract">Contract</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'employment' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Employment Details</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="contractEndDate">Current Contract End Date (If applicable)</Label><Input id="contractEndDate" type="date" value={formData.contractEndDate} onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="basicSalary">Basic Salary Offered</Label><Input id="basicSalary" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="billableStatus">Billable / Non-Billable</Label><Select value={formData.billableStatus} onValueChange={(value) => setFormData({ ...formData, billableStatus: value })}><SelectTrigger id="billableStatus"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Billable">Billable</SelectItem><SelectItem value="Non-Billable">Non-Billable</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="hireType">New Hire / Internal transfer / Conversion</Label><Select value={formData.hireType} onValueChange={(value) => setFormData({ ...formData, hireType: value })}><SelectTrigger id="hireType"><SelectValue placeholder="Select hire type" /></SelectTrigger><SelectContent><SelectItem value="New Hire">New Hire</SelectItem><SelectItem value="Internal transfer">Internal transfer</SelectItem><SelectItem value="Conversion">Conversion</SelectItem></SelectContent></Select></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'work' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Work Details</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="workLocation">Work location (Full address)</Label><Input id="workLocation" value={formData.workLocation} onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="workingTime">Working Time</Label><Select value={formData.workingTime} onValueChange={(value) => setFormData({ ...formData, workingTime: value })}><SelectTrigger id="workingTime"><SelectValue placeholder="Select working time" /></SelectTrigger><SelectContent><SelectItem value="Regular">Regular</SelectItem><SelectItem value="Shift">Shift</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="workdayPattern">Workday / Shift Pattern</Label><Select value={formData.workdayPattern} onValueChange={(value) => setFormData({ ...formData, workdayPattern: value })}><SelectTrigger id="workdayPattern"><SelectValue placeholder="Select workday pattern" /></SelectTrigger><SelectContent><SelectItem value="Mon-Fri">Mon-Fri</SelectItem><SelectItem value="Thu-Sun">Thu-Sun</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="jobGrade">Job Grade</Label><Input id="jobGrade" value={formData.jobGrade} onChange={(e) => setFormData({ ...formData, jobGrade: e.target.value })} /></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'contact' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Contact Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="candidateEmail">Candidates Personal Email ID</Label><Input id="candidateEmail" type="email" value={formData.candidateEmail} onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="candidateMobile">Candidates Mobile number</Label><Input id="candidateMobile" value={formData.candidateMobile} onChange={(e) => setFormData({ ...formData, candidateMobile: e.target.value })} /></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'management' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Management & Approvals</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="reportingManager">Reporting Manager / Supervisor</Label><Input id="reportingManager" value={formData.reportingManager} onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="leaveManager">Leave Manager for Ignite</Label><Input id="leaveManager" value={formData.leaveManager} onChange={(e) => setFormData({ ...formData, leaveManager: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="attendanceManager">Attendance Manager for Ignite</Label><Input id="attendanceManager" value={formData.attendanceManager} onChange={(e) => setFormData({ ...formData, attendanceManager: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="bgcRequired">BGC Required</Label><Select value={formData.bgcRequired} onValueChange={(value) => setFormData({ ...formData, bgcRequired: value })}><SelectTrigger id="bgcRequired"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'compensation' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Compensation & Benefits</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="payGroup">Pay Group (7th / 25th)</Label><Input id="payGroup" value={formData.payGroup} onChange={(e) => setFormData({ ...formData, payGroup: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="parkingAllowance">Parking Allowance (With Conditions)</Label><Select value={formData.parkingAllowance} onValueChange={(value) => setFormData({ ...formData, parkingAllowance: value })}><SelectTrigger id="parkingAllowance"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="NA">NA</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="attendanceAwards">Attendance Awards</Label><Select value={formData.attendanceAwards} onValueChange={(value) => setFormData({ ...formData, attendanceAwards: value })}><SelectTrigger id="attendanceAwards"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="NA">NA</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="shiftAllowance">Shift Allowance</Label><Select value={formData.shiftAllowance} onValueChange={(value) => setFormData({ ...formData, shiftAllowance: value })}><SelectTrigger id="shiftAllowance"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="NA">NA</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="overtimePay">Overtime Pay</Label><Select value={formData.overtimePay} onValueChange={(value) => setFormData({ ...formData, overtimePay: value })}><SelectTrigger id="overtimePay"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="NA">NA</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="annualLeave">Annual leave / Year</Label><Select value={formData.annualLeave} onValueChange={(value) => setFormData({ ...formData, annualLeave: value })}><SelectTrigger id="annualLeave"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="NA">NA</SelectItem></SelectContent></Select></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'workPass' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Work Pass & Email</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="workPassRequired">Apply Work Pass Required</Label><Select value={formData.workPassRequired} onValueChange={(value) => setFormData({ ...formData, workPassRequired: value, workPassType: value === 'Yes' ? formData.workPassType : '' })}><SelectTrigger id="workPassRequired"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="NA">NA</SelectItem></SelectContent></Select></div>
                        {formData.workPassRequired === 'Yes' && (
                          <div className="space-y-2"><Label htmlFor="workPassType">Pass Type (WP / SP / EP / LOC)</Label><Input id="workPassType" value={formData.workPassType} onChange={(e) => setFormData({ ...formData, workPassType: e.target.value })} /></div>
                        )}
                        <div className="space-y-2"><Label htmlFor="emailRequired">Email Required</Label><Select value={formData.emailRequired} onValueChange={(value) => setFormData({ ...formData, emailRequired: value })}><SelectTrigger id="emailRequired"><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="emailNameCreation">Email Name Creation</Label><Input id="emailNameCreation" value={formData.emailNameCreation} onChange={(e) => setFormData({ ...formData, emailNameCreation: e.target.value })} /></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'organization' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Organizational Details</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="departmentName">Department Name</Label><Input id="departmentName" value={formData.departmentName} onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="cccName">CCC Name</Label><Input id="cccName" value={formData.cccName} onChange={(e) => setFormData({ ...formData, cccName: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="cccNo">CCC No.</Label><Input id="cccNo" value={formData.cccNo} onChange={(e) => setFormData({ ...formData, cccNo: e.target.value })} /></div>
                        <div className="space-y-2"><Label htmlFor="pidNo">PID No.</Label><Input id="pidNo" value={formData.pidNo} onChange={(e) => setFormData({ ...formData, pidNo: e.target.value })} /></div>
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="resumeSource">Resume Source</Label><Input id="resumeSource" placeholder="myCareerFuture, Job Portal, Agency, Referral" value={formData.resumeSource} onChange={(e) => setFormData({ ...formData, resumeSource: e.target.value })} /></div>
                      </div>
                    </section>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-end gap-3 border-t pt-4">
                    <Button variant="outline" onClick={handleCancelForm}>Cancel</Button>
                    <Button onClick={isLastSection ? handleSubmitForm : handleNextSection}>
                      {isLastSection ? `${selectedMatrix ? 'Update' : 'Create'} Hiring Matrix` : 'Next'}
                    </Button>
                  </div>
                </div>
              </div>
              </div>
          </CardContent>
        </Card>
      ) : (
        <>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMatrices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {canApprove ? 'Require your action' : 'Awaiting approval'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedMatrices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready to proceed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected (To Resubmit)
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedMatrices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Needs to be edited
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hiring Matrices Table */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingMatrices.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedMatrices.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedMatrices.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              <MatrixTable data={pendingMatrices} showActions={false} showApprovalActions={canApprove} />
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <MatrixTable data={approvedMatrices} showActions={false} showApprovalActions={false} />
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <MatrixTable 
                data={rejectedMatrices} 
                showActions={canCreateMatrix}
                showApprovalActions={false}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

        </>
      )}

      {/* Create/Edit Hiring Matrix Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMatrix ? 'Edit Hiring Matrix' : 'Create Hiring Matrix'}
            </DialogTitle>
            <DialogDescription>
              Fill in the required details for the new hire. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Required Fields */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Required Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name (as per NRIC) *</Label>
                  <Input
                    id="employeeName"
                    placeholder="Enter employee name"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title *</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Enter job title"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                    <SelectTrigger id="employmentType">
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Time">Full Time</SelectItem>
                      <SelectItem value="Part Time">Part Time</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Employment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contractEndDate">Current Contract End Date (If applicable)</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={formData.contractEndDate}
                    onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basicSalary">Basic Salary Offered</Label>
                  <Input
                    id="basicSalary"
                    placeholder="Enter salary amount"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billableStatus">Billable / Non-Billable</Label>
                  <Select value={formData.billableStatus} onValueChange={(value) => setFormData({ ...formData, billableStatus: value })}>
                    <SelectTrigger id="billableStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Billable">Billable</SelectItem>
                      <SelectItem value="Non-Billable">Non-Billable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireType">New Hire / Internal transfer / Conversion</Label>
                  <Select value={formData.hireType} onValueChange={(value) => setFormData({ ...formData, hireType: value })}>
                    <SelectTrigger id="hireType">
                      <SelectValue placeholder="Select hire type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Hire">New Hire</SelectItem>
                      <SelectItem value="Internal transfer">Internal transfer</SelectItem>
                      <SelectItem value="Conversion">Conversion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Work Details */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Work Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="workLocation">Work location (Full address)</Label>
                  <Input
                    id="workLocation"
                    placeholder="Enter work location"
                    value={formData.workLocation}
                    onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingTime">Working Time</Label>
                  <Select value={formData.workingTime} onValueChange={(value) => setFormData({ ...formData, workingTime: value })}>
                    <SelectTrigger id="workingTime">
                      <SelectValue placeholder="Select working time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Shift">Shift</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workdayPattern">Workday / Shift Pattern</Label>
                  <Select value={formData.workdayPattern} onValueChange={(value) => setFormData({ ...formData, workdayPattern: value })}>
                    <SelectTrigger id="workdayPattern">
                      <SelectValue placeholder="Select workday pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mon-Fri">Mon-Fri</SelectItem>
                      <SelectItem value="Thu-Sun">Thu-Sun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobGrade">Job Grade</Label>
                  <Input
                    id="jobGrade"
                    placeholder="Enter job grade"
                    value={formData.jobGrade}
                    onChange={(e) => setFormData({ ...formData, jobGrade: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidateEmail">Candidates Personal Email ID</Label>
                  <Input
                    id="candidateEmail"
                    type="email"
                    placeholder="Enter email"
                    value={formData.candidateEmail}
                    onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateMobile">Candidates Mobile number</Label>
                  <Input
                    id="candidateMobile"
                    placeholder="Enter mobile number"
                    value={formData.candidateMobile}
                    onChange={(e) => setFormData({ ...formData, candidateMobile: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Management */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Management & Approvals</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportingManager">Reporting Manager / Supervisor</Label>
                  <Input
                    id="reportingManager"
                    placeholder="Enter reporting manager name"
                    value={formData.reportingManager}
                    onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaveManager">Leave Manager for Ignite</Label>
                  <Input
                    id="leaveManager"
                    placeholder="Enter leave manager name"
                    value={formData.leaveManager}
                    onChange={(e) => setFormData({ ...formData, leaveManager: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceManager">Attendance Manager for Ignite</Label>
                  <Input
                    id="attendanceManager"
                    placeholder="Enter attendance manager name"
                    value={formData.attendanceManager}
                    onChange={(e) => setFormData({ ...formData, attendanceManager: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgcRequired">BGC Required</Label>
                  <Select value={formData.bgcRequired} onValueChange={(value) => setFormData({ ...formData, bgcRequired: value })}>
                    <SelectTrigger id="bgcRequired">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Compensation & Benefits */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Compensation & Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payGroup">Pay Group (7th / 25th)</Label>
                  <Input
                    id="payGroup"
                    placeholder="Enter pay group"
                    value={formData.payGroup}
                    onChange={(e) => setFormData({ ...formData, payGroup: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parkingAllowance">Parking Allowance (With Conditions)</Label>
                  <Select value={formData.parkingAllowance} onValueChange={(value) => setFormData({ ...formData, parkingAllowance: value })}>
                    <SelectTrigger id="parkingAllowance">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceAwards">Attendance Awards</Label>
                  <Select value={formData.attendanceAwards} onValueChange={(value) => setFormData({ ...formData, attendanceAwards: value })}>
                    <SelectTrigger id="attendanceAwards">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftAllowance">Shift Allowance</Label>
                  <Select value={formData.shiftAllowance} onValueChange={(value) => setFormData({ ...formData, shiftAllowance: value })}>
                    <SelectTrigger id="shiftAllowance">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtimePay">Overtime Pay</Label>
                  <Select value={formData.overtimePay} onValueChange={(value) => setFormData({ ...formData, overtimePay: value })}>
                    <SelectTrigger id="overtimePay">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualLeave">Annual leave / Year</Label>
                  <Select value={formData.annualLeave} onValueChange={(value) => setFormData({ ...formData, annualLeave: value })}>
                    <SelectTrigger id="annualLeave">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Work Pass & Email */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Work Pass & Email</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workPassRequired">Apply Work Pass Required</Label>
                  <Select value={formData.workPassRequired} onValueChange={(value) => setFormData({ ...formData, workPassRequired: value })}>
                    <SelectTrigger id="workPassRequired">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="NA">NA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.workPassRequired === 'Yes' && (
                  <div className="space-y-2">
                    <Label htmlFor="workPassType">Pass Type (WP / SP / EP / LOC)</Label>
                    <Input
                      id="workPassType"
                      placeholder="e.g., WP, SP, EP, LOC"
                      value={formData.workPassType}
                      onChange={(e) => setFormData({ ...formData, workPassType: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="emailRequired">Email Required</Label>
                  <Select value={formData.emailRequired} onValueChange={(value) => setFormData({ ...formData, emailRequired: value })}>
                    <SelectTrigger id="emailRequired">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailNameCreation">Email Name Creation</Label>
                  <Input
                    id="emailNameCreation"
                    placeholder="Enter email name"
                    value={formData.emailNameCreation}
                    onChange={(e) => setFormData({ ...formData, emailNameCreation: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Organizational Details */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Organizational Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="departmentName">Department Name</Label>
                  <Input
                    id="departmentName"
                    placeholder="Enter department name"
                    value={formData.departmentName}
                    onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cccName">CCC Name</Label>
                  <Input
                    id="cccName"
                    placeholder="Enter CCC name"
                    value={formData.cccName}
                    onChange={(e) => setFormData({ ...formData, cccName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cccNo">CCC No.</Label>
                  <Input
                    id="cccNo"
                    placeholder="Enter CCC number"
                    value={formData.cccNo}
                    onChange={(e) => setFormData({ ...formData, cccNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pidNo">PID No.</Label>
                  <Input
                    id="pidNo"
                    placeholder="Enter PID number"
                    value={formData.pidNo}
                    onChange={(e) => setFormData({ ...formData, pidNo: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="resumeSource">Resume Source</Label>
                  <Input
                    id="resumeSource"
                    placeholder="e.g., myCareerFuture, Job Portal, Agency, Referral"
                    value={formData.resumeSource}
                    onChange={(e) => setFormData({ ...formData, resumeSource: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormDialogOpen(false); setSelectedMatrix(null); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitForm}>
              {selectedMatrix ? 'Update' : 'Create'} Hiring Matrix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog - For Department Manager Approval */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hiring Matrix Details - Review & Approve</DialogTitle>
            <DialogDescription>
              Review all details before approval or rejection
            </DialogDescription>
          </DialogHeader>
          {selectedMatrix && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Employee Name</Label>
                  <p className="font-semibold">{selectedMatrix.candidateName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Job Title</Label>
                  <p className="font-semibold">{selectedMatrix.position}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Start Date</Label>
                  <p className="font-semibold">{selectedMatrix.interviewDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Department</Label>
                  <p className="font-semibold">{selectedMatrix.department}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Basic Salary</Label>
                  <p className="font-semibold">{selectedMatrix.salary}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Submitted By</Label>
                  <p className="font-semibold">{selectedMatrix.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Submission Date</Label>
                  <p className="font-semibold">{selectedMatrix.requestedDate}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Employment Details</Label>
                  <p className="font-semibold text-sm">{selectedMatrix.hiringManagerRemark}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleRejectClick(selectedMatrix!)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button 
              onClick={() => handleApprove(selectedMatrix!.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Hiring Matrix</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection. This will be shown to the hiring manager for resubmission.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Provide detailed feedback for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
