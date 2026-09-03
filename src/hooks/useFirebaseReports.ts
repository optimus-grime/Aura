import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { SavedReport, ReportData } from '../types';

async function syncLatestMetrics(userId: string, reportData: ReportData) {
  try {
    const readinessScore = typeof reportData.readiness?.score === 'number' ? reportData.readiness.score : 70;
    const hrvBalanceMs = Math.round(40 + readinessScore * 0.4);
    const sleepHours = parseFloat((6.0 + (readinessScore / 30)).toFixed(1));
    const restingHeartRateBpm = Math.round(75 - readinessScore * 0.15);
    const statusLabel = readinessScore >= 75 ? 'Optimal' : readinessScore >= 45 ? 'Balanced' : 'Recovery Needed';

    const syncDocData = {
      readinessScore,
      hrvBalanceMs,
      sleepHours,
      restingHeartRateBpm,
      statusLabel,
      lastSyncedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', userId, 'sync', 'current'), syncDocData);
  } catch (error) {
    console.error('Error syncing latest metrics to sync/current:', error);
  }
}

export function useFirebaseReports() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try {
      const cached = localStorage.getItem('aura_cached_reports');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Error loading cached reports from localStorage:', e);
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If offline, don't wait for snapshot, use localStorage cache
    if (!navigator.onLine || !auth.currentUser) {
      setLoading(false);
      try {
        const cached = localStorage.getItem('aura_cached_reports');
        if (cached) {
          setSavedReports(JSON.parse(cached));
        }
      } catch (e) {}
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
          logDate: data.logDate || data.date?.split('T')[0],
          report: data.report
        });
      });
      setSavedReports(reports);
      localStorage.setItem('aura_cached_reports', JSON.stringify(reports));
      setLoading(false);

      if (reports.length > 0 && auth.currentUser) {
        syncLatestMetrics(auth.currentUser.uid, reports[0].report);
      }
    }, (error) => {
      console.error('Firestore snapshot error, falling back to local cache:', error);
      try {
        const cached = localStorage.getItem('aura_cached_reports');
        if (cached) {
          setSavedReports(JSON.parse(cached));
        }
      } catch (e) {}
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, `users/${auth.currentUser?.uid}/reports`);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  const saveReport = async (newReportData: ReportData, customDate?: string, logDate?: string) => {
    const reportId = crypto.randomUUID?.() || Date.now().toString();
    const resolvedLogDate = logDate || (customDate ? customDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    const newSaved: SavedReport = {
      id: reportId,
      date: customDate || new Date().toISOString(),
      logDate: resolvedLogDate,
      report: newReportData
    };

    // Update local state and cache immediately
    const updated = [newSaved, ...savedReports];
    setSavedReports(updated);
    try {
      localStorage.setItem('aura_cached_reports', JSON.stringify(updated));
    } catch (e) {}

    if (!navigator.onLine || !auth.currentUser) {
      console.log('Offline: saved report locally.');
      return;
    }

    try {
      const firestoreDoc = {
        userId: auth.currentUser.uid,
        date: newSaved.date,
        logDate: resolvedLogDate,
        report: newReportData,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid, 'reports', reportId), firestoreDoc);
      await syncLatestMetrics(auth.currentUser.uid, newReportData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser?.uid}/reports`);
    }
  };

  const deleteReport = async (id: string) => {
    const updated = savedReports.filter(r => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem('aura_cached_reports', JSON.stringify(updated));
    } catch (e) {}

    if (!auth.currentUser || !navigator.onLine) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'reports', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${auth.currentUser?.uid}/reports/${id}`);
    }
  };

  return { savedReports, loading, saveReport, deleteReport };
}
