import Fader from "./Fader";
import * as Haptics from "expo-haptics";
import BackCaretPressable from "./BackCaretPressable";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Spacer, { AnimatedSpacer } from "./Spacer";
import React, { useEffect, useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../constants/dimensions";
import {
  Modal,
  View,
  Animated,
  StyleSheet,
  TextInput,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Pressable,
  Keyboard,
  ScrollView,
} from "react-native";
import { createPollDraft } from "../firebase";

type PollCreationStage = "name" | "description";
interface UserData {
  admin: boolean;
  createdAt: string;
  email: string;
  id: string;
  intakeSurvey: boolean;
}
interface CreatePollModalProps {
  userData: UserData;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
interface AnimatedPromptProps {
  titleVal: string;
  setTitleVal: React.Dispatch<React.SetStateAction<string>>;
  setStage: React.Dispatch<React.SetStateAction<PollCreationStage>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
interface CreatePollDescriptionProps {
  userID: string;
  pollTitle: string;
  fadeOut: boolean;
  setFadeOut: React.Dispatch<React.SetStateAction<boolean>>;
  setStage: React.Dispatch<React.SetStateAction<PollCreationStage>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
interface CheckMarkWindowProps {
  opacity: Animated.Value;
  windowSlideRef: Animated.Value;
  windowHolderOpacity: Animated.Value;
}

const handlePromptAnimations = (
  fadeInRef: Animated.Value,
  inputGrowRef: Animated.Value,
  nextButtonFadeRef: Animated.Value,
  titleVal: string,
  showButton: boolean,
  setTitleVal: React.Dispatch<React.SetStateAction<string>>,
  setShowButton: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // handle initial animation
  useEffect(() => {
    setTitleVal("");
    Animated.sequence([
      Animated.timing(fadeInRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(inputGrowRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // if showButton is toggled / disabled, do the
  // corresponding animation
  useEffect(() => {
    if (showButton)
      Animated.timing(nextButtonFadeRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(nextButtonFadeRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [showButton]);

  // when titleVal changes, set showButton as necessary
  useEffect(() => {
    setShowButton(titleVal !== "");
  }, [titleVal]);
};

const handleDescriptionAnimations = (
  colorSwitchRef: Animated.Value,
  nextButtonFadeRef: Animated.Value,
  opacity: Animated.Value,
  description: string,
  invalidDescription: boolean,
  letterCount: number,
  fadeOut: boolean,
  setInvalidDescription: React.Dispatch<React.SetStateAction<boolean>>,
  setLetterCount: React.Dispatch<React.SetStateAction<number>>,
  setFadeOut: React.Dispatch<React.SetStateAction<boolean>>,
  setStage: React.Dispatch<React.SetStateAction<PollCreationStage>>
) => {
  useEffect(() => {
    setLetterCount(description.length);
  }, [description]);

  useEffect(() => {
    setInvalidDescription(letterCount > 500);
  }, [letterCount]);

  useEffect(() => {
    Animated.timing(colorSwitchRef, {
      toValue: invalidDescription ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [invalidDescription]);

  useEffect(() => {
    Animated.timing(nextButtonFadeRef, {
      toValue: invalidDescription || description.length === 0 ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [invalidDescription, description.length === 0]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (fadeOut) {
      setFadeOut(false);
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setStage("name"));
    }
  }, [fadeOut]);
};

const updatePollDraft = async (
  userID: string,
  description: string,
  additionalInfo: string,
  pollTitle: string,
  opacity: Animated.Value,
  windowHolderOpacity: Animated.Value,
  windowSlideRef: Animated.Value,
  setVisible: React.Dispatch<React.SetStateAction<boolean>>,
  setStage: React.Dispatch<React.SetStateAction<PollCreationStage>>
) => {
  Animated.parallel([
    Animated.timing(opacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }),
    Animated.timing(windowHolderOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }),
  ]).start(async () => {
    const draftInfo = await createPollDraft(userID, {
      description,
      additionalInfo,
      title: pollTitle,
    });

    // maybe add more to error flow here
    if (draftInfo === undefined) setVisible(false);
    else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.timing(windowSlideRef, {
        toValue: 1,
        duration: 750,
        useNativeDriver: false,
      }).start(() =>
        setTimeout(() => {
          setVisible(false);
          setStage("name");
        }, 1000)
      );
    }
  });
};

const AnimatedPrompt = ({
  titleVal,
  setTitleVal,
  setStage,
  setVisible,
}: AnimatedPromptProps) => {
  const [showButton, setShowButton] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const fadeInRef = useRef(new Animated.Value(0)).current;
  const inputGrowRef = useRef(new Animated.Value(0)).current;
  const nextButtonFadeRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  handlePromptAnimations(
    fadeInRef,
    inputGrowRef,
    nextButtonFadeRef,
    titleVal,
    showButton,
    setTitleVal,
    setShowButton
  );

  return (
    <View style={{ width: "100%", height: "100%" }}>
      <BackCaretPressable
        setVisible={setVisible}
        altAction={undefined}
        style={{ position: "absolute", zIndex: 1 }}
      />
      <KeyboardAvoidingView
        keyboardVerticalOffset={-SCREEN_HEIGHT / 5}
        behavior={Platform.OS === "ios" ? "position" : "height"}
        style={[styles.centerView, { width: "100%", flex: 1 }]}
      >
        <Pressable onPress={() => Keyboard.dismiss()}>
          <Animated.Text
            style={[styles.createPollText, { opacity: fadeInRef }]}
          >
            Please enter a name for your new poll...
          </Animated.Text>
          <AnimatedSpacer
            width="100%"
            height={inputGrowRef.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 50],
            })}
          />
          <Animated.View
            style={{
              alignSelf: "center",
              height: 50,
              width: inputGrowRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, SCREEN_WIDTH - 100],
              }),
            }}
          >
            <TextInput
              value={titleVal}
              selectionColor="#853b30"
              style={styles.textInputStyle}
              onChangeText={(text) => setTitleVal(text)}
            />
          </Animated.View>
          <Spacer width="100%" height={50} />
          <AnimatedTouchable
            disabled={!showButton}
            onPress={() => setFadeOut(true)}
            style={[
              styles.centerView,
              styles.nextButton,
              { opacity: nextButtonFadeRef },
            ]}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </AnimatedTouchable>
        </Pressable>
        <Fader fadeIn={fadeOut} callback={() => setStage("description")} />
      </KeyboardAvoidingView>
    </View>
  );
};

const CheckMarkWindow = ({
  windowHolderOpacity,
  opacity,
  windowSlideRef,
}: CheckMarkWindowProps) => {
  return (
    <Animated.View
      style={[
        styles.centerView,
        {
          position: "absolute",
          zIndex: -1,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          opacity: windowHolderOpacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.centerView,
          {
            width: SCREEN_WIDTH,
            height: SCREEN_WIDTH,
            opacity: opacity.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        <View
          style={[
            styles.centerView,
            {
              width: 250,
              height: 250,
              borderRadius: 125,
              borderWidth: 5,
              borderColor: "#FFF",
              backgroundColor: "#175e54",
            },
          ]}
        >
          <FontAwesome5 name="check" style={{ color: "#FFF", fontSize: 150 }} />
        </View>
        <Animated.View
          style={{
            zIndex: 2,
            position: "absolute",
            right: 0,
            height: "100%",
            backgroundColor: "#853b30",
            width: windowSlideRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["100%", "0%"],
            }),
          }}
        />
      </Animated.View>
    </Animated.View>
  );
};

const CreatePollDescription = ({
  userID,
  pollTitle,
  fadeOut,
  setFadeOut,
  setStage,
  setVisible,
}: CreatePollDescriptionProps) => {
  const [description, setDescription] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [letterCount, setLetterCount] = useState(0);
  const [invalidDescription, setInvalidDescription] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const windowHolderOpacity = useRef(new Animated.Value(0)).current;
  const colorSwitchRef = useRef(new Animated.Value(0)).current;
  const nextButtonFadeRef = useRef(new Animated.Value(0)).current;
  const windowSlideRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  handleDescriptionAnimations(
    colorSwitchRef,
    nextButtonFadeRef,
    opacity,
    description,
    invalidDescription,
    letterCount,
    fadeOut,
    setInvalidDescription,
    setLetterCount,
    setFadeOut,
    setStage
  );

  return (
    <>
      <Animated.View style={{ width: "100%", height: "100%", opacity }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{
            width: SCREEN_WIDTH,
            left: -20,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <BackCaretPressable altAction={() => setFadeOut(true)} />
          <Pressable
            onPress={() => Keyboard.dismiss()}
            style={{ width: "100%", height: "100%" }}
          >
            <Text style={styles.pollDescriptionTitle}>{pollTitle}</Text>
            <Spacer width="100%" height={40} />
            <View style={{ flexDirection: "row", width: "100%" }}>
              <Text style={styles.descriptionHeading}>Description</Text>
              <View style={{ flex: 1 }} />
              <Animated.Text
                style={[
                  styles.counterText,
                  {
                    color: colorSwitchRef.interpolate({
                      inputRange: [0, 1],
                      outputRange: [
                        "rgba(255, 255, 255, 0.75)",
                        "rgba(255, 0, 0, 0.75)",
                      ],
                    }),
                  },
                ]}
              >
                {letterCount}/500
              </Animated.Text>
            </View>
            <Spacer width="100%" height={10} />
            <TextInput
              multiline
              selectionColor="#853b30"
              value={description}
              onBlur={() => Keyboard.dismiss()}
              onChangeText={(text) => setDescription(text)}
              style={[styles.descriptionInput, styles.centerView]}
            />
            <Spacer width="100%" height={40} />
            <Spacer
              width="100%"
              height={1}
              style={{
                backgroundColor: "#FFF",
                opacity: 0.75,
                borderRadius: 1,
              }}
            />
            <Spacer width="100%" height={40} />
            <Text style={styles.descriptionHeading}>
              Additional Information
            </Text>
            <Spacer width="100%" height={10} />
            <TextInput
              multiline
              selectionColor="#853b30"
              value={additionalInfo}
              onBlur={() => Keyboard.dismiss()}
              onChangeText={(text) => setAdditionalInfo(text)}
              style={[styles.descriptionInput, styles.centerView]}
            />
            <Spacer width="100%" height={40} />
            <AnimatedTouchable
              disabled={invalidDescription || description.length === 0}
              onPress={async () => {
                Animated.parallel([
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }),
                  Animated.timing(windowHolderOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                  }),
                ]).start(() =>
                  updatePollDraft(
                    userID,
                    description,
                    additionalInfo,
                    pollTitle,
                    opacity,
                    windowHolderOpacity,
                    windowSlideRef,
                    setVisible,
                    setStage
                  )
                );
              }}
              style={[
                styles.centerView,
                styles.nextButton,
                { opacity: nextButtonFadeRef },
              ]}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </AnimatedTouchable>
          </Pressable>
        </ScrollView>
      </Animated.View>
      <CheckMarkWindow
        opacity={opacity}
        windowHolderOpacity={windowHolderOpacity}
        windowSlideRef={windowSlideRef}
      />
    </>
  );
};

export default function CreatePollModal({
  userData,
  visible,
  setVisible,
}: CreatePollModalProps) {
  const [titleVal, setTitleVal] = useState("");
  const [stage, setStage] = useState<PollCreationStage>("name");
  const [fadeoutTriggered, setFadeoutTriggered] = useState(false);
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
    >
      <View style={styles.modalParent}>
        {stage === "name" ? (
          <AnimatedPrompt
            {...{ titleVal, setTitleVal, setStage, setVisible }}
          />
        ) : (
          <CreatePollDescription
            userID={userData.id}
            pollTitle={titleVal}
            fadeOut={fadeoutTriggered}
            setFadeOut={setFadeoutTriggered}
            setStage={setStage}
            setVisible={setVisible}
          />
        )}
      </View>
      <StatusBar style={"light"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalParent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#853b30",
    padding: 20,
  },
  createPollText: {
    fontSize: 37.5,
    fontFamily: "Lato_400Regular",
    color: "#FFF",
    textAlign: "center",
  },
  textInputStyle: {
    backgroundColor: "#FFF",
    borderRadius: 5,
    textAlign: "center",
    width: "100%",
    height: "100%",
    fontSize: 20,
    color: "#853b30",
    fontFamily: "Lato_400Regular",
  },
  nextButton: {
    padding: 10,
    width: 100,
    alignSelf: "center",
    borderColor: "#FFF",
    borderRadius: 5,
    borderWidth: 2.5,
  },
  nextButtonText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 20,
  },
  pollDescriptionTitle: {
    fontFamily: "Lato_400Regular",
    fontSize: 40,
    color: "#FFF",
    alignSelf: "center",
  },
  descriptionHeading: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 20,
  },
  descriptionInput: {
    fontFamily: "Lato_400Regular",
    borderRadius: 7.5,
    width: "100%",
    backgroundColor: "#FFF",
    color: "#853b30",
    fontSize: 17.5,
    maxHeight: 100,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
  },
  counterText: {
    fontSize: 15,
    alignSelf: "flex-end",
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: "Lato_400Regular",
  },
  buttonText: {
    fontFamily: "Lato_400Regular",
    color: "#FFF",
    fontSize: 30,
  },
});
