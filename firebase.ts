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
  deleteDoc,
  setDoc,
  limit,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { AcceptedLabel } from "./components/PollTypeButton";

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

type AnswerVariant = "Free Response" | "Fixed Response";
interface Answer {
  answerType: AcceptedLabel;
  answerVariant: AnswerVariant;
  answerText: string;
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
  const res = await addDoc(collection(db, "polls"), {
    ...pollData,
    questions: [],
    author: userData.id,
    dateCreated: `${moment()}`,
    published: false,
  });

  const data = (await getDoc(res)).data();

  return data;
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

const removePoll = async (author: string, dateCreated: string) => {
  const q = query(
    collection(db, "polls"),
    where("author", "==", author),
    where("dateCreated", "==", dateCreated)
  );
  try {
    const queryResult = await getDocs(q);
    queryResult.forEach(async (document) => {
      await deleteDoc(doc(db, "polls", document.id));
    });
  } catch (error) {} // do something here
};

const editPoll = async (author: string, title: string, pollData: PollData) => {
  const q = query(
    collection(db, "polls"),
    where("author", "==", author),
    where("title", "==", title),
    limit(1)
  );
  try {
    const document = (await getDocs(q)).docs[0];
    const documentRef = doc(db, "polls", document.id);
    await updateDoc(documentRef, {
      ...pollData,
    });

    // we need to pass the updated doc so the new screen has all of its data
    return { ...(await getDoc(documentRef)).data(), ...pollData };
  } catch (error) {} // do something here
};

const createAnswer = async (
  author: string,
  dateCreated: string,
  answer: Answer
) => {
  const q = query(
    collection(db, "polls"),
    where("author", "==", author),
    where("dateCreated", "==", dateCreated),
    limit(1)
  );

  try {
    const result = (await getDocs(q)).docs;

    // throw stops execution, so no need for a return statement
    if (result.length === 0) throw "Poll not found!";

    const pollRef = result[0];
    const answerRef = await addDoc(
      collection(db, `polls/${pollRef.id}/answers`),
      answer
    );
    return (await getDoc(answerRef)).data();
  } catch (error) {
    console.log(error);
  }
};

export {
  initUser,
  db,
  auth,
  getUserData,
  createPoll,
  getPolls,
  removePoll,
  editPoll,
  createAnswer,
};
export type { UserData, PollData, Answer };
