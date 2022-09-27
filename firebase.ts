import AsyncStorage from "@react-native-async-storage/async-storage";
import { Question } from "./screens/CreatePollScreen";
import { initializeApp } from "firebase/app";
import { AcceptedLabel } from "./components/PollTypeButton";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import {
  // TS throws an error for this import, but it's actually okay (for now)
  getReactNativePersistence,
  initializeAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  User,
} from "firebase/auth";
import {
  getFirestore,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  limit,
  doc,
  updateDoc,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
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

type MCAnswerVariant = "Free Response" | "Fixed Response";
type RankingAnswerVariant = "Text Ranking" | "Image Ranking";
type NumberAnswerVariant = "Percentage" | "Number";
type ImageSelectionVariant = "undefined";
type AnswerVariant =
  | MCAnswerVariant
  | RankingAnswerVariant
  | NumberAnswerVariant
  | ImageSelectionVariant;
interface Answer {
  answerType: AcceptedLabel;
  answerVariant: AnswerVariant;
  answerText: string;
  imageData?: Blob | undefined;
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
  let res = await addDoc(collection(db, "polls"), {
    title: pollData.title,
    description: pollData.description,
    additionalInfo: pollData.additionalInfo,
    previewImageURI: "",
    author: userData.id,
    dateCreated: `${moment()}`,
    published: false,
  });

  if (pollData.previewImageURI !== "") {
    const storage = getStorage();
    const imageRef = ref(storage, `${res.id}/previewImage`);
    try {
      const fetchedImage = await fetch(pollData.previewImageURI);
      const imageBytes = await fetchedImage.blob();

      // TODO: FIX RACE CONDITION
      console.log(JSON.stringify(imageBytes, null, 4));

      const upload = await uploadBytes(imageRef, imageBytes);
      const uploadResult = upload.ref;
      const uri = await getDownloadURL(uploadResult);
      pollData.previewImageURI = uri;
      await updateDoc(res, { previewImageURI: pollData.previewImageURI });
    } catch (error) {
      console.log(error);
    }
  }

  const data = (await getDoc(res)).data();

  return data;
};

const getPolls = async (userID: string): Promise<PollData[]> => {
  const q = query(collection(db, "polls"), where("author", "==", userID));
  try {
    const queryResult = await getDocs(q);
    const pollData = [];
    queryResult.forEach((doc) => {
      const docData = doc.data();
      docData.id = doc.id;
      pollData.push(docData);
    });
    return pollData;
  } catch (error) {} // do something here
};

const getQuestionFromData = (docRef: QueryDocumentSnapshot<DocumentData>) => {
  const { id } = docRef;
  const { answers, questionText, questionType } = docRef.data();
  return { answers, questionText, questionType, id };
};

const removePoll = async (
  pollID: string,
  hasPreviewImage: boolean,
  isPublished: boolean
) => {
  const deleteQuestions = async (
    docs: QueryDocumentSnapshot<DocumentData>[]
  ) => {
    for (const docRef of docs) {
      // makes it easier to access w/ TS
      const data: Question = getQuestionFromData(docRef);
      if (
        data.questionType === "Ranking" ||
        data.questionType === "Image Selection"
      )
        // must delete images from questions in the poll
        await deleteQuestion(pollID, data);
    }
  };

  try {
    const docs = (await getDocs(collection(db, `polls/${pollID}/questions`)))
      .docs;
    await deleteQuestions(docs);

    if (isPublished) {
      const docs = (await getDocs(collection(db, `polls/${pollID}/questions`)))
        .docs;
      await deleteQuestions(docs);
    }

    const pollRef = doc(db, `polls/${pollID}`);

    // if the poll has an image, we need to delete that too
    if (hasPreviewImage) {
      const imageRef = ref(getStorage(), `${pollID}/previewImage`);
      await deleteObject(imageRef);
    }

    await deleteDoc(pollRef);
    if (isPublished) {
      const pollRef = doc(db, `published/${pollID}`);
      await deleteDoc(pollRef);
    }
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
    if (
      pollData.previewImageURI !== "" &&
      /^file:\/\//.test(pollData.previewImageURI)
    ) {
      const storage = getStorage();
      const imageRef = ref(storage, `${document.id}/previewImage`);
      const bytes = await (await fetch(pollData.previewImageURI)).blob();

      // fix race condition
      console.log(JSON.stringify(bytes, null, 4));

      const uploadResult = (await uploadBytes(imageRef, bytes)).ref;
      const uri = await getDownloadURL(uploadResult);
      pollData.previewImageURI = uri;
    }
    await updateDoc(documentRef, {
      ...pollData,
    });

    // we need to pass the updated doc so the new screen has all of its data
    return { ...(await getDoc(documentRef)).data(), ...pollData };
  } catch (error) {} // do something here
};

const uploadAnswerImages = async (
  pollID: string,
  questionID: string,
  answers: Answer[]
) => {
  const storage = getStorage();
  const toReturn: Answer[] = [];
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    if (answer.answerVariant === "Text Ranking") {
      const { answerText, answerType, answerVariant } = answer;
      toReturn.push({ answerText, answerType, answerVariant });
    } else {
      const imageRef = ref(storage, `${pollID}/${questionID}/answer${i}`);
      const uploadResult = (await uploadBytes(imageRef, answer.imageData)).ref;
      const imageURI = await getDownloadURL(uploadResult);
      toReturn.push({
        answerType: answer.answerType,
        answerVariant: answer.answerVariant,
        answerText: imageURI,
      });
    }
    // right now, this stops it from crashing. i have no idea why (race condition?)
    console.log(toReturn);
  }
  return toReturn;
};

const editQuestion = async (
  pollID: string,
  questionID: string,
  questionType: AcceptedLabel,
  questionText: string,
  answers: Answer[]
) => {
  const toAdd = { questionType, questionText, answers };
  await updateDoc(doc(db, `polls/${pollID}/questions/${questionID}`), toAdd);
  const data: Question = {
    questionText,
    questionType,
    answers,
    id: questionID,
  };
  return data;
};

const createQuestion = async (
  pollID: string,
  questionType: AcceptedLabel,
  questionText: string,
  answers: Answer[],
  published: boolean = false
) => {
  try {
    const toAdd: any = {
      questionType,
      questionText,
    };
    if (questionType !== "Ranking" && questionType !== "Image Selection")
      toAdd.answers = answers;

    // get question ref and ID
    // if the question type isn't Ranking, we upload the entire answer here
    const questionRef = await addDoc(
      collection(
        db,
        `${published ? "published" : "polls"}/${pollID}/questions`
      ),
      toAdd
    );
    const questionID = questionRef.id;

    // if we are uploading a ranking question, we must first upload the images and then update the question
    if (questionType === "Ranking" || questionType === "Image Selection") {
      answers = await uploadAnswerImages(pollID, questionID, answers);
      await updateDoc(questionRef, { answers });
    }

    const data: Question = {
      questionText,
      questionType,
      answers,
      id: questionID,
    };
    return data;
  } catch (error) {
    console.log("ERROR:", error);
  }
};

const getQuestions = async (author: string, pollTitle: string) => {
  const q = query(
    collection(db, "polls"),
    where("author", "==", author),
    where("title", "==", pollTitle),
    limit(1)
  );

  try {
    const result = (await getDocs(q)).docs;
    if (result.length === 0) throw `Poll w/ title ${pollTitle} not found!`;

    const pollID = result[0].id;
    const questionRefs = (
      await getDocs(collection(db, `polls/${pollID}/questions`))
    ).docs;

    const questions: Question[] = [];
    questionRefs.forEach((document) => {
      const data = document.data();
      const { questionType, questionText, answers, questionImage } = data;
      questions.push({
        questionType,
        questionText,
        answers,
        id: document.id,
      });
    });
    return { questions, pollID };
  } catch (error) {
    console.log(error);
  }
};

const deleteImagesFromQuestion = async (question: Question) => {
  const storage = getStorage();
  for (const answer of question.answers) {
    if (
      answer.answerType === "Image Selection" ||
      answer.answerVariant === "Image Ranking"
    ) {
      // get image ref from the google URI
      const answerImageRef = ref(storage, answer.answerText);
      await deleteObject(answerImageRef);
    }
  }
};

const deleteQuestion = async (pollID: string, question: Question) => {
  const docRef = doc(db, `polls/${pollID}/questions`, question.id);
  try {
    if (
      question.questionType === "Image Selection" ||
      question.questionType === "Ranking"
    )
      await deleteImagesFromQuestion(question);
    await deleteDoc(docRef);
  } catch (error) {
    console.log(`Error (poll: ${pollID}, question: ${question.id})`);
  }
};

const publishPoll = async (pollID: string) => {
  const pollData = await getDoc(doc(db, `polls/${pollID}`));
  const newPollData = await addDoc(
    collection(db, "published"),
    pollData.data()
  );
  const newQuestionData: Question[] = [];

  const questions = (await getDocs(collection(db, `polls/${pollID}/questions`)))
    .docs;
  for (const docRef of questions) {
    const data = docRef.data();
    const { questionType, questionText, answers } = data;
    const newQuestion = await createQuestion(
      newPollData.id,
      questionType,
      questionText,
      answers,
      true
    );
    newQuestionData.push(newQuestion);
  }

  await updateDoc(doc(db, `polls/${pollID}`), { published: true });

  return { newPollData, newQuestionData };
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
  createQuestion,
  getQuestions,
  deleteQuestion,
  editQuestion,
  publishPoll,
};
export type { UserData, PollData, Answer };
