import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { SavedReport, ReportData } from '../types';

export function useFirebaseReports() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'reports'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reports: SavedReport[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        reports.push({
          id: docSnap.id,
          date: data.date,
          report: data.report
        });
      });
      setSavedReports(reports);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/reports`);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const saveReport = async (newReportData: ReportData) => {
    if (!auth.currentUser) return;
    try {
      const reportId = crypto.randomUUID?.() || Date.now().toString();
      const newSaved = {
        userId: auth.currentUser.uid,
        date: new Date().toISOString(),
        report: newReportData,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'reports', reportId), newSaved);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/reports`);
    }
  };

  const deleteReport = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'reports', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser.uid}/reports/${id}`);
    }
  };

  return { savedReports, loading, saveReport, deleteReport };
}
