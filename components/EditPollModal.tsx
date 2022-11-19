import Spacer from "../components/Spacer";
import React, { useEffect, useRef, useState } from "react";
import { PollDraftInfo, updatePollDraft } from "../firebase";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import {
  View,
  Text,
  Animated,
  Pressable,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";

interface EditPollModalProps {
  userData: {
    admin: boolean;
    createdAt: string;
    email: string;
    id: string;
    intakeSurvey: boolean;
  };
  visible: PollDraftInfo | undefined;
  setVisible: React.Dispatch<React.SetStateAction<PollDraftInfo | undefined>>;
}
interface SubScreen1Props {
  triggerFade: boolean;
  textInputVal: string;
  setSubScreen: React.Dispatch<React.SetStateAction<1 | 2>>;
  setTextInputVal: React.Dispatch<React.SetStateAction<string>>;
  keyboardDodgeRef: Animated.Value;
  buttonFadeRef: Animated.Value;
}
interface SubScreen2Props {
  userID: string;
  name: string;
  description: string;
  additionalInfo: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setAdditionalInfo: React.Dispatch<React.SetStateAction<string>>;
  keyboardDodgeRef: Animated.Value;
  visible: PollDraftInfo | undefined;
  setVisible: React.Dispatch<React.SetStateAction<PollDraftInfo | undefined>>;
}

const SubScreen1 = ({
  triggerFade,
  textInputVal,
  setTextInputVal,
  setSubScreen,
  keyboardDodgeRef,
  buttonFadeRef,
}: SubScreen1Props) => {
  const fadeRef = useRef(new Animated.Value(1)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  return (
    <Animated.View style={{ width: "100%", height: "100%", opacity: fadeRef }}>
      <Text style={styles.title}>Edit Poll</Text>
      <View style={[{ flex: 1, justifyContent: "center" }]}>
        <Text
          style={{
            color: "#853b30",
            fontSize: 15,
            fontFamily: "Lato_400Regular",
          }}
        >
          Poll Name
        </Text>
        <Spacer width="100%" height={10} />
        <TextInput
          value={textInputVal}
          selectionColor="#FFF"
          onChangeText={(text) => setTextInputVal(text)}
          onFocus={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          onBlur={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          style={{
            width: "100%",
            height: 50,
            backgroundColor: "#853b30",
            padding: 10,
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            borderRadius: 5,
          }}
        />
        <Spacer width="100%" height={10} />
        <AnimatedTouchable
          onPress={() =>
            Animated.timing(fadeRef, {
              toValue: 0,
              useNativeDriver: true,
              duration: 250,
            }).start(() => setSubScreen(2))
          }
          disabled={triggerFade}
          style={{
            alignSelf: "center",
            backgroundColor: "#853b30",
            padding: 10,
            borderRadius: 5,
            opacity: buttonFadeRef,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#FFF",
              fontSize: 15,
            }}
          >
            Next
          </Text>
        </AnimatedTouchable>
      </View>
    </Animated.View>
  );
};

const SubScreen2 = ({
  userID,
  name,
  visible,
  setVisible,
  description,
  setDescription,
  additionalInfo,
  setAdditionalInfo,
  keyboardDodgeRef,
}: SubScreen2Props) => {
  const [triggerFade, setTriggerFade] = useState(false);
  const fadeRef = useRef(new Animated.Value(0)).current;
  const buttonFadeRef = useRef(
    new Animated.Value(description === "" ? 0 : 1)
  ).current;
  const colorChangeRef = useRef(
    new Animated.Value(description === "" ? 0 : 1)
  ).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    setTriggerFade(description.length > 500 || description.length === 0);
  }, [description]);

  useEffect(() => {
    Animated.timing(fadeRef, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(buttonFadeRef, {
        toValue: triggerFade ? 0 : 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(colorChangeRef, {
        toValue: triggerFade ? 0 : 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [triggerFade]);

  return (
    <Animated.View style={{ width: "100%", height: "100%", opacity: fadeRef }}>
      <View style={[{ flex: 1, justifyContent: "center" }]}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: "#853b30",
              fontSize: 15,
              fontFamily: "Lato_400Regular",
            }}
          >
            Poll Description
          </Text>
          <Animated.Text
            style={{
              alignSelf: "center",
              fontSize: 12.5,
              fontFamily: "Lato_400Regular",
              color: colorChangeRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(255, 0, 0, 0.5)", "rgba(0, 0, 0, 0.5)"],
              }),
            }}
          >
            {description.length}/500
          </Animated.Text>
        </View>
        <Spacer width="100%" height={10} />
        <TextInput
          multiline
          value={description}
          selectionColor="#FFF"
          onChangeText={(text) => setDescription(text)}
          onFocus={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          onBlur={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          style={{
            width: "100%",
            height: 50,
            backgroundColor: "#853b30",
            paddingTop: 15,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 10,
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            borderRadius: 5,
          }}
        />
        <Spacer width="100%" height={20} />
        <Text
          style={{
            color: "#853b30",
            fontSize: 15,
            fontFamily: "Lato_400Regular",
          }}
        >
          Additional Information
        </Text>
        <Spacer width="100%" height={10} />
        <TextInput
          multiline
          value={additionalInfo}
          selectionColor="#FFF"
          onChangeText={(text) => setAdditionalInfo(text)}
          onFocus={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          onBlur={() =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start()
          }
          style={{
            width: "100%",
            height: 50,
            backgroundColor: "#853b30",
            paddingTop: 15,
            paddingLeft: 10,
            paddingRight: 10,
            paddingBottom: 10,
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            borderRadius: 5,
          }}
        />
        <Spacer width="100%" height={10} />
        <AnimatedTouchable
          onPress={async () => {
            await updatePollDraft(userID, visible.id, {
              additionalInfo,
              description,
              title: name,
            });
            setVisible(undefined);
          }}
          disabled={triggerFade}
          style={{
            alignSelf: "center",
            backgroundColor: "#853b30",
            padding: 10,
            borderRadius: 5,
            opacity: buttonFadeRef,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#FFF",
              fontSize: 15,
            }}
          >
            Update
          </Text>
        </AnimatedTouchable>
      </View>
    </Animated.View>
  );
};

export default function EditPollModal({
  visible,
  setVisible,
  userData,
}: EditPollModalProps) {
  const [textInputVal, setTextInputVal] = useState("");
  const [description, setDescription] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [triggerFade, setTriggerFade] = useState(false);
  const [subScreen, setSubScreen] = useState<1 | 2>(1);
  const buttonFadeRef = useRef(new Animated.Value(0)).current;
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible !== undefined) {
      setTextInputVal(visible.title);
      setDescription(visible.description);
      setAdditionalInfo(visible.additionalInfo);
    } else {
      setTextInputVal("");
      setDescription("");
      setAdditionalInfo("");
      setSubScreen(1);
    }
  }, [visible]);

  useEffect(() => {
    if (textInputVal === "") setTriggerFade(true);
    else setTriggerFade(false);
  }, [textInputVal]);

  useEffect(() => {
    if (triggerFade)
      Animated.timing(buttonFadeRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(buttonFadeRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [triggerFade]);

  return (
    <Modal transparent visible={visible !== undefined} animationType="fade">
      <Pressable
        onPress={() => setVisible(undefined)}
        style={[
          styles.centerView,
          {
            width: "100%",
            height: "100%",
            backgroundColor: "#00000090",
          },
        ]}
      >
        <Animated.View
          style={{
            width: 300,
            height: 300,
            backgroundColor: "#FFF",
            padding: 20,
            transform: [
              {
                translateY: keyboardDodgeRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -SCREEN_HEIGHT / 6],
                }),
              },
            ],
          }}
        >
          {subScreen === 1 ? (
            <SubScreen1
              {...{
                buttonFadeRef,
                keyboardDodgeRef,
                setTextInputVal,
                textInputVal,
                triggerFade,
                setSubScreen,
              }}
            />
          ) : (
            <SubScreen2
              {...{
                userID: userData.id,
                name: textInputVal,
                visible,
                setVisible,
                additionalInfo,
                description,
                keyboardDodgeRef,
                setAdditionalInfo,
                setDescription,
                setSubScreen,
                triggerFade,
              }}
            />
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    alignSelf: "center",
    color: "#853b30",
    fontSize: 30,
    fontFamily: "Lato_400Regular",
  },
});
