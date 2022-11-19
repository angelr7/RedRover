import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useFonts, Lato_400Regular } from "@expo-google-fonts/lato";
import { useEffect, useRef, useState } from "react";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import Spacer from "../components/Spacer";
import { RootSiblingParent } from "react-native-root-siblings";
import { auth } from "../firebase";
import UserHomeScreen from "./UserHomeScreen";
import { User } from "firebase/auth";
import LoadingScreen from "../components/LoadingScreen";

interface ButtonOpacity {
  opacity: Animated.Value | number;
}

const handleLoadIn = (
  fontsLoaded: boolean,
  flyupAnimationProgress: Animated.Value,
  buttonAnimationProgress: Animated.Value,
  setAnimatedButtonstyle: React.Dispatch<React.SetStateAction<ButtonOpacity>>,
  setUser: React.Dispatch<User | null | undefined>
) => {
  useEffect(() => {
    if (fontsLoaded) {
      Animated.timing(flyupAnimationProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // delay the animation until after the logo flies up from the
      // bottom. after it's done, we set the opacity to 1 to avoid some
      // stylistic glitches
      setTimeout(() => {
        Animated.timing(buttonAnimationProgress, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setAnimatedButtonstyle({ opacity: 1 });
        });
      }, 500);
    }
  }, [fontsLoaded]);

  useEffect(() => {
    setUser(auth.currentUser);
  }, [auth.currentUser]);
};

export default function Homepage({ navigation }) {
  const [fontsLoaded] = useFonts({ Lato_400Regular });
  const flyupAnimationProgress = useRef(new Animated.Value(0)).current;
  const buttonAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [animatedButtonStyle, setAnimatedButtonstyle] = useState<ButtonOpacity>(
    {
      opacity: buttonAnimationProgress,
    }
  );

  handleLoadIn(
    fontsLoaded,
    flyupAnimationProgress,
    buttonAnimationProgress,
    setAnimatedButtonstyle,
    setUser
  );

  if (user === undefined) return <LoadingScreen />;
  if (user !== null)
    return (
      <View
        onLayout={() => {
          navigation.push("NoAnimationUserHomeScreen");
        }}
      />
    );

  return (
    <RootSiblingParent>
      <SafeAreaView style={[styles.container, styles.centerView]}>
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

        <Spacer width="100%" height={100} />

        <View style={styles.buttonContainer}>
          <AnimatedTouchable
            style={[
              styles.loginScreenButton,
              styles.centerView,
              animatedButtonStyle,
            ]}
            onPress={() => navigation.push("Register")}
          >
            <Text style={styles.buttonText}>Register</Text>
          </AnimatedTouchable>
          <AnimatedTouchable
            style={[
              styles.loginScreenButton,
              styles.centerView,
              animatedButtonStyle,
            ]}
            onPress={() => {
              navigation.navigate("Login");
            }}
          >
            <Text style={styles.buttonText}>Login</Text>
          </AnimatedTouchable>
        </View>
      </SafeAreaView>
    </RootSiblingParent>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  bigLogoText: {
    fontFamily: "Lato_400Regular",
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
    fontFamily: "Lato_400Regular",
    fontSize: 30,
  },
  buttonContainer: {
    height: 180,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    left: 0,
    right: 0,
  },
});
