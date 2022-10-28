import Spacer from "./Spacer";
import Slider from "@react-native-community/slider";
import React, { useEffect, useRef, useState } from "react";
import { createQuestion } from "../firebase";
import { Question } from "../screens/CreatePollScreen";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type NumberAnswerVariant = "Percentage" | "Number" | "Dollars";
interface VariantButtonContainerProps {
  variant: NumberAnswerVariant;
  setVariant: React.Dispatch<React.SetStateAction<NumberAnswerVariant>>;
}
interface RangeSliderContainerProps {
  variant: NumberAnswerVariant;
  minValue: number;
  maxValue: number;
  setMinValue: React.Dispatch<React.SetStateAction<number>>;
  setMaxValue: React.Dispatch<React.SetStateAction<number>>;
}
interface NumberAnswerProps {
  pollID: string;
  questionText: string;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  currQuestion: Question;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
interface RangeInputContainerProps {
  showDollarSign: boolean;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  inputVal1: string;
  inputVal2: string;
  setInputVal1: React.Dispatch<React.SetStateAction<string>>;
  setInputVal2: React.Dispatch<React.SetStateAction<string>>;
  setInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
}

const handleFadeAnimation = (
  fadeAnimationProgress: Animated.Value,
  invalidRange: boolean,
  animationTriggered: boolean,
  setAnimationTriggered: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (!animationTriggered) {
      setAnimationTriggered(true);
      if (invalidRange) {
        Animated.timing(fadeAnimationProgress, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setAnimationTriggered(false));
      } else {
        Animated.timing(fadeAnimationProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setAnimationTriggered(false));
      }
    }
  }, [invalidRange]);
};

const handleRiseAnimation = (
  inputFocused: boolean,
  riseAnimationProgress: Animated.Value
) => {
  useEffect(() => {
    if (inputFocused)
      Animated.timing(riseAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(riseAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [inputFocused]);
};

const isRangeInvalid = (
  variant: NumberAnswerVariant,
  questionText: string,
  inputVal1: string,
  inputVal2: string,
  minValue: number,
  maxValue: number
) => {
  if (variant === "Number") {
    if (questionText === "" || inputVal1 === "" || inputVal2 === "")
      return true;
    const re = /^[0-9]+$/;
    if (!re.test(inputVal1) || !re.test(inputVal2)) return true;
    else {
      const num1 = parseInt(inputVal1);
      const num2 = parseInt(inputVal2);
      return num1 >= num2;
    }
  } else return minValue === maxValue || questionText === "";
};

const VariantButtonContainer = ({
  variant,
  setVariant,
}: VariantButtonContainerProps) => {
  const selectedButtonText = { color: "rgb(133, 59, 48)" };
  const selectedButtonContainer = { backgroundColor: "#FFF" };

  return (
    <View style={styles.outerRed}>
      <View style={[styles.wineColor, styles.buttonHolder]}>
        <TouchableOpacity
          onPress={() => setVariant("Percentage")}
          style={[
            styles.buttonContainer,
            variant === "Percentage" && selectedButtonContainer,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Percentage" && selectedButtonText,
            ]}
          >
            Percentage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVariant("Number")}
          style={[
            styles.buttonContainer,
            variant === "Number" && selectedButtonContainer,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Number" && selectedButtonText,
            ]}
          >
            Number
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVariant("Dollars")}
          style={[
            styles.buttonContainer,
            variant === "Dollars" && selectedButtonContainer,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Dollars" && selectedButtonText,
            ]}
          >
            Dollars
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RangeSliders = ({
  variant,
  minValue,
  maxValue,
  setMinValue,
  setMaxValue,
}: RangeSliderContainerProps) => {
  return (
    <>
      <View style={styles.rangeInputContainer}>
        <View>
          <Text style={styles.innerContainerText}>Min Value</Text>
          <Text style={styles.sliderValue}>
            {minValue <= maxValue ? minValue : maxValue}
            {variant === "Percentage" && "%"}
          </Text>
        </View>
        <Spacer width={10} height="100%" />
        <View style={[styles.centerView, styles.sliderContainer]}>
          <Slider
            step={1}
            value={minValue > maxValue ? maxValue : minValue}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={"#FFF"}
            maximumTrackTintColor={"#FFF"}
            thumbTintColor={"#FFF"}
            style={{ width: "100%" }}
            onValueChange={(value) => {
              setMinValue(value);
            }}
          />
        </View>
      </View>
      <Spacer width="100%" height={20} />
      <View style={styles.rangeInputContainer}>
        <View>
          <Text style={styles.innerContainerText}>Max Value</Text>
          <Text style={styles.sliderValue}>
            {maxValue >= minValue ? maxValue : minValue}
            {variant === "Percentage" && "%"}
          </Text>
        </View>
        <Spacer width={10} height="100%" />
        <View style={[styles.centerView, styles.sliderContainer]}>
          <Slider
            step={1}
            value={maxValue < minValue ? minValue : maxValue}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={"#FFF"}
            maximumTrackTintColor={"#FFF"}
            thumbTintColor={"#FFF"}
            onValueChange={(value) => setMaxValue(value)}
            style={{ width: "100%" }}
          />
        </View>
      </View>
    </>
  );
};

const RangeInputs = ({
  showDollarSign,
  scrollViewRef,
  inputVal1,
  inputVal2,
  setInputVal1,
  setInputVal2,
  setInputFocused,
}: RangeInputContainerProps) => {
  const [placeholder1, setPlaceholder1] = useState("Enter a number...");
  const [placeholder2, setPlaceholder2] = useState("Enter a number...");

  useEffect(() => {
    if (placeholder1 === "" || placeholder2 === "") setInputFocused(true);
    else if (placeholder1 !== "" && placeholder2 !== "") setInputFocused(false);
  }, [placeholder1, placeholder2]);

  return (
    <>
      <View style={[styles.rangeInputContainer, { width: "100%" }]}>
        <Text style={styles.innerContainerText}>Min Value</Text>
        <Spacer width={showDollarSign ? 15 : 20} height="100%" />
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {showDollarSign && (
            <>
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Lato_400Regular",
                  fontSize: 17.5,
                }}
              >
                $
              </Text>
              <Spacer width={5} height={"100%"} />
            </>
          )}
          <TextInput
            style={styles.textInput}
            value={inputVal1}
            placeholder={placeholder1}
            keyboardType="number-pad"
            selectionColor={"rgb(133, 59, 48)"}
            placeholderTextColor={"rgb(133, 59, 48)"}
            onChangeText={(text) => setInputVal1(text)}
            onFocus={() => {
              setPlaceholder1("");
              scrollViewRef.current.scrollToEnd({ animated: true });
            }}
            onBlur={() => setPlaceholder1("Enter a number...")}
          />
        </View>
      </View>
      <Spacer width="100%" height={20} />
      <View style={[styles.rangeInputContainer, { width: "100%" }]}>
        <Text style={styles.innerContainerText}>Max Value</Text>
        <Spacer width={showDollarSign ? 15 : 20} height="100%" />
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          {showDollarSign && (
            <>
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Lato_400Regular",
                  fontSize: 17.5,
                }}
              >
                $
              </Text>
              <Spacer width={5} height={"100%"} />
            </>
          )}
          <TextInput
            style={styles.textInput}
            value={inputVal2}
            placeholder={placeholder2}
            keyboardType="number-pad"
            selectionColor={"rgb(133, 59, 48)"}
            placeholderTextColor={"rgb(133, 59, 48)"}
            onChangeText={(text) => setInputVal2(text)}
            onFocus={() => {
              setPlaceholder2("");
              scrollViewRef.current.scrollToEnd({ animated: true });
            }}
            onBlur={() => setPlaceholder2("Enter a number...")}
          />
        </View>
      </View>
    </>
  );
};

export default function NumberAnswer({
  pollID,
  questionText,
  scrollViewRef,
  questions,
  setQuestions,
  setOuterModalVisible,
  currQuestion,
}: NumberAnswerProps) {
  const [variant, setVariant] = useState<NumberAnswerVariant>(undefined);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [inputVal1, setInputVal1] = useState("");
  const [inputVal2, setInputVal2] = useState("");
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const fadeAnimationProgress = useRef(new Animated.Value(0)).current;
  const riseAnimationProgress = useRef(new Animated.Value(0)).current;

  const invalidRange = isRangeInvalid(
    variant,
    questionText,
    inputVal1,
    inputVal2,
    minValue,
    maxValue
  );

  handleFadeAnimation(
    fadeAnimationProgress,
    invalidRange,
    animationTriggered,
    setAnimationTriggered
  );

  handleRiseAnimation(inputFocused, riseAnimationProgress);

  useEffect(() => {
    if (currQuestion !== undefined) {
      const currVariant: NumberAnswerVariant =
        currQuestion.answers[0].answerVariant === "Percentage"
          ? "Percentage"
          : "Number";
      setVariant(currVariant);
      if (currVariant === "Percentage") {
        setMinValue(parseInt(currQuestion.answers[0].answerText));
        setMaxValue(parseInt(currQuestion.answers[1].answerText));
      } else {
        setInputVal1(currQuestion.answers[0].answerText);
        setInputVal2(currQuestion.answers[1].answerText);
      }
    }
  }, [currQuestion]);

  return (
    <>
      <Text style={styles.heading}>Select Variant</Text>
      <Spacer width="100%" height={10} />
      <VariantButtonContainer variant={variant} setVariant={setVariant} />
      {variant !== undefined && (
        <>
          <Spacer width="100%" height={40} />
          <Animated.View
            style={{
              transform: [
                {
                  translateY: riseAnimationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -155],
                  }),
                },
              ],
            }}
          >
            <Text
              style={[
                styles.heading,
                // need to give some extra coloring for the rise animation
                { width: "100%", backgroundColor: "#FFF" },
              ]}
            >
              Set Range
            </Text>
            <Spacer width="100%" height={10} />
            <View style={styles.outerRed}>
              <View style={styles.wineColor}>
                {variant === "Percentage" ? (
                  <RangeSliders
                    variant={variant}
                    minValue={minValue}
                    maxValue={maxValue}
                    setMinValue={setMinValue}
                    setMaxValue={setMaxValue}
                  />
                ) : (
                  <RangeInputs
                    scrollViewRef={scrollViewRef}
                    inputVal1={inputVal1}
                    inputVal2={inputVal2}
                    setInputVal1={setInputVal1}
                    setInputVal2={setInputVal2}
                    setInputFocused={setInputFocused}
                    showDollarSign={variant === "Dollars"}
                  />
                )}
              </View>
            </View>
          </Animated.View>
          <Spacer width="100%" height={10} />
          <Animated.View
            style={[
              styles.outerSubmitButtonContainer,
              { opacity: fadeAnimationProgress },
            ]}
          >
            <TouchableOpacity
              disabled={invalidRange}
              style={styles.submitButtonContainer}
              onPress={async () => {
                const questionData = await createQuestion(
                  pollID,
                  "Number Answer",
                  questionText,
                  [
                    {
                      answerText: `${
                        variant === "Number" ? inputVal1 : minValue
                      }`,
                      answerType: "Number Answer",
                      answerVariant: variant,
                    },
                    {
                      answerText: `${
                        variant === "Number" ? inputVal2 : maxValue
                      }`,
                      answerType: "Number Answer",
                      answerVariant: variant,
                    },
                  ]
                );
                setQuestions(questions.concat([questionData]));
                setOuterModalVisible(false);
              }}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
    color: "rgb(133, 59, 48)",
  },
  outerRed: {
    backgroundColor: "rgb(133, 59, 48)",
    width: "100%",
    borderRadius: 7.5,
  },
  wineColor: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    width: "100%",
    flex: 1,
    padding: 20,
    borderRadius: 7.5,
  },
  buttonHolder: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    flex: 1,
  },
  buttonContainer: {
    padding: 10,
    borderRadius: 5,
    borderColor: "#FFF",
    borderWidth: 1,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
  },
  innerContainerText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
    width: 80,
  },
  rangeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderContainer: {
    flex: 1,
    height: 30,
    borderRadius: 5,
  },
  sliderValue: {
    color: "#FFF",
  },
  submitButtonContainer: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
  },
  submitButtonText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
  },
  outerSubmitButtonContainer: {
    alignSelf: "center",
    backgroundColor: "rgb(133, 59, 48)",
    borderRadius: 5,
  },
  textInput: {
    flex: 1,
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#FFF",
    color: "rgb(133, 59, 48)",
    textAlign: "center",
    padding: 10,
  },
});
