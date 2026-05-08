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
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UnifiedCase, ProjectStatus } from '../types';

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

const COLLECTION_PATH = 'unified_cases';

export const unifiedService = {
  async saveCase(caseData: UnifiedCase) {
    if (!auth || !auth.currentUser || !db) return;
    
    const path = `${COLLECTION_PATH}/${caseData.id}`;
    try {
      const dataToSave = {
        ...caseData,
        userId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, COLLECTION_PATH, caseData.id), dataToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateCase(id: string, updates: Partial<UnifiedCase>) {
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
      return docSnap.exists() ? docSnap.data() as UnifiedCase : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /** Subscribe to all cases (Admin view) */
  subscribeToAllCases(callback: (cases: UnifiedCase[]) => void) {
    if (!db) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTION_PATH), 
      orderBy('created_at', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => doc.data() as UnifiedCase);
      callback(cases);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
    });
  },

  /** Subscribe to cases for the current user only (Requestor view) */
  subscribeToMyCases(callback: (cases: UnifiedCase[]) => void) {
    if (!auth || !auth.currentUser || !db) {
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, COLLECTION_PATH), 
      where('userId', '==', auth.currentUser.uid),
      orderBy('created_at', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const cases = snapshot.docs.map(doc => doc.data() as UnifiedCase);
      callback(cases);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_PATH);
    });
  }
};
