import { getApps, initializeApp } from "firebase/app";
import { addDoc, collection, getDocs, getFirestore, query, serverTimestamp, where } from "firebase/firestore";

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

export const db = getFirestore(app);
export const JOB_POSITION_COLLECTION = "job_position";

export async function createOpenJobPosition({
  createdBy,
  department,
  position,
  requiredCandidates,
  salaryRange,
}) {
  const payload = {
    Created_by: createdBy,
    Created_date: serverTimestamp(),
    Department: department,
    Position: position,
    Required_Candidate: requiredCandidates,
    Status: true,
    salary_range: salaryRange,
  };

  const documentReference = await addDoc(collection(db, JOB_POSITION_COLLECTION), payload);
  return documentReference.id;
}

export async function listOpenJobPositions() {
  const snapshot = await getDocs(query(collection(db, JOB_POSITION_COLLECTION), where("Status", "==", true)));

  return snapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    ...documentSnapshot.data(),
  }));
}