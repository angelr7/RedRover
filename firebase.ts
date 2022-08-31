// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  // TS throws an error for this import, but it's actually okay (for now)
  getReactNativePersistence,
  initializeAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User,
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

interface UserData {
  admin: boolean;
  createdAt: string;
  email: string;
  id: string;
  intakeSurvey: boolean;
}

interface PollData {
  title: string;
  description: string;
  previewImageURI: string;
  additionalInfo: string;
}

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
const initUser = async (email: string, password: string) => {
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

const getUserData = async (user: User, setUserData: any) => {
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

// initializes a poll after the client provides description information
const createPoll = async (userData: UserData, pollData: PollData) => {
  await addDoc(collection(db, "polls"), {
    ...pollData,
    author: userData.id,
    dateCreated: `${moment()}`,
    published: false,
  });
};

const getPolls = async (userID: string): Promise<PollData[]> => {
  const q = query(collection(db, "polls"), where("author", "==", userID));

  try {
    const queryResult = await getDocs(q);
    const pollData = [];
    queryResult.forEach((doc) => {
      pollData.push(doc.data());
    });
    return pollData;
  } catch (error) {} // do something here
};

export { initUser, db, auth, getUserData, createPoll, getPolls };
export type { UserData, PollData };
