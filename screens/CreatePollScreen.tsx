import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Toast from "react-native-root-toast";
import React, { useEffect, useRef, useState } from "react";
import Spacer, { AnimatedSpacer } from "../components/Spacer";
import { StatusBar } from "expo-status-bar";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../constants/dimensions";
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
  Image,
  ImageBackground,
} from "react-native";
import { createPoll, UserData } from "../firebase";
import LoadingScreen from "../components/LoadingScreen";

type Screen = "Initial" | "Description" | "Loading" | "AddQuestions";
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
  textInputRef: React.MutableRefObject<TextInput>;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  editingDescription: boolean;
  setOuterAdditionalInfo: React.Dispatch<React.SetStateAction<string>>;
}
interface AddQuestionsProps {
  userData: {
    admin: boolean;
    createdAt: string;
    email: string;
    id: string;
    intakeSurvey: boolean;
  };
  pollData: {
    additionalInfo: string;
    author: string;
    dateCreated: string;
    description: string;
    previewImageURI: string;
    published: boolean;
    title: string;
  };
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
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(secondFadeProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (triggerEndAnimation) {
      Animated.timing(endAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setScreen({ name: "Description", params: { title: inputVal } });
      });
    }
  }, [triggerEndAnimation]);
};

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

const AdditionalInfoContainer = ({
  textInputRef,
  scrollViewRef,
  editingDescription,
  setOuterAdditionalInfo,
}: AdditionalInfoProps) => {
  const [editing, setEditing] = useState(false);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [useWhite, setUseWhite] = useState(editing);

  const riseAnimation = useRef(new Animated.Value(0)).current;
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const hasMounted = useRef(false);

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
                  outputRange: [0, SCREEN_HEIGHT * -0.8],
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
            }}
          />
        )}
        {!editing && additionalInfo !== "" && (
          <Pressable
            style={[
              {
                width: SCREEN_WIDTH - 20,
                height: 150,
                backgroundColor: "transparent",
                position: "absolute",
                zIndex: 2,
              },
            ]}
            onLongPress={() => {
              Haptics.selectionAsync();
              scrollViewRef.current.scrollTo({ y: 0, animated: true });
              setUseWhite(false);
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
                setEditing(true);
                textInputRef.current.focus();
              });
            }}
          />
        )}
      </Animated.View>
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

  const pickImage = async () => {
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
                  await pickImage();
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
          <TouchableOpacity onPress={pickImage}>
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
          style={[
            {
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
            styles.centerView,
          ]}
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

const AddQuestions = ({ userData, pollData }: AddQuestionsProps) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const fadeAnimationProgress = useRef(new Animated.Value(0)).current;
  const componentMounted = useRef(false);

  useEffect(() => {
    if (flipped) {
      Animated.sequence([
        Animated.timing(fadeAnimationProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(flipAnimationProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimationProgress, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      if (componentMounted.current)
        Animated.sequence([
          Animated.timing(fadeAnimationProgress, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(flipAnimationProgress, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimationProgress, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      else componentMounted.current = true;
    }
  }, [flipped]);

  return (
    <ScrollView
      style={[
        { width: "100%", height: "100%", paddingLeft: 10, paddingRight: 10 },
      ]}
    >
      <Spacer width="100%" height={10} />
      <Pressable
        onPress={() => {
          setFlipped(!flipped);
        }}
      >
        <Animated.View
          style={{
            transform: [
              {
                rotateY: flipAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", "180deg"],
                }),
              },
            ],
          }}
        >
          <ImageBackground
            source={{ uri: pollData.previewImageURI }}
            resizeMode="cover"
            style={{ width: "100%", height: 600 }}
            borderRadius={7.5}
          >
            {/* Text must be wrapped in a View b/c the Text component doesn't appear to support borderRadius */}
            <Animated.View
              style={{
                alignSelf: "center",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                marginTop: 5,
                borderRadius: 5,
                opacity: fadeAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
                transform: [
                  {
                    scaleX: flipAnimationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, -1],
                    }),
                  },
                ],
              }}
            >
              <Text
                style={{
                  alignSelf: "center",
                  fontSize: 30,
                  color: "#FFF",
                  fontFamily: "Actor_400Regular",
                  borderRadius: 5,
                  paddingLeft: 5,
                  paddingRight: 5,
                }}
              >
                {flipped ? "Additional Info" : pollData.title}
              </Text>
            </Animated.View>
            <View
              style={[
                styles.centerView,
                {
                  width: "100%",
                  flex: 1,
                  padding: 5,
                },
              ]}
            >
              <Animated.View
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  paddingLeft: 5,
                  paddingRight: 5,
                  borderRadius: 5,
                  opacity: fadeAnimationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0],
                  }),
                }}
              >
                <Text
                  style={{
                    fontFamily: "Actor_400Regular",
                    fontSize: 20,
                    color: "#FFF",
                  }}
                >
                  {pollData.description}
                </Text>
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>
      </Pressable>
    </ScrollView>
  );
};

const SetDescriptionInformation = ({
  title,
  keyboardAnimationVal,
  keyboardHeight,
  userData,
  setScreen,
}: SetDescriptionProps) => {
  const [mainDescription, setMainDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [previewImageURI, setPreviewImageURI] = useState();
  const [additionalInfo, setAdditionalInfo] = useState("");

  const fadeInAnimationProgress = useRef(new Animated.Value(0)).current;
  const buttonFadeAnimation = useRef(new Animated.Value(0)).current;
  const descriptionShakeProgress = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

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

  return (
    <ScrollView
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
          textInputRef={textInputRef}
          scrollViewRef={scrollViewRef}
          editingDescription={editingDescription}
          setOuterAdditionalInfo={setAdditionalInfo}
        />
      </Animated.View>

      <Spacer width="100%" height={40} />

      <AnimatedTouchable
        onPress={() => {
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

            createPoll(userData, pollData)
              .then(() => {
                setScreen({
                  name: "AddQuestions",
                  params: { userData, pollData },
                });
              })
              .catch((error) => {
                console.log(error);
              }); // do something in the event of an error

            setScreen({ name: "Loading" });
          }
        }}
        style={[
          {
            alignSelf: "center",
            width: 100,
            height: 50,
            backgroundColor: "#FFF",
            borderRadius: 7.5,
          },
          styles.centerView,
        ]}
      >
        <Text style={{ fontSize: 15, color: "#D2042D" }}>Create Draft</Text>
      </AnimatedTouchable>
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
    </ScrollView>
  );
};

export default function CreatePollScreen({ navigation, route }) {
  const keyboardAnimationVal = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const hasInitialScreen = route.params.initialScreen !== undefined;

  const initialScreenParams =
    route.params.initialScreen === undefined
      ? undefined
      : route.params.initialScreen.params;

  const [screen, setScreen] = useState<LocalPageScreen>({
    name: !hasInitialScreen ? "Initial" : route.params.initialScreen.name,
    ...(hasInitialScreen &&
      initialScreenParams && {
        params: initialScreenParams,
      }),
  });

  const useCenterView = screen.name !== "Description";
  const { userData } = route.params;

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
                userData={userData}
                setScreen={setScreen}
              />
            );
          case "AddQuestions":
            if (screen.params.pollData)
              return (
                <AddQuestions
                  pollData={screen.params.pollData}
                  userData={screen.params.userData}
                />
              );
          case "Loading":
            return <LoadingScreen color="#D2042D" />;
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
    color: "#D2042D",
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
    minHeight: 150,
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
});
