import {
  StyleSheet,
  SafeAreaView,
  TextInput,
  Text,
  TouchableOpacity,
  Animated,
  View,
} from "react-native";
import {
  useFonts,
  Lato_400Regular,
  Lato_700Bold,
  Lato_400Regular_Italic,
} from "@expo-google-fonts/lato";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../constants/dimensions";
import Spacer from "../components/Spacer";
import React, { useEffect, useRef, useState } from "react";
import {
  sendEmailVerification,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  getAuth,
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
      fontFamily: "Lato_400Regular",
      fontSize: 17.5,
      lineHeight: 25,
    },
    shadow: false,
  });
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
        navigation.navigate("UserHomeScreen");
      }
    } catch (error) {
      setTriggerError(true);
    }
  };
};

const keyboardUp = (animationVal: Animated.Value) => {
  Animated.timing(animationVal, {
    toValue: 1,
    duration: 250,
    useNativeDriver: true,
  }).start();
};

const keyboardDown = (animationVal: Animated.Value) => {
  Animated.timing(animationVal, {
    toValue: 0,
    duration: 250,
    useNativeDriver: true,
  }).start();
};

const ForgotPassword = ({ navigation }) => {
  const [inputVal, setInputVal] = useState("");
  const keyboardAnimationRef = useRef(new Animated.Value(0)).current;

  return (
    <SafeAreaView style={[styles.container, styles.centerView]}>
      <Animated.View
        style={{
          transform: [
            {
              translateY: keyboardAnimationRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -SCREEN_HEIGHT / 10],
              }),
            },
          ],
        }}
      >
        <Text style={styles.questionText}>Enter your email.</Text>
        <Spacer height={50} width="100%" />
        <TextInput
          autoCapitalize="none"
          placeholder={"email"}
          selectionColor={"#000"}
          keyboardType={"email-address"}
          style={[styles.textInput, { alignSelf: "center" }]}
          onFocus={() => keyboardUp(keyboardAnimationRef)}
          onBlur={() => keyboardDown(keyboardAnimationRef)}
          onChangeText={(text) => setInputVal(text)}
        />
        <Spacer width="100%" height={50} />
        <TouchableOpacity
          style={[
            styles.submitButton,
            styles.centerView,
            { alignSelf: "center" },
          ]}
          onPress={() => {
            navigation.navigate("ForgottenPasswordEmailSent", {
              email: inputVal,
            });
          }}
        >
          <Text style={[styles.buttonText]}>Submit</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const ErrorScreen = () => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <Text style={styles.questionText}>Uh oh! That email didn't work!</Text>
      <Spacer width="100%" height={20} />
      <Text style={styles.questionText}>Please try again.</Text>
    </Animated.View>
  );
};

const ResetEmailSent = () => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <Text style={styles.questionText}>Reset email sent!</Text>
      <Spacer width="100%" height={20} />
      <Text style={styles.questionText}>
        Check your inbox for further instructions.
      </Text>
    </Animated.View>
  );
};

const ForgottenPasswordEmailSent = ({ navigation, route }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const { email } = route.params;

  useEffect(() => {
    if (error) setLoading(false);
  }, [error]);

  useEffect(() => {
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => setLoading(false))
      .catch(() => setError(true));
  }, []);

  return (
    <SafeAreaView style={[styles.container, styles.centerView]}>
      {loading ? (
        <LoadingScreen color="#507DBC" />
      ) : error ? (
        <ErrorScreen />
      ) : (
        <ResetEmailSent />
      )}
    </SafeAreaView>
  );
};

const ErrorMessage = ({
  errorAnimationProgress,
}: {
  errorAnimationProgress: Animated.Value;
}) => {
  return (
    <Animated.Text
      style={[
        styles.errorMessage,
        {
          opacity: errorAnimationProgress,
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
  const [fontsLoaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
    Lato_400Regular_Italic,
  });
  const errorAnimationProgress = useRef(new Animated.Value(0)).current;

  handleTypingErrors(
    triggerError,
    setTriggerError,
    setInputStyle,
    errorAnimationProgress
  );

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <SafeAreaView style={[styles.container, styles.centerView]}>
      <Animated.View style={[styles.centerView]}>
        <Text style={styles.questionText}>
          Enter your username and password.
        </Text>
        <Spacer width="100%" height={50} />
        <ErrorMessage errorAnimationProgress={errorAnimationProgress} />
        <Spacer width="100%" height={10} />
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
        <Spacer width="100%" height={50} />
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
        <Spacer width="100%" height={25} />
        <TouchableOpacity
          style={[styles.submitButton, styles.centerView]}
          onPress={async () => {
            navigation.push("ForgotPassword");
          }}
        >
          <Text style={[styles.buttonText]}>Forgot My Password</Text>
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
    fontFamily: "Lato_400Regular",
    fontSize: 20,
    paddingLeft: 4,
    paddingRight: 4,
  },
  questionText: {
    fontFamily: "Lato_400Regular",
    fontSize: 40,
    alignSelf: "center",
    textAlign: "center",
    width: SCREEN_WIDTH * 0.9,
  },
  submitButton: {
    padding: 15,
    backgroundColor: "#507DBC",
    borderRadius: 5,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 20,
  },
  errorMessage: {
    color: "#F00",
    fontFamily: "Lato_400Regular",
    zIndex: 1,
    alignSelf: "flex-start",
    left: 20,
    fontSize: 15,
  },
});

export { ForgotPassword, ForgottenPasswordEmailSent };
