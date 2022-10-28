import FreeResponse from "../components/FreeResponseQuestion";
import Ranking from "../components/RankingQuestion";
import NumberAnswer from "../components/NumberAnswerQuestion";
import ImageSelection from "../components/ImageSelectionQuestion";
import GestureRecognizer from "react-native-swipe-gestures";
import PollTypeButton from "../components/PollTypeButton";
import Spacer from "../components/Spacer";
import MultipleChoice from "../components/MultipleChoiceQuestion";
import React, { useEffect, useRef, useState } from "react";
import { AddQuestionsProps, Question } from "./CreatePollScreen";
import {
  FREE_RESPONSE,
  getIDFromQuestionType,
  IMAGE_SELECTION,
  MULTIPLE_CHOICE,
  NUMBER_ANSWER,
  POLL_QUESTION_TYPES,
  RANKING,
} from "../constants/polls";
import {
  TextInput,
  Text,
  View,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";

interface AddQuestionsModalProps {
  pollData: AddQuestionsProps["pollData"];
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  pollID: string;
  currQuestion: Question;
  setCurrQuestion: React.Dispatch<React.SetStateAction<Question>>;
  setRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}

const getQuestionType = (
  pollID: string,
  currSelected: number,
  pollData: AddQuestionsProps["pollData"],
  questionText: string,
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>,
  questions: Question[],
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>,
  scrollViewRef: React.MutableRefObject<ScrollView>,
  currQuestion: Question,
  setRefetch: React.Dispatch<React.SetStateAction<boolean>>
) => {
  let questionTypeScreen: JSX.Element;
  switch (currSelected) {
    case MULTIPLE_CHOICE:
      questionTypeScreen = (
        <MultipleChoice
          pollID={pollID}
          pollData={pollData}
          questionText={questionText}
          setOuterModalVisible={setOuterModalVisible}
          questions={questions}
          setQuestions={setQuestions}
          scrollViewRef={scrollViewRef}
          currQuestion={currQuestion}
          setRefetch={setRefetch}
          oldAnswers={
            currQuestion === undefined ? undefined : currQuestion.answers
          }
        />
      );
      break;
    case FREE_RESPONSE:
      questionTypeScreen = (
        <FreeResponse
          pollID={pollID}
          scrollViewRef={scrollViewRef}
          questionText={questionText}
          setQuestions={setQuestions}
          setOuterModalVisible={setOuterModalVisible}
          questions={questions}
          currQuestion={currQuestion}
        />
      );
      break;
    case RANKING:
      questionTypeScreen = (
        <Ranking
          pollID={pollID}
          questionText={questionText}
          questions={questions}
          setQuestions={setQuestions}
          setOuterModalVisible={setOuterModalVisible}
          currQuestion={currQuestion}
        />
      );
      break;
    case NUMBER_ANSWER:
      questionTypeScreen = (
        <NumberAnswer
          pollID={pollID}
          questionText={questionText}
          scrollViewRef={scrollViewRef}
          currQuestion={currQuestion}
          questions={questions}
          setQuestions={setQuestions}
          setOuterModalVisible={setOuterModalVisible}
        />
      );
      break;
    case IMAGE_SELECTION:
      questionTypeScreen = (
        <ImageSelection
          pollID={pollID}
          currQuestion={currQuestion}
          scrollViewRef={scrollViewRef}
          questionText={questionText}
          questions={questions}
          setQuestions={setQuestions}
          setOuterModalVisible={setOuterModalVisible}
        />
      );
      break;
    default:
      questionTypeScreen = <View />;
      break;
  }

  return questionTypeScreen;
};

export default function AddQuestionsModal({
  pollID,
  pollData,
  questions,
  modalVisible,
  setModalVisible,
  setQuestions,
  currQuestion,
  setCurrQuestion,
  setRefetch,
}: AddQuestionsModalProps) {
  const [currSelected, setCurrSelected] = useState<number | undefined>(
    undefined
  );
  const [placeholder, setPlaceholder] = useState(
    "Tap here to add a question..."
  );
  const [questionText, setQuestionText] = useState("");
  const [scrolling, setScrolling] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const editing = currQuestion !== undefined;

  const questionTypeScreen = getQuestionType(
    pollID,
    currSelected,
    pollData,
    questionText,
    setModalVisible,
    questions,
    setQuestions,
    scrollViewRef,
    currQuestion,
    setRefetch
  );

  useEffect(() => {
    if (!modalVisible) {
      setCurrQuestion(undefined);
      setCurrSelected(undefined);
      setQuestionText("");
    }
  }, [modalVisible]);

  useEffect(() => {
    // need to reset the current selected question every time the modal closes
    if (editing) {
      setCurrSelected(getIDFromQuestionType(currQuestion.questionType));
      setQuestionText(currQuestion.questionText);
    }
  }, [editing]);

  return (
    // allows us to swipe down and close our modal
    // TODO: update gesture handler to ask users to save changes first
    <GestureRecognizer
      onSwipeDown={() => {
        if (!scrolling) setModalVisible(false);
      }}
    >
      <Modal
        visible={modalVisible}
        presentationStyle="pageSheet"
        animationType="slide"
      >
        <View style={styles.outerModalContainer}>
          <Text style={styles.modalTitle}>
            {editing ? "Edit Question" : "Add Question"}
          </Text>
          <Spacer width="100%" height={20} />
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ width: "100%", height: "100%" }}
              showsVerticalScrollIndicator={false}
              ref={(ref) => (scrollViewRef.current = ref)}
              scrollEventThrottle={100}
              onScroll={(event) => {
                // this helps make the GestureRecognizer a little less sensitive
                if (event.nativeEvent.contentOffset.y <= 10)
                  setScrolling(false);
                else setScrolling(true);
              }}
            >
              <Text
                style={{
                  fontSize: 17.5,
                  color: "rgb(133, 59, 48)",
                  fontFamily: "Lato_400Regular",
                }}
              >
                Question Text
              </Text>
              <Spacer width="100%" height={10} />
              <View
                style={{
                  backgroundColor: "rgb(133, 59, 48)",
                  borderRadius: 7.5,
                }}
              >
                <TextInput
                  placeholder={placeholder}
                  placeholderTextColor="#FFF"
                  style={styles.questionTextInput}
                  value={questionText}
                  onChangeText={(text) => {
                    setQuestionText(text);
                  }}
                  onFocus={() => {
                    setPlaceholder("");
                  }}
                  onBlur={() => {
                    setPlaceholder("Tap here to add a question...");
                  }}
                />
              </View>
              <Spacer width="100%" height={40} />
              <Text
                style={{
                  fontSize: 17.5,
                  color: "rgb(133, 59, 48)",
                  fontFamily: "Lato_400Regular",
                }}
              >
                What type of question will this be?
              </Text>
              <Spacer width="100%" height={10} />
              <View style={styles.buttonContainer1}>
                <View style={styles.buttonContainer2}>
                  {POLL_QUESTION_TYPES.map((questionType, index) => {
                    return (
                      <PollTypeButton
                        iconName={questionType.iconName}
                        label={questionType.label}
                        index={index}
                        currSelected={currSelected}
                        onPress={() => {
                          setCurrSelected(index);
                        }}
                        key={index}
                      />
                    );
                  })}
                </View>
              </View>
              <Spacer width="100%" height={40} />
              {questionTypeScreen}
              <Spacer width="100%" height={20} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GestureRecognizer>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  outerModalContainer: {
    width: "100%",
    height: "100%",
    padding: 10,
  },
  modalTitle: {
    alignSelf: "center",
    fontFamily: "Lato_400Regular",
    fontSize: 40,
    color: "rgb(133, 59, 48)",
  },
  questionTextInput: {
    width: "100%",
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    minHeight: 100,
    borderRadius: 7.5,
    padding: 10,
    color: "#FFF",
    textAlign: "center",
    fontSize: 17.5,
  },
  buttonContainer1: {
    width: "100%",
    minHeight: 100,
    backgroundColor: "rgb(133, 59, 48)",
    borderRadius: 7.5,
  },
  buttonContainer2: {
    width: "100%",
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 7.5,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    justifyContent: "space-evenly",
  },
});
