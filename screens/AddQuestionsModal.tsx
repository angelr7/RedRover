import GestureRecognizer from "react-native-swipe-gestures";
import PollTypeButton from "../components/PollTypeButton";
import Spacer from "../components/Spacer";
import MultipleChoice from "../components/MultipleChoiceQuestion";
import { useState } from "react";
import { AddQuestionsProps } from "./CreatePollScreen";
import {
  FREE_RESPONSE,
  IMAGE_SELECTION,
  MIX_MATCH,
  MULTIPLE_CHOICE,
  NUMBER_ANSWER,
  POLL_QUESTION_TYPES,
  RANKING,
} from "../constants/polls";
import {
  TextInput,
  Text,
  View,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";

interface AddQuestionsModalProps {
  pollData: AddQuestionsProps["pollData"];
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const getQuestionType = (
  currSelected: number,
  pollData: AddQuestionsProps["pollData"]
) => {
  let questionTypeScreen: JSX.Element;
  switch (currSelected) {
    case MULTIPLE_CHOICE:
      questionTypeScreen = <MultipleChoice pollData={pollData} />;
      break;
    case FREE_RESPONSE:
      questionTypeScreen = <FreeResponse />;
      break;
    case RANKING:
      questionTypeScreen = <Ranking />;
      break;
    case NUMBER_ANSWER:
      questionTypeScreen = <NumberAnswer />;
      break;
    case MIX_MATCH:
      questionTypeScreen = <MixAndMatch />;
      break;
    case IMAGE_SELECTION:
      questionTypeScreen = <ImageSelection />;
      break;
    default:
      questionTypeScreen = <View />;
      break;
  }

  return questionTypeScreen;
};

const FreeResponse = () => {
  return <Text>Free Response</Text>;
};
const Ranking = () => {
  return <View />;
};
const NumberAnswer = () => {
  return <View />;
};
const MixAndMatch = () => {
  return <View />;
};
const ImageSelection = () => {
  return <View />;
};

export default function AddQuestionsModal({
  pollData,
  modalVisible,
  setModalVisible,
}: AddQuestionsModalProps) {
  const [currSelected, setCurrSelected] = useState<number | undefined>(
    undefined
  );
  const [placeholder, setPlaceholder] = useState(
    "Tap here to add a question..."
  );

  const questionTypeScreen = getQuestionType(currSelected, pollData);

  return (
    // allows us to swipe down and close our modal
    // TODO: update gesture handler to ask users to save changes first
    <GestureRecognizer
      onSwipeDown={() => {
        setModalVisible(false);
      }}
    >
      <Modal
        visible={modalVisible}
        presentationStyle="pageSheet"
        animationType="slide"
      >
        <View style={styles.outerModalContainer}>
          <Text style={styles.modalTitle}>Add Question</Text>
          <Spacer width="100%" height={20} />
          <View style={{ flex: 1 }}>
            <ScrollView
              style={{ width: "100%", height: "100%" }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={{ fontSize: 17.5, color: "#D2042D" }}>
                Question Text
              </Text>
              <Spacer width="100%" height={10} />
              <View style={{ backgroundColor: "#D2042D", borderRadius: 7.5 }}>
                <TextInput
                  placeholder={placeholder}
                  placeholderTextColor="#FFF"
                  style={styles.questionTextInput}
                  onFocus={() => {
                    setPlaceholder("");
                  }}
                  onBlur={() => {
                    setPlaceholder("Tap here to add a question...");
                  }}
                />
              </View>
              <Spacer width="100%" height={40} />
              <Text
                style={{
                  fontSize: 17.5,
                  color: "#D2042D",
                }}
              >
                What type of question will this be?
              </Text>
              <Spacer width="100%" height={10} />
              <View style={styles.buttonContainer1}>
                <View style={styles.buttonContainer2}>
                  {POLL_QUESTION_TYPES.map((questionType, index) => {
                    return (
                      <PollTypeButton
                        iconName={questionType.iconName}
                        label={questionType.label}
                        index={index}
                        currSelected={currSelected}
                        onPress={() => {
                          setCurrSelected(index);
                        }}
                        key={index}
                      />
                    );
                  })}
                </View>
              </View>
              <Spacer width="100%" height={40} />
              {questionTypeScreen}
              <Spacer width="100%" height={20} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GestureRecognizer>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  outerModalContainer: {
    width: "100%",
    height: "100%",
    padding: 10,
  },
  modalTitle: {
    alignSelf: "center",
    fontFamily: "Actor_400Regular",
    fontSize: 40,
    color: "#D2042D",
  },
  questionTextInput: {
    width: "100%",
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    minHeight: 100,
    borderRadius: 7.5,
    padding: 10,
    color: "#FFF",
    textAlign: "center",
    fontSize: 17.5,
  },
  buttonContainer1: {
    width: "100%",
    minHeight: 100,
    backgroundColor: "#D2042D",
    borderRadius: 7.5,
  },
  buttonContainer2: {
    width: "100%",
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 7.5,
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 10,
    justifyContent: "space-evenly",
  },
});
