import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-root-toast";
import Spacer from "../components/Spacer";
import React, { useEffect, useRef, useState } from "react";
import { LocalPageScreen } from "./CreatePollScreen";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../constants/dimensions";
import { createPoll, editPoll, UserData } from "../firebase";
import {
  Animated,
  TextInput,
  Keyboard,
  TouchableOpacity,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";

interface SetDescriptionProps {
  title: string;
  description: string;
  passedPreviewImageURI: string;
  passedAdditionalInfo: string;
  keyboardAnimationVal: Animated.Value;
  keyboardHeight: number;
  userData: UserData;
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>;
}
interface EditablePollTitleProps {
  fadeInAnimationProgress: Animated.Value;
  title: string;
}
interface DescriptionContainerProps {
  mainDescription: string;
  editingDescription: boolean;
  setEditingDescription: React.Dispatch<React.SetStateAction<boolean>>;
  shakeAnimationProgress: Animated.Value;
}
interface EditDescriptionModalProps {
  keyboardAnimationVal: Animated.Value;
  keyboardHeight: number;
  editingDescription: boolean;
  mainDescription: string;
  setEditingDescription: React.Dispatch<React.SetStateAction<boolean>>;
  setMainDescription: React.Dispatch<React.SetStateAction<string>>;
}
interface AdditionalInfoProps {
  passedDescription: string;
  textInputRef: React.MutableRefObject<TextInput>;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  previewImageURI: string | undefined;
  outerAdditionalInfo: string;
  setOuterAdditionalInfo: React.Dispatch<React.SetStateAction<string>>;
}
interface SubmitButtonProps {
  mainDescription: string;
  descriptionShakeProgress: Animated.Value;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  title: string;
  additionalInfo: string;
  previewImageURI: string;
  description: string;
  userData: UserData;
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>;
}

const showToast = (message: string) => {
  Toast.show(message, {
    animation: true,
    duration: 3000,
    position: Toast.positions.TOP,
    containerStyle: {
      width: SCREEN_WIDTH * 0.75,
      height: 80,
      top: 20,
      justifyContent: "center",
      alignContent: "center",
      backgroundColor: "#FFF",
      paddingRight: 10,
      paddingLeft: 10,
      opacity: 1,
    },
    textStyle: {
      fontFamily: "Actor_400Regular",
      color: "#D2042D",
      fontSize: 17.5,
      lineHeight: 25,
    },
    shadow: false,
    opacity: 1,
  });
};

const pickImage = async (
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>,
  setEditing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  // casting to "any" allows us to avoid annoying TS errors
  // from the library
  let result: any = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    allowsEditing: true,

    // ratio must be 1:1 for now since the expo image picker's
    // edit box doesn't adjust for aspect ratio
    aspect: [1, 1],
    quality: 1,
  });

  if (!result.cancelled) {
    setPreviewImage(result.uri);
  } else setEditing(false);
};

const handleKeyboardAnimation = (
  passedDescription: string,
  expandAnimation: Animated.Value,
  riseAnimation: Animated.Value,
  additionalInfo: string,
  setOuterAdditionalInfo: React.Dispatch<React.SetStateAction<string>>,
  setUseWhite: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const hasMounted = useRef(passedDescription !== "");

  useEffect(() => {
    Keyboard.addListener("keyboardWillHide", () => {
      if (hasMounted.current)
        Animated.sequence([
          Animated.timing(expandAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
          Animated.timing(riseAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setOuterAdditionalInfo(additionalInfo);
          setUseWhite(true);
          // if (!editingDescription)
          //   scrollViewRef.current.scrollToEnd({ animated: true });
        });
      else hasMounted.current = true;
    });
  }, []);
};

const handleDescriptionAnimations = (
  fadeInAnimationProgress: Animated.Value,
  buttonFadeAnimation: Animated.Value,
  mainDescription: string
) => {
  useEffect(() => {
    Animated.timing(fadeInAnimationProgress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (mainDescription === "") {
      Animated.timing(buttonFadeAnimation, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(buttonFadeAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [mainDescription]);
};

const handleShakeAnimation = (
  mainDescription: string,
  descriptionShakeProgress: Animated.Value,
  scrollViewRef: React.MutableRefObject<ScrollView>,
  title: string,
  additionalInfo: string,
  previewImageURI: string,
  description: string,
  userData: UserData,
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>
) => {
  if (mainDescription === "") {
    Animated.loop(
      Animated.sequence([
        Animated.timing(descriptionShakeProgress, {
          toValue: -1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionShakeProgress, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionShakeProgress, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(descriptionShakeProgress, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    ).start();
    scrollViewRef.current.scrollTo({ y: 0, animated: true });
    showToast("You must enter a description for your poll!");
  } else {
    const pollData = {
      title,
      additionalInfo,
      description: mainDescription,
      previewImageURI: previewImageURI ?? "",
    };

    // fresh screen means we need to create a new poll
    if (description === "") {
      createPoll(userData, pollData)
        .then((result) => {
          setScreen({
            name: "AddQuestions",
            params: { userData, pollData: result },
          });
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      editPoll(userData.id, title, pollData)
        .then((result) => {
          setScreen({
            name: "AddQuestions",
            params: { userData, pollData: result },
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }
    setScreen({ name: "Loading" });
  }
};

const EditablePollTitle = ({
  fadeInAnimationProgress,
  title,
}: EditablePollTitleProps) => {
  const [inputVal, setInputVal] = useState(title.trim());
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <Animated.View
      style={[
        styles.centerView,
        styles.editableTitleContainer,
        {
          opacity: fadeInAnimationProgress,
        },
      ]}
    >
      <TextInput
        style={styles.editableTitle}
        value={inputVal}
        editable={editingTitle}
        onChangeText={(text) => {
          setInputVal(text);
        }}
      />
      <Spacer height="100%" width={10} />
      <TouchableOpacity
        style={[styles.centerView]}
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
  shakeAnimationProgress,
}: DescriptionContainerProps) => {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
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
      <AnimatedPressable
        onLongPress={() => {
          Haptics.selectionAsync();
          setEditingDescription(true);
        }}
        style={[
          styles.descriptionContainer,
          styles.centerView,
          {
            // this one can be absolute
            height: 150,
            transform: [
              {
                translateX: shakeAnimationProgress.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [-20, 20],
                }),
              },
            ],
          },
        ]}
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
      </AnimatedPressable>
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

const AdditionalInformationDetail = ({
  previewImageURI,
  expandAnimation,
  riseAnimation,
  editing,
  additionalInfo,
  scrollViewRef,
  setUseWhite,
  setEditing,
  textInputRef,
  useWhite,
  setAdditionalInfo,
}) => {
  const screenPercentageOffset = previewImageURI === undefined ? -0.8 : -0.925;

  const riseAndExpand = (callback: () => any = undefined) => {
    Animated.sequence([
      Animated.timing(riseAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(expandAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(
      callback === undefined
        ? () => {
            textInputRef.current.focus();
          }
        : callback
    );
  };

  return (
    <Animated.View
      style={[
        styles.additionalInfoContainer,
        styles.centerView,
        {
          maxHeight: expandAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [150, 400],
          }),
          backgroundColor: riseAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgb(114, 47, 55)", "rgb(255, 255, 255)"],
          }),
          transform: [
            {
              translateY: riseAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, SCREEN_HEIGHT * screenPercentageOffset],
              }),
            },
          ],
          opacity: riseAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
        !editing &&
          additionalInfo === "" && {
            height: 150,
            opacity: 1,
            backgroundColor: "rgba(114, 47, 55, 0.5)",
          },
      ]}
    >
      {additionalInfo === "" && !editing && (
        <TouchableOpacity
          onPress={() => {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
            setUseWhite(false);
            setEditing(true);
            riseAndExpand();
          }}
        >
          <Ionicons name="add-circle" style={styles.addIcon} />
        </TouchableOpacity>
      )}
      {(additionalInfo !== "" || editing) && (
        <TextInput
          value={additionalInfo}
          multiline={true}
          selectionColor="#D2042D"
          editable={editing}
          ref={(ref) => {
            textInputRef.current = ref;
          }}
          style={[
            styles.additionalInfoInput,
            { color: editing && !useWhite ? "#D2042D" : "#FFF" },
          ]}
          onChangeText={(text) => {
            setAdditionalInfo(text);
          }}
          onFocus={() => {
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
            setUseWhite(false);
            riseAndExpand();
          }}
        />
      )}
      {!editing && additionalInfo !== "" && (
        <Pressable
          style={styles.pressableCover}
          onLongPress={() => {
            Haptics.selectionAsync();
            scrollViewRef.current.scrollTo({ y: 0, animated: true });
            setUseWhite(false);
            riseAndExpand(() => {
              setEditing(true);
              textInputRef.current.focus();
            });
          }}
        />
      )}
    </Animated.View>
  );
};

const AdditionalInfoContainer = ({
  passedDescription,
  textInputRef,
  scrollViewRef,
  previewImageURI,
  outerAdditionalInfo,
  setOuterAdditionalInfo,
}: AdditionalInfoProps) => {
  const [editing, setEditing] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState(outerAdditionalInfo);
  const [useWhite, setUseWhite] = useState(editing);

  const riseAnimation = useRef(new Animated.Value(0)).current;
  const expandAnimation = useRef(new Animated.Value(0)).current;

  handleKeyboardAnimation(
    passedDescription,
    expandAnimation,
    riseAnimation,
    additionalInfo,
    setOuterAdditionalInfo,
    setUseWhite
  );

  return (
    // height of the item, plus margin
    <View>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.headingText}>Additional Information</Text>
        <TouchableOpacity
          style={[{ marginLeft: 10 }, styles.centerView]}
          onPress={() => {
            if (!editing) {
              scrollViewRef.current.scrollTo({ y: 0, animated: true });
              setUseWhite(false);
              setEditing(true);
              Animated.sequence([
                Animated.timing(riseAnimation, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }),
                Animated.timing(expandAnimation, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: false,
                }),
              ]).start(() => {
                textInputRef.current.focus();
              });
            } else {
              // user can't lock until blur is complete, so no need for animation here
              // scrollViewRef.current.scrollToEnd({ animated: true });
              setOuterAdditionalInfo(additionalInfo);
              setEditing(false);
              setUseWhite(false);
            }
          }}
        >
          <FontAwesome5
            name={editing ? "unlock" : "lock"}
            style={{ color: "#FFF", fontSize: 15, opacity: 1 }}
          />
        </TouchableOpacity>
      </View>
      <AdditionalInformationDetail
        {...{
          previewImageURI,
          additionalInfo,
          editing,
          expandAnimation,
          riseAnimation,
          scrollViewRef,
          setAdditionalInfo,
          setEditing,
          setUseWhite,
          textInputRef,
          useWhite,
        }}
      />
    </View>
  );
};

const PreviewImageContainer = ({
  previewImage,
  setPreviewImage,
}: {
  previewImage: string;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [editing, setEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const imageAnimationProgress = useRef(new Animated.Value(0)).current;

  return (
    <View>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.headingText}>Preview Image</Text>
        <TouchableOpacity
          style={[{ marginLeft: 10 }, styles.centerView]}
          onPress={
            !editing
              ? async () => {
                  setEditing(true);
                  await pickImage(setPreviewImage, setEditing);
                }
              : () => {
                  setEditing(false);
                }
          }
        >
          <FontAwesome5
            name={editing ? "unlock" : "lock"}
            style={{ color: "#FFF", fontSize: 15 }}
          />
        </TouchableOpacity>
      </View>
      <View style={[styles.descriptionContainer, styles.centerView]}>
        {previewImage === undefined && (
          <TouchableOpacity
            onPress={async () => {
              await pickImage(setPreviewImage, setEditing);
            }}
          >
            <Ionicons name="add-circle" style={styles.addIcon} />
          </TouchableOpacity>
        )}
        {previewImage && (
          <Pressable
            onLongPress={() => {
              setModalVisible(true);
            }}
          >
            <Image
              source={{ uri: previewImage }}
              style={{ width: 200, height: 200 }}
            />
          </Pressable>
        )}
      </View>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <Pressable
          style={[styles.shadowContainer, styles.centerView]}
          onPress={() => {
            setModalVisible(false);
          }}
        >
          <Pressable
            onLongPress={() => {
              Animated.timing(imageAnimationProgress, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }).start();
            }}
          >
            <Animated.Image
              source={{ uri: previewImage }}
              style={{
                width: 400,
                height: 400,
                transform: [
                  {
                    rotateX: imageAnimationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                ],
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const SubmitButton = ({
  mainDescription,
  descriptionShakeProgress,
  scrollViewRef,
  title,
  additionalInfo,
  previewImageURI,
  description,
  userData,
  setScreen,
}: SubmitButtonProps) => {
  return (
    <TouchableOpacity
      onPress={() => {
        handleShakeAnimation(
          mainDescription,
          descriptionShakeProgress,
          scrollViewRef,
          title,
          additionalInfo,
          previewImageURI,
          description,
          userData,
          setScreen
        );
      }}
      style={[styles.submitButtonContainer, styles.centerView]}
    >
      <Text style={{ fontSize: 15, color: "#D2042D" }}>
        {description === "" ? "Create Draft" : "Save Changes"}
      </Text>
    </TouchableOpacity>
  );
};

export default function SetDescriptionInformation({
  title,
  description,
  passedPreviewImageURI,
  passedAdditionalInfo,
  keyboardAnimationVal,
  keyboardHeight,
  userData,
  setScreen,
}: SetDescriptionProps) {
  const [mainDescription, setMainDescription] = useState(description);
  const [editingDescription, setEditingDescription] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState(passedAdditionalInfo);
  const [previewImageURI, setPreviewImageURI] = useState(
    passedPreviewImageURI === "" ? undefined : passedPreviewImageURI
  );

  const fadeInAnimationProgress = useRef(
    new Animated.Value(description === "" ? 0 : 1)
  ).current;
  const buttonFadeAnimation = useRef(new Animated.Value(0)).current;
  const descriptionShakeProgress = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  handleDescriptionAnimations(
    fadeInAnimationProgress,
    buttonFadeAnimation,
    mainDescription
  );

  return (
    <ScrollView
      style={styles.androidSafeView}
      ref={(ref) => (scrollViewRef.current = ref)}
      scrollEventThrottle={20}
      showsVerticalScrollIndicator={false}
    >
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
          shakeAnimationProgress={descriptionShakeProgress}
        />
        <Spacer width="100%" height={40} />

        <PreviewImageContainer
          previewImage={previewImageURI}
          setPreviewImage={setPreviewImageURI}
        />
        <Spacer width="100%" height={40} />

        <AdditionalInfoContainer
          passedDescription={description}
          textInputRef={textInputRef}
          scrollViewRef={scrollViewRef}
          previewImageURI={previewImageURI}
          outerAdditionalInfo={additionalInfo}
          setOuterAdditionalInfo={setAdditionalInfo}
        />
      </Animated.View>

      <Spacer width="100%" height={40} />

      <SubmitButton
        {...{
          mainDescription,
          descriptionShakeProgress,
          scrollViewRef,
          title,
          additionalInfo,
          previewImageURI,
          description,
          userData,
          setScreen,
        }}
      />

      <Spacer width="100%" height={20} />

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

      {/* On Android devices, the StatusBar throws off the ScrollView height */}
      {Platform.OS === "android" && (
        <Spacer width="100%" height={StatusBar.currentHeight} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
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
    minHeight: 150,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 7.5,
    padding: 20,
  },
  mainDescriptionText: {
    fontSize: 15,
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    textAlign: "justify",
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
  additionalInfoContainer: {
    width: SCREEN_WIDTH - 20,
    marginTop: 10,
    alignSelf: "center",
    borderRadius: 7.5,
    padding: 20,
  },
  additionalInfoInput: {
    width: "100%",
    minHeight: 130,
    maxHeight: 380,
    fontSize: 17.5,
    fontFamily: "Actor_400Regular",
  },
  pressableCover: {
    width: SCREEN_WIDTH - 20,
    height: 150,
    backgroundColor: "transparent",
    position: "absolute",
    zIndex: 2,
  },
  shadowContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  submitButtonContainer: {
    alignSelf: "center",
    minWidth: 100,
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 7.5,
    padding: 7.5,
  },
  androidSafeView: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  editableTitleContainer: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 20,
    maxWidth: "90%",
    paddingLeft: Platform.OS === "android" ? 5 : 0,
    paddingRight: Platform.OS === "android" ? 5 : 0,
  },
});
