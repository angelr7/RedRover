import Spacer, { AnimatedSpacer } from "../components/Spacer";
import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { LocalPageScreen } from "./CreatePollScreen";
import {
  SafeAreaView,
  Animated,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from "react-native";

interface InitialPromptProps {
  keyboardHeight: number;
  keyboardAnimationVal: Animated.Value;
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>;
}

const handleIntialPromptAnimations = (
  initialFadeProgress: Animated.Value,
  secondFadeProgress: Animated.Value,
  endAnimationProgress: Animated.Value,
  triggerEndAnimation: boolean,
  inputVal: string,
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>
) => {
  useEffect(() => {
    Animated.parallel([
      Animated.timing(initialFadeProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(secondFadeProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (triggerEndAnimation) {
      Animated.timing(endAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setScreen({
          name: "Description",
          params: {
            title: inputVal,
            description: "",
            previewImageURI: "",
            additionalInfo: "",
          },
        });
      });
    }
  }, [triggerEndAnimation]);
};

export default function InitialPrompt({
  keyboardHeight,
  keyboardAnimationVal,
  setScreen,
}: InitialPromptProps) {
  const initialFadeProgress = useRef(new Animated.Value(0)).current;
  const secondFadeProgress = useRef(new Animated.Value(0)).current;
  const endAnimationProgress = useRef(new Animated.Value(0)).current;

  const [inputVal, setInputVal] = useState("");
  const [triggerEndAnimation, setTriggerEndAnimation] = useState(false);

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  handleIntialPromptAnimations(
    initialFadeProgress,
    secondFadeProgress,
    endAnimationProgress,
    triggerEndAnimation,
    inputVal,
    setScreen
  );

  return (
    <SafeAreaView style={[styles.mainContainer, styles.centerView]}>
      <Animated.View
        style={[
          styles.centerView,
          {
            width: "100%",
            transform: [
              {
                translateY: keyboardAnimationVal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, keyboardHeight / -2],
                }),
              },
            ],
            opacity: endAnimationProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <Animated.Text
          style={[styles.bigPromptText, { opacity: initialFadeProgress }]}
        >
          {"Enter a title for your new poll..."}
        </Animated.Text>
        <AnimatedSpacer
          width="100%"
          height={secondFadeProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 75],
          })}
        />
        <Animated.View
          style={{
            opacity: secondFadeProgress.interpolate({
              inputRange: [0, 0.5],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
            width: secondFadeProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "75%"],
            }),
          }}
        >
          <TextInput
            style={[styles.inputStyle]}
            value={inputVal}
            autoCapitalize="words"
            onChangeText={(str) => {
              setInputVal(str);
            }}
          />
        </Animated.View>
        <Spacer width="100%" height={50} />
        <AnimatedTouchable
          disabled={inputVal === ""}
          onPress={() => {
            setTriggerEndAnimation(true);
          }}
          style={[
            styles.button,
            styles.centerView,
            {
              backgroundColor: inputVal === "" ? "#D2042D" : "#FFF",
            },
          ]}
        >
          <Text style={styles.buttonText}>Next</Text>
        </AnimatedTouchable>
      </Animated.View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D2042D",
  },
  bigPromptText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 40,
    textAlign: "center",
  },
  inputStyle: {
    height: 55,
    backgroundColor: "#FFF",
    borderRadius: 5,
    paddingLeft: 10,
    paddingRight: 10,
    fontFamily: "Actor_400Regular",
    fontSize: 20,
    textAlign: "center",
    color: "#D2042D",
  },
  button: {
    width: 100,
    height: 50,
    borderRadius: 5,
  },
  buttonText: {
    fontFamily: "Actor_400Regular",
    fontSize: 25,
    color: "#D2042D",
  },
});
