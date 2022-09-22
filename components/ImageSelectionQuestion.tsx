import Spacer from "./Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import { ListEmpty } from "../screens/CreatePolls";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Pressable,
  ScrollView,
} from "react-native";
import { Answer, createQuestion } from "../firebase";
import { Question } from "../screens/CreatePollScreen";

interface ImageContainerProps {
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}
interface ImagePreviewProps {
  image: string;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}
interface ImageSelectionProps {
  pollID: string;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  questionText: string;
  questions: Question[];
  setQuestionText: React.Dispatch<React.SetStateAction<string>>;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
interface ImagePreviewButtonsProps {
  flipAnimationProgress: Animated.Value;
  flipped: boolean;
  image: string;
  images: string[];
  setFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}
interface SubmitButtonProps {
  pollID: string;
  images: string[];
  questionText: string;
  questions: Question[];
  setQuestionText: React.Dispatch<React.SetStateAction<string>>;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setOuterModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

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

  return result.cancelled ? undefined : result.uri;
};

const handleFlipAnimation = (
  flipped: boolean,
  flipAnimationProgress: Animated.Value
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

const ImagePreviewButtons = ({
  flipAnimationProgress,
  image,
  flipped,
  images,
  setFlipped,
  setImages,
}: ImagePreviewButtonsProps) => {
  return (
    <Animated.View
      style={[
        styles.imageMask,
        styles.centerView,
        { opacity: flipAnimationProgress },
      ]}
    >
      <TouchableOpacity
        disabled={!flipped}
        onPress={() => {
          setImages(images.filter((currImage) => currImage !== image));
        }}
        style={[styles.imagePreviewButtonContainer, styles.centerView]}
      >
        <Text style={styles.imagePreviewButtonText}>Delete</Text>
      </TouchableOpacity>
      <Spacer width="100%" height={10} />
      <TouchableOpacity
        disabled={!flipped}
        onPress={() => setFlipped(!flipped)}
        style={[styles.imagePreviewButtonContainer, styles.centerView]}
      >
        <Text style={styles.imagePreviewButtonText}>Back</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ImagePreview = ({ image, images, setImages }: ImagePreviewProps) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  handleFlipAnimation(flipped, flipAnimationProgress);

  return (
    <AnimatedPressable
      onPress={() => setFlipped(!flipped)}
      style={{
        borderRadius: 5,
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
      <Animated.Image
        source={{ uri: image }}
        style={[
          styles.imageStyle,
          {
            opacity: flipAnimationProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      />
      <ImagePreviewButtons
        flipAnimationProgress={flipAnimationProgress}
        flipped={flipped}
        image={image}
        images={images}
        setImages={setImages}
        setFlipped={setFlipped}
      />
    </AnimatedPressable>
  );
};

const ImageContainer = ({ images, setImages }: ImageContainerProps) => {
  return (
    <View style={styles.imageContainer}>
      {images.map((image, index) => (
        <ImagePreview
          key={index}
          image={image}
          images={images}
          setImages={setImages}
        />
      ))}
    </View>
  );
};

const SubmitButton = ({
  pollID,
  images,
  questionText,
  questions,
  setQuestionText,
  setQuestions,
  setOuterModalVisible,
}: SubmitButtonProps) => {
  const showButton = images.length > 1 && questionText !== "";
  const fadeAnimationRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (showButton)
      Animated.timing(fadeAnimationRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(fadeAnimationRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [showButton]);

  return (
    <AnimatedTouchable
      style={[
        styles.submitButtonWrapper,
        {
          opacity: fadeAnimationRef,
        },
      ]}
      onPress={async () => {
        const answers: Answer[] = [];
        for (const image of images) {
          const answer: Answer = {
            answerText: "",
            answerType: "Image Selection",
            answerVariant: "undefined",
            imageData: await (await fetch(image)).blob(),
          };
          answers.push(answer);
        }

        const question = await createQuestion(
          pollID,
          "Image Selection",
          questionText,
          answers
        );
        setQuestions(questions.concat([question]));
        setOuterModalVisible(false);
        setQuestionText("");
      }}
    >
      <View style={[styles.centerView, styles.submitButtonContainer]}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </View>
    </AnimatedTouchable>
  );
};

export default function ImageSelection({
  pollID,
  scrollViewRef,
  questionText,
  questions,
  setQuestionText,
  setQuestions,
  setOuterModalVisible,
}: ImageSelectionProps) {
  const [images, setImages] = useState<string[]>([]);
  return (
    <>
      <Text style={styles.heading}>Add Images</Text>
      <Spacer width="100%" height={10} />
      <View style={styles.outerRed}>
        <View style={[styles.wineColor, styles.centerView]}>
          {images.length === 0 && <ListEmpty />}
          {images.length > 0 && (
            <ImageContainer images={images} setImages={setImages} />
          )}
        </View>
      </View>
      <Spacer width="100%" height={10} />
      <TouchableOpacity
        style={styles.addButtonContainer}
        onPress={async () => {
          scrollViewRef.current.scrollToEnd({ animated: true });
          const result = await pickImage();
          if (result) setImages(images.concat([result]));
        }}
      >
        <Ionicons style={styles.addButton1} name="add-circle" />
        <Ionicons style={styles.addButton2} name="add-circle" />
      </TouchableOpacity>
      <Spacer width="100%" height={10} />
      <SubmitButton
        images={images}
        questionText={questionText}
        pollID={pollID}
        questions={questions}
        setQuestions={setQuestions}
        setQuestionText={setQuestionText}
        setOuterModalVisible={setOuterModalVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centerView: {
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    color: "#D2042D",
    fontSize: 17.5,
  },
  outerRed: {
    backgroundColor: "#D2042D",
    width: "100%",
    borderRadius: 7.5,
  },
  wineColor: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    flex: 1,
    width: "100%",
    padding: 20,
    borderRadius: 7.5,
  },
  addButtonContainer: {
    alignSelf: "center",
  },
  addButton1: {
    color: "#D2042D",
    fontSize: 50,
  },
  addButton2: {
    position: "absolute",
    fontSize: 50,
    color: "rgba(114, 47, 55, 0.5)",
  },
  imageContainer: {
    width: "100%",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  imageStyle: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  imageMask: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 5,
    position: "absolute",
    transform: [{ scaleX: -1 }],
  },
  imagePreviewButtonContainer: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: "#D2042D",
    width: 60,
    padding: 5,
  },
  imagePreviewButtonText: {
    color: "#D2042D",
    fontFamily: "Actor_400Regular",
    fontSize: 15,
  },
  submitButtonWrapper: {
    backgroundColor: "#D2042D",
    alignSelf: "center",
    borderRadius: 5,
  },
  submitButtonContainer: {
    borderRadius: 5,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    padding: 10,
  },
  submitButtonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
  },
});
