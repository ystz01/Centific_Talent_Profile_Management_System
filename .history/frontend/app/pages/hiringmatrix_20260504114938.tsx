"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Edit2 } from 'lucide-react';
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


export function HiringMatrix() {
  const { hasPermission, user } = useAuth();
  const canCreateMatrix = user?.role === 'Hiring Manager';
  const canApprove = user?.role === 'Department Manager';
  const [matrices, setMatrices] = useState<HiringMatrixType[]>(mockHiringMatrix);
  
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
    basicSalary: '',
    department: '',
    reportingManager: '',
  });

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
    setFormDialogOpen(true);
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
    setFormDialogOpen(false);
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
    setFormDialogOpen(true);
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
        {canCreateMatrix && (
          <Button onClick={handleOpenFormDialog} size="lg">
            Create New Hiring Matrix
          </Button>
        )}
      </div>

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

      {/* Create/Edit Hiring Matrix Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMatrix ? 'Edit Hiring Matrix' : 'Create Hiring Matrix'}
            </DialogTitle>
            <DialogDescription>
              Fill in the required details for the new hire. Only the first 2 fields are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="Enter department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportingManager">Reporting Manager / Supervisor</Label>
              <Input
                id="reportingManager"
                placeholder="Enter reporting manager name"
                value={formData.reportingManager}
                onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })}
              />
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
