import Spacer from "./Spacer";
import Slider from "@react-native-community/slider";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  PollDraftInfo,
  QuestionData,
  createDraftQuestion,
  updatePollDraftQuestion,
} from "../firebase";

interface Category {
  name: "Multiple Choice" | "Free Response" | "Ranking" | "Range (Slider)";
  iconName: string;
}
interface Question extends QuestionData {
  id: string;
}
interface FreeResponseAnswersProps {
  userData: {
    admin: boolean;
    createdAt: string;
    email: string;
    id: string;
    intakeSurvey: boolean;
  };
  question: string;
  questionsModalActive: PollDraftInfo | undefined;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  editQuestion: Question | undefined;
  setEditQuestion: React.Dispatch<React.SetStateAction<Question | undefined>>;
  setAddAnswersActive: React.Dispatch<
    React.SetStateAction<Category | undefined>
  >;
  setDraftsChanged: React.Dispatch<React.SetStateAction<boolean>>;
}
interface FreeResponseQuestionPreviewProps {
  multiline: boolean;
  wordCount: number;
  letterCount: number;
}

const FreeResponseQuestionPreview = ({
  multiline,
  wordCount,
  letterCount,
}: FreeResponseQuestionPreviewProps) => {
  return (
    <View
      style={{
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "space-evenly",
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 17.5,
          color: "#FFF",
        }}
      >
        Word Count: {wordCount}
      </Text>
      <Text
        style={{
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 17.5,
          color: "#FFF",
        }}
      >
        Letter Count: {letterCount}
      </Text>
      <Text
        style={{
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 17.5,
          color: "#FFF",
        }}
      >
        {multiline
          ? "Allows multiline responses."
          : "Does not allow multiline responses."}
      </Text>
    </View>
  );
};

export default function FreeResponseAnswers({
  userData,
  question,
  questions,
  setVisible,
  setQuestions,
  editQuestion,
  setEditQuestion,
  setAddAnswersActive,
  questionsModalActive,
  setDraftsChanged,
}: FreeResponseAnswersProps) {
  const [valid, setValid] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [wordCount, setWordCount] = useState(
    editQuestion !== undefined ? editQuestion.wordCount : 0
  );
  const [letterCount, setLetterCount] = useState(
    editQuestion !== undefined ? editQuestion.letterCount : 0
  );
  const [multiline, setMultiline] = useState<boolean | undefined>(
    editQuestion !== undefined ? editQuestion.multiline : undefined
  );
  const yesButtonFade = useRef(new Animated.Value(0)).current;
  const noButtonFade = useRef(new Animated.Value(0)).current;
  const submitButtonFade = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (multiline === undefined) {
      setValid(false);
      Animated.parallel([
        Animated.timing(yesButtonFade, {
          toValue: 0,
          useNativeDriver: false,
          duration: 250,
        }),
        Animated.timing(noButtonFade, {
          toValue: 0,
          useNativeDriver: false,
          duration: 250,
        }),
      ]).start();
    } else {
      setValid(true);
      if (multiline) {
        Animated.parallel([
          Animated.timing(yesButtonFade, {
            toValue: 1,
            useNativeDriver: false,
            duration: 250,
          }),
          Animated.timing(noButtonFade, {
            toValue: 0,
            useNativeDriver: false,
            duration: 250,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(yesButtonFade, {
            toValue: 0,
            useNativeDriver: false,
            duration: 250,
          }),
          Animated.timing(noButtonFade, {
            toValue: 1,
            useNativeDriver: false,
            duration: 250,
          }),
        ]).start();
      }
    }
  }, [multiline]);

  useEffect(() => {
    Animated.timing(submitButtonFade, {
      toValue: valid ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [valid]);

  return (
    <View style={[styles.centerView, { flex: 1, width: "100%" }]}>
      <View style={{ width: "100%", flex: 1 }} />
      <View style={{ width: "100%" }}>
        <View style={{ flexDirection: "row" }}>
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
            }}
          >
            Word Count:
          </Text>
          <View style={[styles.centerView, { flex: 1 }]}>
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#853b30",
              }}
            >
              {wordCount === 0 ? "Unlimited" : wordCount}
            </Text>
          </View>
        </View>
        <Spacer width={"100%"} height={20} />
        <View
          style={{
            width: "100%",
            padding: 20,
            backgroundColor: "#853b30",
            borderRadius: 10,
          }}
        >
          <Slider
            step={1}
            value={wordCount}
            minimumValue={0}
            maximumValue={1000}
            minimumTrackTintColor={"#FFF"}
            maximumTrackTintColor={"#FFF"}
            thumbTintColor={"#FFF"}
            style={{ width: "100%" }}
            onValueChange={(value) => {
              setWordCount(value);
            }}
          />
        </View>
      </View>
      <Spacer width="100%" height={40} />
      <View style={{ width: "100%" }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
            }}
          >
            Letter Count:
          </Text>
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#853b30",
              }}
            >
              {letterCount === 0 ? "Unlimited" : letterCount}
            </Text>
          </View>
        </View>
        <Spacer width="100%" height={20} />
        <View
          style={{
            width: "100%",
            padding: 20,
            backgroundColor: "#853b30",
            borderRadius: 10,
          }}
        >
          <Slider
            step={1}
            value={letterCount}
            minimumValue={0}
            maximumValue={1000}
            minimumTrackTintColor={"#FFF"}
            maximumTrackTintColor={"#FFF"}
            thumbTintColor={"#FFF"}
            style={{ width: "100%" }}
            onValueChange={(value) => {
              setLetterCount(value);
            }}
          />
        </View>
      </View>
      <Spacer width="100%" height={40} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#853b30",
        }}
      >
        Multiline Answer?
      </Text>
      <Spacer width="100%" height={20} />
      <View
        style={[
          styles.centerView,
          {
            flexDirection: "row",
          },
        ]}
      >
        <AnimatedTouchable
          onPress={() => {
            if (multiline) setMultiline(undefined);
            else setMultiline(true);
          }}
          style={{
            padding: 10,
            borderWidth: 2.5,
            borderRadius: 5,
            borderColor: yesButtonFade.interpolate({
              inputRange: [0, 1],
              outputRange: ["#853b30", "#FFF"],
            }),
            backgroundColor: yesButtonFade.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: yesButtonFade.interpolate({
                inputRange: [0, 1],
                outputRange: ["#853b30", "#FFF"],
              }),
            }}
          >
            Yes
          </Animated.Text>
        </AnimatedTouchable>
        <Spacer width={20} height={"100%"} />
        <AnimatedTouchable
          onPress={() => {
            // !multiline isn't a good enough check b/c it can be undefined
            if (multiline === false) setMultiline(undefined);
            else setMultiline(false);
          }}
          style={{
            padding: 10,
            borderWidth: 2.5,
            borderRadius: 5,
            borderColor: noButtonFade.interpolate({
              inputRange: [0, 1],
              outputRange: ["#853b30", "#FFF"],
            }),
            backgroundColor: noButtonFade.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: noButtonFade.interpolate({
                inputRange: [0, 1],
                outputRange: ["#853b30", "#FFF"],
              }),
            }}
          >
            No
          </Animated.Text>
        </AnimatedTouchable>
      </View>
      <View style={{ width: "100%", flex: 1 }} />
      <AnimatedTouchable
        disabled={!valid || buttonDisabled}
        onPress={() => {
          setDraftsChanged(true);
          if (editQuestion !== undefined) {
            updatePollDraftQuestion(
              userData.id,
              questionsModalActive.id,
              editQuestion.id,
              {
                question,
                multiline,
                wordCount,
                letterCount,
                answers: [],
                category: "Free Response",
              }
            ).then((result) => {
              // find question and update it
              for (let i = 0; i < questions.length; i++) {
                if (questions[i].id === result)
                  questions[i] = {
                    question,
                    multiline,
                    wordCount,
                    letterCount,
                    id: result,
                    answers: [],
                    category: "Free Response",
                  };
                setQuestions(questions);
                break;
              }

              // set remaining variables to exit
              // for some reason, the visible call doesn't always register
              setEditQuestion(undefined);
              setAddAnswersActive(undefined);
              setVisible(false);
            });
            setButtonDisabled(true);
          } else {
            createDraftQuestion(userData.id, questionsModalActive.id, {
              question,
              multiline,
              wordCount,
              letterCount,
              answers: [],
              category: "Free Response",
            }).then((result) => {
              setQuestions(
                questions.concat({
                  question,
                  multiline,
                  wordCount,
                  letterCount,
                  answers: [],
                  id: result,
                  category: "Free Response",
                })
              );
              setVisible(false);
            });
            setButtonDisabled(true);
          }
        }}
        style={{
          backgroundColor: "#853b30",
          alignSelf: "center",
          padding: 10,
          borderRadius: 5,
          opacity: submitButtonFade,
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
          }}
        >
          Submit
        </Text>
      </AnimatedTouchable>
      <View style={{ width: "100%", flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export { FreeResponseQuestionPreview };
