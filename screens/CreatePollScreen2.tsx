import { useEffect, useRef, useState } from "react";
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import Spacer from "../components/Spacer";

type CPSState = "Description";
const FONT_NAME = "Lato_400Regular";

const EnterPollName = () => {
  const [pollName, setPollName] = useState("");
  const animationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

  useEffect(() => {
    Keyboard.removeAllListeners("keyboardWillShow");
    Keyboard.removeAllListeners("keyboardWillHide");
    Animated.timing(animationProgress, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View
      style={[
        { width: "100%", height: "100%", padding: 50 },
        styles.centerView,
      ]}
    >
      <Animated.Text
        style={[
          styles.animatedTitle,
          {
            opacity: animationProgress,
          },
        ]}
      >
        Enter your poll...
      </Animated.Text>
      <Spacer width="100%" height={40} />
      <AnimatedTextInput
        style={[styles.inputStyle]}
        selectionColor={"#853b30"}
        onChangeText={(text) => setPollName(text)}
        value={pollName}
      />
      <Spacer width="100%" height={40} />
      <TouchableOpacity
        style={[
          styles.centerView,
          { backgroundColor: "#FFF", width: 75, height: 40, borderRadius: 5 },
        ]}
      >
        <Text style={styles.submitButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function CreatePollScreen2({ route, navigation }) {
  const [currState, setCurrState] = useState<CPSState>("Description");
  return (
    <SafeAreaView
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#853b30",
      }}
    >
      {(() => {
        switch (currState) {
          case "Description":
            return <EnterPollName />;
          default:
            return <View />;
        }
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  animatedTitle: {
    fontFamily: FONT_NAME,
    color: "#FFF",
    fontSize: 50,
    textAlign: "center",
  },
  submitButtonText: {
    fontFamily: FONT_NAME,
    fontSize: 20,
    color: "#853b30",
  },
  inputStyle: {
    width: "100%",
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 5,
    paddingLeft: 20,
    paddingRight: 20,
    color: "#853b30",
    fontSize: 20,
  },
});
