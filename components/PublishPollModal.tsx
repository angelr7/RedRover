import { SCREEN_HEIGHT } from "../constants/dimensions";
import { PollDraftInfo, publishPoll, publishPollDraft } from "../firebase";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Animated,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Spacer from "./Spacer";
import LoadingScreen from "./LoadingScreen";
import { TIME_UNITS } from "../constants/localization";
import { errorPrefix } from "@firebase/util";

interface PublishPollModalProps {
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

const SubScreen = ({
  userID,
  visible,
  setVisible,
  keyboardDodgeRef,
}: {
  userID: string;
  visible: PollDraftInfo | undefined;
  keyboardDodgeRef: Animated.Value;
  setVisible: React.Dispatch<React.SetStateAction<PollDraftInfo | undefined>>;
}) => {
  const [currUnit, setCurrUnit] = useState(0);
  const [error, displayError] = useState<number>(0);
  const [expiration, setExpiration] = useState("");
  const [publishing, triggerPublish] = useState(false);
  const [finalizing, finalizePublish] = useState(false);
  const [unitButtonDisabled, disableUnitButton] = useState(false);
  const loadRef = useRef(new Animated.Value(0)).current;
  const fadeRef = useRef(new Animated.Value(1)).current;
  const error1Ref = useRef(new Animated.Value(0)).current;
  const error2Ref = useRef(new Animated.Value(0)).current;
  const deleteRef = useRef(new Animated.Value(0)).current;
  const unitAnimation = useRef(new Animated.Value(0)).current;
  const submitButtonRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const changeUnit = () => {
    disableUnitButton(true);
    Animated.timing(unitAnimation, {
      toValue: 1,
      duration: 125,
      useNativeDriver: true,
    }).start(() => {
      setCurrUnit((currUnit + 1) % TIME_UNITS.length);
      unitAnimation.setValue(-1);
      Animated.timing(unitAnimation, {
        toValue: 0,
        duration: 125,
        useNativeDriver: true,
      }).start(() => disableUnitButton(false));
    });
  };

  useEffect(() => {
    if (publishing)
      Animated.sequence([
        Animated.timing(fadeRef, {
          toValue: 0,
          duration: 125,
          useNativeDriver: true,
        }),
        Animated.timing(deleteRef, {
          toValue: 1,
          duration: 125,
          useNativeDriver: false,
        }),
      ]).start(() => {});
    else deleteRef.setValue(0);
  }, [publishing]);

  useEffect(() => {
    Animated.timing(submitButtonRef, {
      toValue: expiration === "" ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [expiration]);

  useEffect(() => {
    if (finalizing) {
      Animated.sequence([
        Animated.timing(deleteRef, {
          toValue: 0,
          duration: 125,
          useNativeDriver: false,
        }),
        Animated.timing(loadRef, {
          toValue: 1,
          duration: 125,
          useNativeDriver: false,
        }),
      ]).start(async () => {
        const result = await publishPollDraft(userID, visible.id, {
          time: parseInt(expiration),
          unit: TIME_UNITS[currUnit],
        });
        if (result === -1 || result === -2) {
          displayError(result);
        } else {
          setVisible(undefined);
          finalizePublish(false);
        }
      });
    }
  }, [finalizing]);

  useEffect(() => {
    if (error === -1)
      Animated.sequence([
        Animated.timing(loadRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(error1Ref, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    if (error === -2)
      Animated.sequence([
        Animated.timing(loadRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(error2Ref, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
  }, [error]);

  return (
    <>
      <View
        style={{
          top: 20,
          width: "100%",
          height: "100%",
          alignSelf: "center",
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: loadRef,
            opacity: loadRef,
          }}
        >
          <LoadingScreen color="#853b30" />
        </Animated.View>
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            zIndex: error1Ref,
            opacity: error1Ref,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              color: "#853b30",
              textAlign: "center",
              fontFamily: "Lato_400Regular",
            }}
          >
            You cannot publish this poll!
          </Text>
          <Spacer width="100%" height={20} />
          <Text
            style={{
              fontSize: 20,
              color: "#853b30",
              textAlign: "center",
              fontFamily: "Lato_400Regular",
            }}
          >
            Please add questions to continue!
          </Text>
        </Animated.View>
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            zIndex: error2Ref,
            opacity: error2Ref,
          }}
        >
          <Text
            style={{
              fontSize: 20,
              color: "#853b30",
              textAlign: "center",
              fontFamily: "Lato_400Regular",
            }}
          >
            Publishing failed!
          </Text>
          <Spacer width="100%" height={20} />
          <Text
            style={{
              fontSize: 20,
              color: "#853b30",
              textAlign: "center",
              fontFamily: "Lato_400Regular",
            }}
          >
            You have already published this poll!
          </Text>
        </Animated.View>
      </View>
      <Animated.View
        style={{
          position: "absolute",
          alignSelf: "center",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          width: "100%",
          opacity: deleteRef,
          top: 20,
          zIndex: deleteRef,
        }}
      >
        <Text
          style={[
            styles.title,
            {
              width: "80%",
              fontSize: 20,
              color: "#853b30",
              textAlign: "center",
              fontFamily: "Lato_400Regular",
            },
          ]}
        >
          When would you like this poll to expire?
        </Text>
        <Spacer width="100%" height={20} />
        <View
          style={{
            width: "100%",
            padding: 15,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextInput
            selectionColor="#FFF"
            keyboardType="number-pad"
            value={expiration}
            onChangeText={(text) => setExpiration(text)}
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
              flex: 1,
              backgroundColor: "#853b30",
              borderRadius: 5,
              fontFamily: "Lato_400Regular",
              color: "#FFF",
              fontSize: 20,
              height: 50,
              textAlign: "center",
            }}
          />
          <Spacer height="100%" width={20} />
          <TouchableOpacity
            disabled={unitButtonDisabled}
            onPress={() => changeUnit()}
            style={{
              flex: 1,
              height: 50,
              borderWidth: 2.5,
              borderRadius: 5,
              borderColor: "#853b30",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.Text
              style={{
                color: "#853b30",
                fontSize: 20,
                fontFamily: "Lato_400Regular",
                transform: [
                  {
                    translateY: unitAnimation.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [45, 0, -45],
                    }),
                  },
                ],
                opacity: unitAnimation.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0, 1, 0],
                }),
              }}
            >
              {TIME_UNITS[currUnit]}
            </Animated.Text>
          </TouchableOpacity>
        </View>
        <Spacer width="100%" height={20} />
        <AnimatedTouchable
          disabled={finalizing}
          onPress={() => finalizePublish(true)}
          style={{
            backgroundColor: "#853b30",
            padding: 10,
            justifyContent: "center",
            alignItems: "center",
            opacity: submitButtonRef,
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 20,
            }}
          >
            Submit
          </Text>
        </AnimatedTouchable>
      </Animated.View>
      <Animated.View style={{ width: "100%", flex: 1, opacity: fadeRef }}>
        <Text style={styles.title}>Publishing Poll!</Text>
        <Spacer width="100%" height={20} />
        <View style={[styles.centerView, { width: "100%", flex: 1 }]}>
          <Text>
            <Text
              style={{
                color: "#853b30",
                fontFamily: "Lato_400Regular",
                fontSize: 17.5,
                flexDirection: "row",
              }}
            >
              Are you sure you want to publish your poll? Once published,
            </Text>
            <Text
              style={{
                fontWeight: "bold",
                color: "#853b30",
                fontFamily: "Lato_700Bold",
                fontSize: 17.5,
                flexDirection: "row",
              }}
            >
              {" you cannot edit your poll any further."}
            </Text>
          </Text>
          <Spacer width="100%" height={20} />
          <View
            style={{
              flex: 1,
              width: "50%",
              justifyContent: "space-evenly",
            }}
          >
            <TouchableOpacity
              onPress={() => triggerPublish(true)}
              style={[
                styles.centerView,
                {
                  padding: 10,
                  backgroundColor: "#853b30",
                  borderRadius: 5,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
                Yes, Publish Poll
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVisible(undefined)}
              style={[
                styles.centerView,
                {
                  padding: 10,
                  backgroundColor: "#853b30",
                  borderRadius: 5,
                },
              ]}
            >
              <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
                No, Take Me Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

export default function PublishPollModal({
  userData,
  visible,
  setVisible,
}: PublishPollModalProps) {
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;
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
          <SubScreen
            visible={visible}
            userID={userData.id}
            setVisible={setVisible}
            keyboardDodgeRef={keyboardDodgeRef}
          />
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
