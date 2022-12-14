import { AcceptedLabel, AcceptedIcon } from "../components/PollTypeButton";

interface QuestionButtonData {
  iconName: AcceptedIcon;
  label: AcceptedLabel;
}

const POLL_QUESTION_TYPES: QuestionButtonData[] = [
  { iconName: "tasks", label: "Multiple Choice" },
  { iconName: "i-cursor", label: "Free Response" },
  { iconName: "podium", label: "Ranking" },
  { iconName: "numbers", label: "Number Answer" },
  { iconName: "images", label: "Image Selection" },
];

type QuestionTypeID = 0 | 1 | 2 | 3 | 4 | undefined;

const MULTIPLE_CHOICE: QuestionTypeID = 0;
const FREE_RESPONSE: QuestionTypeID = 1;
const RANKING: QuestionTypeID = 2;
const NUMBER_ANSWER: QuestionTypeID = 3;
const IMAGE_SELECTION: QuestionTypeID = 4;

const getIDFromQuestionType = (questionType: AcceptedLabel) => {
  switch (questionType) {
    case "Multiple Choice":
      return MULTIPLE_CHOICE;
    case "Free Response":
      return FREE_RESPONSE;
    case "Ranking":
      return RANKING;
    case "Number Answer":
      return NUMBER_ANSWER;
    case "Image Selection":
      return IMAGE_SELECTION;
    default:
      return -1;
  }
};

export {
  POLL_QUESTION_TYPES,
  MULTIPLE_CHOICE,
  FREE_RESPONSE,
  RANKING,
  NUMBER_ANSWER,
  IMAGE_SELECTION,
  getIDFromQuestionType,
};

export type { QuestionTypeID };
