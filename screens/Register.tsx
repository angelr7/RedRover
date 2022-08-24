import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TextInput,
  Keyboard,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useFonts, Actor_400Regular } from "@expo-google-fonts/actor";
import React, { ReactElement, useEffect, useRef, useState } from "react";
import { SCREEN_WIDTH } from "../constants/dimensions";
import Spacer from "../components/Spacer";
import { handleSignup } from "../firebase";

const SYMBOLS = "`!@#$%^&*()_-+={[}]|\\:;\"'<,>.?/";

// TODO: ask alex about updating this
const isPossibleEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password: string) => {
  const isLongEnough = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  let hasSymbol = false;
  for (const char of password)
    if (SYMBOLS.includes(char)) {
      hasSymbol = true;
      break;
    }

  return isLongEnough && hasUppercase && hasNumber && hasSymbol;
};

// TODO: update navigation types
const handlePress =
  (
    navigation: any,
    errorMessageAnimationProgress: Animated.Value,
    inputVal: string,
    email: string,
    password: string,
    setInputVal: React.Dispatch<React.SetStateAction<string>>,
    setEmail: React.Dispatch<React.SetStateAction<string>>,
    setPassword: React.Dispatch<React.SetStateAction<string>>,
    setInputStyle: React.Dispatch<any>,
    setPrompt: React.Dispatch<React.SetStateAction<string>>,
    setShowBackButton: React.Dispatch<React.SetStateAction<boolean>>,
    setShowErrorMessages: React.Dispatch<React.SetStateAction<boolean>>,
    setErrorMessages: React.Dispatch<
      React.SetStateAction<React.ReactElement<any, any>[]>
    >,
    setTriggerError: React.Dispatch<React.SetStateAction<boolean>>
  ) =>
  async () => {
    if (email === "") {
      if (isPossibleEmail(inputVal)) {
        setInputStyle(undefined);
        setShowErrorMessages(false);
        setEmail(inputVal);
        setInputVal("");
        setErrorMessages([
          <Animated.Text
            key={1}
            style={[
              styles.errorMessage,
              { opacity: errorMessageAnimationProgress, top: -36 },
            ]}
          >
            Please enter a secure password!
          </Animated.Text>,
          <Animated.Text
            key={2}
            style={[
              styles.errorMessage,
              { opacity: errorMessageAnimationProgress, top: -26 },
            ]}
          >
            Your password must have at least one special character,
          </Animated.Text>,
          <Animated.Text
            key={3}
            style={[
              styles.errorMessage,
              { opacity: errorMessageAnimationProgress, top: -16 },
            ]}
          >
            one number, and one symbol ({SYMBOLS})
          </Animated.Text>,
        ]);
        setPrompt("Enter a strong password.");
      } else {
        setTriggerError(true);
      }
    } else {
      if (password === "") {
        if (isValidPassword(inputVal)) {
          setInputStyle(undefined);
          setShowErrorMessages(false);
          setPassword(inputVal);
          setInputVal("");
          setErrorMessages([
            <Animated.Text
              key={1}
              style={[
                styles.errorMessage,
                { opacity: errorMessageAnimationProgress, top: -16 },
              ]}
            >
              Your passwords do not match!
            </Animated.Text>,
          ]);
          setPrompt("Confirm your password.");
          setShowBackButton(true);
        } else {
          setTriggerError(true);
        }
      } else {
        if (inputVal === password) {
          // handle signup
          const userInfo = handleSignup(email, password);
          console.log(userInfo);
        } else {
          setTriggerError(true);
        }
      }
    }
  };

const goBack =
  (
    errorMessageAnimationProgress: Animated.Value,
    setInputVal: React.Dispatch<React.SetStateAction<string>>,
    setPassword: React.Dispatch<React.SetStateAction<string>>,
    setShowErrorMessages: React.Dispatch<React.SetStateAction<boolean>>,
    setErrorMessages: React.Dispatch<
      React.SetStateAction<React.ReactElement<any, any>[]>
    >,
    setShowBackButton: React.Dispatch<React.SetStateAction<boolean>>,
    setInputStyle: React.Dispatch<any>,
    setPrompt: React.Dispatch<React.SetStateAction<string>>
  ) =>
  () => {
    setPassword("");
    setShowErrorMessages(false);
    setInputVal("");
    setErrorMessages([
      <Animated.Text
        key={1}
        style={[
          styles.errorMessage,
          { opacity: errorMessageAnimationProgress, top: -36 },
        ]}
      >
        Please enter a secure password!
      </Animated.Text>,
      <Animated.Text
        key={2}
        style={[
          styles.errorMessage,
          { opacity: errorMessageAnimationProgress, top: -26 },
        ]}
      >
        Your password must have at least one special character,
      </Animated.Text>,
      <Animated.Text
        key={3}
        style={[
          styles.errorMessage,
          { opacity: errorMessageAnimationProgress, top: -16 },
        ]}
      >
        one number, and one symbol ({SYMBOLS})
      </Animated.Text>,
    ]);

    setInputStyle(undefined);
    setShowBackButton(false);
    setPrompt("Enter a strong password");
  };

const handleKeyboardAnimations = (
  email: string,
  password: string,
  errorMessageAnimationProgress: Animated.Value,
  moveUpAnimationProgress: Animated.Value,
  triggerError: boolean,
  setTriggerError: React.Dispatch<React.SetStateAction<boolean>>,
  setShowErrorMessages: React.Dispatch<React.SetStateAction<boolean>>,
  setInputStyle: React.Dispatch<any>
) => {
  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", () => {
      Animated.timing(moveUpAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(moveUpAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  useEffect(() => {
    if (triggerError) {
      setTriggerError(false);
      setShowErrorMessages(true);
      setInputStyle({
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#F00",
        backgroundColor: "rgba(255, 0, 0, 0.125)",
      });
      Animated.timing(errorMessageAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(
          () => {
            Animated.timing(errorMessageAnimationProgress, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start();
          },
          email !== "" && password === "" ? 10000 : 3000
        );
      });
    }
  }, [triggerError]);
};

export default function Register({ navigation }) {
  const [fontsLoaded] = useFonts({ Actor_400Regular });
  const moveUpAnimationProgress = useRef(new Animated.Value(0)).current;
  const errorMessageAnimationProgress = useRef(new Animated.Value(0)).current;

  const [inputVal, setInputVal] = useState("");
  const [triggerError, setTriggerError] = useState(false);
  const [inputStyle, setInputStyle] = useState(undefined);
  const [prompt, setPrompt] = useState("What's your email?");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBackButton, setShowBackButton] = useState(false);
  const [showErrorMessages, setShowErrorMessages] = useState(true);
  const [errorMessages, setErrorMessages] = useState<ReactElement<any, any>[]>([
    <Animated.Text
      key={1}
      style={[
        styles.errorMessage,
        {
          opacity: errorMessageAnimationProgress,
        },
      ]}
    >
      Please enter a valid email address!
    </Animated.Text>,
  ]);

  handleKeyboardAnimations(
    email,
    password,
    errorMessageAnimationProgress,
    moveUpAnimationProgress,
    triggerError,
    setTriggerError,
    setShowErrorMessages,
    setInputStyle
  );

  //TODO: replace w/ loading screen
  if (!fontsLoaded) return <View />;

  return (
    // right now, we're only working w/ an ordinary email and password,
    // but we'll add more auth methods soon
    <SafeAreaView style={[styles.container]}>
      <Animated.View
        style={[
          styles.container,
          styles.centerView,
          {
            transform: [
              {
                translateY: moveUpAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -100],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.questionText}>{prompt}</Text>
        <Spacer width="100%" height={75} />
        <View>
          {showErrorMessages && errorMessages}
          <TextInput
            style={[styles.textInput, inputStyle]}
            value={inputVal}
            keyboardType="email-address"
            secureTextEntry={email !== ""}
            onChangeText={(text) => {
              setInputVal(text);
            }}
            {...(email !== "" ? {} : { placeholder: "yourname@example.com" })}
          />
        </View>
        <Spacer width="100%" height={50} />
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {showBackButton && (
            <>
              <TouchableOpacity
                style={[styles.submitButton, styles.centerView]}
                onPress={goBack(
                  errorMessageAnimationProgress,
                  setInputVal,
                  setPassword,
                  setShowErrorMessages,
                  setErrorMessages,
                  setShowBackButton,
                  setInputStyle,
                  setPrompt
                )}
              >
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              <Spacer width={20} height={50} />
            </>
          )}
          <TouchableOpacity
            style={[styles.submitButton, styles.centerView]}
            onPress={handlePress(
              navigation,
              errorMessageAnimationProgress,
              inputVal,
              email,
              password,
              setInputVal,
              setEmail,
              setPassword,
              setInputStyle,
              setPrompt,
              setShowBackButton,
              setShowErrorMessages,
              setErrorMessages,
              setTriggerError
            )}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
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
  questionText: {
    fontFamily: "Actor_400Regular",
    fontSize: 40,
    alignSelf: "center",
    textAlign: "center",
    width: SCREEN_WIDTH * 0.9,
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
    top: -16,
    fontSize: 10,
  },
});
