import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import Spacer, { AnimatedSpacer } from "../components/Spacer";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SCREEN_WIDTH } from "../constants/dimensions";
import {
  SafeAreaView,
  StyleSheet,
  Animated,
  TextInput,
  Keyboard,
  TouchableOpacity,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";

type Screen = "Initial" | "Description";
interface InitialPromptProps {
  keyboardHeight: number;
  keyboardAnimationVal: Animated.Value;
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>;
}
interface LocalPageScreen {
  name: Screen;
  params?: {
    [key: string]: any;
  };
}
interface SetDescriptionProps {
  title: string;
  keyboardAnimationVal: Animated.Value;
  keyboardHeight: number;
}
interface EditablePollTitleProps {
  fadeInAnimationProgress: Animated.Value;
  title: string;
}
interface DescriptionContainerProps {
  mainDescription: string;
  editingDescription: boolean;
  setEditingDescription: React.Dispatch<React.SetStateAction<boolean>>;
}
interface EditDescriptionModalProps {
  keyboardAnimationVal: Animated.Value;
  keyboardHeight: number;
  editingDescription: boolean;
  mainDescription: string;
  setEditingDescription: React.Dispatch<React.SetStateAction<boolean>>;
  setMainDescription: React.Dispatch<React.SetStateAction<string>>;
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
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(secondFadeProgress, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (triggerEndAnimation) {
      Animated.timing(endAnimationProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setScreen({ name: "Description", params: { title: inputVal } });
      });
    }
  }, [triggerEndAnimation]);
};

const InitialPrompt = ({
  keyboardHeight,
  keyboardAnimationVal,
  setScreen,
}: InitialPromptProps) => {
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
            transform: [
              {
                translateY: keyboardAnimationVal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, keyboardHeight / -2],
                }),
              },
            ],
            width: "100%",
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
};

const EditablePollTitle = ({
  fadeInAnimationProgress,
  title,
}: EditablePollTitleProps) => {
  const [inputVal, setInputVal] = useState(title.trim());
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        marginTop: 20,
        opacity: fadeInAnimationProgress,
      }}
    >
      <TextInput
        style={styles.editableTitle}
        value={inputVal}
        editable={editingTitle}
        onChangeText={(text) => {
          setInputVal(text);
        }}
      />
      <TouchableOpacity
        style={[styles.iconButton, styles.centerView]}
        onPress={() => {
          setEditingTitle(!editingTitle);
        }}
      >
        <FontAwesome5
          name={editingTitle ? "unlock" : "lock"}
          style={styles.iconStyle}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const DescriptionContainer = ({
  mainDescription,
  editingDescription,
  setEditingDescription,
}: DescriptionContainerProps) => {
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.headingText}>Description</Text>
        <TouchableOpacity
          style={[{ marginLeft: 10, height: 20 }, styles.centerView]}
          onPress={() => {
            setEditingDescription(true);
          }}
        >
          <FontAwesome5
            name={editingDescription ? "unlock" : "lock"}
            style={{ color: "#FFF", fontSize: 15 }}
          />
        </TouchableOpacity>
      </View>
      <Pressable
        style={[styles.descriptionContainer, styles.centerView]}
        onLongPress={() => {
          Haptics.selectionAsync();
          setEditingDescription(true);
        }}
      >
        {!editingDescription && mainDescription === "" && (
          <TouchableOpacity
            onPress={() => {
              setEditingDescription(true);
            }}
          >
            <Ionicons name="add-circle" style={styles.addIcon} />
          </TouchableOpacity>
        )}
        {!editingDescription && mainDescription !== "" && (
          <Text style={styles.mainDescriptionText}>{mainDescription}</Text>
        )}
      </Pressable>
    </>
  );
};

const EditDescriptionModal = ({
  keyboardAnimationVal,
  keyboardHeight,
  editingDescription,
  mainDescription,
  setEditingDescription,
  setMainDescription,
}: EditDescriptionModalProps) => {
  const [modalDescription, setModalDescription] = useState(mainDescription);
  const buttonFadeAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (modalDescription.length <= 500) {
      Animated.timing(buttonFadeAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(buttonFadeAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [modalDescription.length]);

  return (
    <Modal visible={editingDescription} transparent={true} animationType="fade">
      <Pressable
        style={[styles.modalContainer, styles.centerView]}
        onPress={() => {
          // don't save changes
          setEditingDescription(false);
          setModalDescription(mainDescription);
        }}
      >
        <Animated.View
          style={{
            transform: [
              {
                translateY: keyboardAnimationVal.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -keyboardHeight / 2.25],
                }),
              },
            ],
          }}
        >
          <Pressable style={styles.innerModalContainer}>
            <Text style={styles.modalHeading}>Edit Description</Text>
            <View>
              <TextInput
                style={styles.modalInputStyle}
                multiline={true}
                selectionColor="#FFF"
                value={modalDescription}
                onChangeText={(text) => setModalDescription(text)}
              />
              <Text
                style={{
                  position: "absolute",
                  bottom: -7.5,
                  right: 25,
                  color:
                    modalDescription.length <= 500
                      ? "rgba(89, 89, 89, 0.5)"
                      : "#F00",
                  fontFamily: "Actor_400Regular",
                }}
              >
                {modalDescription.length}/500
              </Text>
            </View>
            <AnimatedTouchable
              disabled={modalDescription.length > 500}
              style={[
                styles.modalButton,
                styles.centerView,
                {
                  opacity: buttonFadeAnimationProgress,
                },
              ]}
              onPress={() => {
                setMainDescription(modalDescription);
                setEditingDescription(false);
              }}
            >
              <Text style={styles.modalButtonText}>Submit</Text>
            </AnimatedTouchable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const AdditionalInfoContainer = () => {
  const [editing, setEditing] = useState(false);
  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.headingText}>Additional Information</Text>
        <TouchableOpacity
          style={[{ marginLeft: 10, height: 20 }, styles.centerView]}
          onPress={() => {
            setEditing(!editing);
          }}
        >
          <FontAwesome5
            name={editing ? "unlock" : "lock"}
            style={{ color: "#FFF", fontSize: 15 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SetDescriptionInformation = ({
  title,
  keyboardAnimationVal,
  keyboardHeight,
}: SetDescriptionProps) => {
  const [mainDescription, setMainDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);

  const fadeInAnimationProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeInAnimationProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <ScrollView>
      <EditablePollTitle
        title={title}
        fadeInAnimationProgress={fadeInAnimationProgress}
      />
      <Spacer width="100%" height={40} />

      {/* holds everything to animate them in */}
      <Animated.View style={{ opacity: fadeInAnimationProgress }}>
        <DescriptionContainer
          mainDescription={mainDescription}
          editingDescription={editingDescription}
          setEditingDescription={setEditingDescription}
        />
        <Spacer width="100%" height={40} />
        <AdditionalInfoContainer />
      </Animated.View>

      {/* Popup Modal, doesn't take up space in layout flow */}
      <EditDescriptionModal
        {...{
          keyboardAnimationVal,
          keyboardHeight,
          editingDescription,
          mainDescription,
          setEditingDescription,
          setMainDescription,
        }}
      />
    </ScrollView>
  );
};

export default function CreatePollScreen({ navigation }) {
  const [screen, setScreen] = useState<LocalPageScreen>({ name: "Initial" });
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardAnimationVal = useRef(new Animated.Value(0)).current;
  const useCenterView = screen.name !== "Description";

  // we only need and want one keyboard listener for the whole screen
  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      Animated.timing(keyboardAnimationVal, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(keyboardAnimationVal, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        // set this after the animation so the animation
        // isn't cut off by this state change.
        setKeyboardHeight(0);
      });
    });
  }, []);

  return (
    <SafeAreaView
      style={[styles.mainContainer, useCenterView && styles.centerView]}
    >
      {(() => {
        switch (screen.name) {
          case "Initial":
            return (
              <InitialPrompt
                keyboardHeight={keyboardHeight}
                keyboardAnimationVal={keyboardAnimationVal}
                setScreen={setScreen}
              />
            );
          case "Description":
            return (
              <SetDescriptionInformation
                title={screen.params.title}
                keyboardAnimationVal={keyboardAnimationVal}
                keyboardHeight={keyboardHeight}
              />
            );
          default:
            return <View />;
        }
      })()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  centerView: {
    justifyContent: "center",
    alignItems: "center",
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
  editableTitle: {
    fontSize: 30,
    color: "#FFF",
    borderColor: "#FFF",
    borderWidth: 2.5,
    padding: 10,
    borderRadius: 5,
  },
  iconStyle: {
    color: "#FFF",
    fontSize: 25,
    position: "absolute",
  },
  iconButton: {
    right: -30,
  },
  headingText: {
    fontFamily: "Actor_400Regular",
    color: "#FFF",
    marginLeft: 10,
    fontSize: 20,
  },
  addIcon: {
    color: "#FFF",
    fontSize: 50,
  },
  descriptionContainer: {
    width: SCREEN_WIDTH - 20,
    height: 150,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 7.5,
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  innerModalContainer: {
    width: 300,
    backgroundColor: "#FFF",
    borderRadius: 7.5,
  },
  modalHeading: {
    fontFamily: "Actor_400Regular",
    color: "#D2042D",
    fontSize: 20,
    marginTop: 10,
    marginBottom: 10,
    alignSelf: "center",
  },
  modalInputStyle: {
    minHeight: 40,
    backgroundColor: "#D2042D",
    borderRadius: 7.5,
    width: 260,
    alignSelf: "center",
    marginBottom: 10,
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 16,
    lineHeight: 20,
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 10,
    maxHeight: 300,
  },
  modalButton: {
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor: "#D2042D",
    width: 100,
    height: 40,
    borderRadius: 7.5,
  },
  modalButtonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 20,
  },
  mainDescriptionText: {
    fontSize: 15,
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    textAlign: "justify",
  },
});
