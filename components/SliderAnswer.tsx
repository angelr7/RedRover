import Spacer, { AnimatedSpacer } from "./Spacer";
import { useEffect, useRef, useState } from "react";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import {
  createDraftQuestion,
  updatePollDraftQuestion,
  PollDraftInfo,
  QuestionData,
} from "../firebase";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  TextInput,
} from "react-native";

interface Question extends QuestionData {
  id: string;
}
interface Category {
  name: "Multiple Choice" | "Range (Slider)" | "Ranking" | "Range (Slider)";
  iconName: string;
}
interface SliderAnswerProps {
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

const SliderAnswerQuestionPreview = ({
  minRange,
  maxRange,
  inDollars,
}: {
  minRange: number;
  maxRange: number;
  inDollars: boolean;
}) => (
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
        fontFamily: "Lato_400Regular",
        fontSize: 20,
        color: "#FFF",
      }}
    >{`Minimum Number: ${inDollars ? "$" : ""}${minRange}`}</Text>
    <Text
      style={{
        fontFamily: "Lato_400Regular",
        fontSize: 20,
        color: "#FFF",
      }}
    >{`Maximum Number: ${inDollars ? "$" : ""}${maxRange}`}</Text>
  </View>
);

export default function SliderAnswer({
  editQuestion,
  question,
  questions,
  questionsModalActive,
  setAddAnswersActive,
  setEditQuestion,
  setQuestions,
  setVisible,
  userData,
  setDraftsChanged,
}: SliderAnswerProps) {
  const [dollarRange, setDollarRange] = useState<boolean | undefined>(
    editQuestion !== undefined ? editQuestion.dollarSign : undefined
  );
  const [isValid, setIsValid] = useState(
    editQuestion !== undefined ? true : false
  );
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [minRangeText, setMinRangeText] = useState(
    editQuestion !== undefined ? `${editQuestion.minRange}` : ""
  );
  const [maxRangeText, setMaxRangeText] = useState(
    editQuestion !== undefined ? `${editQuestion.maxRange}` : ""
  );
  const [minRange, setMinRange] = useState<number | undefined>(
    editQuestion !== undefined ? editQuestion.minRange : 0
  );
  const [maxRange, setMaxRange] = useState<number | undefined>(
    editQuestion !== undefined ? editQuestion.maxRange : 0
  );
  const noButtonFade = useRef(new Animated.Value(0)).current;
  const yesButtonFade = useRef(new Animated.Value(0)).current;
  const dollarAnimation = useRef(new Animated.Value(0)).current;
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;
  const submitButtonOpacity = useRef(new Animated.Value(0)).current;
  const negativeButtonAnimation = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (dollarRange === undefined) {
      Animated.parallel([
        Animated.timing(noButtonFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesButtonFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else if (dollarRange) {
      Animated.parallel([
        Animated.timing(noButtonFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesButtonFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(noButtonFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesButtonFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [dollarRange]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(dollarAnimation, {
        toValue: dollarRange ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(negativeButtonAnimation, {
        toValue: dollarRange === false ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [dollarRange]);

  useEffect(() => {
    if (
      minRange !== undefined &&
      maxRange !== undefined &&
      dollarRange !== undefined
    ) {
      setIsValid(minRange < maxRange);
    } else {
      setIsValid(false);
    }
  }, [dollarRange, minRange, maxRange]);

  useEffect(() => {
    Animated.timing(submitButtonOpacity, {
      toValue: isValid ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isValid]);

  return (
    <Animated.View
      style={[
        styles.centerView,
        {
          flex: 1,
          width: "100%",
          transform: [
            {
              translateY: keyboardDodgeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -SCREEN_HEIGHT / 4],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#853b30",
          transform: [
            {
              scale: keyboardDodgeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            },
          ],
        }}
      >
        Use Dollars?
      </Animated.Text>
      <Spacer width="100%" height={20} />
      <Animated.View
        style={[
          styles.centerView,
          {
            width: "100%",
            flexDirection: "row",
            transform: [
              {
                scale: keyboardDodgeRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ],
          },
        ]}
      >
        <AnimatedTouchable
          onPress={() => {
            if (dollarRange) setDollarRange(undefined);
            else setDollarRange(true);
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
        <Spacer width={20} height="100%" />
        <AnimatedTouchable
          onPress={() => {
            if (dollarRange === false) setDollarRange(undefined);
            else setDollarRange(false);
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
      </Animated.View>
      <Spacer width="100%" height={40} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#853b30",
        }}
      >
        Enter a Minimum Range
      </Text>
      <Spacer width="100%" height={20} />
      <View
        style={{ width: "100%", flexDirection: "row", alignItems: "center" }}
      >
        <Animated.View
          style={{
            justifyContent: "center",
            alignItems: "center",
            width: dollarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 15 + 20],
            }),
            height: dollarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 40],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
              transform: [
                {
                  scale: dollarAnimation.interpolate({
                    inputRange: [0.75, 1],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            $
          </Animated.Text>
        </Animated.View>
        <AnimatedTouchable
          onPress={() => {
            setMinRangeText(`${minRange * -1}`);
            setMinRange(minRange * -1);
          }}
          style={[
            styles.centerView,
            {
              width: negativeButtonAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 15 + 20],
              }),
            },
          ]}
        >
          <Animated.Text
            style={{
              top: -5,
              fontFamily: "Lato_400Regular",
              fontSize: 40,
              color: "#853b30",
              textAlignVertical: "center",
              transform: [
                {
                  scale: negativeButtonAnimation.interpolate({
                    inputRange: [0.75, 1],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            {"-"}
          </Animated.Text>
        </AnimatedTouchable>
        <TextInput
          selectionColor="#FFF"
          keyboardType={dollarRange ? "number-pad" : "decimal-pad"}
          value={minRangeText}
          onChangeText={(text) => setMinRangeText(text)}
          onFocus={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          onBlur={() => {
            Animated.timing(keyboardDodgeRef, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start();

            const parsed = parseFloat(minRangeText);
            if (Number.isNaN(parsed)) setMinRange(undefined);
            else setMinRange(parsed);
            setMinRange(parseFloat(minRangeText));
          }}
          style={{
            flex: 1,
            padding: 15,
            borderRadius: 10,
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            backgroundColor: "#853b30",
            fontSize: 20,
            textAlign: "center",
          }}
        />
        <AnimatedSpacer
          height="100%"
          width={dollarAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          })}
        />
        <AnimatedSpacer
          height="100%"
          width={negativeButtonAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          })}
        />
      </View>
      <Spacer width="100%" height={40} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#853b30",
        }}
      >
        Enter a Maximum Range
      </Text>
      <Spacer width="100%" height={20} />
      <View
        style={{ width: "100%", flexDirection: "row", alignItems: "center" }}
      >
        <Animated.View
          style={{
            justifyContent: "center",
            alignItems: "center",
            width: dollarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 15 + 20],
            }),
            height: dollarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 40],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
              transform: [
                {
                  scale: dollarAnimation.interpolate({
                    inputRange: [0.75, 1],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            $
          </Animated.Text>
        </Animated.View>
        <AnimatedTouchable
          onPress={() => {
            setMaxRangeText(`${maxRange * -1}`);
            setMaxRange(maxRange * -1);
          }}
          style={[
            styles.centerView,
            {
              width: negativeButtonAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 15 + 20],
              }),
            },
          ]}
        >
          <Animated.Text
            style={{
              top: -5,
              fontFamily: "Lato_400Regular",
              fontSize: 40,
              color: "#853b30",
              textAlignVertical: "center",
              transform: [
                {
                  scale: negativeButtonAnimation.interpolate({
                    inputRange: [0.75, 1],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                },
              ],
            }}
          >
            {"-"}
          </Animated.Text>
        </AnimatedTouchable>
        <TextInput
          selectionColor="#FFF"
          keyboardType={dollarRange ? "number-pad" : "decimal-pad"}
          value={maxRangeText}
          onChangeText={(text) => setMaxRangeText(text)}
          onFocus={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          onBlur={() => {
            Animated.timing(keyboardDodgeRef, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start();

            const parsed = parseFloat(maxRangeText);
            if (Number.isNaN(parsed)) setMaxRange(undefined);
            else setMaxRange(parsed);
          }}
          style={{
            flex: 1,
            padding: 15,
            borderRadius: 10,
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            backgroundColor: "#853b30",
            fontSize: 20,
            textAlign: "center",
          }}
        />
        <AnimatedSpacer
          height="100%"
          width={dollarAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          })}
        />
        <AnimatedSpacer
          height="100%"
          width={negativeButtonAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          })}
        />
      </View>
      <Spacer width="100%" height={40} />
      <AnimatedTouchable
        disabled={!isValid || buttonDisabled}
        onPress={() => {
          setDraftsChanged(true);
          if (editQuestion !== undefined) {
            updatePollDraftQuestion(
              userData.id,
              questionsModalActive.id,
              editQuestion.id,
              {
                question,
                minRange,
                maxRange,
                answers: [],
                category: "Range (Slider)",
                dollarSign: dollarRange ? true : false,
              }
            ).then((result) => {
              // find question and update it
              for (let i = 0; i < questions.length; i++) {
                if (questions[i].id === result)
                  questions[i] = {
                    question,
                    minRange,
                    maxRange,
                    answers: [],
                    category: "Range (Slider)",
                    dollarSign: dollarRange ? true : false,
                    id: result,
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
              minRange,
              maxRange,
              question,
              answers: [],
              category: "Range (Slider)",
              dollarSign: dollarRange ? true : false,
            }).then((result) => {
              setQuestions(
                questions.concat({
                  minRange,
                  maxRange,
                  question,
                  id: result,
                  answers: [],
                  category: "Range (Slider)",
                  dollarSign: dollarRange ? true : false,
                })
              );
              setVisible(false);
            });
            setButtonDisabled(true);
          }
        }}
        style={{
          padding: 10,
          backgroundColor: "#853b30",
          borderRadius: 5,
          opacity: submitButtonOpacity,
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
    </Animated.View>
  );
}

export { SliderAnswerQuestionPreview };

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
});
