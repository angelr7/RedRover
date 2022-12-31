import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Spacer, { AnimatedSpacer } from "./Spacer";
import React, { useState, useRef, useEffect } from "react";
import {
  createDraftQuestion,
  PollDraftInfo,
  QuestionData,
  updatePollDraftQuestion,
} from "../firebase";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AddQuestionsModal2Props {
  userData: {
    admin: boolean;
    createdAt: string;
    email: string;
    id: string;
    intakeSurvey: boolean;
  };

  questionsModalActive: PollDraftInfo | undefined;
  setQuestionsModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
}

interface Question extends QuestionData {
  id: string;
}
interface Category {
  name: "Multiple Choice" | "Free Response" | "Ranking" | "Range (Slider)";
  iconName: string;
}

const MCAnswer = ({
  answers,
  answer,
  index,
  setAnswers,
}: {
  answers: string[];
  answer: string;
  index: number;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [open, setOpen] = useState(false);
  const growAnimationRef = useRef(new Animated.Value(0)).current;
  const deleteButtonGrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(growAnimationRef, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(deleteButtonGrow, {
      toValue: open ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [open]);

  return (
    <Animated.View style={{ transform: [{ scale: growAnimationRef }] }}>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{
          justifyContent: "center",
          width: 300,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#853b30",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            padding: 20,
          }}
        >
          {answer}
        </Text>
        <Animated.View
          style={[
            styles.centerView,
            {
              position: "absolute",
              backgroundColor: "#FFF",
              height: "100%",
              right: 0,
              borderColor: "#853b30",
              width: deleteButtonGrow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 75],
              }),
              borderWidth: deleteButtonGrow.interpolate({
                inputRange: [0, 0.05],
                outputRange: [0, 2.5],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() =>
              setAnswers(
                answers.filter((_val, curr_index) => curr_index !== index)
              )
            }
            style={[styles.centerView, { width: "100%", height: "100%" }]}
          >
            <FontAwesome5
              name="trash-alt"
              style={{ fontSize: 25, color: "#853b30" }}
            />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
      {index !== answers.length - 1 && (
        <>
          <Spacer width="100%" height={20} />
          <View
            style={{
              backgroundColor: "#853b3025",
              width: "100%",
              height: 1,
            }}
          />
          <Spacer width="100%" height={20} />
        </>
      )}
    </Animated.View>
  );
};

export default function MCAnswers({
  userData,
  answers,
  setAnswers,
  question,
  questions,
  setQuestions,
  setVisible,
  editQuestion,
  setEditQuestion,
  questionsModalActive,
  setAddAnswersActive,
  setDraftsChanged,
}: {
  editQuestion: Question | undefined;
  setEditQuestion: React.Dispatch<React.SetStateAction<Question | undefined>>;
  userData: AddQuestionsModal2Props["userData"];
  question: string;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questionsModalActive: PollDraftInfo;
  setAddAnswersActive: React.Dispatch<
    React.SetStateAction<Category | undefined>
  >;
  setDraftsChanged: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [newAnswer, setNewAnswer] = useState("");
  const [triggerFade, setTriggerFade] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const buttonFadeRef = useRef(new Animated.Value(0)).current;
  const submitButtonRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (newAnswer === "") setTriggerFade(false);
    else setTriggerFade(!answers.includes(newAnswer));
  }, [newAnswer]);

  useEffect(() => {
    Animated.timing(buttonFadeRef, {
      toValue: triggerFade ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [triggerFade]);

  useEffect(() => {
    Animated.timing(submitButtonRef, {
      toValue: answers.length === 0 ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [answers]);

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <View style={{ flexDirection: "row" }}>
        <TextInput
          multiline
          selectionColor={"#FFF"}
          value={newAnswer}
          onChangeText={(text) => setNewAnswer(text)}
          style={{
            flex: 1,
            minHeight: 50,
            maxHeight: 200,
            backgroundColor: "#853b30",
            borderRadius: 5,
            padding: 10,
            paddingTop: 15,
            fontFamily: "Lato_400Regular",
            fontSize: 17.5,
            color: "#FFF",
            alignItems: "center",
          }}
        />
        <AnimatedSpacer
          height="100%"
          width={buttonFadeRef.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          })}
        />
        <AnimatedTouchable
          disabled={newAnswer === ""}
          onPress={() => {
            setAnswers(answers.concat(newAnswer));
            setNewAnswer("");
          }}
          style={[
            styles.centerView,
            {
              backgroundColor: "#853b30",
              borderRadius: 5,
              opacity: buttonFadeRef,
              padding: buttonFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10],
              }),
              height: buttonFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
              width: buttonFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
            },
          ]}
        >
          <Animated.Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 17.5,
              opacity: buttonFadeRef.interpolate({
                inputRange: [0.975, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            Add
          </Animated.Text>
        </AnimatedTouchable>
      </View>

      <Spacer width="100%" height={40} />
      <ScrollView style={{ flex: 1 }}>
        {answers.map((answer, index) => (
          <MCAnswer
            key={index}
            {...{ answer, answers, index, setAnswers, questions, setQuestions }}
          />
        ))}
        <Spacer width="100%" height={40} />
        <AnimatedTouchable
          disabled={answers.length === 0 || buttonDisabled}
          onPress={() => {
            setDraftsChanged(true);
            if (editQuestion !== undefined) {
              updatePollDraftQuestion(
                userData.id,
                questionsModalActive.id,
                editQuestion.id,
                { answers, question, category: "Multiple Choice" }
              ).then((result) => {
                // find question and update it
                for (let i = 0; i < questions.length; i++) {
                  if (questions[i].id === result)
                    questions[i] = {
                      answers,
                      question,
                      id: result,
                      category: "Multiple Choice",
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
                answers,
                question,
                category: "Multiple Choice",
              }).then((result) => {
                setQuestions(
                  questions.concat({
                    answers,
                    question,
                    id: result,
                    category: "Multiple Choice",
                  })
                );
                setVisible(false);
              });
            }
            setButtonDisabled(true);
          }}
          style={{
            alignSelf: "center",
            padding: 12.5,
            backgroundColor: "#853b30",
            borderRadius: 5,
            opacity: submitButtonRef,
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 17.5,
            }}
          >
            Submit
          </Text>
        </AnimatedTouchable>
        <Spacer width="100%" height={40} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerView: {
    alignItems: "center",
    justifyContent: "center",
  },
});
