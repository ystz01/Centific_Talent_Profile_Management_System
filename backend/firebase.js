// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUkRHBdy_gvLx7-DXfLpYXGRMhxHegGB8",
  authDomain: "centifictpms.firebaseapp.com",
  projectId: "centifictpms",
  storageBucket: "centifictpms.firebasestorage.app",
  messagingSenderId: "33543603282",
  appId: "1:33543603282:web:93918a26c2461e4fbf8b8b",
  measurementId: "G-F590VDVDS4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);