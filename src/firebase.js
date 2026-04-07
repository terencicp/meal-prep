import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getFirestore } from "firebase/firestore";

// Replace these placeholders with your Firebase project settings.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0,
);

const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;
const hasRecaptchaSiteKey =
  typeof recaptchaSiteKey === "string" && recaptchaSiteKey.trim().length > 0;

let auth = null;
let db = null;
let app = null;
let authDependenciesPromise = null;
let isAppCheckInitialized = false;

if (hasFirebaseConfig) {
  app = initializeApp(firebaseConfig);

  db = getFirestore(app);
} else {
  console.warn(
    "Firebase config is missing. Running in local-only mode until VITE_FIREBASE_* env vars are provided.",
  );
}

async function loadFirebaseAuth() {
  if (!hasFirebaseConfig || !app) {
    return null;
  }

  if (!isAppCheckInitialized) {
    if (hasRecaptchaSiteKey) {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } else {
      console.warn(
        "VITE_RECAPTCHA_V3_SITE_KEY is missing. Firebase App Check is disabled.",
      );
    }

    isAppCheckInitialized = true;
  }

  if (!authDependenciesPromise) {
    authDependenciesPromise = import("firebase/auth")
      .then((authModule) => {
        auth = authModule.getAuth(app);

        return {
          auth,
          googleProvider: new authModule.GoogleAuthProvider(),
          onAuthStateChanged: authModule.onAuthStateChanged,
          signInWithPopup: authModule.signInWithPopup,
          signOut: authModule.signOut,
        };
      })
      .catch((error) => {
        authDependenciesPromise = null;
        console.error("Failed to lazy-load Firebase Authentication:", error);
        return null;
      });
  }

  return authDependenciesPromise;
}

export { db, loadFirebaseAuth };
