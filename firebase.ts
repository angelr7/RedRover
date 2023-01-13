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
  setDoc,
} from "firebase/firestore";
import { COUNTRY, TIME_UNIT } from "./constants/localization";
import {
  AFFILIATION,
  EDUCATION_LEVEL,
  GENDER,
  INCOME_LEVEL,
  JOB,
  LS,
  PET,
  RACE,
  convertToEL,
  convertToGender,
  convertToIL,
  convertToJob,
  convertToLS,
  convertToPet,
  convertToRace,
  convertToReligion,
  convertToString,
  getPA,
} from "./constants/demographics";

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
type NumberAnswerVariant = "Percentage" | "Number" | "Dollars";
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
interface QuestionData {
  category: "Multiple Choice" | "Free Response" | "Ranking" | "Range (Slider)";
  question: string;
  answers: string[];
  letterCount?: number;
  wordCount?: number;
  multiline?: boolean;
  minRange?: number;
  maxRange?: number;
  dollarSign?: boolean;
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

const getQuestionFromData = (docRef: any): Question => {
  const { id } = docRef;
  const { answers, questionText, questionType } = docRef.data();
  return { answers, questionText, questionType, id };
};

const getImagesFromQuestions = async (
  docs: QueryDocumentSnapshot<DocumentData>[]
): Promise<{ uri: string; index: number; questionID: string }[]> => {
  const images = [];
  for (let i = 0; i < docs.length; i++) {
    const document = docs[i];
    const question = getQuestionFromData(document);
    const { questionType } = question;
    if (questionType === "Image Selection" || questionType === "Ranking") {
      for (let j = 0; j < question.answers.length; j++) {
        const answer = question.answers[j];
        if (
          questionType === "Image Selection" ||
          answer.answerVariant === "Image Ranking"
        ) {
          images.push({
            questionID: document.id,
            uri: answer.answerText,
            index: j,
          });
        }
      }
    }
  }
  return images;
};

const removePoll = async (
  pollID: string,
  hasPreviewImage: boolean,
  isPublished: boolean
) => {
  try {
    const docs = (await getDocs(collection(db, `polls/${pollID}/questions`)))
      .docs;

    const storage = getStorage();
    const images = await getImagesFromQuestions(docs);
    for (const image of images) {
      console.log(`${pollID}/${image.questionID}/answer${image.index}`);

      const imageRef = ref(
        storage,
        `${pollID}/${image.questionID}/answer${image.index}`
      );
      await deleteObject(imageRef);
    }

    for (const document of docs)
      await deleteDoc(doc(db, `polls/${pollID}/questions/${document.id}`));

    if (isPublished) {
      const docs = (
        await getDocs(collection(db, `published/${pollID}/questions`))
      ).docs;
      for (const document of docs)
        await deleteDoc(
          doc(db, `published/${pollID}/questions/${document.id}`)
        );
    }

    const pollRef = doc(db, `polls/${pollID}`);

    // if the poll has an image, we need to delete that too
    if (hasPreviewImage) {
      const imageRef = ref(storage, `${pollID}/previewImage`);
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
  // get question ref
  const questionRef = doc(db, `polls/${pollID}/questions/${questionID}`);
  const questionRefData = (await getDoc(questionRef)).data();
  const question = getQuestionFromData(questionRefData);

  // depending on type, filter answers and take out images
  const oldQuestionType = question.questionType;
  const oldAnswers = question.answers;
  if (oldQuestionType === "Image Selection" || questionType === "Ranking") {
    const storage = getStorage();
    for (let i = 0; i < oldAnswers.length; i++)
      if (
        (oldQuestionType === "Image Selection" ||
          oldAnswers[i].answerVariant === "Image Ranking") &&
        i < answers.length &&
        (answers[i].answerType !== "Image Selection" ||
          answers[i].answerVariant !== "Image Ranking")
      )
        await deleteObject(ref(storage, `${pollID}/${questionID}/answer${i}`));
  }

  await updateDoc(questionRef, { questionType, questionText, answers });
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

const deleteImagesFromQuestion = async (pollID: string, question: Question) => {
  const storage = getStorage();
  for (let i = 0; i < question.answers.length; i++) {
    const answer = question.answers[0];
    if (
      answer.answerType === "Image Selection" ||
      answer.answerVariant === "Image Ranking"
    ) {
      const answerImageRef = ref(
        storage,
        `${pollID}/${question.id}/answer${i}`
      );
      await deleteObject(answerImageRef);
    }
  }
};

const deleteQuestion = async (pollID: string, question: Question) => {
  const docRef = doc(db, `polls/${pollID}/questions`, question.id);
  const { questionType } = question;
  try {
    if (questionType === "Image Selection" || questionType === "Ranking")
      await deleteImagesFromQuestion(pollID, question);
    await deleteDoc(docRef);
  } catch (error) {
    console.log(`Error (poll: ${pollID}, question: ${question.id})`);
  }
};

const publishPoll = async (pollID: string) => {
  const pollData = await getDoc(doc(db, `polls/${pollID}`));
  await setDoc(doc(db, "published", pollID), pollData.data());

  const questions = (await getDocs(collection(db, `polls/${pollID}/questions`)))
    .docs;
  const newQuestionData: Question[] = [];
  for (const docRef of questions) {
    const data = docRef.data();
    const { questionType, questionText, answers } = data;
    const newQuestion = await createQuestion(
      pollID,
      questionType,
      questionText,
      answers,
      true
    );
    newQuestionData.push(newQuestion);
  }

  await updateDoc(doc(db, `polls/${pollID}`), { published: true });

  return { newQuestionData };
};

const getAllPolls = async () => {
  return (await getDocs(collection(db, "published"))).docs;
};

const getPublishedQuestions = async (pollID: string) => {
  const { docs } = await getDocs(
    collection(db, `published/${pollID}/questions`)
  );
  return docs.map((doc) => getQuestionFromData(doc));
};

const removePollDraft = async (userID: string, pollID: string) => {
  const docs = (
    await getDocs(collection(db, `${userID}_drafts/${pollID}/questions`))
  ).docs;

  for (const d of docs) {
    await deleteDoc(doc(db, `${userID}_drafts/${pollID}/questions/${d.id}`));
  }

  const docRef = doc(db, `${userID}_drafts/${pollID}`);
  await deleteDoc(docRef);
};

interface PollDraftInfo {
  id: string;
  additionalInfo: string;
  dateCreated: string;
  description: string;
  title: string;
}
const parsePollDraft = (doc: any) => {
  const { additionalInfo, dateCreated, description, title } = doc.data();
  const { id } = doc;
  const docInfo: PollDraftInfo = {
    id,
    additionalInfo,
    dateCreated,
    description,
    title,
  };
  return docInfo;
};

const getPollDrafts = async (userID: string) => {
  const { docs } = await getDocs(collection(db, `${userID}_drafts`));

  const pollDrafts: PollDraftInfo[] = [];
  for (const doc of docs) pollDrafts.push(parsePollDraft(doc));
  return pollDrafts;
};

interface PollInfo {
  title: string;
  description: string;
  additionalInfo: string;
}

const createPollDraft = async (userID: string, pollInfo: PollInfo) => {
  const doc = await addDoc(collection(db, `${userID}_drafts`), {
    ...pollInfo,
    dateCreated: `${moment()}`,
  });
  return (await getDoc(doc)).data();
};

const updatePollDraftQuestion = async (
  userID: string,
  pollID: string,
  questionID: string,
  questionData: QuestionData
) => {
  await updateDoc(
    doc(db, `${userID}_drafts/${pollID}/questions/${questionID}`),
    {
      category: questionData.category,
      question: questionData.question,
      answers: questionData.answers,
      ...(questionData.category === "Free Response"
        ? {
            letterCount: questionData.letterCount,
            wordCount: questionData.wordCount,
            multiline: questionData.multiline,
          }
        : {}),
    }
  );
  return questionID;
};

interface PollInfoWithStatus extends PollInfo {
  status?: string | undefined;
}
const updatePollDraft = async (
  userID: string,
  pollID: string,
  pollInfo: PollInfoWithStatus
) => {
  const { title, description, additionalInfo } = pollInfo;
  const docRef = doc(db, `${userID}_drafts/${pollID}`);
  const { status } = pollInfo;
  await updateDoc(docRef, {
    title,
    description,
    additionalInfo,
    dateCreated: `${moment()}`,
    ...(status === undefined
      ? { status: "undefined" }
      : { status: pollInfo.status }),
  });
};

interface ExtendedQuestion extends QuestionDataWithID {
  votes: { answer: string; userID: string }[];
}
const publishPollDraft = async (
  userID: string,
  pollID: string,
  expirationTime: { time: number; unit: string }
) => {
  const preTaggedQuestions: QuestionDataWithID[] = await getDraftQuestions(
    userID,
    pollID
  );
  const taggedQuestions: ExtendedQuestion[] = preTaggedQuestions.map((q) => {
    return { ...q, votes: [] };
  });

  if (taggedQuestions.length === 0) return -1;

  const documentRef = await getDoc(doc(db, `${userID}_drafts/${pollID}`));
  const pollData = parsePollDraft(documentRef);
  const { status } = documentRef.data();
  if (status === "published") return -2;

  const currTime = moment();
  const result = await addDoc(collection(db, "published"), {
    author: userID,
    pollData,
    questions: taggedQuestions,
    createdAt: `${currTime}`,
    expirationTime: `${currTime.add(expirationTime.time, expirationTime.unit)}`,
    likes: [],
  });
  await addDoc(collection(db, `${userID}_published`), {
    publishedDocRef: result.id,
  });

  await updatePollDraft(userID, pollID, { ...pollData, status: "published" });
};

const createDraftQuestion = async (
  userID: string,
  pollID: string,
  question: QuestionData
) => {
  const res = await addDoc(
    collection(db, `${userID}_drafts/${pollID}/questions`),
    question
  );
  return res.id;
};

const getDraftQuestions = async (userID: string, pollID: string) => {
  const docs = (
    await getDocs(collection(db, `${userID}_drafts/${pollID}/questions`))
  ).docs;

  const toRet: QuestionDataWithID[] = [];
  for (const d of docs) {
    const {
      category,
      question,
      answers,
      letterCount,
      wordCount,
      multiline,
      minRange,
      maxRange,
      dollarSign,
    } = d.data();
    const newQuestion: QuestionDataWithID = {
      category,
      question,
      answers,
      id: d.id,
    };
    if (category === "Free Response") {
      newQuestion.letterCount = letterCount;
      newQuestion.wordCount = wordCount;
      newQuestion.multiline = multiline;
    } else if (category === "Range (Slider)") {
      newQuestion.minRange = minRange;
      newQuestion.maxRange = maxRange;
      newQuestion.dollarSign = dollarSign;
    }
    toRet.push(newQuestion);
  }
  return toRet;
};

const deleteDraftQuestion = async (
  userID: string,
  pollID: string,
  questionID: string
) => {
  await deleteDoc(
    doc(db, `${userID}_drafts/${pollID}/questions/${questionID}`)
  );
};

const removeAnswersFromQuestionDraft = async (
  userID: string,
  pollID: string,
  questionID: string
) => {
  const res = await getDocs(
    collection(db, `${userID}_drafts/${pollID}/questions/${questionID}/answers`)
  );
  for (const currDoc of res.docs) {
    await deleteDoc(
      doc(
        db,
        `${userID}_drafts/${pollID}/questions/${questionID}/answers/${currDoc.id}`
      )
    );
  }
};

interface QuestionDataWithID extends QuestionData {
  id: string;
}
interface PublishedPollData {
  author: string;
  createdAt: string;
  expirationTime: string;
  pollData: PollDraftInfo;
  questions: ExtendedQuestion[];
  likes: { userID: string }[];
}
interface PublishedPollWithID extends PublishedPollData {
  id: string;
}

const parsePublishedPoll = (doc: any) => {
  const { author, createdAt, expirationTime, pollData, questions, likes } =
    doc.data();
  const toRet: PublishedPollWithID = {
    author,
    createdAt,
    expirationTime,
    pollData,
    questions,
    likes,
    id: doc.id,
  };
  return toRet;
};

const getPublishedPollsForUser = async (userID: string) => {
  const currTime = moment();
  const docs = (await getDocs(collection(db, `${userID}_published`))).docs;
  const docRefIDs = docs.map((document) => document.data().publishedDocRef);
  const publishedPolls: PublishedPollWithID[] = [];
  for (const id of docRefIDs) {
    const docRef = await getDoc(doc(db, `published/${id}`));
    const { status, expirationTime } = docRef.data();
    if (status !== "expired") {
      if (currTime.diff(moment(parseInt(expirationTime)), "milliseconds") >= 0)
        await updateDoc(doc(db, `published/${id}`), { status: "expired" });
      else publishedPolls.push(parsePublishedPoll(docRef));
    }
  }
  return publishedPolls;
};

const getLikedPollsForUser = async (userID: string) => {
  const likedPolls: PublishedPollWithID[] = [];
  const publishedPolls = await getPublishedPollsForNonAdmin();
  for (const poll of publishedPolls) {
    const { likes } = poll;
    let liked = false;
    for (const like of likes) {
      if (like.userID === userID) {
        liked = true;
        break;
      }
    }

    if (liked) likedPolls.push(poll);
  }
  return likedPolls;
};

const getPublishedPollsForNonAdmin = async () => {
  const currTime = moment();
  const docs = (await getDocs(collection(db, "published"))).docs;
  const polls: PublishedPollWithID[] = [];
  for (const document of docs) {
    const publishedPoll = parsePublishedPoll(document);
    if (document.data().status !== "expired") {
      const msDiff = currTime.diff(
        moment(parseInt(publishedPoll.expirationTime)),
        "milliseconds"
      );
      if (msDiff < 0) polls.push(publishedPoll);
      else
        await updateDoc(doc(db, `published/${publishedPoll.id}`), {
          status: "expired",
        });
    }
  }
  return polls;
};

const submitPollResponse = async (
  pollData: PublishedPollWithID,
  userID: string,
  answers: string[]
) => {
  const questions = pollData.questions;

  for (let i = 0; i < questions.length; i++) {
    const { votes } = questions[i];
    votes.push({ answer: answers[i], userID });
  }

  await updateDoc(doc(db, `published/${pollData.id}/`), { questions });
};

const handleLike = async (userID: string, pollID: string) => {
  const docRef = doc(db, `published/${pollID}`);
  const fullPollData = await getDoc(docRef);
  let likes: { userID: string }[] = fullPollData.data().likes;
  if (likes === undefined) likes = [];
  likes.push({ userID });
  await updateDoc(docRef, { likes });
};

const handleDislike = async (userID: string, pollID: string) => {
  const docRef = doc(db, `published/${pollID}`);
  const fullPollData = await getDoc(docRef);
  const likes: { userID: string }[] = fullPollData.data().likes;
  if (likes === undefined) return -1;
  for (let i = 0; i < likes.length; i++) {
    if (likes[i].userID === userID) {
      likes.splice(i, 1);
      await updateDoc(docRef, { likes });
      return 0;
    }
  }
  return 0;
};

const extendPollDeadline = async (
  pollData: PublishedPollWithID,
  value: number,
  unit: TIME_UNIT
) => {
  const { expirationTime } = pollData;
  const newExpirationTime = moment(parseInt(expirationTime)).add(value, unit);
  await updateDoc(doc(db, `published/${pollData.id}`), {
    expirationTime: `${newExpirationTime}`,
  });
};

const closePublishedPoll = async (pollID: string) => {
  await updateDoc(doc(db, `published/${pollID}`), { status: "expired" });
};

const getPollStatus = async (pollID: string) => {
  const { status } = (await getDoc(doc(db, `published/${pollID}`))).data();
  return status;
};

const getAllUserPolls = async (userID: string) => {
  const docs = (await getDocs(collection(db, `${userID}_published`))).docs;
  const docRefIDs = docs.map((document) => document.data().publishedDocRef);

  const publishedPolls: PublishedPollWithID[] = [];
  for (const refID of docRefIDs) {
    const docRef = await getDoc(doc(db, `published/${refID}`));
    const publishedPoll = parsePublishedPoll(docRef);
    publishedPolls.push(publishedPoll);
  }

  return publishedPolls;
};

// first name, last name, and birthday filters will be added later
// for right now, they're unnecessary
const INTAKE_FILTERS: DEMOGRAPHIC_FILTER[] = [
  "School",
  "Country",
  "State",
  "City",
  "Gender",
  "Race",
  "Hispanic/Latino",
  "Political Affiliation",
  "LGBTQ",
  "Income Level",
  "Occupation",
  "Religion",
  "Pet",
  "Living Situation",
];
type DEMOGRAPHIC_FILTER =
  | "School"
  | "Country"
  | "Education Level"
  | "State"
  | "City"
  | "Gender"
  | "Race"
  | "Hispanic/Latino"
  | "Political Affiliation"
  | "LGBTQ"
  | "Income Level"
  | "Occupation"
  | "Religion"
  | "Pet"
  | "Living Situation";

interface FilteredInfo {
  school: { school: string; votes: number; likes: number }[];
  educationLevel: {
    educationLevel: EDUCATION_LEVEL;
    votes: number;
    likes: number;
  }[];
  country: { country: COUNTRY; votes: number; likes: number }[];
  state: { state: string; votes: number; likes: number }[];
  city: { city: string; votes: number; likes: number }[];
  gender: { gender: GENDER; votes: number; likes: number }[];
  race: { race: RACE; votes: number; likes: number }[];
  hispanicOrLatino: {
    hispanicOrLatino: boolean;
    votes: number;
    likes: number;
  }[];
  politicalAffiliation: {
    politicalAffiliation: AFFILIATION;
    votes: number;
    likes: number;
  }[];
  lgbtq: { lbgtq: boolean; votes: number; likes: number }[];
  incomeLevel: { incomeLevel: INCOME_LEVEL; votes: number; likes: number }[];
  occupation: { occupation: JOB; votes: number; likes: number }[];
  religion: { religion: string; votes: number; likes: number }[];
  pet: { pet: PET; votes: number; likes: number }[];
  livingSituation: { livingSituation: LS; votes: number; likes: number }[];
}

interface IntakeData {
  firstName: string;
  lastName: string;
  school: string;
  educationLevel: EDUCATION_LEVEL;
  country: string;
  state: string;
  city: string;
  birthday: string;
  gender: GENDER;
  race: string;
  hispanicOrLatino: boolean;
  politicalAffiliation: AFFILIATION;
  lgbtq: boolean;
  incomeLevel: INCOME_LEVEL;
  occupation: JOB;
  religion: string;
  pet: PET;
  livingSituation: LS;
}
const submitIntakeSurvey = async (userID: string, answers: string[]) => {
  const [firstName, lastName] = answers[0].split(";");
  const school = answers[1];
  const educationLevel = convertToEL(answers[2]);

  let country: string, state: string, city: string;
  const splitted = answers[3].split(";");
  if (splitted.length === 3) [country, state, city] = splitted;
  else {
    country = answers[3];
    state = "N/A";
    city = "N/A";
  }

  const birthday = answers[4];
  const gender: GENDER = convertToGender(answers[5]);
  const race = answers[6];
  const hispanicOrLatino = answers[7].toLowerCase() === "yes";
  const politicalAffiliation = getPA(answers[8]);
  const lgbtq = answers[9].toLowerCase() === "yes";
  const incomeLevel: INCOME_LEVEL = convertToIL(answers[10]);
  const occupation: JOB = convertToJob(answers[11]);
  const religion = convertToReligion(answers[12]);
  const pet = convertToPet(answers[13]);
  const livingSituation = convertToLS(answers[14]);

  const intakeData: IntakeData = {
    birthday,
    city,
    educationLevel,
    country,
    firstName,
    gender,
    hispanicOrLatino,
    incomeLevel,
    lastName,
    lgbtq,
    livingSituation,
    occupation,
    pet,
    politicalAffiliation,
    race,
    religion,
    school,
    state,
  };

  const q = query(collection(db, "users"), where("id", "==", userID), limit(1));
  const docID = (await getDocs(q)).docs[0].id;

  await updateDoc(doc(db, `users/${docID}`), {
    intakeSurvey: true,
    ...intakeData,
  });
};

const getFilterData = async (
  votes: {
    answer: string;
    userID: string;
  }[],
  likes: { userID: string }[]
): Promise<FilteredInfo> => {
  const data: FilteredInfo = {
    city: [],
    country: [],
    educationLevel: [],
    gender: [],
    hispanicOrLatino: [],
    incomeLevel: [],
    lgbtq: [],
    livingSituation: [],
    occupation: [],
    pet: [],
    politicalAffiliation: [],
    race: [],
    religion: [],
    school: [],
    state: [],
  };

  // TODO: update users during creation to reflect ID's accurately
  const userIDs = votes.map((vote) => vote.userID);
  for (const userID of userIDs) {
    const q = query(
      collection(db, "users"),
      where("id", "==", userID),
      limit(1)
    );
    const docID = (await getDocs(q)).docs[0].id;

    const userData = (await getDoc(doc(db, `users/${docID}`))).data();
    for (const key in data) {
      const filterValue = userData[key];
      const indexOfFilter = data[key].findIndex((item: any) => item[key]);
      const hasLiked = likes.findIndex((item) => item.userID === userID) !== -1;
      if (indexOfFilter === -1) {
        const item: any = { votes: 1, likes: hasLiked ? 1 : 0 };
        item[key] = filterValue;
        data[key].push(item);
      } else {
        data[key][indexOfFilter].votes++;
        if (hasLiked) data[key][indexOfFilter].likes++;
      }
    }
  }

  return data;
};

interface FilteredQuestionInfo {
  school: { school: string; answerTallies: string[] }[];
  educationLevel: {
    educationLevel: EDUCATION_LEVEL;
    answerTallies: string[];
  }[];
  country: { country: COUNTRY; answerTallies: string[] }[];
  state: { state: string; answerTallies: string[] }[];
  city: { city: string; answerTallies: string[] }[];
  gender: { gender: GENDER; answerTallies: string[] }[];
  race: { race: RACE; answerTallies: string[] }[];
  hispanicOrLatino: {
    hispanicOrLatino: boolean;
    answerTallies: string[];
  }[];
  politicalAffiliation: {
    politicalAffiliation: AFFILIATION;
    answerTallies: string[];
  }[];
  lgbtq: { lbgtq: boolean; answerTallies: string[] }[];
  incomeLevel: {
    incomeLevel: INCOME_LEVEL;
    answerTallies: string[];
  }[];
  occupation: { occupation: JOB; answerTallies: string[] }[];
  religion: { religion: string; answerTallies: string[] }[];
  pet: { pet: PET; answerTallies: string[] }[];
  livingSituation: {
    livingSituation: LS;
    answerTallies: string[];
  }[];
}

const getFilterDataForQuestion = async (question: ExtendedQuestion) => {
  const filteredInfo: FilteredQuestionInfo = {
    city: [],
    country: [],
    educationLevel: [],
    gender: [],
    hispanicOrLatino: [],
    incomeLevel: [],
    lgbtq: [],
    livingSituation: [],
    occupation: [],
    pet: [],
    politicalAffiliation: [],
    race: [],
    religion: [],
    school: [],
    state: [],
  };

  for (const vote of question.votes) {
    const { answer, userID } = vote;
    const q = query(
      collection(db, "users"),
      where("id", "==", userID),
      limit(1)
    );

    const userData = (await getDocs(q)).docs[0].data();
    for (const key in filteredInfo) {
      const foundIndex = filteredInfo[key].findIndex(
        (item: any) => item[key] === userData[key]
      );
      if (foundIndex === -1) {
        const toPush: any = {};
        toPush[key] = userData[key];
        toPush.answerTallies = [answer];
        filteredInfo[key].push(toPush);
      } else filteredInfo[key][foundIndex].answerTallies.push(answer);
    }
  }

  return filteredInfo;
};

export {
  db,
  auth,
  initUser,
  editPoll,
  getPolls,
  removePoll,
  createPoll,
  handleLike,
  publishPoll,
  getAllPolls,
  getUserData,
  editQuestion,
  getQuestions,
  handleDislike,
  getPollStatus,
  getPollDrafts,
  getFilterData,
  createQuestion,
  deleteQuestion,
  INTAKE_FILTERS,
  createPollDraft,
  getAllUserPolls,
  removePollDraft,
  updatePollDraft,
  publishPollDraft,
  getDraftQuestions,
  submitPollResponse,
  submitIntakeSurvey,
  closePublishedPoll,
  extendPollDeadline,
  createDraftQuestion,
  deleteDraftQuestion,
  getLikedPollsForUser,
  getPublishedQuestions,
  updatePollDraftQuestion,
  getFilterDataForQuestion,
  getPublishedPollsForUser,
  getPublishedPollsForNonAdmin,
  removeAnswersFromQuestionDraft,
};
export type {
  Answer,
  UserData,
  PollData,
  QuestionData,
  FilteredInfo,
  PollDraftInfo,
  ExtendedQuestion,
  DEMOGRAPHIC_FILTER,
  QuestionDataWithID,
  PublishedPollWithID,
  FilteredQuestionInfo,
};
