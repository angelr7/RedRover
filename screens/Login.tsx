import {
  StyleSheet,
  View,
  SafeAreaView,
  TextInput,
  Text,
  TouchableOpacity,
  Keyboard,
  Animated,
} from "react-native";
import { useFonts, Actor_400Regular } from "@expo-google-fonts/actor";
import { SCREEN_WIDTH } from "../constants/dimensions";
import Spacer, { AnimatedSpacer } from "../components/Spacer";
import React, { useEffect, useRef, useState } from "react";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import Toast from "react-native-root-toast";
import LoadingScreen from "../components/LoadingScreen";

const showToast = (message: string) => {
  Toast.show(message, {
    animation: true,
    duration: 10000, // 10s display,
    position: Toast.positions.TOP,
    containerStyle: {
      width: SCREEN_WIDTH * 0.75,
      height: 120,
      top: 20,
      justifyContent: "center",
      alignContent: "center",
      backgroundColor: "#507DBC",
      paddingRight: 10,
      paddingLeft: 10,
    },
    textStyle: {
      fontFamily: "Actor_400Regular",
      fontSize: 17.5,
      lineHeight: 25,
    },
    shadow: false,
  });
};

const handleKeyboardAnimations = (
  moveUpAnimationProgress: Animated.Value,
  setKeyboardHeight: React.Dispatch<React.SetStateAction<number>>
) => {
  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      Animated.timing(moveUpAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    Keyboard.addListener("keyboardWillHide", (event) => {
      Animated.timing(moveUpAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
  }, []);
};

const handleTypingErrors = (
  triggerError: boolean,
  setTriggerError: React.Dispatch<React.SetStateAction<boolean>>,
  setInputStyle: React.Dispatch<any>,
  errorAnimationProgress: Animated.Value
) => {
  useEffect(() => {
    if (triggerError) {
      setTriggerError(false);

      Animated.timing(errorAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          Animated.timing(errorAnimationProgress, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }).start();
        }, 5000);
      });

      setInputStyle({
        borderWidth: 1,
        borderColor: "#F00",
        backgroundColor: "rgba(255, 0, 0, 0.125)",
      });
    }
  }, [triggerError]);
};

const handlePress = (
  navigation: any,
  email: string,
  password: string,
  setTriggerError: React.Dispatch<React.SetStateAction<boolean>>,
  setInputStyle: React.Dispatch<any>
) => {
  return async () => {
    // no reason to make a request if the values aren't even valid
    if (email === "" || password === "") {
      setTriggerError(true);
      return;
    }
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      setInputStyle(undefined);
      if (!user.emailVerified) {
        signOut(auth);
        navigation.popToTop();
        sendEmailVerification(user);
        showToast(
          "You must verify your email before logging in! Just in case, we've already sent you another verification link!"
        );
      } else {
        navigation.push("UserHomeScreen");
      }
    } catch (error) {
      setTriggerError(true);
    }
  };
};

const ErrorMessage = ({
  moveUpAnimationProgress,
  errorAnimationProgress,
}: {
  moveUpAnimationProgress: Animated.Value;
  errorAnimationProgress: Animated.Value;
}) => {
  return (
    <Animated.Text
      style={[
        styles.errorMessage,
        {
          opacity: errorAnimationProgress,
          transform: [
            {
              translateY: moveUpAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -32],
              }),
            },
          ],
        },
      ]}
    >
      Invalid username or password!
    </Animated.Text>
  );
};

export default function Login({ navigation }) {
  const [emailVal, setEmailVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [inputStyle, setInputStyle] = useState<any>();
  const [triggerError, setTriggerError] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fontsLoaded] = useFonts({ Actor_400Regular });
  const moveUpAnimationProgress = useRef(new Animated.Value(0)).current;
  const errorAnimationProgress = useRef(new Animated.Value(0)).current;

  handleKeyboardAnimations(moveUpAnimationProgress, setKeyboardHeight);
  handleTypingErrors(
    triggerError,
    setTriggerError,
    setInputStyle,
    errorAnimationProgress
  );

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, styles.centerView]}>
      <Animated.View
        style={[
          styles.centerView,
          {
            transform: [
              {
                translateY: moveUpAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (keyboardHeight / 2) * -1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.questionText}>
          Enter your username and password.
        </Text>
        <AnimatedSpacer
          width="100%"
          height={moveUpAnimationProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [100, 50],
          })}
        />

        <ErrorMessage
          moveUpAnimationProgress={moveUpAnimationProgress}
          errorAnimationProgress={errorAnimationProgress}
        />
        <TextInput
          placeholder="email"
          style={[styles.textInput, inputStyle]}
          keyboardType="email-address"
          autoCapitalize={"none"}
          onChangeText={(text) => {
            setEmailVal(text);
          }}
        />
        <Spacer width="100%" height={20} />
        <TextInput
          placeholder="password"
          secureTextEntry={true}
          style={[styles.textInput, inputStyle]}
          autoCapitalize="none"
          onChangeText={(text) => {
            setPasswordVal(text);
          }}
        />
        <Spacer width="100%" height={20} />

        <TouchableOpacity
          style={[styles.submitButton, styles.centerView]}
          onPress={handlePress(
            navigation,
            emailVal,
            passwordVal,
            setTriggerError,
            setInputStyle
          )}
        >
          <Text style={[styles.buttonText]}>Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerView: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  textInput: {
    height: 50,
    width: SCREEN_WIDTH * 0.8,
    backgroundColor: "#DAE3E5",
    borderRadius: 5,
    textAlign: "center",
    fontFamily: "Actor_400Regular",
    fontSize: 20,
    paddingLeft: 4,
    paddingRight: 4,
  },
  questionText: {
    fontFamily: "Actor_400Regular",
    fontSize: 40,
    alignSelf: "center",
    textAlign: "center",
    width: SCREEN_WIDTH * 0.9,
  },
  submitButton: {
    width: 100,
    height: 50,
    backgroundColor: "#507DBC",
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 20,
  },
  errorMessage: {
    color: "#F00",
    fontFamily: "Actor_400Regular",
    position: "absolute",
    zIndex: 1,
    top: "45%",
    alignSelf: "flex-start",
    left: 20,
    fontSize: 10,
  },
});
