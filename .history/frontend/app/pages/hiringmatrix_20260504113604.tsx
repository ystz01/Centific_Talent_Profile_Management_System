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
  employeeName: string;
  jobTitle: string;
  startDate: string;
  employmentType: string;
  basicSalary: string;
  department: string;
  reportingManager: string;
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
      basicSalary: '',
      department: '',
      reportingManager: '',
    });
    setFormDialogOpen(true);
  };

  const handleSubmitForm = () => {
    if (!formData.employeeName || !formData.jobTitle || !formData.startDate || !formData.employmentType) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newMatrix: HiringMatrixType = {
      id: `hm-${matrices.length + 1}`,
      candidateId: `cand-${matrices.length + 1}`,
      candidateName: formData.employeeName,
      position: formData.jobTitle,
      department: formData.department,
      phone: '',
      email: '',
      interviewDate: formData.startDate,
      salary: formData.basicSalary,
      hiringManagerRemark: `Employment Type: ${formData.employmentType}, Reporting Manager: ${formData.reportingManager}`,
      recruiterRemark: '',
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
    setFormData({
      employeeName: matrix.candidateName,
      jobTitle: matrix.position,
      startDate: matrix.interviewDate,
      employmentType: matrix.hiringManagerRemark?.split('Employment Type: ')[1]?.split(',')[0] || '',
      basicSalary: matrix.salary,
      department: matrix.department,
      reportingManager: matrix.hiringManagerRemark?.split('Reporting Manager: ')[1] || '',
    });
    setSelectedMatrix(matrix);
    setFormDialogOpen(true);
  };

  const MatrixTable = ({ data, showActions }: { data: HiringMatrixType[], showActions: boolean }) => (
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
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Salary</TableHead>
            {showActions && canApprove && <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((matrix, index) => (
              <TableRow key={matrix.id}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{matrix.candidateName}</TableCell>
                <TableCell>{matrix.phone}</TableCell>
                <TableCell>{matrix.email}</TableCell>
                <TableCell>{matrix.interviewDate}</TableCell>
                <TableCell>
                  <span className="text-green-600 font-bold">Y</span>
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="truncate">{matrix.hiringManagerRemark}</p>
                </TableCell>
                <TableCell>{matrix.jobRequisition}</TableCell>
                <TableCell className="max-w-[200px]">
                  <p className="truncate">{matrix.recruiterRemark}</p>
                </TableCell>
                <TableCell>{matrix.salary}</TableCell>
                {showActions && canApprove && (
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleApprove(matrix.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(matrix.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showActions && canApprove ? 11 : 10} className="text-center py-8">
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
              Approved Matrices
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
              Rejected Matrices
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedMatrices.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Matrix for Approved Candidates - Hiring Manager Only */}
      {isHiringManager && approvedCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Approved Candidates (Ready for Hiring Matrix)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approvedCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{candidate.candidateName}</p>
                    <p className="text-sm text-muted-foreground">{candidate.jobPosition}</p>
                  </div>
                  <Button onClick={() => handleOpenGenerateDialog(candidate)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Hiring Matrix
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <MatrixTable data={pendingMatrices} showActions={true} />
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <MatrixTable data={approvedMatrices} showActions={false} />
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <MatrixTable data={rejectedMatrices} showActions={false} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Generate Hiring Matrix Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Hiring Matrix</DialogTitle>
            <DialogDescription>
              Complete the details for {selectedCandidate?.candidateName}'s hiring matrix
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Salary Offer *</Label>
              <Input
                id="salary"
                placeholder="e.g., $120,000"
                value={matrixData.salary}
                onChange={(e) => setMatrixData({ ...matrixData, salary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobRequisition">Job Requisition *</Label>
              <Input
                id="jobRequisition"
                value={matrixData.jobRequisition}
                onChange={(e) => setMatrixData({ ...matrixData, jobRequisition: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateMatrix}>
              Generate Matrix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
