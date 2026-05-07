import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const isConfigValid = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "";

const app = isConfigValid 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig as any) : getApp())
  : null;

// @ts-ignore
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null as any;
export const auth = app ? getAuth(app) : null as any;

async function testConnection() {
  if (!app || !isConfigValid) {
    console.warn("Firebase not initialized: Missing or invalid API key in firebase-applet-config.json");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message?.includes('offline') || error.message?.includes('permission')) {
      console.warn("Firestore connection check failed.");
    }
  }
}
testConnection();
