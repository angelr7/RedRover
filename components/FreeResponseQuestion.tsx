import Spacer, { AnimatedSpacer } from "./Spacer";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  Animated,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import { createQuestion, editQuestion } from "../firebase";
import { Question } from "../screens/CreatePollScreen";

interface FreeResponseProps {
  pollID: string;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  questionText: string;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  currQuestion: Question;
}

const handleMoveUp = (
  spacerHeight: Animated.Value,
  scrollViewRef: React.MutableRefObject<ScrollView>
) => {
  Animated.timing(spacerHeight, {
    toValue: 1,
    duration: 125,
    useNativeDriver: false,
  }).start(() => {
    if (scrollViewRef.current !== null)
      scrollViewRef.current.scrollToEnd({ animated: true });
  });
};

const handleMoveDown = (spacerHeight: Animated.Value) => {
  Animated.timing(spacerHeight, {
    toValue: 0,
    duration: 300, // roughly matches the time of expanding + scrolling
    useNativeDriver: false,
  }).start();
};

const handleTypingAnimations = (
  questionText: string,
  fadeAnimationProgress: Animated.Value,
  charLimit: string,
  characterLimitApproved: boolean,
  setCharacterLimitApproved: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (questionText === "") setCharacterLimitApproved(false);
    else {
      const parsed = parseInt(charLimit);
      if (Number.isNaN(parsed) || !Number.isFinite(parsed))
        setCharacterLimitApproved(false);
      else setCharacterLimitApproved(true);
    }
  }, [charLimit, questionText]);

  useEffect(() => {
    if (characterLimitApproved)
      Animated.timing(fadeAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(fadeAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [characterLimitApproved]);
};

export default function FreeResponse({
  pollID,
  questions,
  questionText,
  scrollViewRef,
  setQuestions,
  setOuterModalVisible,
  currQuestion,
}: FreeResponseProps) {
  const [placeholder, setPlaceholder] = useState("Enter a character limit...");
  const [characterLimitApproved, setCharacterLimitApproved] = useState(false);
  const [charLimit, setCharLimit] = useState(
    currQuestion !== undefined ? currQuestion.answers[0].answerText : ""
  );
  const spacerHeight = useRef(new Animated.Value(0)).current;
  const fadeAnimationProgress = useRef(new Animated.Value(0)).current;

  handleTypingAnimations(
    questionText,
    fadeAnimationProgress,
    charLimit,
    characterLimitApproved,
    setCharacterLimitApproved
  );

  return (
    <>
      <Text style={styles.heading}>Character Limit</Text>
      <Spacer width="100%" height={10} />
      <Animated.View style={[styles.inputWrapper]}>
        <TextInput
          style={styles.inputStyle}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor="#FFF"
          value={charLimit}
          onChangeText={(text) => setCharLimit(text)}
          onFocus={() => {
            handleMoveUp(spacerHeight, scrollViewRef);
            setPlaceholder("");
          }}
          onBlur={() => {
            handleMoveDown(spacerHeight);
            setPlaceholder("Enter a character limit...");
          }}
        />
      </Animated.View>
      <Spacer width="100%" height={10} />
      <Animated.View
        style={[styles.wineShade, { opacity: fadeAnimationProgress }]}
      >
        <TouchableOpacity
          style={styles.submitButton}
          disabled={!characterLimitApproved}
          onPress={async () => {
            const editing = currQuestion !== undefined;
            let questionData: Question;
            if (!editing) {
              questionData = await createQuestion(
                pollID,
                "Free Response",
                questionText,
                [
                  {
                    answerText: charLimit,
                    answerType: "Free Response",
                    answerVariant: "undefined",
                  },
                ]
              );
              setQuestions(questions.concat([questionData]));
            } else {
              questionData = await editQuestion(
                pollID,
                currQuestion.id,
                "Free Response",
                questionText,
                [
                  {
                    answerText: charLimit,
                    answerType: "Free Response",
                    answerVariant: "undefined",
                  },
                ]
              );
            }
            setOuterModalVisible(false);
          }}
        >
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      </Animated.View>
      <AnimatedSpacer
        width="100%"
        height={spacerHeight.interpolate({
          inputRange: [0, 1],
          outputRange: [1, SCREEN_HEIGHT * 0.3],
        })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 17.5,
    color: "rgb(133, 59, 48)",
  },
  inputWrapper: {
    backgroundColor: "rgb(133, 59, 48)",
    borderRadius: 7.5,
  },
  inputStyle: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 7.5,
    padding: 10,
    minHeight: 100,
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
    textAlign: "center",
  },
  submitButton: {
    padding: 10,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    alignSelf: "center",
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
  },
  wineShade: {
    backgroundColor: "rgb(133, 59, 48)",
    alignSelf: "center",
    borderRadius: 5,
  },
});
