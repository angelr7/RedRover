import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef, useState } from "react";
import { AddQuestionsProps } from "../screens/CreatePollScreen";
import { ListEmpty } from "../screens/CreatePolls";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import { Answer, createAnswer } from "../firebase";
import {
  TextInput,
  Text,
  View,
  Modal,
  Animated,
  Keyboard,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

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

const createNewAnswer = async (
  freeResponse: boolean,
  answerInput: string,
  pollData: any,
  answers: any[],
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const answer: Answer = {
    answerType: "Multiple Choice",
    answerVariant: freeResponse ? "Free Response" : "Fixed Response",
    answerText: answerInput,
  };

  const answerData = await createAnswer(
    pollData.author,
    pollData.dateCreated,
    answer
  );
  answers.push(answerData);

  setModalVisible(false);
};

const AnswerPreview = ({
  answerData,
  includeSpacer,
}: {
  answerData: Answer;
  includeSpacer: boolean;
}) => {
  return (
    <View style={styles.answerPreviewContainer}>
      <Text style={styles.answerPreviewType}>{answerData.answerVariant}</Text>
      <Spacer width="100%" height={10} />
      <View style={[styles.centerView, styles.answerTextContainer]}>
        <Text ellipsizeMode="tail" style={styles.answerText}>
          {answerData.answerText}
        </Text>
      </View>
    </View>
  );
};

const AnswerPreviewContainer = ({ answers }) => {
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
            }}
          >
            {answers.map((answer: Answer, index: number) => {
              return (
                <AnswerPreview
                  key={index}
                  answerData={answer}
                  includeSpacer={index !== answers.length - 1}
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
  pollData,
  answers,
}) => {
  const [freeResponse, setFreeResponse] = useState(undefined);
  const [answerInputFocused, setAnswerInputFocused] = useState(false);

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
                    freeResponse === false ? "#D2042D" : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.variantButtonText,
                  {
                    color: freeResponse === false ? "#FFF" : "#D2042D",
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
                  backgroundColor: freeResponse ? "#D2042D" : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.variantButtonText,
                  {
                    color: freeResponse ? "#FFF" : "#D2042D",
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
            placeholder={answerInputFocused ? "" : "Enter your answer here..."}
            placeholderTextColor={"#D2042D"}
          />
          <Spacer width="100%" height={10} />
          <View style={styles.answerModalBottomButtons}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
              }}
              style={styles.variantButtonContainer}
            >
              <Text style={styles.modalHeadingText}>Cancel</Text>
            </TouchableOpacity>
            {answerInput !== "" && freeResponse !== undefined && (
              <TouchableOpacity
                onPress={() => {
                  createNewAnswer(
                    freeResponse,
                    answerInput,
                    pollData,
                    answers,
                    setModalVisible
                  );
                }}
                style={[
                  styles.variantButtonContainer,
                  {
                    backgroundColor: "#D2042D",
                  },
                ]}
              >
                <Text style={styles.modalHeadingText}>Submit</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function MultipleChoice({
  pollData,
}: {
  pollData: AddQuestionsProps["pollData"];
}) {
  const [modalVisible, setModalVisible] = useState(false);
  const [answerInput, setAnswerInput] = useState("");

  const riseAnimationProgress = useRef(new Animated.Value(0)).current;
  const answers = useRef([]).current;

  handleAnimations(riseAnimationProgress, answerInput);

  return (
    <>
      <Text style={styles.modalHeadingText}>Answers</Text>
      <Spacer width="100%" height={10} />
      <AnswerPreviewContainer answers={answers} />
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        style={{ alignSelf: "center" }}
        onPress={() => {
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" style={styles.addAnswerButton1} />
        <Ionicons name="add-circle" style={styles.addAnswerButton2} />
      </TouchableOpacity>
      <AddAnswerModal
        {...{
          answerInput,
          answers,
          modalVisible,
          pollData,
          riseAnimationProgress,
          setAnswerInput,
          setModalVisible,
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
    fontFamily: "Actor_400Regular",
    color: "#D2042D",
    fontSize: 17.5,
  },
  addAnswerButton1: {
    fontSize: 50,
    color: "#D2042D",
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
    fontFamily: "Actor_400Regular",
    color: "#D2042D",
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
    borderColor: "#D2042D",
    borderRadius: 5,
  },
  variantButtonText: {
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
  },
  answerTextInput: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#D2042D",
    borderRadius: 7.5,
    textAlign: "center",
    color: "#D2042D",
    fontFamily: "Actor_400Regular",
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
  },
  answerPreviewType: {
    alignSelf: "center",
    fontSize: 12.5,
    color: "#FFF",
    fontFamily: "Actor_400Regular",
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
    color: "#D2042D",
    fontFamily: "Actor_400Regular",
    fontSize: 12.5,
  },
  answerPreviewHolder: {
    width: "100%",
    backgroundColor: "#D2042D",
    borderRadius: 7.5,
  },
  answerPreviewHolderInner: {
    width: "100%",
    flex: 1,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 7.5,
    padding: 20,
  },
});
