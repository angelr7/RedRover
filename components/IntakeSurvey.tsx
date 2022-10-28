import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import Spacer from "./Spacer";

export function IntakeSurveyIndicator({ navigation }) {
  const growAnimationProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(growAnimationProgress, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
        Animated.timing(growAnimationProgress, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.indicatorContainer, styles.centerView]}>
      <Animated.Text
        style={[
          styles.promptText,
          {
            transform: [
              {
                scale: growAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        Please take the intake survey to get started!
      </Animated.Text>
      <Spacer width="100%" height={100} />
      <TouchableOpacity
        style={[styles.openSurveyButton, styles.centerView]}
        onPress={() => {
          navigation.push("Poll");
        }}
      >
        <Text style={styles.buttonText}>Open Survey</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function IntakeSurvey() {
  return <View />;
}

const styles = StyleSheet.create({
  indicatorContainer: {
    width: 350,
    height: 500,
    top: "5%",
    borderRadius: 8,
    borderColor: "rgb(80, 125, 188)",
    borderWidth: 5,
    backgroundColor: "rgb(80, 125, 188)",
  },
  promptText: {
    fontFamily: "Lato_400Regular",
    color: "#FFF",
    fontSize: 30,
    textAlign: "center",
    paddingLeft: 20,
    paddingRight: 20,
  },
  centerView: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  openSurveyButton: {
    width: 100,
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 5,
  },
  buttonText: {
    fontFamily: "Lato_400Regular",
    color: "rgb(80, 125, 188)",
  },
});
