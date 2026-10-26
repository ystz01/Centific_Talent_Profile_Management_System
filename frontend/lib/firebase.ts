import { getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, onSnapshot, query, serverTimestamp, Timestamp, deleteDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Role } from '@/types';

const requiredFirebaseEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to frontend/.env.local and restart the Next.js development server.`,
    );
  }

  return value;
};

const firebaseConfig = {
  apiKey: requiredFirebaseEnv(
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  ),
  authDomain: requiredFirebaseEnv(
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),
  projectId: requiredFirebaseEnv(
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  ),
  storageBucket: requiredFirebaseEnv(
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ),
  messagingSenderId: requiredFirebaseEnv(
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),
  appId: requiredFirebaseEnv(
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  ),
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const userManagementApp =
  getApps().find((candidate) => candidate.name === 'user-management') ??
  initializeApp(firebaseConfig, 'user-management');

export const db = getFirestore(app);
export const auth = getAuth(app);
const userManagementAuth = getAuth(userManagementApp);
export const JOB_POSITION_COLLECTION = 'job_position';
export const USERS_COLLECTION = 'users';
export const CANDIDATES_COLLECTION = 'candidates';
export const SHORTLISTED_POOL_COLLECTION = 'shortlisted_pool';
export const INTERVIEWS_COLLECTION = 'interviews';
export const HIRING_MATRIX_COLLECTION = 'hiring_matrix';

export type FirestoreJobPosition = {
  Created_by: string;
  Created_date?: Timestamp | null;
  Department: string;
  Position: string;
  Required_Candidate: number;
  Status: boolean;
  salary_range: string;
  skillsNeeded?: string[];
};

export type FirestoreUserProfile = {
  name?: string;
  email?: string;
  role?: string;
  roles?: string;
};

export type FirestoreCandidate = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  education_level?: string | null;
  highest_education?: string | null;
  skills?: string[] | null;
  work_history?: Array<{ role?: string | null; company?: string | null; duration?: string | null }> | null;
  years_of_experience?: number | null;
  resume_url?: string | null;
  linkedin?: string | null;
  github?: string | null;
  languages?: string[] | null;
  projects?: Array<{ title?: string | null; description?: string | null }> | null;
  leadership_activities?: string[] | null;
  awards?: string[] | null;
  status?: string | null;
  created_at?: string | null;
  recruiter_notes?: Array<{ name?: string | null; note?: string | null }> | null;
  hiringmanager_notes?: Array<{ name?: string | null; note?: string | null }> | null;
  departmentmanager_notes?: Array<{ name?: string | null; note?: string | null }> | null;
};

export type FirestoreShortlistedCandidate = {
  candidateId?: string;
  candidateName?: string;
  email?: string;
  phone?: string;
  jobId?: string;
  jobName?: string;
  fitScore?: number | null;
  strength?: string | null;
  weakness?: string | null;
  recruiterRemark?: string;
  hiringManagerRemark?: string;
  status?: string;
  hiringManagerDecision?: string;
  position?: string;
};

export type InterviewRemark = {
  name: string;
  remark: string;
};

export type FirestoreInterview = {
  candidateId?: string;
  jobId?: string;
  candidateName?: string;
  phone?: string;
  email?: string;
  position?: string;
  interviewer?: string;
  interview_status?: 'pending' | 'accept' | 'reject' | '2nd Interview' | 'KIV';
  hiring_matrix_creation?: 'yes' | 'no';
  reject_reason?: string | null;
  interview_datetime?: string | null;
  interview_type?: 'Technical Interview' | 'Phone Interview' | 'HR Interview' | 'Final Interview' | null;
  recruiter_remark?: InterviewRemark[] | null;
  hiringmanager_remark?: InterviewRemark[] | null;
  departmentmanager_remark?: InterviewRemark[] | null;
  createdAt?: Timestamp | null;
};

export type FirestoreHiringMatrix = {
  candidate_id?: string;
  employee_name?: string;
  job_title?: string;
  start_date?: string;
  employment_type?: string;
  current_contract_end_date?: string | null;
  billable_status?: string;
  basic_salary_offered?: string;
  hire_type?: string;
  work_location?: string;
  working_time?: string;
  workday_shift_pattern?: string;
  job_grade?: string | null;
  candidate_personal_email?: string;
  candidate_mobile_number?: string;
  reporting_manager?: string;
  leave_manager?: string;
  attendance_manager?: string;
  bgc_required?: string;
  pay_group?: string;
  attendance_awards?: string;
  overtime_pay?: string;
  parking_allowance?: string;
  shift_allowance?: string;
  annual_leave?: string;
  apply_work_pass_required?: string;
  pass_type?: string | null;
  email_required?: string;
  email_name_creation?: string | null;
  department_name?: string;
  ccc_no?: string | null;
  ccc_name?: string | null;
  pid_no?: string | null;
  resume_source?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  created_by?: string;
  created_at?: Timestamp | null;
  approved_by?: string | null;
  approved_at?: Timestamp | null;
};

export type CandidateNote = {
  name: string;
  note: string;
};

export function normalizeRole(role?: string | null): Role | null {
  if (!role) {
    return null;
  }

  const normalizedRole = role.trim().toLowerCase();

  if (normalizedRole === 'recruiter') return 'Recruiter';
  if (normalizedRole === 'super admin') return 'Super Admin';
  if (normalizedRole === 'department manager') return 'Department Manager';
  if (normalizedRole === 'hiring manager') return 'Hiring Manager';

  return null;
}

export async function createJobPosition(payload: {
  createdBy: string;
  department: string;
  position: string;
  requiredCandidates: number;
  salaryRange: string;
  skillsNeeded: string[];
}) {
  const documentReference = await addDoc(collection(db, JOB_POSITION_COLLECTION), {
    Created_by: payload.createdBy,
    Created_date: serverTimestamp(),
    Department: payload.department,
    Position: payload.position,
    Required_Candidate: payload.requiredCandidates,
    Status: true,
    salary_range: payload.salaryRange,
    skillsNeeded: payload.skillsNeeded,
  });

  return documentReference.id;
}

export async function updateJobPosition(
  jobId: string,
  payload: {
    department: string;
    position: string;
    requiredCandidates: number;
    salaryRange: string;
    skillsNeeded: string[];
  }
) {
  await updateDoc(doc(db, JOB_POSITION_COLLECTION, jobId), {
    Department: payload.department,
    Position: payload.position,
    Required_Candidate: payload.requiredCandidates,
    salary_range: payload.salaryRange,
    skillsNeeded: payload.skillsNeeded,
  });
}

export async function updateJobPositionStatus(jobId: string, status: boolean) {
  await updateDoc(doc(db, JOB_POSITION_COLLECTION, jobId), {
    Status: status,
  });
}

export async function fetchJobPositions() {
  const snapshot = await getDocs(query(collection(db, JOB_POSITION_COLLECTION)));

  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...(documentSnapshot.data() as FirestoreJobPosition),
  }));
}

export function subscribeToJobPositions(onChange: (jobs: Array<FirestoreJobPosition & { id: string }>) => void) {
  return onSnapshot(query(collection(db, JOB_POSITION_COLLECTION)), (snapshot) => {
    onChange(
      snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...(documentSnapshot.data() as FirestoreJobPosition),
      }))
    );
  });
}

export function subscribeToOpenJobPositions(onChange: (jobs: Array<FirestoreJobPosition & { id: string }>) => void, onError?: (error: Error) => void) {
  return onSnapshot(
    query(collection(db, JOB_POSITION_COLLECTION)),
    (snapshot) => {
      onChange(snapshot.docs
        .map((documentSnapshot) => ({ id: documentSnapshot.id, ...(documentSnapshot.data() as FirestoreJobPosition) }))
        .filter((job) => job.Status === true));
    },
    (error) => onError?.(error)
  );
}

export async function firebaseSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function firebaseSendPasswordResetEmail(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function firebaseSignOut() {
  return signOut(auth);
}

export async function fetchUserProfileById(userId: string) {
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, userId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as FirestoreUserProfile),
  };
}

export async function fetchUsersCollection() {
  const snapshot = await getDocs(query(collection(db, USERS_COLLECTION)));

  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...(documentSnapshot.data() as FirestoreUserProfile),
  }));
}

export function subscribeToUsersCollection(onChange: (users: Array<FirestoreUserProfile & { id: string }>) => void) {
  return onSnapshot(query(collection(db, USERS_COLLECTION)), (snapshot) => {
    onChange(
      snapshot.docs.map((documentSnapshot) => ({
        id: documentSnapshot.id,
        ...(documentSnapshot.data() as FirestoreUserProfile),
      }))
    );
  });
}

export async function upsertUserProfile(userId: string, payload: FirestoreUserProfile) {
  await setDoc(doc(db, USERS_COLLECTION, userId), payload, { merge: true });
}

export async function createUserProfile(payload: FirestoreUserProfile) {
  const documentReference = await addDoc(collection(db, USERS_COLLECTION), payload);
  return documentReference.id;
}

async function callUserAccountApi(path: string, options: RequestInit) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const token = await auth.currentUser?.getIdToken();
  if (!apiUrl || !token) {
    throw new Error('User account service is not configured or you are signed out.');
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'The user account API is not available on the configured backend. Deploy the latest backend service and try again.'
      );
    }
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail || 'User account request failed.');
  }

  return response.json();
}

export async function createUserAccount(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const credential = await createUserWithEmailAndPassword(
    userManagementAuth,
    payload.email.trim().toLowerCase(),
    payload.password
  );

  try {
    await setDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      roles: payload.role,
    });
    return { id: credential.user.uid };
  } catch (error) {
    await credential.user.delete();
    throw error;
  } finally {
    await signOut(userManagementAuth);
  }
}

export async function deleteUserAccount(userId: string, email?: string) {
  return callUserAccountApi('/api/users', {
    method: 'DELETE',
    body: JSON.stringify({ user_id: userId, email }),
  });
}

export async function deleteUserProfile(userId: string) {
  await deleteDoc(doc(db, USERS_COLLECTION, userId));
}

export async function updateCurrentUserProfile(name: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('You must be signed in to update your profile.');
  }

  const trimmedName = name.trim();
  await updateProfile(currentUser, { displayName: trimmedName });
  await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), { name: trimmedName }, { merge: true });
}

export async function changeCurrentUserPassword(currentPassword: string, newPassword: string) {
  const currentUser = auth.currentUser;
  if (!currentUser?.email) {
    throw new Error('You must be signed in with an email and password to change your password.');
  }

  const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
  await reauthenticateWithCredential(currentUser, credential);
  await updatePassword(currentUser, newPassword);
}

export async function fetchCandidatesCollection() {
  const snapshot = await getDocs(query(collection(db, CANDIDATES_COLLECTION)));

  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...(documentSnapshot.data() as FirestoreCandidate),
  }));
}

export async function updateCandidateProfile(
  candidateId: string,
  payload: Partial<FirestoreCandidate>
) {
  await updateDoc(doc(db, CANDIDATES_COLLECTION, candidateId), payload);
}

export async function updateCandidateStatus(candidateId: string, status: string) {
  await updateCandidateProfile(candidateId, { status });
}

export async function updateCandidateNotes(
  candidateId: string,
  role: 'recruiter' | 'hiringmanager' | 'departmentmanager',
  actorName: string,
  note: CandidateNote | null
) {
  const candidateReference = doc(db, CANDIDATES_COLLECTION, candidateId);
  const snapshot = await getDoc(candidateReference);
  const data = snapshot.data() as FirestoreCandidate | undefined;
  const field = role === 'recruiter'
    ? 'recruiter_notes'
    : role === 'hiringmanager'
      ? 'hiringmanager_notes'
      : 'departmentmanager_notes';
  const existing = data?.[field] ?? [];
  const withoutCurrentUser = existing.filter((entry) => entry.name !== actorName);

  await updateDoc(candidateReference, {
    [field]: note ? [...withoutCurrentUser, note] : withoutCurrentUser,
  });
}

export function subscribeToCandidatesCollection(
  onChange: (candidates: Array<FirestoreCandidate & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, CANDIDATES_COLLECTION)),
    (snapshot) => {
      onChange(
        snapshot.docs.map((documentSnapshot) => ({
          id: documentSnapshot.id,
          ...(documentSnapshot.data() as FirestoreCandidate),
        }))
      );
    },
    (error) => onError?.(error)
  );
}

export async function addToShortlistedPool(payload: {
  candidate: FirestoreCandidate & { id: string };
  jobId: string;
  jobName: string;
  fitScore?: number;
  strengths?: string[];
  gaps?: string[];
}) {
  const documentReference = doc(collection(db, SHORTLISTED_POOL_COLLECTION));
  const batch = writeBatch(db);

  batch.set(documentReference, {
    candidateId: payload.candidate.id,
    candidateName: payload.candidate.name ?? '',
    email: payload.candidate.email ?? '',
    phone: payload.candidate.phone ?? '',
    jobId: payload.jobId,
    jobName: payload.jobName,
    position: payload.jobName,
    fitScore: payload.fitScore ?? null,
    recruiterRemark: null,
    hiringManagerRemark: null,
    strength: payload.strengths?.join('. ') ?? null,
    weakness: payload.gaps?.join('. ') ?? null,
    status: 'Pending',
    hiringManagerDecision: 'Pending',
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, CANDIDATES_COLLECTION, payload.candidate.id), {
    status: 'pending shortlisted',
  });
  await batch.commit();

  return documentReference.id;
}

export function subscribeToShortlistedPool(
  onChange: (candidates: Array<FirestoreShortlistedCandidate & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, SHORTLISTED_POOL_COLLECTION)),
    (snapshot) => {
      onChange(
        snapshot.docs.map((documentSnapshot) => ({
          id: documentSnapshot.id,
          ...(documentSnapshot.data() as FirestoreShortlistedCandidate),
        }))
      );
    },
    (error) => onError?.(error)
  );
}

export async function updateShortlistedDecision(
  id: string,
  decision: 'Approve to Hire' | 'Reject',
  candidate?: FirestoreShortlistedCandidate & { id: string }
) {
  if (!candidate?.candidateId) {
    throw new Error('The shortlisted candidate is missing its candidate ID.');
  }

  const batch = writeBatch(db);
  batch.update(doc(db, SHORTLISTED_POOL_COLLECTION, id), {
    status: decision === 'Approve to Hire' ? 'Approved' : 'Rejected',
    hiringManagerDecision: decision,
  });
  batch.update(doc(db, CANDIDATES_COLLECTION, candidate.candidateId), {
    status: decision === 'Approve to Hire' ? 'pending interview' : 'active',
  });
  await batch.commit();

  if (decision === 'Approve to Hire' && candidate) {
    await createInterviewForApprovedCandidate(candidate);
  }
}

export async function createInterviewForApprovedCandidate(candidate: FirestoreShortlistedCandidate & { id: string }) {
  const interviewQuery = query(collection(db, INTERVIEWS_COLLECTION));
  const existing = await getDocs(interviewQuery);
  const alreadyExists = existing.docs.some((item) => {
    const interview = item.data() as FirestoreInterview;

    if (interview.candidateId !== candidate.candidateId) {
      return false;
    }

    // Older interview records do not have jobId, so use their position as a
    // compatibility fallback while keeping applications for different jobs separate.
    return interview.jobId
      ? interview.jobId === candidate.jobId
      : interview.position === (candidate.position ?? candidate.jobName);
  });
  if (alreadyExists) return;

  await addDoc(collection(db, INTERVIEWS_COLLECTION), {
    candidateId: candidate.candidateId ?? '',
    jobId: candidate.jobId ?? '',
    candidateName: candidate.candidateName ?? '',
    position: candidate.position ?? candidate.jobName ?? '',
    interviewer: '',
    interview_status: 'pending',
    hiring_matrix_creation: 'no',
    interview_datetime: null,
    interview_type: null,
    recruiter_remark: [],
    hiringmanager_remark: [],
    departmentmanager_remark: [],
    createdAt: serverTimestamp(),
  });
}

export function subscribeToInterviews(
  onChange: (interviews: Array<FirestoreInterview & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, INTERVIEWS_COLLECTION)),
    (snapshot) => onChange(snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as FirestoreInterview),
    }))),
    (error) => onError?.(error)
  );
}

export async function scheduleInterview(
  interviewId: string,
  payload: {
    interview_datetime: string;
    interview_type: NonNullable<FirestoreInterview['interview_type']>;
    interviewer: string;
  }
) {
  await updateDoc(doc(db, INTERVIEWS_COLLECTION, interviewId), {
    ...payload,
    interview_status: 'pending',
  });
}

export async function updateInterviewDecision(
  interviewId: string,
  decision: NonNullable<FirestoreInterview['interview_status']>,
  rejectReason?: string
) {
  await updateDoc(doc(db, INTERVIEWS_COLLECTION, interviewId), {
    interview_status: decision,
    ...(decision === 'accept' ? { hiring_matrix_creation: 'no' } : {}),
    reject_reason: decision === 'reject' ? rejectReason ?? null : null,
    ...(decision === '2nd Interview' ? { interview_datetime: null, interview_type: null } : {}),
  });
}

export async function markInterviewHiringMatrixCreated(interviewId: string) {
  await updateDoc(doc(db, INTERVIEWS_COLLECTION, interviewId), {
    hiring_matrix_creation: 'yes',
  });
}

export async function addInterviewRemark(
  interviewId: string,
  role: 'recruiter' | 'hiringmanager' | 'departmentmanager',
  entry: InterviewRemark
) {
  const interviewReference = doc(db, INTERVIEWS_COLLECTION, interviewId);
  const snapshot = await getDoc(interviewReference);
  const data = snapshot.data() as FirestoreInterview | undefined;
  const field = role === 'recruiter'
    ? 'recruiter_remark'
    : role === 'hiringmanager'
      ? 'hiringmanager_remark'
      : 'departmentmanager_remark';
  const remarks = data?.[field] ?? [];

  await updateDoc(interviewReference, {
    [field]: [...remarks, entry],
  });
}

export async function updateInterviewRemark(
  interviewId: string,
  role: 'recruiter' | 'hiringmanager' | 'departmentmanager',
  index: number,
  entry: InterviewRemark
) {
  const interviewReference = doc(db, INTERVIEWS_COLLECTION, interviewId);
  const snapshot = await getDoc(interviewReference);
  const data = snapshot.data() as FirestoreInterview | undefined;
  const field = role === 'recruiter'
    ? 'recruiter_remark'
    : role === 'hiringmanager'
      ? 'hiringmanager_remark'
      : 'departmentmanager_remark';
  const remarks = [...(data?.[field] ?? [])];
  if (!remarks[index]) {
    throw new Error('Remark not found.');
  }
  remarks[index] = entry;
  await updateDoc(interviewReference, { [field]: remarks });
}

export function subscribeToHiringMatrices(
  onChange: (matrices: Array<FirestoreHiringMatrix & { id: string }>) => void,
  onError?: (error: Error) => void
) {
  return onSnapshot(
    query(collection(db, HIRING_MATRIX_COLLECTION)),
    (snapshot) => onChange(snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as FirestoreHiringMatrix),
    }))),
    (error) => onError?.(error)
  );
}

export async function createHiringMatrix(payload: Omit<FirestoreHiringMatrix, 'created_at' | 'approval_status'>) {
  const documentReference = await addDoc(collection(db, HIRING_MATRIX_COLLECTION), {
    ...payload,
    approval_status: 'pending',
    created_at: serverTimestamp(),
  });
  return documentReference.id;
}

export async function updateHiringMatrix(
  matrixId: string,
  payload: Omit<FirestoreHiringMatrix, 'created_at' | 'approval_status'>
) {
  await updateDoc(doc(db, HIRING_MATRIX_COLLECTION, matrixId), {
    ...payload,
    approval_status: 'pending',
    rejection_reason: null,
    approved_by: null,
    approved_at: null,
  });
}

export async function updateHiringMatrixApproval(
  matrixId: string,
  approvalStatus: 'approved' | 'rejected',
  actorName: string,
  rejectionReason?: string
) {
  await updateDoc(doc(db, HIRING_MATRIX_COLLECTION, matrixId), {
    approval_status: approvalStatus,
    ...(approvalStatus === 'approved'
      ? { approved_by: actorName, approved_at: serverTimestamp(), rejection_reason: null }
      : { rejection_reason: rejectionReason ?? null }),
  });
}