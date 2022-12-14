import * as Haptics from "expo-haptics";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoadingScreen from "./LoadingScreen";
import React, { useEffect, useRef, useState } from "react";
import { AddQuestionsProps, Question } from "../screens/CreatePollScreen";
import { ListEmpty } from "../screens/CreatePolls";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import { Answer, createQuestion, editQuestion } from "../firebase";
import {
  TextInput,
  Text,
  View,
  Modal,
  Animated,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from "react-native";

interface MultipleChoiceProps {
  pollID: string;
  pollData: AddQuestionsProps["pollData"];
  questionText: string;
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  currQuestion: Question | undefined;
  setRefetch: React.Dispatch<React.SetStateAction<boolean>>;
  oldAnswers?: any[] | undefined; // passed in when editing
}
interface AnswerPreviewProps {
  answerData: Answer;
  index: number;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  answers: any[];
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedAnswer: React.Dispatch<any>;
}
interface AnswerPreviewButtonConainerProps {
  flipAnimationProgress: Animated.Value;
  index: number;
  flipped: boolean;
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  answers: any[];
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>;
}
interface AnswerPreviewContainerProps {
  answers: any[];
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedAnswer: React.Dispatch<any>;
}
interface AddAnswerModalProps {
  modalVisible: boolean;
  riseAnimationProgress: Animated.Value;
  setAnswerInput: React.Dispatch<React.SetStateAction<string>>;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  answerInput: string;
  answers: any[];
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>;
  selectedAnswer: any;
}

const handleAnimations = (
  riseAnimationProgress: Animated.Value,
  answerInput: string
) => {
  const [fading, setFading] = useState(false);
  const fadeAnimationProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (answerInput === "")
      Animated.timing(fadeAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else if (!fading) {
      setFading(true);
      Animated.timing(fadeAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setFading(false);
      });
    }
  }, [answerInput]);

  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", () => {
      Animated.timing(riseAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(riseAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, []);
};

const handleFlipAnimation = (
  flipped: boolean,
  flipAnimationProgress: Animated.Value,
  setDisplayButtons: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (flipped) {
      setDisplayButtons(true);
      Animated.timing(flipAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else
      Animated.timing(flipAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setDisplayButtons(false);
      });
  }, [flipped]);
};

const createNewAnswer = (
  freeResponse: boolean,
  answerInput: string,
  answers: any[],
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const filtered = answers.filter(
    (answer) => answer.answerText === answerInput
  );
  if (filtered.length === 0) {
    setAnswers(
      answers.concat([
        {
          answerType: "Multiple Choice",
          answerVariant: freeResponse ? "Free Response" : "Fixed Response",
          answerText: answerInput,
        },
      ])
    );
  }

  //  this essentially prohibits the user from ever having two answers w/ the same text
  else editAnswer(filtered[0], freeResponse, answerInput, answers, setAnswers);
};

const deleteAnswer = (
  index: number,
  answers: any[],
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>
) => {
  let sliced: any[];
  if (answers.length === 1) sliced = [];
  else if (index === 0) sliced = answers.slice(1);
  else if (index === answers.length - 1) sliced = answers.slice(0, index);
  else sliced = answers.slice(0, index).concat(answers.slice(index + 1));
  setAnswers(sliced);
};

const editAnswer = (
  selectedAnswer: any,
  freeResponse: boolean,
  answerInput: string,
  answers: any[],
  setAnswers: React.Dispatch<React.SetStateAction<any[]>>
) => {
  const index = answers.findIndex(
    (item) => item.answerText === selectedAnswer.answerText
  );
  answers[index] = {
    answerType: "Multiple Choice",
    answerVariant: freeResponse ? "Free Response" : "Fixed Response",
    answerText: answerInput,
  };
  setAnswers(answers);
};

const AnswerPreviewButtonContainer = ({
  flipAnimationProgress,
  index,
  flipped,
  setFlipped,
  answers,
  setAnswers,
}: AnswerPreviewButtonConainerProps) => {
  return (
    <Animated.View
      style={[
        styles.answerPreviewMask,
        styles.centerView,
        {
          opacity: flipAnimationProgress,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.answerPreviewButtonContainer}
        onPress={() => {
          deleteAnswer(index, answers, setAnswers);
        }}
      >
        <Text style={{ color: "#FFF", textAlign: "center" }}>Delete</Text>
      </TouchableOpacity>
      <Spacer width="100%" height={5} />
      <TouchableOpacity
        style={styles.answerPreviewButtonContainer}
        onPress={() => {
          setFlipped(!flipped);
        }}
      >
        <Text style={{ color: "#FFF", textAlign: "center" }}>Back</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnswerPreview = ({
  answerData,
  index,
  setModalVisible,
  answers,
  setAnswers,
  setSelectedAnswer,
}: AnswerPreviewProps) => {
  const [flipped, setFlipped] = useState(false);
  const [displayButtons, setDisplayButtons] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const editAnswer = () => {
    setSelectedAnswer(answerData);
    Haptics.selectionAsync();
    setModalVisible(true);
  };

  handleFlipAnimation(flipped, flipAnimationProgress, setDisplayButtons);

  return (
    <>
      <AnimatedPressable
        onLongPress={editAnswer}
        onPress={() => {
          setFlipped(!flipped);
        }}
        style={[
          styles.answerPreviewContainer,
          {
            transform: [
              {
                rotateY: flipAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.answerPreviewType}>{answerData.answerVariant}</Text>
        <Spacer width="100%" height={10} />
        <View style={[styles.centerView, styles.answerTextContainer]}>
          <Text ellipsizeMode="tail" style={styles.answerText}>
            {answerData.answerText}
          </Text>
        </View>
        {displayButtons && (
          <AnswerPreviewButtonContainer
            flipAnimationProgress={flipAnimationProgress}
            index={index}
            flipped={flipped}
            setFlipped={setFlipped}
            answers={answers}
            setAnswers={setAnswers}
          />
        )}
      </AnimatedPressable>
    </>
  );
};

const AnswerPreviewContainer = ({
  answers,
  setAnswers,
  setModalVisible,
  setSelectedAnswer,
}: AnswerPreviewContainerProps) => {
  return (
    <View style={styles.answerPreviewHolder}>
      <View style={styles.answerPreviewHolderInner}>
        {answers.length === 0 && (
          <View style={{ alignSelf: "center" }}>
            <ListEmpty />
          </View>
        )}
        {answers.length > 0 && (
          <View
            style={{
              width: "100%",
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "space-evenly",
            }}
          >
            {answers.map((answer: Answer, index: number) => {
              return (
                <AnswerPreview
                  key={index}
                  answerData={answer}
                  index={index}
                  setModalVisible={setModalVisible}
                  answers={answers}
                  setAnswers={setAnswers}
                  setSelectedAnswer={setSelectedAnswer}
                />
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const AddAnswerModal = ({
  modalVisible,
  riseAnimationProgress,
  setAnswerInput,
  setModalVisible,
  answerInput,
  answers,
  setAnswers,
  selectedAnswer,
}: AddAnswerModalProps) => {
  const [freeResponse, setFreeResponse] = useState(undefined);
  const [answerInputFocused, setAnswerInputFocused] = useState(false);

  let placeholder: string;
  if (Platform.OS === "ios")
    placeholder = answerInputFocused ? "" : "Enter your answer here...";
  else
    placeholder =
      answerInputFocused || answerInput !== ""
        ? ""
        : "Enter your answer here...";

  const closeAndReset = () => {
    setModalVisible(false);
    setFreeResponse(undefined);
    setAnswerInput("");
  };

  const handleSubmit = () => {
    if (selectedAnswer === undefined)
      createNewAnswer(freeResponse, answerInput, answers, setAnswers);
    else
      editAnswer(
        selectedAnswer,
        freeResponse,
        answerInput,
        answers,
        setAnswers
      );

    closeAndReset();
  };

  return (
    <Modal visible={modalVisible} animationType="fade" transparent>
      <View style={[styles.centerView, styles.shadowContainer]}>
        <Animated.View
          style={[
            styles.createAnswerModalInner,
            {
              transform: [
                {
                  translateY: riseAnimationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -SCREEN_HEIGHT * 0.125],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.modalLabel}>Create Answer</Text>
          <Spacer width="100%" height={10} />
          <Text style={styles.modalHeadingText}>Answer Type</Text>
          <Spacer width="100%" height={10} />
          <View style={styles.answerVariantContainer}>
            <TouchableOpacity
              onPress={() => {
                setFreeResponse(false);
              }}
              style={[
                styles.variantButtonContainer,
                {
                  backgroundColor:
                    freeResponse === false ? "rgb(133, 59, 48)" : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.variantButtonText,
                  {
                    color: freeResponse === false ? "#FFF" : "rgb(133, 59, 48)",
                  },
                ]}
              >
                Fixed Response
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setFreeResponse(true);
              }}
              style={[
                styles.variantButtonContainer,
                {
                  backgroundColor: freeResponse ? "rgb(133, 59, 48)" : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.variantButtonText,
                  {
                    color: freeResponse ? "#FFF" : "rgb(133, 59, 48)",
                  },
                ]}
              >
                Free Response
              </Text>
            </TouchableOpacity>
          </View>
          <Spacer width="100%" height={20} />
          <Text style={styles.modalHeadingText}>Answer Text</Text>
          <Spacer width="100%" height={10} />

          {/* enforce text limit? */}
          <TextInput
            onFocus={() => {
              setAnswerInputFocused(true);
            }}
            onBlur={() => {
              setAnswerInputFocused(false);
            }}
            onChangeText={(text) => {
              setAnswerInput(text);
            }}
            style={styles.answerTextInput}
            placeholder={placeholder}
            placeholderTextColor={"rgb(133, 59, 48)"}
          />
          <Spacer width="100%" height={10} />
          <View style={styles.answerModalBottomButtons}>
            <TouchableOpacity
              onPress={closeAndReset}
              style={styles.variantButtonContainer}
            >
              <Text style={styles.modalHeadingText}>Cancel</Text>
            </TouchableOpacity>
            {answerInput !== "" && freeResponse !== undefined && (
              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.variantButtonContainer,
                  {
                    backgroundColor: "rgb(133, 59, 48)",
                  },
                ]}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function MultipleChoice({
  pollID,
  pollData,
  questionText,
  setOuterModalVisible,
  questions,
  setQuestions,
  scrollViewRef,
  currQuestion,
  setRefetch,
  oldAnswers,
}: MultipleChoiceProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [answerInput, setAnswerInput] = useState("");
  const [answers, setAnswers] = useState<any[]>(oldAnswers ?? []);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(undefined);

  const riseAnimationProgress = useRef(new Animated.Value(0)).current;

  const canSubmit = answers.length > 1 && questionText !== "";

  handleAnimations(riseAnimationProgress, answerInput);

  if (pollID === undefined) return <LoadingScreen color="rgb(133, 59, 48)" />;

  return (
    <>
      <Text style={styles.modalHeadingText}>Answers</Text>
      <Spacer width="100%" height={10} />
      <AnswerPreviewContainer
        answers={answers}
        setAnswers={setAnswers}
        setModalVisible={setModalVisible}
        setSelectedAnswer={setSelectedAnswer}
      />
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        style={{ alignSelf: "center" }}
        onPress={() => {
          scrollViewRef.current.scrollToEnd({ animated: true });
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" style={styles.addAnswerButton1} />
        <Ionicons name="add-circle" style={styles.addAnswerButton2} />
      </TouchableOpacity>
      <Spacer width="100%" height={20} />
      {canSubmit && (
        <TouchableOpacity
          style={styles.submitButtonContainer}
          onPress={async () => {
            // this means we're editing, not creating
            let questionData: Question;
            const editing = currQuestion !== undefined;
            if (editing) {
              questionData = await editQuestion(
                pollID,
                currQuestion.id,
                "Multiple Choice",
                questionText,
                answers
              );
            } else {
              questionData = await createQuestion(
                pollID,
                "Multiple Choice",
                questionText,
                answers
              );
              setQuestions(questions.concat([questionData]));
            }
            if (editing) setRefetch(true);
            setOuterModalVisible(false);
          }}
        >
          <View style={[styles.submitButtonContainer2, styles.centerView]}>
            <Text style={styles.submitButtonText}>Submit</Text>
          </View>
        </TouchableOpacity>
      )}
      <AddAnswerModal
        {...{
          answerInput,
          answers,
          modalVisible,
          pollData,
          riseAnimationProgress,
          setAnswerInput,
          setModalVisible,
          setAnswers,
          selectedAnswer,
          scrollViewRef,
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeadingText: {
    fontFamily: "Lato_400Regular",
    color: "rgb(133, 59, 48)",
    fontSize: 17.5,
  },
  addAnswerButton1: {
    fontSize: 50,
    color: "rgb(133, 59, 48)",
  },
  addAnswerButton2: {
    fontSize: 50,
    color: "rgba(114, 47, 55, 0.5)",
    position: "absolute",
  },
  shadowContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  createAnswerModalInner: {
    width: "90%",
    minHeight: 200,
    backgroundColor: "#FFF",
    borderRadius: 7.5,
    padding: 10,
  },
  modalLabel: {
    fontSize: 30,
    fontFamily: "Lato_400Regular",
    color: "rgb(133, 59, 48)",
    alignSelf: "center",
  },
  answerVariantContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  variantButtonContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: "rgb(133, 59, 48)",
    borderRadius: 5,
  },
  variantButtonText: {
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
  },
  answerTextInput: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderColor: "rgb(133, 59, 48)",
    borderRadius: 7.5,
    textAlign: "center",
    color: "rgb(133, 59, 48)",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
  },
  answerModalBottomButtons: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingLeft: 50,
    paddingRight: 50,
  },
  answerPreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 5,
    padding: 5,
    borderColor: "#FFF",
    borderWidth: 1,
    marginBottom: 20,
  },
  answerPreviewType: {
    alignSelf: "center",
    fontSize: 12.5,
    color: "#FFF",
    fontFamily: "Lato_400Regular",
  },
  answerTextContainer: {
    width: "100%",
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 5,
  },
  answerText: {
    width: "100%",
    maxHeight: "100%",
    textAlign: "center",
    color: "rgb(133, 59, 48)",
    fontFamily: "Lato_400Regular",
    fontSize: 12.5,
  },
  answerPreviewHolder: {
    width: "100%",
    backgroundColor: "rgb(133, 59, 48)",
    borderRadius: 7.5,
  },
  answerPreviewHolderInner: {
    width: "100%",
    flex: 1,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 7.5,
    padding: 10,
  },
  answerPreviewMask: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 5,
    backgroundColor: "#FFF",
    alignSelf: "center",
  },
  answerPreviewButtonContainer: {
    padding: 5,
    borderRadius: 5,
    backgroundColor: "rgb(133, 59, 48)",
    transform: [{ scaleX: -1 }],
    width: "60%",
  },
  submitButtonContainer: {
    backgroundColor: "rgb(133, 59, 48)",
    borderRadius: 5,
    width: 75,
    alignSelf: "center",
  },
  submitButtonContainer2: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    width: "100%",
    flex: 1,
    borderRadius: 5,
    padding: 10,
  },
  submitButtonText: {
    fontSize: 17.5,
    fontFamily: "Lato_400Regular",
    color: "#FFF",
  },
});
