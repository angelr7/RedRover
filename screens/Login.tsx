import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useFonts, Actor_400Regular } from "@expo-google-fonts/actor";
import { useEffect, useRef } from "react";
import { SCREEN_HEIGHT } from "../constants/dimensions";

const handleRegister = () => {};
const handleLogin = () => {};

export default function Homepage() {
  const [fontsLoaded] = useFonts({ Actor_400Regular });
  const flyupAnimationProgress = useRef(new Animated.Value(0)).current;
  const buttonAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const animatedButtonStyle = { opacity: buttonAnimationProgress };

  useEffect(() => {
    if (fontsLoaded) {
      Animated.timing(flyupAnimationProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(buttonAnimationProgress, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 500);
    }
  }, [fontsLoaded]);

  //TODO: replace w/ loading screen
  if (!fontsLoaded) return <View />;

  return (
    <SafeAreaView style={[styles.container]}>
      <Animated.View
        style={{
          display: "flex",
          flexDirection: "row",
          alignSelf: "center",
          transform: [
            {
              translateY: flyupAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT, 0],
              }),
            },
          ],
        }}
      >
        <Text
          style={[
            styles.bigLogoText,
            {
              transform: [{ scaleX: -1 }],
              left: 12,
            },
          ]}
        >
          R
        </Text>
        <Text
          style={[
            styles.bigLogoText,
            {
              right: 12,
            },
          ]}
        >
          R
        </Text>
      </Animated.View>

      <View style={styles.buttonContainer}>
        <AnimatedTouchable
          style={[
            styles.loginScreenButton,
            styles.centerView,
            animatedButtonStyle,
          ]}
          onPress={handleRegister}
        >
          <Text style={styles.buttonText}>Register</Text>
        </AnimatedTouchable>
        <AnimatedTouchable
          style={[
            styles.loginScreenButton,
            styles.centerView,
            animatedButtonStyle,
          ]}
          onPress={handleLogin}
        >
          <Text style={styles.buttonText}>Login</Text>
        </AnimatedTouchable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bigLogoText: {
    fontFamily: "Actor_400Regular",
    fontSize: 200,
    color: "#507DBC",
  },
  centerView: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  loginScreenButton: {
    width: 250,
    height: 75,
    backgroundColor: "#507DBC",
    borderRadius: 250,
    alignSelf: "center",
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 25,
  },
  buttonContainer: {
    height: 200,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: SCREEN_HEIGHT / 4,
  },
});
