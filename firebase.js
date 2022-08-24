// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBVbrOgLXw-zGVNr_1E20eXJEXvh0Cr-Yo",
  authDomain: "redrover-2c5f6.firebaseapp.com",
  projectId: "redrover-2c5f6",
  storageBucket: "redrover-2c5f6.appspot.com",
  messagingSenderId: "720603590863",
  appId: "1:720603590863:web:e643c5d73f4da6738987ba",
  measurementId: "G-HYZNVEKYFN",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const askForConfirmation = (email) => {
  sendEmailVerification();
};

// // TODO: create an error handler for this function
const handleSignup = (email, password) => {
  
};

export { handleSignup };
