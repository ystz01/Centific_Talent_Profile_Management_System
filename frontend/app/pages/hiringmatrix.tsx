"use client";

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Eye, Edit2, ArrowLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatSalary } from '@/lib/utils';
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
import { HiringMatrix as HiringMatrixType } from '@/types';
import { toast } from 'sonner';
import {
  createHiringMatrix,
  updateHiringMatrix,
  subscribeToCandidatesCollection,
  subscribeToHiringMatrices,
  subscribeToInterviews,
  updateCandidateStatus,
  updateHiringMatrixApproval,
  type FirestoreCandidate,
  type FirestoreHiringMatrix,
} from '@/lib/firebase';

interface HiringMatrixFormData {
  // Required fields
  candidateId: string;
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

const DEFAULT_WORK_LOCATION = '30th Floor, Menara BHL, No. 51, Jalan Sultan Ahmad Shah, 10050 Georgetown, Penang, Malaysia';

function mapFirestoreHiringMatrix(record: FirestoreHiringMatrix & { id: string }): HiringMatrixType {
  const status = record.approval_status === 'approved'
    ? 'Approved'
    : record.approval_status === 'rejected'
      ? 'Rejected'
      : 'Pending';

  return {
    id: record.id,
    candidateId: record.candidate_id ?? '',
    candidateName: record.employee_name ?? '',
    position: record.job_title ?? '',
    department: record.department_name ?? '',
    phone: record.candidate_mobile_number ?? '',
    email: record.candidate_personal_email ?? '',
    interviewDate: record.start_date ?? '',
    salary: record.basic_salary_offered ?? '',
    hiringManagerRemark: `Employment Type: ${record.employment_type ?? ''}, Work Pass: ${record.apply_work_pass_required ?? ''}, Email Required: ${record.email_required ?? ''}`,
    recruiterRemark: JSON.stringify(record),
    jobRequisition: '',
    status,
    requestedBy: record.created_by ?? '',
    requestedDate: record.created_at?.toDate().toISOString().split('T')[0] ?? '',
    approvedBy: record.approved_by ?? undefined,
    approvedDate: record.approved_at?.toDate().toISOString().split('T')[0] ?? undefined,
    rejectionReason: record.rejection_reason ?? undefined,
  };
}

export function HiringMatrix() {
  const { hasPermission, user } = useAuth();
  const canCreateMatrix = user?.role === 'Hiring Manager';
  const canApprove = user?.role === 'Department Manager';
  const [matrices, setMatrices] = useState<HiringMatrixType[]>([]);
  const [acceptedCandidates, setAcceptedCandidates] = useState<Array<{
    id: string;
    name: string;
    position: string;
    email: string;
    phone: string;
  }>>([]);
  const [pageMode, setPageMode] = useState<'list' | 'form'>('list');
  
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMatrix, setSelectedMatrix] = useState<HiringMatrixType | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const [formData, setFormData] = useState<HiringMatrixFormData>({
    candidateId: '',
    employeeName: '',
    jobTitle: '',
    startDate: '',
    employmentType: '',
    contractEndDate: '',
    basicSalary: '',
    billableStatus: '',
    workLocation: DEFAULT_WORK_LOCATION,
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
    parkingAllowance: 'N/A',
    attendanceAwards: 'N/A',
    shiftAllowance: 'N/A',
    overtimePay: 'N/A',
    annualLeave: 'N/A',
    workPassRequired: 'N/A',
    workPassType: '',
    emailRequired: 'N/A',
    emailNameCreation: '',
    departmentName: '',
    cccName: '',
    cccNo: '',
    pidNo: '',
    resumeSource: '',
  });
  const [activeSection, setActiveSection] = useState<FormSectionKey>('required');
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => subscribeToHiringMatrices(
    (records) => {
      setMatrices(records.map(mapFirestoreHiringMatrix));
    },
    (error) => {
      console.error(error);
      toast.error('Unable to load hiring matrices from Firebase.');
    }
  ), []);

  useEffect(() => {
    let interviews: Array<{ candidateId?: string; candidateName?: string; position?: string; email?: string; phone?: string; interview_status?: string }> = [];
    let candidates: Array<FirestoreCandidate & { id: string }> = [];

    const updateAcceptedCandidates = () => {
      const candidateById = new Map(candidates.map((candidate) => [candidate.id, candidate]));
      setAcceptedCandidates(
        interviews
          .filter((interview) => interview.interview_status === 'accept' && interview.candidateId)
          .map((interview) => {
            const candidate = candidateById.get(interview.candidateId!);
            return {
              id: interview.candidateId!,
              name: interview.candidateName ?? candidate?.name ?? '',
              position: interview.position ?? '',
              email: interview.email ?? candidate?.email ?? '',
              phone: interview.phone ?? candidate?.phone ?? '',
            };
          })
          .filter((candidate) => candidate.name)
      );
    };

    const unsubscribeInterviews = subscribeToInterviews((records) => {
      interviews = records;
      updateAcceptedCandidates();
    }, (error) => {
      console.error(error);
      toast.error('Unable to load accepted interview candidates.');
    });
    const unsubscribeCandidates = subscribeToCandidatesCollection((records) => {
      candidates = records;
      updateAcceptedCandidates();
    }, (error) => {
      console.error(error);
      toast.error('Unable to load candidate contact details.');
    });

    return () => {
      unsubscribeInterviews();
      unsubscribeCandidates();
    };
  }, []);

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
      candidateId: '',
      employeeName: '',
      jobTitle: '',
      startDate: '',
      employmentType: '',
      contractEndDate: '',
      basicSalary: '',
      billableStatus: '',
      workLocation: DEFAULT_WORK_LOCATION,
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
      parkingAllowance: 'N/A',
      attendanceAwards: 'N/A',
      shiftAllowance: 'N/A',
      overtimePay: 'N/A',
      annualLeave: 'N/A',
      workPassRequired: 'N/A',
      workPassType: '',
      emailRequired: 'N/A',
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
    setViewOnly(false);
  };

  const populateFormFromMatrix = (matrix: HiringMatrixType) => {
    let extraData: Partial<FirestoreHiringMatrix> = {};
    try {
      extraData = JSON.parse(matrix.recruiterRemark) as Partial<FirestoreHiringMatrix>;
    } catch {
      // ignore
    }

    setFormData({
      candidateId: extraData.candidate_id ?? matrix.candidateId,
      employeeName: extraData.employee_name ?? matrix.candidateName,
      jobTitle: extraData.job_title ?? matrix.position,
      startDate: extraData.start_date ?? matrix.interviewDate,
      employmentType: extraData.employment_type ?? '',
      contractEndDate: extraData.current_contract_end_date ?? '',
      basicSalary: extraData.basic_salary_offered ?? matrix.salary,
      billableStatus: extraData.billable_status ?? '',
      workLocation: extraData.work_location ?? DEFAULT_WORK_LOCATION,
      workingTime: extraData.working_time ?? '',
      workdayPattern: extraData.workday_shift_pattern ?? '',
      candidateEmail: extraData.candidate_personal_email ?? matrix.email,
      candidateMobile: extraData.candidate_mobile_number ?? matrix.phone,
      jobGrade: extraData.job_grade ?? '',
      hireType: extraData.hire_type ?? '',
      bgcRequired: extraData.bgc_required ?? '',
      reportingManager: extraData.reporting_manager ?? '',
      leaveManager: extraData.leave_manager ?? '',
      attendanceManager: extraData.attendance_manager ?? '',
      payGroup: extraData.pay_group ?? '',
      parkingAllowance: extraData.parking_allowance ?? 'N/A',
      attendanceAwards: extraData.attendance_awards ?? 'N/A',
      shiftAllowance: extraData.shift_allowance ?? 'N/A',
      overtimePay: extraData.overtime_pay ?? 'N/A',
      annualLeave: extraData.annual_leave ?? 'N/A',
      workPassRequired: extraData.apply_work_pass_required ?? 'N/A',
      workPassType: extraData.pass_type ?? '',
      emailRequired: extraData.email_required ?? 'N/A',
      emailNameCreation: extraData.email_name_creation ?? '',
      departmentName: extraData.department_name ?? '',
      cccName: extraData.ccc_name ?? '',
      cccNo: extraData.ccc_no ?? '',
      pidNo: extraData.pid_no ?? '',
      resumeSource: extraData.resume_source ?? '',
    });
  };

  const handleSubmitForm = async () => {
    const missingFields = [
      !formData.employeeName.trim() && 'Name',
      !formData.jobTitle.trim() && 'Job Title',
      !formData.startDate.trim() && 'Start Date',
      !formData.employmentType.trim() && 'Employment Type',
    ].filter((field): field is string => Boolean(field));

    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields (Name, Job Title, Start Date, Employment Type)');
      return;
    }

    try {
      const salary = formatSalary(formData.basicSalary);
      const selectedCandidate = acceptedCandidates.find(
        (candidate) => candidate.id === formData.candidateId || candidate.name === formData.employeeName
      );
      const payload = {
        candidate_id: formData.candidateId || selectedCandidate?.id || '',
        employee_name: formData.employeeName,
        job_title: formData.jobTitle,
        start_date: formData.startDate,
        employment_type: formData.employmentType,
        current_contract_end_date: formData.contractEndDate || null,
        billable_status: formData.billableStatus,
        basic_salary_offered: salary ? `RM${salary}` : '',
        hire_type: formData.hireType,
        work_location: formData.workLocation || DEFAULT_WORK_LOCATION,
        working_time: formData.workingTime,
        workday_shift_pattern: formData.workdayPattern,
        job_grade: formData.jobGrade || null,
        candidate_personal_email: formData.candidateEmail,
        candidate_mobile_number: formData.candidateMobile,
        reporting_manager: formData.reportingManager,
        leave_manager: formData.leaveManager,
        attendance_manager: formData.attendanceManager,
        bgc_required: formData.bgcRequired,
        pay_group: formData.payGroup,
        attendance_awards: formData.attendanceAwards || 'N/A',
        overtime_pay: formData.overtimePay || 'N/A',
        parking_allowance: formData.parkingAllowance || 'N/A',
        shift_allowance: formData.shiftAllowance || 'N/A',
        annual_leave: formData.annualLeave || 'N/A',
        apply_work_pass_required: formData.workPassRequired || 'N/A',
        pass_type: formData.workPassRequired === 'Yes' ? formData.workPassType : null,
        email_required: formData.emailRequired || 'N/A',
        email_name_creation: formData.emailRequired === 'Yes' && formData.emailNameCreation.trim()
          ? `${formData.emailNameCreation.trim().toLowerCase().replace(/@centific\.com$/i, '')}@centific.com`
          : null,
        department_name: formData.departmentName,
        ccc_no: formData.cccNo || null,
        ccc_name: formData.cccName || null,
        pid_no: formData.pidNo || null,
        resume_source: formData.resumeSource || null,
        created_by: user?.name || '',
      };
      if (selectedMatrix) {
        await updateHiringMatrix(selectedMatrix.id, payload);
      } else {
        await createHiringMatrix(payload);
      }
      setPageMode('list');
      setSelectedMatrix(null);
      toast.success('Hiring matrix created successfully');
    } catch (error) {
      console.error(error);
      toast.error('Unable to save hiring matrix.');
    }
  };

  const handleOpenDetailsDialog = (matrix: HiringMatrixType) => {
    // Department Manager should see a read-only multi-section form
    if (user?.role === 'Department Manager') {
      populateFormFromMatrix(matrix);
      setSelectedMatrix(matrix);
      setActiveSection('required');
      setPageMode('form');
      setViewOnly(true);
      return;
    }

    setSelectedMatrix(matrix);
    setDetailsDialogOpen(true);
  };

  const handleApprove = async (id: string) => {
    const matrix = matrices.find((item) => item.id === id);
    if (!matrix?.candidateId) {
      toast.error('Unable to approve hiring matrix because no candidate is linked.');
      return;
    }

    try {
      await updateHiringMatrixApproval(id, 'approved', user?.name || '');
      await updateCandidateStatus(matrix.candidateId, 'Hired');
    } catch (error) {
      console.error(error);
      toast.error('Unable to approve hiring matrix.');
      return;
    }
    // If Department Manager approved from the form view, return to list and clear view state
    setDetailsDialogOpen(false);
    setRejectionDialogOpen(false);
    setPageMode('list');
    setSelectedMatrix(null);
    setViewOnly(false);
    toast.success('Hiring matrix approved');
  };

  const handleRejectClick = (matrix: HiringMatrixType) => {
    setSelectedMatrix(matrix);
    setRejectionReason('');
    setRejectionDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedMatrix) return;
    try {
      await updateHiringMatrixApproval(selectedMatrix.id, 'rejected', user?.name || '', rejectionReason);
    } catch (error) {
      console.error(error);
      toast.error('Unable to reject hiring matrix.');
      return;
    }
    // After rejection, return Department Manager to list and clear view state
    setRejectionDialogOpen(false);
    setDetailsDialogOpen(false);
    setPageMode('list');
    setSelectedMatrix(null);
    setViewOnly(false);
    toast.error('Hiring matrix rejected');
  };

  const parsedRecruiterRemark = selectedMatrix?.recruiterRemark
    ? (() => {
        try {
          return JSON.parse(selectedMatrix.recruiterRemark || '{}');
        } catch {
          return {};
        }
      })()
    : {};

  const getHiringManagerField = (field: 'employmentType' | 'workPass' | 'workPassType' | 'emailRequired') => {
    const hm = selectedMatrix?.hiringManagerRemark || '';
    if (field === 'employmentType') {
      return hm.split('Employment Type: ')[1]?.split(',')[0] || '';
    }
    if (field === 'workPass') {
      return hm.includes('Work Pass: Yes') ? 'Yes' : hm.includes('Work Pass: No') ? 'No' : '';
    }
    if (field === 'workPassType') {
      const m = hm.match(/Work Pass: .*?\((.*?)\)/);
      return m?.[1] || '';
    }
    if (field === 'emailRequired') {
      return hm.includes('Email Required: Yes') ? 'Yes' : hm.includes('Email Required: No') ? 'No' : '';
    }
    return '';
  };

  const ReadOnlyField = ({ label, value }: { label: string; value?: string }) => (
    <div>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className="font-semibold">{value || '-'}</p>
    </div>
  );

  const handleEditRejected = (matrix: HiringMatrixType) => {
    let extraData: Partial<FirestoreHiringMatrix> = {};
    try {
      extraData = JSON.parse(matrix.recruiterRemark) as Partial<FirestoreHiringMatrix>;
    } catch {
      // If not JSON, ignore
    }

    setFormData({
      candidateId: extraData.candidate_id ?? matrix.candidateId,
      employeeName: extraData.employee_name ?? matrix.candidateName,
      jobTitle: extraData.job_title ?? matrix.position,
      startDate: extraData.start_date ?? matrix.interviewDate,
      employmentType: extraData.employment_type ?? '',
      contractEndDate: extraData.current_contract_end_date ?? '',
      basicSalary: extraData.basic_salary_offered ?? matrix.salary,
      billableStatus: extraData.billable_status ?? '',
      workLocation: extraData.work_location ?? DEFAULT_WORK_LOCATION,
      workingTime: extraData.working_time ?? '',
      workdayPattern: extraData.workday_shift_pattern ?? '',
      candidateEmail: extraData.candidate_personal_email ?? matrix.email,
      candidateMobile: extraData.candidate_mobile_number ?? matrix.phone,
      jobGrade: extraData.job_grade ?? '',
      hireType: extraData.hire_type ?? '',
      bgcRequired: extraData.bgc_required ?? '',
      reportingManager: extraData.reporting_manager ?? '',
      leaveManager: extraData.leave_manager ?? '',
      attendanceManager: extraData.attendance_manager ?? '',
      payGroup: extraData.pay_group ?? '',
      parkingAllowance: extraData.parking_allowance ?? 'N/A',
      attendanceAwards: extraData.attendance_awards ?? 'N/A',
      shiftAllowance: extraData.shift_allowance ?? 'N/A',
      overtimePay: extraData.overtime_pay ?? 'N/A',
      annualLeave: extraData.annual_leave ?? 'N/A',
      workPassRequired: extraData.apply_work_pass_required ?? 'N/A',
      workPassType: '',
      emailRequired: extraData.email_required ?? 'N/A',
      emailNameCreation: extraData.email_name_creation ?? '',
      departmentName: extraData.department_name ?? matrix.department,
      cccName: extraData.ccc_name ?? '',
      cccNo: extraData.ccc_no ?? '',
      pidNo: extraData.pid_no ?? '',
      resumeSource: extraData.resume_source ?? '',
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

  const MatrixTable = ({ data, showActions, showApprovalActions, showReason }: {
    data: HiringMatrixType[], 
    showActions: boolean,
    showApprovalActions: boolean,
    showReason?: boolean,
  }) => {
    const baseCols = 8;
    const extraCols = (showActions || showApprovalActions ? 1 : 0) + (showReason ? 1 : 0);
    const colSpan = baseCols + extraCols;

    return (
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
            <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Submit Date</TableHead>
            {showReason && <TableHead className="text-blue-700 dark:text-blue-300 font-bold">Reason</TableHead>}
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
                {showReason && (
                  <TableCell>
                    <div className="max-w-xs truncate">{matrix.rejectionReason || '-'}</div>
                  </TableCell>
                )}

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
              <TableCell colSpan={colSpan} className="text-center py-8">
                <p className="text-muted-foreground">No hiring matrices found</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    );
  };

  if (!hasPermission('Hiring Matrix Approval', 'read')) {
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
                      {viewOnly ? 'Hiring Matrix' : (selectedMatrix ? 'Edit Hiring Matrix' : 'Create Hiring Matrix')}
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {activeSection === 'required' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Required Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="employeeName">Employee Name (as per NRIC) *</Label>
                          <Select
                            value={formData.candidateId}
                            onValueChange={(value) => {
                              const candidate = acceptedCandidates.find((item) => item.id === value);
                              if (!candidate) return;
                              setFormData({
                                ...formData,
                                candidateId: candidate.id,
                                employeeName: candidate.name,
                                jobTitle: candidate.position,
                                candidateEmail: candidate.email,
                                candidateMobile: candidate.phone,
                              });
                            }}
                          >
                            <SelectTrigger id="employeeName" disabled={viewOnly}><SelectValue placeholder="Select an accepted candidate" /></SelectTrigger>
                            <SelectContent>
                              {acceptedCandidates.map((candidate) => (
                                <SelectItem key={candidate.id} value={candidate.id}>{candidate.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jobTitle">Job Title *</Label>
                          <Input
                            id="jobTitle"
                            value={formData.jobTitle}
                            onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                            readOnly={viewOnly}
                            disabled={viewOnly}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date *</Label>
                          <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} readOnly={viewOnly} disabled={viewOnly} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employmentType">Employment Type *</Label>
                          <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                            <SelectTrigger id="employmentType" disabled={viewOnly}><SelectValue placeholder="Select employment type" /></SelectTrigger>
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
                        <div className="space-y-2"><Label htmlFor="contractEndDate">Current Contract End Date (If applicable)</Label><Input id="contractEndDate" type="date" value={formData.contractEndDate} onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="basicSalary">Basic Salary Offered</Label><Input id="basicSalary" placeholder="RM 0.00" value={formData.basicSalary} onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })} onBlur={(e) => setFormData({ ...formData, basicSalary: formatSalary(e.target.value) })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="billableStatus">Billable / Non-Billable</Label><Select value={formData.billableStatus} onValueChange={(value) => setFormData({ ...formData, billableStatus: value })}><SelectTrigger id="billableStatus" disabled={viewOnly}><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="Billable">Billable</SelectItem><SelectItem value="Non-Billable">Non-Billable</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="hireType">New Hire / Internal transfer / Conversion</Label><Select value={formData.hireType} onValueChange={(value) => setFormData({ ...formData, hireType: value })}><SelectTrigger id="hireType" disabled={viewOnly}><SelectValue placeholder="Select hire type" /></SelectTrigger><SelectContent><SelectItem value="New Hire">New Hire</SelectItem><SelectItem value="Internal transfer">Internal transfer</SelectItem><SelectItem value="Conversion">Conversion</SelectItem></SelectContent></Select></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'work' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Work Details</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="workLocation">Work location (Full address)</Label><Input id="workLocation" value={formData.workLocation} onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="workingTime">Working Time</Label><Select value={formData.workingTime} onValueChange={(value) => setFormData({ ...formData, workingTime: value })}><SelectTrigger id="workingTime" disabled={viewOnly}><SelectValue placeholder="Select working time" /></SelectTrigger><SelectContent><SelectItem value="Regular">Regular</SelectItem><SelectItem value="Shift">Shift</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="workdayPattern">Workday / Shift Pattern</Label><Select value={formData.workdayPattern} onValueChange={(value) => setFormData({ ...formData, workdayPattern: value })}><SelectTrigger id="workdayPattern" disabled={viewOnly}><SelectValue placeholder="Select workday pattern" /></SelectTrigger><SelectContent><SelectItem value="Mon-Fri">Mon-Fri</SelectItem><SelectItem value="Thu-Sun">Thu-Sun</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="jobGrade">Job Grade</Label><Input id="jobGrade" value={formData.jobGrade} onChange={(e) => setFormData({ ...formData, jobGrade: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'contact' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Contact Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="candidateEmail">Candidates Personal Email ID</Label><Input id="candidateEmail" type="email" value={formData.candidateEmail} onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="candidateMobile">Candidates Mobile number</Label><Input id="candidateMobile" value={formData.candidateMobile} onChange={(e) => setFormData({ ...formData, candidateMobile: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'management' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Management & Approvals</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="reportingManager">Reporting Manager / Supervisor</Label><Input id="reportingManager" value={formData.reportingManager} onChange={(e) => setFormData({ ...formData, reportingManager: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="leaveManager">Leave Manager for Ignite</Label><Input id="leaveManager" value={formData.leaveManager} onChange={(e) => setFormData({ ...formData, leaveManager: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="attendanceManager">Attendance Manager for Ignite</Label><Input id="attendanceManager" value={formData.attendanceManager} onChange={(e) => setFormData({ ...formData, attendanceManager: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="bgcRequired">BGC Required</Label><Select value={formData.bgcRequired} onValueChange={(value) => setFormData({ ...formData, bgcRequired: value })}><SelectTrigger id="bgcRequired" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem></SelectContent></Select></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'compensation' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Compensation & Benefits</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="payGroup">Pay Group (7th / 25th)</Label><Input id="payGroup" value={formData.payGroup} onChange={(e) => setFormData({ ...formData, payGroup: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="parkingAllowance">Parking Allowance (With Conditions)</Label><Select value={formData.parkingAllowance} onValueChange={(value) => setFormData({ ...formData, parkingAllowance: value })}><SelectTrigger id="parkingAllowance" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="attendanceAwards">Attendance Awards</Label><Select value={formData.attendanceAwards} onValueChange={(value) => setFormData({ ...formData, attendanceAwards: value })}><SelectTrigger id="attendanceAwards" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="shiftAllowance">Shift Allowance</Label><Select value={formData.shiftAllowance} onValueChange={(value) => setFormData({ ...formData, shiftAllowance: value })}><SelectTrigger id="shiftAllowance" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="overtimePay">Overtime Pay</Label><Select value={formData.overtimePay} onValueChange={(value) => setFormData({ ...formData, overtimePay: value })}><SelectTrigger id="overtimePay" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label htmlFor="annualLeave">Annual leave / Year</Label><Select value={formData.annualLeave} onValueChange={(value) => setFormData({ ...formData, annualLeave: value })}><SelectTrigger id="annualLeave" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                      </div>
                    </section>
                    )}

                    {activeSection === 'workPass' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Work Pass & Email</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="workPassRequired">Apply Work Pass Required</Label><Select value={formData.workPassRequired} onValueChange={(value) => setFormData({ ...formData, workPassRequired: value, workPassType: value === 'Yes' ? formData.workPassType : '' })}><SelectTrigger id="workPassRequired" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                        {formData.workPassRequired === 'Yes' && (
                          <div className="space-y-2"><Label htmlFor="workPassType">Pass Type (WP / SP / EP / LOC)</Label><Input id="workPassType" value={formData.workPassType} onChange={(e) => setFormData({ ...formData, workPassType: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        )}
                        <div className="space-y-2"><Label htmlFor="emailRequired">Email Required</Label><Select value={formData.emailRequired} onValueChange={(value) => setFormData({ ...formData, emailRequired: value, emailNameCreation: value === 'Yes' ? formData.emailNameCreation : '' })}><SelectTrigger id="emailRequired" disabled={viewOnly}><SelectValue placeholder="Select option" /></SelectTrigger><SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="N/A">N/A</SelectItem></SelectContent></Select></div>
                        {formData.emailRequired === 'Yes' && <div className="space-y-2"><Label htmlFor="emailNameCreation">Email Name Creation</Label><Input id="emailNameCreation" value={formData.emailNameCreation} onChange={(e) => setFormData({ ...formData, emailNameCreation: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>}
                      </div>
                    </section>
                    )}

                    {activeSection === 'organization' && (
                    <section className="space-y-4">
                      <h3 className="font-semibold text-sm">Organizational Details</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2"><Label htmlFor="departmentName">Department Name</Label><Input id="departmentName" value={formData.departmentName} onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="cccName">CCC Name</Label><Input id="cccName" value={formData.cccName} onChange={(e) => setFormData({ ...formData, cccName: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="cccNo">CCC No.</Label><Input id="cccNo" value={formData.cccNo} onChange={(e) => setFormData({ ...formData, cccNo: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2"><Label htmlFor="pidNo">PID No.</Label><Input id="pidNo" value={formData.pidNo} onChange={(e) => setFormData({ ...formData, pidNo: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                        <div className="space-y-2 md:col-span-2"><Label htmlFor="resumeSource">Resume Source</Label><Input id="resumeSource" placeholder="myCareerFuture, Job Portal, Agency, Referral" value={formData.resumeSource} onChange={(e) => setFormData({ ...formData, resumeSource: e.target.value })} readOnly={viewOnly} disabled={viewOnly} /></div>
                      </div>
                    </section>
                    )}
                  </div>

                  <div className="mt-8 flex items-center justify-end gap-3 border-t pt-4">
                    {viewOnly ? (
                      <>
                        <Button variant="outline" onClick={() => { setPageMode('list'); setSelectedMatrix(null); setViewOnly(false); }}>
                          Back
                        </Button>
                        <Button variant="destructive" onClick={() => handleRejectClick(selectedMatrix!)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button onClick={() => handleApprove(selectedMatrix!.id)}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" onClick={handleCancelForm}>Cancel</Button>
                        <Button onClick={isLastSection ? handleSubmitForm : handleNextSection}>
                          {isLastSection ? `${selectedMatrix ? 'Update' : 'Create'} Hiring Matrix` : 'Next'}
                        </Button>
                      </>
                    )}
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
                showReason={true}
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
                    <SelectTrigger id="employmentType" disabled={viewOnly}>
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
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basicSalary">Basic Salary Offered</Label>
                  <Input
                    id="basicSalary"
                    placeholder="RM 0.00"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                    onBlur={(e) => setFormData({ ...formData, basicSalary: formatSalary(e.target.value) })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billableStatus">Billable / Non-Billable</Label>
                  <Select value={formData.billableStatus} onValueChange={(value) => setFormData({ ...formData, billableStatus: value })}>
                    <SelectTrigger id="billableStatus" disabled={viewOnly}>
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
                    <SelectTrigger id="hireType" disabled={viewOnly}>
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
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workingTime">Working Time</Label>
                  <Select value={formData.workingTime} onValueChange={(value) => setFormData({ ...formData, workingTime: value })}>
                    <SelectTrigger id="workingTime" disabled={viewOnly}>
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
                    <SelectTrigger id="workdayPattern" disabled={viewOnly}>
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
                    readOnly={viewOnly}
                    disabled={viewOnly}
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
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="candidateMobile">Candidates Mobile number</Label>
                  <Input
                    id="candidateMobile"
                    placeholder="Enter mobile number"
                    value={formData.candidateMobile}
                    onChange={(e) => setFormData({ ...formData, candidateMobile: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
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
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaveManager">Leave Manager for Ignite</Label>
                  <Input
                    id="leaveManager"
                    placeholder="Enter leave manager name"
                    value={formData.leaveManager}
                    onChange={(e) => setFormData({ ...formData, leaveManager: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceManager">Attendance Manager for Ignite</Label>
                  <Input
                    id="attendanceManager"
                    placeholder="Enter attendance manager name"
                    value={formData.attendanceManager}
                    onChange={(e) => setFormData({ ...formData, attendanceManager: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgcRequired">BGC Required</Label>
                  <Select value={formData.bgcRequired} onValueChange={(value) => setFormData({ ...formData, bgcRequired: value })}>
                    <SelectTrigger id="bgcRequired" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Compensation & Benefits */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-sm mb-4">Compensation & Benefits</h3>
              <div className="grid grid-cols-2 gap-4">
                {formData.emailRequired === 'Yes' && <div className="space-y-2">
                  <Label htmlFor="payGroup">Pay Group (7th / 25th)</Label>
                  <Input
                    id="payGroup"
                    placeholder="Enter pay group"
                    value={formData.payGroup}
                    onChange={(e) => setFormData({ ...formData, payGroup: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>}
                <div className="space-y-2">
                  <Label htmlFor="parkingAllowance">Parking Allowance (With Conditions)</Label>
                  <Select value={formData.parkingAllowance} onValueChange={(value) => setFormData({ ...formData, parkingAllowance: value })}>
                    <SelectTrigger id="parkingAllowance" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attendanceAwards">Attendance Awards</Label>
                  <Select value={formData.attendanceAwards} onValueChange={(value) => setFormData({ ...formData, attendanceAwards: value })}>
                    <SelectTrigger id="attendanceAwards" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftAllowance">Shift Allowance</Label>
                  <Select value={formData.shiftAllowance} onValueChange={(value) => setFormData({ ...formData, shiftAllowance: value })}>
                    <SelectTrigger id="shiftAllowance" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overtimePay">Overtime Pay</Label>
                  <Select value={formData.overtimePay} onValueChange={(value) => setFormData({ ...formData, overtimePay: value })}>
                    <SelectTrigger id="overtimePay" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualLeave">Annual leave / Year</Label>
                  <Select value={formData.annualLeave} onValueChange={(value) => setFormData({ ...formData, annualLeave: value })}>
                    <SelectTrigger id="annualLeave" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
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
                    <SelectTrigger id="workPassRequired" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
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
                      readOnly={viewOnly}
                      disabled={viewOnly}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="emailRequired">Email Required</Label>
                  <Select value={formData.emailRequired} onValueChange={(value) => setFormData({ ...formData, emailRequired: value, emailNameCreation: value === 'Yes' ? formData.emailNameCreation : '' })}>
                    <SelectTrigger id="emailRequired" disabled={viewOnly}>
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="N/A">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.emailRequired === 'Yes' && <div className="space-y-2">
                  <Label htmlFor="emailNameCreation">Email Name Creation</Label>
                  <Input
                    id="emailNameCreation"
                    placeholder="Enter email name"
                    value={formData.emailNameCreation}
                    onChange={(e) => setFormData({ ...formData, emailNameCreation: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>}
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
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cccName">CCC Name</Label>
                  <Input
                    id="cccName"
                    placeholder="Enter CCC name"
                    value={formData.cccName}
                    onChange={(e) => setFormData({ ...formData, cccName: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cccNo">CCC No.</Label>
                  <Input
                    id="cccNo"
                    placeholder="Enter CCC number"
                    value={formData.cccNo}
                    onChange={(e) => setFormData({ ...formData, cccNo: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pidNo">PID No.</Label>
                  <Input
                    id="pidNo"
                    placeholder="Enter PID number"
                    value={formData.pidNo}
                    onChange={(e) => setFormData({ ...formData, pidNo: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="resumeSource">Resume Source</Label>
                  <Input
                    id="resumeSource"
                    placeholder="e.g., myCareerFuture, Job Portal, Agency, Referral"
                    value={formData.resumeSource}
                    onChange={(e) => setFormData({ ...formData, resumeSource: e.target.value })}
                    readOnly={viewOnly}
                    disabled={viewOnly}
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
                <ReadOnlyField label="Employee Name" value={selectedMatrix.candidateName} />
                <ReadOnlyField label="Job Title" value={selectedMatrix.position} />
                <ReadOnlyField label="Start Date" value={selectedMatrix.interviewDate} />
                <ReadOnlyField label="Department" value={selectedMatrix.department} />
                <ReadOnlyField label="Basic Salary" value={selectedMatrix.salary} />
                <ReadOnlyField label="Submitted By" value={selectedMatrix.requestedBy} />
                <ReadOnlyField label="Submission Date" value={selectedMatrix.requestedDate} />
                <ReadOnlyField label="Employment Details" value={selectedMatrix.hiringManagerRemark} />
              </div>

              {Object.keys(parsedRecruiterRemark || {}).length > 0 && (
                <div>
                  <h4 className="font-semibold mt-4">Hiring Manager / Recruiter Details (Read Only)</h4>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <ReadOnlyField label="Billable" value={(parsedRecruiterRemark as any).billable} />
                    <ReadOnlyField label="Work Location" value={(parsedRecruiterRemark as any).workLocation} />
                    <ReadOnlyField label="Working Time" value={(parsedRecruiterRemark as any).workingTime} />
                    <ReadOnlyField label="Workday Pattern" value={(parsedRecruiterRemark as any).workdayPattern} />
                    <ReadOnlyField label="Job Grade" value={(parsedRecruiterRemark as any).jobGrade} />
                    <ReadOnlyField label="Hire Type" value={(parsedRecruiterRemark as any).hireType} />
                    <ReadOnlyField label="BGC Required" value={(parsedRecruiterRemark as any).bgcRequired} />
                    <ReadOnlyField label="Reporting Manager" value={(parsedRecruiterRemark as any).reportingManager} />
                    <ReadOnlyField label="Leave Manager" value={(parsedRecruiterRemark as any).leaveManager} />
                    <ReadOnlyField label="Attendance Manager" value={(parsedRecruiterRemark as any).attendanceManager} />
                    <ReadOnlyField label="Pay Group" value={(parsedRecruiterRemark as any).payGroup} />
                    <ReadOnlyField label="Parking Allowance" value={(parsedRecruiterRemark as any).parkingAllowance} />
                    <ReadOnlyField label="Attendance Awards" value={(parsedRecruiterRemark as any).attendanceAwards} />
                    <ReadOnlyField label="Shift Allowance" value={(parsedRecruiterRemark as any).shiftAllowance} />
                    <ReadOnlyField label="Overtime Pay" value={(parsedRecruiterRemark as any).overtimePay} />
                    <ReadOnlyField label="Annual Leave" value={(parsedRecruiterRemark as any).annualLeave} />
                    <ReadOnlyField label="CCC Name" value={(parsedRecruiterRemark as any).cccName} />
                    <ReadOnlyField label="CCC No" value={(parsedRecruiterRemark as any).cccNo} />
                    <ReadOnlyField label="PID No" value={(parsedRecruiterRemark as any).pidNo} />
                    <ReadOnlyField label="Resume Source" value={(parsedRecruiterRemark as any).resumeSource} />
                    <ReadOnlyField label="Work Pass Type" value={(parsedRecruiterRemark as any).workPassType || getHiringManagerField('workPassType')} />
                    <ReadOnlyField label="Email Name" value={(parsedRecruiterRemark as any).emailNameCreation} />
                  </div>
                </div>
              )}
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
