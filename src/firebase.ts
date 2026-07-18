import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';


// Use the current host as authDomain to route through the express proxy
// This avoids third-party cookie blocking on iOS/PWAs
const config = {
  ...firebaseConfig,
  authDomain: firebaseConfig.authDomain
};
const app = initializeApp(config);

export const db = initializeFirestore(app, { 
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
