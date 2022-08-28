// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFirestore,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

let moment = require("moment-timezone");

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
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// // TODO: create an error handler
const initUser = async (email, password) => {
  try {
    const { user } = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await sendEmailVerification(user);
    await addDoc(collection(db, "users"), {
      id: user.uid,
      email: email,
      intakeSurvey: false,
      createdAt: `${moment()}`,
      admin: false,
    });

    return "ok";
  } catch (error) {
    return error.code;
  }
};

const getUserData = async (user, setUserData) => {
  const q = query(
    collection(db, "users"),
    where("id", "==", user.uid),
    limit(1)
  );

  try {
    const queryResult = await getDocs(q);
    queryResult.forEach((userData) => {
      setUserData(userData.data());
    });
  } catch (error) {
    console.log(error);
  }
};

const makeAdminUser = async (documentID) => {
  const docRef = doc(db, "users", "y4zx6afeeRJVK88TfMTy");
  console.log(docRef);
};

export { initUser, db, auth, getUserData, makeAdminUser };
