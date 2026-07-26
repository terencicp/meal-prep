import { useRef, useState, useCallback } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
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

  const ensureAuthReady = useCallback(async () => {
    if (authRuntimeRef.current) {
      return authRuntimeRef.current;
    }
    const authDependencies = await loadFirebaseAuth();
    return authDependencies;
  }, []);

  // These are consumed as effect dependencies, so their identity has to stay
  // stable: an unmemoized version re-triggers the effect that calls it, which
  // loops forever.
  const syncTrackerToFirebase = useCallback(async (dateKey, summary) => {
    // Update the local view first: setDoc only resolves once the server
    // acknowledges the write, so awaiting it would leave the UI unresponsive
    // whenever the device is offline.
    setTrackerHistory((prev) => ({
      ...prev,
      [dateKey]: summary,
    }));

    if (!db) {
      console.warn("[tracker] no db instance; skipping write for", dateKey);
      return false;
    }

    const authDependencies = await ensureAuthReady();
    if (!authDependencies?.auth?.currentUser) {
      console.warn(
        "[tracker] no signed-in user at write time; skipping write for",
        dateKey,
        { hasDeps: Boolean(authDependencies) },
      );
      return false;
    }

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

      return true;
    } catch (error) {
      console.error("Failed to sync tracker to Firebase:", error);
      setTrackerSync((prev) => ({ ...prev, error }));
      return false;
    }
  }, [ensureAuthReady]);

  const clearTrackerDayInFirebase = useCallback(async (dateKey) => {
    setTrackerHistory((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });

    if (!db) {
      console.warn("[tracker] no db instance; skipping delete for", dateKey);
      return false;
    }

    const authDependencies = await ensureAuthReady();
    if (!authDependencies?.auth?.currentUser) {
      console.warn(
        "[tracker] no signed-in user at delete time; skipping delete for",
        dateKey,
      );
      return false;
    }

    const userId = authDependencies.auth.currentUser.uid;
    const trackerRef = doc(db, "users", userId, "tracker", dateKey);

    try {
      await deleteDoc(trackerRef);

      return true;
    } catch (error) {
      console.error("Failed to clear tracker day in Firebase:", error);
      setTrackerSync((prev) => ({ ...prev, error }));
      return false;
    }
  }, [ensureAuthReady]);

  const loadTrackerHistory = useCallback(async () => {
    if (!db) {
      console.warn("[tracker] no db instance; skipping history load");
      return null;
    }

    const authDependencies = await ensureAuthReady();
    if (!authDependencies?.auth?.currentUser) {
      console.warn("[tracker] no signed-in user at load time; skipping load");
      return null;
    }

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
  }, [ensureAuthReady]);

  return {
    syncTrackerToFirebase,
    clearTrackerDayInFirebase,
    loadTrackerHistory,
    trackerHistory,
    trackerSync,
  };
}
