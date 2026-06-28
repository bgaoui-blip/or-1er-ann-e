import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAsNLWgn-7j-w23FQ8cYdiDeTG4uem_ifM",
  authDomain: "gen-lang-client-0243364471.firebaseapp.com",
  projectId: "gen-lang-client-0243364471",
  storageBucket: "gen-lang-client-0243364471.firebasestorage.app",
  messagingSenderId: "84639122226",
  appId: "1:84639122226:web:9e08811973c2e76e94cd2b"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId
export const db = initializeFirestore(app, {}, "ai-studio-fe50a9cc-e8f3-4787-ab83-ba388d33384c");
