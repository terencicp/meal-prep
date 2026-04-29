import { useRef, useState, useCallback } from "react";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  getDocs,
} from "firebase/firestore";
import { db, loadFirebaseAuth } from "../firebase";

export function useSyncTracker() {
  const [trackerSync, setTrackerSync] = useState({
    isLoading: false,
    error: null,
  });
  const [trackerHistory, setTrackerHistory] = useState({});
  const authRuntimeRef = useRef(null);

  const ensureAuthReady = async () => {
    if (authRuntimeRef.current) {
      return authRuntimeRef.current;
    }
    const authDependencies = await loadFirebaseAuth();
    return authDependencies;
  };

  const syncTrackerToFirebase = async (dateKey, summary) => {
    if (!db) return false;

    const authDependencies = await ensureAuthReady();
    if (!authDependencies?.auth?.currentUser) return false;

    const userId = authDependencies.auth.currentUser.uid;
    const trackerRef = doc(db, "users", userId, "tracker", dateKey);

    try {
      await setDoc(trackerRef, {
        dateKey,
        completionPercentage: summary.completionPercentage,
        totalItems: summary.totalItems,
        checkedItems: summary.checkedItems,
        byMeal: summary.byMeal,
        updatedAt: serverTimestamp(),
      });

      setTrackerHistory((prev) => ({
        ...prev,
        [dateKey]: summary,
      }));

      return true;
    } catch (error) {
      console.error("Failed to sync tracker to Firebase:", error);
      setTrackerSync((prev) => ({ ...prev, error }));
      return false;
    }
  };

  const loadTrackerHistory = useCallback(async () => {
    if (!db) return null;

    const authDependencies = await ensureAuthReady();
    if (!authDependencies?.auth?.currentUser) return null;

    setTrackerSync((prev) => ({ ...prev, isLoading: true }));
    const userId = authDependencies.auth.currentUser.uid;

    try {
      const trackerQuery = query(collection(db, "users", userId, "tracker"));
      const snapshot = await getDocs(trackerQuery);

      const history = {};
      snapshot.forEach((doc) => {
        history[doc.id] = doc.data();
      });

      setTrackerHistory(history);
      setTrackerSync((prev) => ({ ...prev, isLoading: false }));
      return history;
    } catch (error) {
      console.error("Failed to load tracker data:", error);
      setTrackerSync((prev) => ({ ...prev, isLoading: false, error }));
      return null;
    }
  }, []);

  return {
    syncTrackerToFirebase,
    loadTrackerHistory,
    trackerHistory,
    trackerSync,
  };
}
