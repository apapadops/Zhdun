import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AIGovernanceCase, ProjectStatus } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  const errorJson = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorJson);
  throw new Error(errorJson);
}

const COLLECTION_PATH = 'ai_governance_cases';

export const governanceService = {
  async saveCase(caseData: AIGovernanceCase) {
    if (!auth || !auth.currentUser || !db) return;
    
    const path = `${COLLECTION_PATH}/${caseData.id}`;
    try {
      const dataToSave = {
        ...caseData,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };
      // If it has created_at as string, we keep it but ensure server consistency if needed
      await setDoc(doc(db, COLLECTION_PATH, caseData.id), dataToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateCase(id: string, updates: Partial<AIGovernanceCase>) {
    if (!db) return;
    const path = `${COLLECTION_PATH}/${id}`;
    try {
      await updateDoc(doc(db, COLLECTION_PATH, id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getCase(id: string) {
    if (!db) return null;
    const path = `${COLLECTION_PATH}/${id}`;
    try {
      const docSnap = await getDoc(doc(db, COLLECTION_PATH, id));
      return docSnap.exists() ? docSnap.data() as AIGovernanceCase : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToCases(callback: (cases: AIGovernanceCase[]) => void) {
    if (!auth || !auth.currentUser || !db) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTION_PATH), 
      where('userId', '==', auth.currentUser.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => doc.data() as AIGovernanceCase);
      callback(cases);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
    });
  }
};
