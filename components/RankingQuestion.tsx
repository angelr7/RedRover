import Spacer from "./Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { ListEmpty } from "../screens/CreatePolls";
import React, { useEffect, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Animated,
  Keyboard,
  Image,
} from "react-native";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import { Answer, createQuestion } from "../firebase";
import { Question } from "../screens/CreatePollScreen";
import FastImage from "./FastImage";

type RankingVariant = "Text Ranking" | "Image Ranking";
interface VariantButtonContainerProps {
  variant: RankingVariant;
  setVariant: React.Dispatch<React.SetStateAction<RankingVariant>>;
}
interface AnswerContainerProps {
  variant: RankingVariant;
  toRank: RankingItem[];
  setToRank: React.Dispatch<React.SetStateAction<RankingItem[]>>;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  pollID: string;
  currQuestion: Question;
}
interface AddItemModalProps {
  riseAnimationProgress: Animated.Value;
  itemText: string;
  modalVisible: boolean;
  toRank: RankingItem[];
  setItemText: React.Dispatch<React.SetStateAction<string>>;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setToRank: React.Dispatch<React.SetStateAction<RankingItem[]>>;
}
interface RankingItem {
  variant: RankingVariant;
  data: string | Blob; // will be item text or a URI
  uri?: string;
}
interface AnswerPreviewProps {
  item: RankingItem;
  index: number;
  toRank: RankingItem[];
  setToRank: React.Dispatch<React.SetStateAction<RankingItem[]>>;
  pollID: string;
  currQuestion: Question;
}
interface RankingProps {
  pollID: string;
  questionText: string;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  currQuestion: Question;
}

const handleRiseAnimation = (riseAnimationProgress: Animated.Value) => {
  useEffect(() => {
    Keyboard.addListener("keyboardWillShow", () => {
      Animated.timing(riseAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    Keyboard.addListener("keyboardWillHide", () => {
      Animated.timing(riseAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, []);
};

const handleFlipAnimation = (
  flipAnimationProgress: Animated.Value,
  flipped: boolean
) => {
  useEffect(() => {
    if (flipped)
      Animated.timing(flipAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(flipAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [flipped]);
};

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

  const image = await fetch(result.uri);
  const bytes = await image.blob();

  if (!result.cancelled) return { bytes, uri: result.uri };
};

const VariantButtonContainer = ({
  variant,
  setVariant,
}: VariantButtonContainerProps) => {
  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>
        <TouchableOpacity
          onPress={() => setVariant("Text Ranking")}
          style={[
            styles.buttonContainer,
            variant === "Text Ranking" && { backgroundColor: "#FFF" },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Text Ranking" && { color: "#D2042D" },
            ]}
          >
            Text Ranking
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVariant("Image Ranking")}
          style={[
            styles.buttonContainer,
            variant === "Image Ranking" && { backgroundColor: "#FFF" },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Image Ranking" && { color: "#D2042D" },
            ]}
          >
            Image Ranking
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const AnswerPreview = ({
  item,
  index,
  toRank,
  setToRank,
  pollID,
  currQuestion,
}: AnswerPreviewProps) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const imageButtonStyle = {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderColor: "#FFF",
    borderWidth: 1,
  };

  const re = /^file:\/\//;
  const localUri = item.uri !== undefined && re.test(item.uri);

  handleFlipAnimation(flipAnimationProgress, flipped);

  return (
    <AnimatedPressable
      key={index}
      onPress={() => setFlipped(!flipped)}
      style={[
        styles.itemPreviewParent,
        styles.centerView,
        {
          transform: [
            {
              rotateY: flipAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "180deg"],
              }),
            },
          ],
        },
      ]}
    >
      {item.variant === "Text Ranking" ? (
        <Animated.Text
          style={[
            styles.itemPreviewText,
            {
              opacity: flipAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          {typeof item.data === "string" && item.data}
        </Animated.Text>
      ) : localUri ? (
        // sub Image component for local URI's because they're faster (no state update)
        <Image
          source={{ uri: localUri && item.uri }}
          style={{ width: 100, height: 100, borderRadius: 5 }}
        />
      ) : (
        <FastImage
          trueCenter
          pollID={pollID}
          uri={item.uri && item.uri}
          style={{ width: 100, height: 100, borderRadius: 5 }}
          answerImageData={{
            answerIndex: index,
            questionID: currQuestion && currQuestion.id,
          }}
        />
      )}
      <Animated.View
        style={[
          styles.itemPreviewBackside,
          styles.centerView,
          { opacity: flipAnimationProgress },
        ]}
      >
        <TouchableOpacity
          disabled={!flipped}
          onPress={() => {
            setToRank(
              toRank.filter((rankingItem) => {
                if (rankingItem.variant === "Text Ranking")
                  return rankingItem.data !== item.data;
                else return rankingItem.uri !== item.uri;
              })
            );
          }}
          style={[
            styles.backsideButtonContainer,
            item.variant === "Image Ranking" && imageButtonStyle,
          ]}
        >
          <Text
            style={[
              styles.backsideButtonText,
              item.variant === "Image Ranking" && { color: "#FFF" },
            ]}
          >
            Delete
          </Text>
        </TouchableOpacity>
        <Spacer width="100%" height={5} />
        <TouchableOpacity
          disabled={!flipped}
          onPress={() => setFlipped(!flipped)}
          style={[
            styles.backsideButtonContainer,
            item.variant === "Image Ranking" && imageButtonStyle,
          ]}
        >
          <Text
            style={[
              styles.backsideButtonText,
              item.variant === "Image Ranking" && { color: "#FFF" },
            ]}
          >
            Back
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </AnimatedPressable>
  );
};

const AnswerContainer = ({
  variant,
  toRank,
  setToRank,
  setModalVisible,
  pollID,
  currQuestion,
}: AnswerContainerProps) => {
  return (
    <>
      <View style={styles.outerRed}>
        <View style={[styles.centerView, styles.wineColor, { padding: 0 }]}>
          {toRank.length === 0 && (
            <View style={{ padding: 20 }}>
              <ListEmpty />
            </View>
          )}
          {toRank.length > 0 && (
            <View style={styles.itemPreviewContainer}>
              {toRank.map((item, index) => (
                <AnswerPreview
                  toRank={toRank}
                  setToRank={setToRank}
                  item={item}
                  index={index}
                  key={index}
                  pollID={pollID}
                  currQuestion={currQuestion}
                />
              ))}
            </View>
          )}
        </View>
      </View>
      <Spacer width="100%" height={10} />
      {variant !== undefined && (
        <TouchableOpacity
          style={styles.addButtonContainer}
          onPress={async () => {
            if (variant === "Text Ranking") setModalVisible(true);
            else {
              const { bytes, uri } = await pickImage();
              if (bytes !== undefined) {
                setToRank(
                  toRank.concat([
                    { variant: "Image Ranking", data: bytes, uri },
                  ])
                );
              }
            }
          }}
        >
          <Ionicons name="add-circle" style={styles.addButton1} />
          <Ionicons name="add-circle" style={styles.addButton2} />
        </TouchableOpacity>
      )}
    </>
  );
};

const AddItemModal = ({
  riseAnimationProgress,
  itemText,
  modalVisible,
  setItemText,
  setModalVisible,
  toRank,
  setToRank,
}: AddItemModalProps) => {
  const [placeholder, setPlaceholder] = useState("Enter item text...");
  const fadeAnimationProgress = useRef(new Animated.Value(0)).current;
  const noText = itemText === "";

  useEffect(() => {
    if (!noText)
      Animated.timing(fadeAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    else
      Animated.timing(fadeAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
  }, [noText]);

  return (
    <Modal visible={modalVisible} animationType="fade" transparent>
      <Pressable
        onPress={() => setModalVisible(false)}
        style={[styles.centerView, styles.modalParent]}
      >
        <Animated.View
          style={[
            styles.modalInner,
            {
              transform: [
                {
                  translateY: riseAnimationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -SCREEN_HEIGHT * 0.1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.modalHeading}>Add Item</Text>
          <Spacer width="100%" height={10} />
          <Text style={styles.modalSubheading}>Item Text</Text>
          <Spacer width="100%" height={10} />
          <View style={styles.outerRed}>
            <TextInput
              style={[styles.wineColorAlt, styles.modalTextInput]}
              value={itemText}
              placeholder={placeholder}
              placeholderTextColor="#FFF"
              onFocus={() => setPlaceholder("")}
              onBlur={() => setPlaceholder("Enter item text...")}
              onChangeText={(text) => setItemText(text)}
            />
          </View>
          <Spacer width="100%" height={10} />
          <Animated.View
            style={[
              styles.buttonMask,
              {
                opacity: fadeAnimationProgress,
                height: fadeAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 40],
                }),
              },
            ]}
          >
            <TouchableOpacity
              disabled={itemText === ""}
              style={styles.submitButtonContainer}
              onPress={() => {
                if (
                  toRank.filter((item) => item.data === itemText).length === 0
                ) {
                  setToRank(
                    toRank.concat([{ variant: "Text Ranking", data: itemText }])
                  );
                  setItemText("");
                }
              }}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

// TODO: fix imagePicker promise rejection
export default function Ranking({
  pollID,
  questionText,
  questions,
  setQuestions,
  setOuterModalVisible,
  currQuestion,
}: RankingProps) {
  const [variant, setVariant] = useState<RankingVariant>(undefined);
  const [toRank, setToRank] = useState<RankingItem[]>(
    currQuestion === undefined
      ? []
      : currQuestion.answers.map((question): RankingItem => {
          const isTextRanking = question.answerVariant === "Text Ranking";
          return {
            data: isTextRanking ? question.answerText : "",
            uri: isTextRanking ? undefined : question.answerText,
            // do this to avoid TS error
            variant: isTextRanking ? "Text Ranking" : "Image Ranking",
          };
        })
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [itemText, setItemText] = useState("");
  const riseAnimationProgress = useRef(new Animated.Value(0)).current;

  handleRiseAnimation(riseAnimationProgress);

  return (
    <>
      <Text style={styles.heading}>Select Variant</Text>
      <Spacer width="100%" height={10} />
      <VariantButtonContainer variant={variant} setVariant={setVariant} />
      <Spacer width="100%" height={40} />
      <Text style={styles.heading}>Items To Rank</Text>
      <Spacer width="100%" height={10} />
      <AnswerContainer
        variant={variant}
        toRank={toRank}
        setToRank={setToRank}
        setModalVisible={setModalVisible}
        pollID={pollID}
        currQuestion={currQuestion}
      />
      {toRank.length > 1 && questionText !== "" && (
        <>
          <Spacer width="100%" height={10} />
          <View style={styles.modalSubmitButtonOuterContainer}>
            <TouchableOpacity
              style={styles.modalSubmitButtonContainer}
              onPress={async () => {
                const answers = toRank.map((item): Answer => {
                  return {
                    answerText:
                      item.variant === "Text Ranking" &&
                      typeof item.data === "string"
                        ? item.data
                        : "",
                    answerType: "Ranking",
                    answerVariant: item.variant,
                    imageData:
                      typeof item.data !== "string" ? item.data : undefined,
                  };
                });
                const questionData = await createQuestion(
                  pollID,
                  "Ranking",
                  questionText,
                  answers
                );
                setQuestions(questions.concat([questionData]));
                setOuterModalVisible(false);
              }}
            >
              <Text style={styles.modalSubmitButtonText}>
                {currQuestion === undefined ? "Submit" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      <AddItemModal
        riseAnimationProgress={riseAnimationProgress}
        itemText={itemText}
        modalVisible={modalVisible}
        toRank={toRank}
        setItemText={setItemText}
        setModalVisible={setModalVisible}
        setToRank={setToRank}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    color: "#D2042D",
    fontSize: 17.5,
  },
  outerContainer: {
    width: "100%",
    backgroundColor: "#D2042D",
    borderRadius: 7.5,
  },
  innerContainer: {
    width: "100%",
    flex: 1,
    borderRadius: 7.5,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  buttonContainer: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#FFF",
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
  },
  outerRed: {
    backgroundColor: "#D2042D",
    width: "100%",
    borderRadius: 7.5,
  },
  wineColor: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    width: "100%",
    flex: 1,
    padding: 10,
    borderRadius: 7.5,
  },
  wineColorAlt: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    width: "100%",
    padding: 10,
    borderRadius: 7.5,
  },
  addButtonContainer: {
    alignSelf: "center",
  },
  addButton1: {
    fontSize: 50,
    color: "#D2042D",
  },
  addButton2: {
    fontSize: 50,
    color: "rgba(114, 47, 55, 0.5)",
    position: "absolute",
  },
  modalParent: {
    height: "100%",
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalInner: {
    backgroundColor: "#FFF",
    borderRadius: 7.5,
    padding: 10,
    width: "75%",
  },
  modalHeading: {
    fontFamily: "Actor_400Regular",
    fontSize: 30,
    color: "#D2042D",
    alignSelf: "center",
  },
  modalSubheading: {
    fontSize: 17.5,
    color: "#D2042D",
  },
  modalTextInput: {
    color: "#FFF",
    textAlign: "center",
    fontSize: 17.5,
  },
  submitButtonContainer: {
    padding: 10,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 5,
  },
  submitButtonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
  },
  buttonMask: {
    backgroundColor: "#D2042D",
    alignSelf: "center",
    borderRadius: 5,
  },
  itemPreviewContainer: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    flexWrap: "wrap",
    padding: 20,
  },
  itemPreviewParent: {
    width: 100,
    height: 100,
    backgroundColor: "#FFF",
    borderRadius: 5,
    marginTop: 10,
    padding: 5,
  },
  itemPreviewText: {
    color: "#D2042D",
    fontSize: 12.5,
    textAlign: "center",
  },
  itemPreviewBackside: {
    width: "100%",
    height: "100%",
    position: "absolute",
    transform: [{ scaleX: -1 }],
  },
  backsideButtonContainer: {
    padding: 5,
    borderRadius: 5,
    borderColor: "#D2042D",
    borderWidth: 1,
    width: 60,
    alignSelf: "center",
  },
  backsideButtonText: {
    color: "#D2042D",
    textAlign: "center",
  },
  modalSubmitButtonOuterContainer: {
    backgroundColor: "#D2042D",
    borderRadius: 5,
    alignSelf: "center",
  },
  modalSubmitButtonContainer: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    padding: 10,
    borderRadius: 5,
  },
  modalSubmitButtonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
  },
});
