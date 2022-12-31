import * as Haptics from "expo-haptics";
import Spacer from "./Spacer";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import LoadingScreen from "./LoadingScreen";
import MCAnswers from "./MultipleChoiceAnswerComponents";
import React, { useState, useRef, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import FreeResponseAnswers, {
  FreeResponseQuestionPreview,
} from "./FreeResponseAnswerComponents";
import {
  deleteDraftQuestion,
  getDraftQuestions,
  PollDraftInfo,
  QuestionData,
} from "../firebase";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import SliderAnswer, { SliderAnswerQuestionPreview } from "./SliderAnswer";
import RankingAnswers from "./RankingAnswers";

interface AddQuestionsModal2Props {
  userData: {
    admin: boolean;
    createdAt: string;
    email: string;
    id: string;
    intakeSurvey: boolean;
  };

  questionsModalActive: PollDraftInfo | undefined;
  setQuestionsModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setDraftsChanged: React.Dispatch<React.SetStateAction<boolean>>;
}
interface Question extends QuestionData {
  id: string;
}
interface AddQuestionsProps {
  userData: AddQuestionsModal2Props["userData"];
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  questionsModalActive: PollDraftInfo;
  editQuestion: Question | undefined;
  setEditQuestion: React.Dispatch<React.SetStateAction<Question | undefined>>;
  setDraftsChanged: React.Dispatch<React.SetStateAction<boolean>>;
}
interface EnterQuestionTitleProps {
  question: string;
  editQuestion: Question | undefined;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  setAddQuestionActive: React.Dispatch<React.SetStateAction<boolean>>;
}
interface AddQuestionSubModalProps {
  pollID: string;
  userData: AddQuestionsModal2Props["userData"];
  question: string;
  addQuestionActive: boolean;
  editQuestion: Question | undefined;
  setAddAnswersActive: React.Dispatch<
    React.SetStateAction<Category | undefined>
  >;
}
interface Category {
  name: "Multiple Choice" | "Free Response" | "Ranking" | "Range (Slider)";
  iconName: string;
}
interface CategoryProps {
  category: Category;
  index: number;
}
interface QuestionButtonsProps {
  question: Question;
  growRef: Animated.Value;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDeleting: React.Dispatch<React.SetStateAction<Question | undefined>>;
  setEditQuestion: React.Dispatch<React.SetStateAction<Question | undefined>>;
}

// TODO: update time labels when someone edits questions / answers

const Empty = () => {
  return (
    <View
      style={[
        styles.centerView,
        {
          height: "100%",
          width: "100%",
          position: "absolute",
          alignSelf: "center",
        },
      ]}
    >
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 30,
          color: "#853b30",
        }}
      >
        {"There's nothing here! :("}
      </Text>
    </View>
  );
};

const EnterQuestionTitle = ({
  question,
  setQuestion,
  setAddQuestionActive,
}: EnterQuestionTitleProps) => {
  const [triggerButtonFade, setTriggerButtonFade] = useState(false);
  const shrinkRef = useRef(new Animated.Value(1)).current;
  const buttonFadeRef = useRef(new Animated.Value(0)).current;
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    setTriggerButtonFade(question !== "");
  }, [question]);

  useEffect(() => {
    Animated.timing(buttonFadeRef, {
      toValue: triggerButtonFade ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [triggerButtonFade]);

  return (
    <Animated.View
      style={[
        styles.centerView,
        {
          left: 20,
          width: "100%",
          height: "100%",
          alignItems: "center",
          position: "absolute",
          transform: [
            { scale: shrinkRef },
            {
              translateY: keyboardDodgeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -SCREEN_HEIGHT / 6],
              }),
            },
          ],
        },
      ]}
    >
      <Text
        style={{
          fontSize: 30,
          color: "#853b30",
          textAlign: "center",
          width: "100%",
        }}
      >
        Enter your question.
      </Text>
      <Spacer width="100%" height={40} />
      <TextInput
        multiline
        numberOfLines={3}
        selectionColor="#FFF"
        value={question}
        onChangeText={(text) => setQuestion(text)}
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
          backgroundColor: "#853b30",
          width: "100%",
          minHeight: 50,
          maxHeight: 150,
          borderRadius: 5,
          padding: 10,
          paddingTop: 12.5,
          fontSize: 20,
          alignSelf: "center",
          color: "#FFF",
          fontFamily: "Lato_400Regular",
        }}
      />
      <Spacer width="100%" height={40} />
      <AnimatedTouchable
        disabled={!triggerButtonFade}
        onPress={() =>
          Animated.timing(shrinkRef, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => setAddQuestionActive(true))
        }
        style={{
          padding: 10,
          backgroundColor: "#853b30",
          borderRadius: 5,
          opacity: buttonFadeRef,
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
          }}
        >
          Next
        </Text>
      </AnimatedTouchable>
    </Animated.View>
  );
};

const CategoryList = ({
  setAddAnswersActive,
  editQuestion,
  questionWarning,
  raiseQuestionWarning,
}: {
  setAddAnswersActive: React.Dispatch<
    React.SetStateAction<Category | undefined>
  >;
  editQuestion: Question | undefined;
  questionWarning: boolean | -1;
  raiseQuestionWarning: React.Dispatch<React.SetStateAction<boolean | -1>>;
}) => {
  const categories: Category[] = [
    {
      name: "Multiple Choice",
      iconName: "spell-check",
    },
    {
      name: "Free Response",
      iconName: "i-cursor",
    },
    {
      name: "Range (Slider)",
      iconName: "sliders-h",
    },
    {
      name: "Ranking",
      iconName: "list-ol",
    },
  ];
  const getCategoryFromName = (name: Category["name"]) => {
    return {
      name,
      iconName: categories.filter((item) => item.name === name)[0].iconName,
    };
  };

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const CategoryButton = ({ category, index }: CategoryProps) => {
    const { name, iconName } = category;
    const colorChangeRef = useRef(new Animated.Value(0)).current;
    const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome5);

    useEffect(() => {
      if (
        selectedCategory !== undefined &&
        selectedCategory.name === category.name
      )
        Animated.timing(colorChangeRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      else
        Animated.timing(colorChangeRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
    }, [selectedCategory]);

    return (
      <>
        <TouchableOpacity
          onPress={() => {
            if (selectedCategory !== undefined) {
              if (selectedCategory.name === category.name)
                setSelectedCategory(undefined);
              else if (
                editQuestion !== undefined &&
                questionWarning !== -1 &&
                editQuestion.category !== category.name
              ) {
                setWarnedCategory(category);
                raiseQuestionWarning(true);
              } else setSelectedCategory(category);
            } else setSelectedCategory(category);
          }}
        >
          <Animated.View
            style={{
              borderWidth: 2.5,
              borderRadius: 5,
              borderColor: "#853b30",
              backgroundColor: colorChangeRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#FFF", "#853b30"],
              }),
            }}
          >
            <View
              style={{
                padding: 20,
                flexDirection: "row",
                alignSelf: "center",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 5,
              }}
            >
              <Animated.Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 20,
                  color: colorChangeRef.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#853b30", "#FFF"],
                  }),
                }}
              >
                {name}
              </Animated.Text>
              <Spacer height="100%" width={20} />
              <AnimatedIcon
                name={iconName}
                style={{
                  fontSize: 20,
                  color: colorChangeRef.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#853b30", "#FFF"],
                  }),
                }}
              />
            </View>
          </Animated.View>
        </TouchableOpacity>
        <Spacer width="100%" height={20} />
      </>
    );
  };

  const [warnedCategory, setWarnedCategory] = useState<Category>(undefined);
  const [triggerFade, setTriggerFade] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(
    editQuestion !== undefined
      ? getCategoryFromName(editQuestion.category)
      : undefined
  );
  const buttonFadeRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTriggerFade(selectedCategory !== undefined);
  }, [selectedCategory]);

  useEffect(() => {
    if (questionWarning === -1) {
      setSelectedCategory(warnedCategory);
      setWarnedCategory(undefined);

      // TODO: make this change if necessary
      // for now, it just shows the category change warning
      // on the first change.
      // raiseQuestionWarning(false);
    }
  }, [questionWarning]);

  useEffect(() => {
    if (triggerFade)
      Animated.timing(buttonFadeRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    else
      Animated.timing(buttonFadeRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [triggerFade]);

  return (
    <View style={{ flex: 1, width: "100%", justifyContent: "center" }}>
      {categories.map((category, index) => (
        <CategoryButton key={index} {...{ category, index }} />
      ))}
      <Spacer width="100%" height={20} />
      <AnimatedTouchable
        disabled={selectedCategory === undefined}
        onPress={() => {
          setAddAnswersActive(selectedCategory);
        }}
        style={{
          alignSelf: "center",
          backgroundColor: "#853b30",
          padding: 12.5,
          borderRadius: 5,
          opacity: buttonFadeRef,
        }}
      >
        <Text
          style={{ fontSize: 20, color: "#FFF", fontFamily: "Lato_400Regular" }}
        >
          Next
        </Text>
      </AnimatedTouchable>
    </View>
  );
};

const AddQuestionSubModal = ({
  editQuestion,
  addQuestionActive,
  setAddAnswersActive,
}: AddQuestionSubModalProps) => {
  const [questionWarning, raiseQuestionWarning] = useState<boolean | -1>(false);
  const shrinkRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shrinkRef, {
      toValue: addQuestionActive ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [addQuestionActive]);

  return (
    <Animated.View
      style={[
        {
          top: 20,
          left: 20,
          width: "100%",
          height: "100%",
          alignItems: "center",
          position: "absolute",
          transform: [{ scale: shrinkRef }],
          paddingTop: 80,
        },
      ]}
    >
      <Text
        style={{
          alignSelf: "flex-start",
          color: "#853b30",
          fontFamily: "Lato_400Regular",
          fontSize: 20,
        }}
      >
        Question Type
      </Text>
      <CategoryList
        questionWarning={questionWarning}
        setAddAnswersActive={setAddAnswersActive}
        editQuestion={editQuestion}
        raiseQuestionWarning={raiseQuestionWarning}
      />
      <Spacer width={"100%"} height={40} />
      <Modal
        visible={questionWarning === true}
        transparent
        animationType="fade"
      >
        <View
          style={[
            styles.centerView,
            {
              width: "100%",
              height: "100%",
              backgroundColor: "#00000090",
            },
          ]}
        >
          <View
            style={{
              width: 300,
              height: 300,
              borderRadius: 10,
              backgroundColor: "#FFF",
              padding: 20,
            }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#853b30",
                alignSelf: "center",
              }}
            >
              Category Change Warning!
            </Text>
            <View style={[styles.centerView, { width: "100%", flex: 1 }]}>
              <Text
                style={{
                  fontFamily: "Lato_700Bold",
                  fontSize: 17.5,
                  color: "#853b30",
                  alignSelf: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 17.5,
                    color: "#853b30",
                    alignSelf: "center",
                  }}
                >
                  Are you sure you want to change categories?
                </Text>
                {" The current answers to your question will not be preserved."}
              </Text>
              <Spacer width="100%" height={20} />
              <View
                style={{
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => raiseQuestionWarning(-1)}
                  style={{
                    padding: 10,
                    backgroundColor: "#853b30",
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}
                  >
                    Yes, Change My Category
                  </Text>
                </TouchableOpacity>
                <Spacer width="100%" height={10} />
                <TouchableOpacity
                  onPress={() => raiseQuestionWarning(false)}
                  style={{
                    padding: 10,
                    backgroundColor: "#853b30",
                    borderRadius: 5,
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}
                  >
                    No, Take Me Back
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const AddAnswers = ({
  userData,
  question,
  addAnswersActive,
  setAddAnswersActive,
  questions,
  setQuestions,
  setVisible,
  questionsModalActive,
  editQuestion,
  setEditQuestion,
  setDraftsChanged,
}: {
  userData: AddQuestionsModal2Props["userData"];
  question: string;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questionsModalActive: PollDraftInfo;
  editQuestion: Question | undefined;
  setEditQuestion: React.Dispatch<React.SetStateAction<Question | undefined>>;
  addAnswersActive: Category | undefined;
  setAddAnswersActive: React.Dispatch<
    React.SetStateAction<Category | undefined>
  >;
  setDraftsChanged: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [answers, setAnswers] = useState<string[]>(
    editQuestion === undefined ? [] : editQuestion.answers
  );
  const shrinkRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shrinkRef, {
      delay: 250,
      toValue: addAnswersActive === undefined ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [addAnswersActive]);

  return (
    <Animated.View
      style={[
        {
          top: 20,
          left: 20,
          width: "100%",
          height: "100%",
          alignItems: "center",
          position: "absolute",
          transform: [{ scale: shrinkRef }],
          paddingTop: 80,
        },
      ]}
    >
      {addAnswersActive !== undefined &&
        (() => {
          switch (addAnswersActive.name) {
            case "Multiple Choice":
              return (
                <>
                  <Text
                    style={{
                      fontFamily: "Lato_400Regular",
                      fontSize: 20,
                      alignSelf: "flex-start",
                      color: "#853b30",
                    }}
                  >
                    Answers
                  </Text>
                  <Spacer width="100%" height={20} />
                  <MCAnswers
                    editQuestion={editQuestion}
                    userData={userData}
                    question={question}
                    answers={answers}
                    setAnswers={setAnswers}
                    questions={questions}
                    setQuestions={setQuestions}
                    setVisible={setVisible}
                    questionsModalActive={questionsModalActive}
                    setEditQuestion={setEditQuestion}
                    setAddAnswersActive={setAddAnswersActive}
                    setDraftsChanged={setDraftsChanged}
                  />
                </>
              );
            case "Free Response":
              return (
                <FreeResponseAnswers
                  userData={userData}
                  question={question}
                  questions={questions}
                  setVisible={setVisible}
                  setQuestions={setQuestions}
                  editQuestion={editQuestion}
                  setEditQuestion={setEditQuestion}
                  setAddAnswersActive={setAddAnswersActive}
                  questionsModalActive={questionsModalActive}
                  setDraftsChanged={setDraftsChanged}
                />
              );
            case "Range (Slider)":
              return (
                <SliderAnswer
                  {...{
                    editQuestion,
                    question,
                    questions,
                    questionsModalActive,
                    setAddAnswersActive,
                    setEditQuestion,
                    setQuestions,
                    setVisible,
                    userData,
                    setDraftsChanged,
                  }}
                />
              );
            case "Ranking":
              return (
                <>
                  <Text
                    style={{
                      fontFamily: "Lato_400Regular",
                      fontSize: 20,
                      alignSelf: "flex-start",
                      color: "#853b30",
                    }}
                  >
                    Add Items
                  </Text>
                  <Spacer width="100%" height={20} />
                  <RankingAnswers
                    {...{
                      editQuestion,
                      question,
                      questions,
                      questionsModalActive,
                      setAddAnswersActive,
                      setEditQuestion,
                      setQuestions,
                      setVisible,
                      userData,
                      answers,
                      setAnswers,
                      setDraftsChanged,
                    }}
                  />
                </>
              );
          }
        })()}
    </Animated.View>
  );
};

const AddQuestion = ({
  userData,
  visible,
  setVisible,
  questions,
  setQuestions,
  questionsModalActive,
  editQuestion,
  setEditQuestion,
  setDraftsChanged,
}: AddQuestionsProps) => {
  const [question, setQuestion] = useState("");
  const [addQuestionActive, setAddQuestionActive] = useState(false);
  const [questionTitleActive, setQuestionTitleActive] = useState(true);
  const [addAnswersActive, setAddAnswersActive] = useState<
    Category | undefined
  >(undefined);

  useEffect(() => {
    if (addQuestionActive) setQuestionTitleActive(false);
  }, [addQuestionActive]);

  useEffect(() => {
    if (addAnswersActive) setAddQuestionActive(false);
  }, [addAnswersActive]);

  useEffect(() => {
    if (visible === false) {
      setQuestion("");
      setAddQuestionActive(false);
      setQuestionTitleActive(false);
      setAddAnswersActive(undefined);
      setEditQuestion(undefined);
    }
  }, [visible]);

  useEffect(() => {
    if (editQuestion !== undefined) setQuestion(editQuestion.question);
  }, [editQuestion]);

  return (
    <Modal
      visible={visible || editQuestion !== undefined}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#FFF",
          padding: 20,
        }}
      >
        <TouchableOpacity
          style={[
            styles.centerView,
            { padding: 20, position: "absolute", zIndex: 2 },
          ]}
          onPress={() => {
            if (editQuestion !== undefined) {
              setQuestion("");
              setAddQuestionActive(false);
              setQuestionTitleActive(false);
              setAddAnswersActive(undefined);
              setEditQuestion(undefined);
            }
            setVisible(false);
          }}
        >
          <FontAwesome5
            name="times"
            style={{ color: "#853b30", fontSize: 30 }}
          />
        </TouchableOpacity>
        <Text style={{ alignSelf: "center", fontSize: 30, color: "#853b30" }}>
          {editQuestion === undefined ? "Add Question" : "Edit Question"}
        </Text>
        <Spacer width="100%" height={40} />
        <EnterQuestionTitle
          {...{
            question,
            setQuestion,
            setAddQuestionActive,
            editQuestion,
          }}
        />
        <AddQuestionSubModal
          userData={userData}
          pollID={questionsModalActive.id}
          question={question}
          editQuestion={editQuestion}
          addQuestionActive={addQuestionActive}
          setAddAnswersActive={setAddAnswersActive}
        />
        <AddAnswers
          editQuestion={editQuestion}
          userData={userData}
          addAnswersActive={addAnswersActive}
          setAddAnswersActive={setAddAnswersActive}
          question={question}
          questions={questions}
          setQuestions={setQuestions}
          setVisible={setVisible}
          questionsModalActive={questionsModalActive}
          setEditQuestion={setEditQuestion}
          setDraftsChanged={setDraftsChanged}
        />
      </View>
    </Modal>
  );
};

const QuestionButtons = ({
  question,
  growRef,
  setIsOpen,
  setDeleting,
  setEditQuestion,
}: QuestionButtonsProps) => {
  const [triggerDelete, setTriggerDelete] = useState(false);
  const deletePromptGrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(deletePromptGrow, {
      toValue: triggerDelete ? 1 : 0,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [triggerDelete]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        borderBottomColor: "#853b30",
        backgroundColor: "#FFF",
        alignSelf: "center",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        height: growRef.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
      }}
    >
      <Animated.View
        style={{
          width: "30%",
          opacity: growRef.interpolate({
            inputRange: [0.75, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <TouchableOpacity
          onPress={() => setEditQuestion(question)}
          style={{
            backgroundColor: "#853b30",
            justifyContent: "center",
            alignItems: "center",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
            Edit
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Spacer width="100%" height={10} />
      <Animated.View
        style={{
          width: "30%",
          opacity: growRef.interpolate({
            inputRange: [0.75, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <TouchableOpacity
          onPress={() => setTriggerDelete(true)}
          style={{
            backgroundColor: "#853b30",
            justifyContent: "center",
            alignItems: "center",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
            Delete
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Spacer width="100%" height={10} />
      <Animated.View
        style={{
          width: "30%",
          opacity: growRef.interpolate({
            inputRange: [0.75, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <TouchableOpacity
          onPress={() => setIsOpen(false)}
          style={{
            backgroundColor: "#853b30",
            justifyContent: "center",
            alignItems: "center",
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
            Back
          </Text>
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={{
          alignSelf: "center",
          position: "absolute",
          backgroundColor: "#FFF",
          padding: deletePromptGrow.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 10],
          }),
          width: deletePromptGrow.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
          height: deletePromptGrow.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      >
        <Animated.Text
          style={{
            color: "#853b30",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            alignSelf: "center",
            opacity: deletePromptGrow.interpolate({
              inputRange: [0.9, 1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          }}
        >
          Deleting Question!
        </Animated.Text>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Animated.Text
            style={{
              width: "90%",
              alignSelf: "center",
              borderRadius: deletePromptGrow.interpolate({
                inputRange: [0, 1],
                outputRange: ["50%", "0%"],
                extrapolate: "clamp",
              }),
              opacity: deletePromptGrow.interpolate({
                inputRange: [0.9, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            <Text
              style={{
                color: "#853b30",
                fontFamily: "Lato_400Regular",
                fontSize: 15,
                flexDirection: "row",
              }}
            >
              Are you sure you want to delete this question?
            </Text>
            <Text
              style={{
                color: "#853b30",
                fontFamily: "Lato_700Bold",
                fontSize: 15,
                flexDirection: "row",
              }}
            >
              {" This cannot be undone."}
            </Text>
          </Animated.Text>
          <Spacer width="100%" height={20} />
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Animated.View
              style={{
                transform: [{ scale: deletePromptGrow }],
                opacity: deletePromptGrow.interpolate({
                  inputRange: [0.9, 1],
                  outputRange: [0, 1],
                  extrapolate: "clamp",
                }),
              }}
            >
              <TouchableOpacity
                onPress={() => setDeleting(question)}
                style={{
                  backgroundColor: "#853b30",
                  borderRadius: 5,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 12.5,
                    color: "#FFF",
                  }}
                >
                  Yes, Delete This Question.
                </Text>
              </TouchableOpacity>
            </Animated.View>
            <Spacer width="100%" height={10} />
            <Animated.View
              style={{
                transform: [{ scale: deletePromptGrow }],
                opacity: deletePromptGrow.interpolate({
                  inputRange: [0.9, 1],
                  outputRange: [0, 1],
                  extrapolate: "clamp",
                }),
              }}
            >
              <TouchableOpacity
                onPress={() => setTriggerDelete(false)}
                style={{
                  backgroundColor: "#853b30",
                  borderRadius: 5,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 12.5,
                    color: "#FFF",
                  }}
                >
                  No, Take Me Back
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const QuestionComponent = ({
  question,
  last,
  setDeleting,
  setEditQuestion,
}: {
  questionsModalActive: PollDraftInfo;
  userData: AddQuestionsModal2Props["userData"];
  question: Question;
  last: boolean;
  setDeleting: React.Dispatch<React.SetStateAction<Question | undefined>>;
  setEditQuestion: React.Dispatch<React.SetStateAction<Question | undefined>>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const growRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(growRef, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  return (
    <>
      <Pressable
        disabled={isOpen}
        onPress={() => setIsOpen(true)}
        onLongPress={() => {
          if (!isOpen) {
            Haptics.selectionAsync();
            setIsOpen(true);
          }
        }}
        style={{
          width: 300,
          minHeight: 200,
          borderLeftWidth: 2.5,
          borderTopWidth: 2.5,
          borderRightWidth: 2.5,
          borderBottomWidth: 2.5,
          borderColor: "#853b30",
          backgroundColor: "#853b30",
          alignSelf: "center",
        }}
      >
        <View
          style={[
            styles.centerView,
            {
              width: "100%",
              minHeight: 50,
              backgroundColor: "#FFF",
              padding: 10,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
            }}
          >
            {question.question}
          </Text>
        </View>
        <View
          style={{
            width: "100%",
            flex: 1,
            padding: 20,
          }}
        >
          {(() => {
            switch (question.category) {
              case "Free Response":
                return (
                  <FreeResponseQuestionPreview
                    multiline={question.multiline}
                    letterCount={question.letterCount}
                    wordCount={question.wordCount}
                  />
                );
              case "Range (Slider)":
                return (
                  <SliderAnswerQuestionPreview
                    minRange={question.minRange}
                    maxRange={question.maxRange}
                    inDollars={question.dollarSign}
                  />
                );
              default:
                return question.answers.map((answer, index) => (
                  <Text
                    key={index}
                    style={{
                      textAlign: "center",
                      fontFamily: "Lato_400Regular",
                      fontSize: 17.5,
                      color: "#FFF",
                    }}
                  >
                    {answer}
                  </Text>
                ));
            }
          })()}
        </View>
        <QuestionButtons
          question={question}
          growRef={growRef}
          setIsOpen={setIsOpen}
          setDeleting={setDeleting}
          setEditQuestion={setEditQuestion}
        />
      </Pressable>
      {!last && (
        <>
          <Spacer width="100%" height={20} />
          <View
            style={{ width: "100%", height: 1, backgroundColor: "#853b3025" }}
          />
          <Spacer width="100%" height={20} />
        </>
      )}
      {last && <Spacer width="100%" height={80} />}
    </>
  );
};

export default function AddQuestionsModal2({
  userData,
  questionsModalActive,
  setQuestionsModalActive,
  setDraftsChanged,
}: AddQuestionsModal2Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [addModalActive, setAddModalActive] = useState(false);
  const [deleting, setDeleting] = useState<Question | undefined>(undefined);
  const [editQuestion, setEditQuestion] = useState<Question | undefined>(
    undefined
  );

  useEffect(() => {
    if (questionsModalActive !== undefined) {
      setLoading(true);
      getDraftQuestions(userData.id, questionsModalActive.id).then((result) => {
        setQuestions(result);
        setLoading(false);
      });
    } else setQuestions([]);
  }, [questionsModalActive]);

  useEffect(() => {
    if (deleting !== undefined) {
      deleteDraftQuestion(
        userData.id,
        questionsModalActive.id,
        deleting.id
      ).then(() => setDeleting(undefined));
    } else if (deleting === undefined && questionsModalActive) {
      setLoading(true);
      getDraftQuestions(userData.id, questionsModalActive.id).then((result) => {
        setQuestions(result);
        setLoading(false);
      });
    }
  }, [deleting]);

  return (
    <Modal animationType="slide" visible={questionsModalActive !== undefined}>
      <StatusBar />
      <View
        style={[
          {
            width: "100%",
            height: "100%",
            backgroundColor: "#FFF",
            padding: 20,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setQuestionsModalActive(undefined)}
          style={[
            styles.centerView,
            {
              position: "absolute",
              marginTop: 40,
              zIndex: 2,
              padding: 20,
            },
          ]}
        >
          <FontAwesome5
            name="angle-left"
            style={{ fontSize: 30, color: "#853b30" }}
          />
        </TouchableOpacity>
        <Spacer width="100%" height={50} />
        <Text
          style={{
            alignSelf: "center",
            fontFamily: "Lato_400Regular",
            color: "#853b30",
            fontSize: 30,
            textAlign: "center",
            width: "100%",
          }}
        >
          Questions
        </Text>
        <Spacer width="100%" height={40} />
        {loading ? (
          <LoadingScreen color="#853b30" />
        ) : questions.length === 0 ? (
          <Empty />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {questions.map((val, index) => {
              return (
                <QuestionComponent
                  key={index}
                  question={val}
                  userData={userData}
                  last={index == questions.length - 1}
                  questionsModalActive={questionsModalActive}
                  setEditQuestion={setEditQuestion}
                  setDeleting={setDeleting}
                />
              );
            })}
          </ScrollView>
        )}
        <Spacer width="100%" height={40} />
        <TouchableOpacity
          onPress={() => setAddModalActive(true)}
          style={[
            styles.centerView,
            {
              width: 75,
              height: 75,
              backgroundColor: "#853b30",
              borderRadius: 37.5,
              position: "absolute",
              bottom: SCREEN_HEIGHT / 15,
              right: 20,
              borderWidth: 2.5,
              borderColor: "#FFF",
            },
          ]}
        >
          <FontAwesome5 name="plus" color="#FFF" style={{ fontSize: 25 }} />
        </TouchableOpacity>
      </View>
      <AddQuestion
        userData={userData}
        questionsModalActive={questionsModalActive}
        editQuestion={editQuestion}
        visible={addModalActive}
        setVisible={setAddModalActive}
        questions={questions}
        setQuestions={setQuestions}
        setEditQuestion={setEditQuestion}
        setDraftsChanged={setDraftsChanged}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerView: { justifyContent: "center", alignItems: "center" },
});
