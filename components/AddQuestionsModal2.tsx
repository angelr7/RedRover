import Spacer, { AnimatedSpacer } from "./Spacer";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React, { useState, useRef, useEffect } from "react";
import {
  createDraftQuestion,
  getDraftQuestions,
  PollDraftInfo,
} from "../firebase";
import { StatusBar } from "expo-status-bar";
import { SCREEN_HEIGHT } from "../constants/dimensions";
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
import LoadingScreen from "./LoadingScreen";

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
}
interface Question {
  category: Category["name"];
  question: string;
  answers: string[];
}
interface AddQuestionsProps {
  userData: AddQuestionsModal2Props["userData"];
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  questionsModalActive: PollDraftInfo;
}
interface EnterQuestionTitleProps {
  question: string;
  setQuestion: React.Dispatch<React.SetStateAction<string>>;
  setAddQuestionActive: React.Dispatch<React.SetStateAction<boolean>>;
}
interface AddQuestionSubModalProps {
  question: string;
  addQuestionActive: boolean;
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
            duration: 500,
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
}: {
  setAddAnswersActive: React.Dispatch<
    React.SetStateAction<Category | undefined>
  >;
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
          <TouchableOpacity
            onPress={() => {
              if (
                selectedCategory !== undefined &&
                selectedCategory.name === category.name
              )
                setSelectedCategory(undefined);
              else setSelectedCategory(category);
            }}
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
          </TouchableOpacity>
        </Animated.View>
        <Spacer width="100%" height={20} />
      </>
    );
  };

  const [triggerFade, setTriggerFade] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    Category | undefined
  >(undefined);
  const buttonFadeRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTriggerFade(selectedCategory !== undefined);
  }, [selectedCategory]);

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
  question,
  addQuestionActive,
  setAddAnswersActive,
}: AddQuestionSubModalProps) => {
  const shrinkRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shrinkRef, {
      toValue: addQuestionActive ? 1 : 0,
      duration: 500,
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
      <CategoryList setAddAnswersActive={setAddAnswersActive} />
      <Spacer width={"100%"} height={40} />
    </Animated.View>
  );
};

const MCAnswer = ({
  answers,
  answer,
  index,
  setAnswers,
}: {
  answers: string[];
  answer: string;
  index: number;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [open, setOpen] = useState(false);
  const growAnimationRef = useRef(new Animated.Value(0)).current;
  const deleteButtonGrow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(growAnimationRef, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(deleteButtonGrow, {
      toValue: open ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [open]);

  return (
    <Animated.View style={{ transform: [{ scale: growAnimationRef }] }}>
      <Pressable
        onPress={() => setOpen(!open)}
        style={{
          justifyContent: "center",
          width: 300,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#853b30",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            padding: 20,
          }}
        >
          {answer}
        </Text>
        <Animated.View
          style={[
            styles.centerView,
            {
              position: "absolute",
              backgroundColor: "#FFF",
              height: "100%",
              right: 0,
              borderColor: "#853b30",
              width: deleteButtonGrow.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 75],
              }),
              borderWidth: deleteButtonGrow.interpolate({
                inputRange: [0, 0.05],
                outputRange: [0, 2.5],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() =>
              setAnswers(
                answers.filter((_val, curr_index) => curr_index !== index)
              )
            }
            style={[styles.centerView, { width: "100%", height: "100%" }]}
          >
            <FontAwesome5
              name="trash-alt"
              style={{ fontSize: 25, color: "#853b30" }}
            />
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
      {index !== answers.length - 1 && (
        <>
          <Spacer width="100%" height={20} />
          <View
            style={{
              backgroundColor: "#853b3025",
              width: "100%",
              height: 1,
            }}
          />
          <Spacer width="100%" height={20} />
        </>
      )}
    </Animated.View>
  );
};

const MCAnswers = ({
  userData,
  answers,
  setAnswers,
  question,
  questions,
  setQuestions,
  setVisible,
  questionsModalActive,
}: {
  userData: AddQuestionsModal2Props["userData"];
  question: string;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questionsModalActive: PollDraftInfo;
}) => {
  const [newAnswer, setNewAnswer] = useState("");
  const [triggerFade, setTriggerFade] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const buttonFadeRef = useRef(new Animated.Value(0)).current;
  const submitButtonRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (newAnswer === "") setTriggerFade(false);
    else setTriggerFade(!answers.includes(newAnswer));
  }, [newAnswer]);

  useEffect(() => {
    Animated.timing(buttonFadeRef, {
      toValue: triggerFade ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [triggerFade]);

  useEffect(() => {
    Animated.timing(submitButtonRef, {
      toValue: answers.length === 0 ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [answers]);

  return (
    <View style={{ flex: 1, width: "100%" }}>
      <View style={{ flexDirection: "row" }}>
        <TextInput
          multiline
          selectionColor={"#FFF"}
          value={newAnswer}
          onChangeText={(text) => setNewAnswer(text)}
          style={{
            flex: 1,
            minHeight: 50,
            maxHeight: 200,
            backgroundColor: "#853b30",
            borderRadius: 5,
            padding: 10,
            paddingTop: 15,
            fontFamily: "Lato_400Regular",
            fontSize: 17.5,
            color: "#FFF",
            alignItems: "center",
          }}
        />
        <AnimatedSpacer
          height="100%"
          width={buttonFadeRef.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          })}
        />
        <AnimatedTouchable
          disabled={newAnswer === ""}
          onPress={() => {
            setAnswers(answers.concat(newAnswer));
            setNewAnswer("");
          }}
          style={[
            styles.centerView,
            {
              backgroundColor: "#853b30",
              borderRadius: 5,
              opacity: buttonFadeRef,
              padding: buttonFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 10],
              }),
              height: buttonFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
              width: buttonFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50],
              }),
            },
          ]}
        >
          <Animated.Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 17.5,
              opacity: buttonFadeRef.interpolate({
                inputRange: [0.975, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            Add
          </Animated.Text>
        </AnimatedTouchable>
      </View>

      <Spacer width="100%" height={40} />
      <ScrollView style={{ flex: 1 }}>
        {answers.map((answer, index) => (
          <MCAnswer
            key={index}
            {...{ answer, answers, index, setAnswers, questions, setQuestions }}
          />
        ))}
        <Spacer width="100%" height={40} />
        <AnimatedTouchable
          disabled={answers.length === 0 || buttonDisabled}
          onPress={async () => {
            createDraftQuestion(userData.id, questionsModalActive.id, {
              answers,
              question,
              category: "Multiple Choice",
            }).then(() => setVisible(false));
            setButtonDisabled(true);
            setQuestions(
              questions.concat({
                answers,
                question,
                category: "Multiple Choice",
              })
            );
            setVisible(false);
          }}
          style={{
            alignSelf: "center",
            padding: 12.5,
            backgroundColor: "#853b30",
            borderRadius: 5,
            opacity: submitButtonRef,
          }}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 17.5,
            }}
          >
            Submit
          </Text>
        </AnimatedTouchable>
        <Spacer width="100%" height={40} />
      </ScrollView>
    </View>
  );
};

const AddAnswers = ({
  userData,
  question,
  addAnswersActive,
  questions,
  setQuestions,
  setVisible,
  questionsModalActive,
}: {
  userData: AddQuestionsModal2Props["userData"];
  question: string;
  addAnswersActive: Category | undefined;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  questionsModalActive: PollDraftInfo;
}) => {
  const [answers, setAnswers] = useState<string[]>([]);
  const shrinkRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(shrinkRef, {
      delay: 500,
      toValue: addAnswersActive === undefined ? 0 : 1,
      duration: 500,
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
      {addAnswersActive !== undefined &&
        addAnswersActive.name === "Multiple Choice" && (
          <MCAnswers
            userData={userData}
            question={question}
            answers={answers}
            setAnswers={setAnswers}
            questions={questions}
            setQuestions={setQuestions}
            setVisible={setVisible}
            questionsModalActive={questionsModalActive}
          />
        )}
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
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
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
            setVisible(false);
          }}
        >
          <FontAwesome5
            name="times"
            style={{ color: "#853b30", fontSize: 30 }}
          />
        </TouchableOpacity>
        <Text style={{ alignSelf: "center", fontSize: 30, color: "#853b30" }}>
          Add Question
        </Text>
        <Spacer width="100%" height={40} />
        <EnterQuestionTitle
          {...{
            question,
            setQuestion,
            setAddQuestionActive,
          }}
        />
        <AddQuestionSubModal
          question={question}
          addQuestionActive={addQuestionActive}
          setAddAnswersActive={setAddAnswersActive}
        />
        <AddAnswers
          userData={userData}
          addAnswersActive={addAnswersActive}
          question={question}
          questions={questions}
          setQuestions={setQuestions}
          setVisible={setVisible}
          questionsModalActive={questionsModalActive}
        />
      </View>
    </Modal>
  );
};

const QuestionComponent = ({
  question,
  last,
}: {
  question: Question;
  last: boolean;
}) => {
  return (
    <>
      <View
        style={{
          width: 300,
          minHeight: 200,
          borderLeftWidth: 2.5,
          borderTopWidth: 2.5,
          borderRightWidth: 2.5,
          borderColor: "#853b30",
          backgroundColor: "#853b30",
          alignSelf: "center",
        }}
      >
        <View
          style={[
            styles.centerView,
            { width: "100%", minHeight: 50, backgroundColor: "#FFF" },
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
          {question.answers.map((answer, index) => {
            return (
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
            );
          })}
        </View>
      </View>
      {!last && (
        <>
          <Spacer width="100%" height={20} />
          <View
            style={{ width: "100%", height: 1, backgroundColor: "#853b3025" }}
          />
          <Spacer width="100%" height={20} />
        </>
      )}
    </>
  );
};

export default function AddQuestionsModal2({
  userData,
  questionsModalActive,
  setQuestionsModalActive,
}: AddQuestionsModal2Props) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [addModalActive, setAddModalActive] = useState(false);

  useEffect(() => {
    if (questionsModalActive !== undefined)
      getDraftQuestions(userData.id, questionsModalActive.id).then((result) => {
        setQuestions(result);
        setLoading(false);
      });
    else setQuestions([]);
  }, [questionsModalActive]);

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
          <ScrollView>
            {questions.map((val, index) => {
              return (
                <QuestionComponent
                  key={index}
                  question={val}
                  last={index == questions.length - 1}
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
        visible={addModalActive}
        setVisible={setAddModalActive}
        questions={questions}
        setQuestions={setQuestions}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  centerView: { justifyContent: "center", alignItems: "center" },
});
