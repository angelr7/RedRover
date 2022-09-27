// TODO: have some front-end checking to make sure that polls don't have duplicate names
import * as Localization from "expo-localization";
import FastImage from "../components/FastImage";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoadingScreen from "../components/LoadingScreen";
import moment from "moment-timezone";
import Spacer from "../components/Spacer";
import SetDescriptionInformation from "./SetDescriptionInformation";
import InitialPrompt from "./InitialPrompt";
import AddQuestionsModal from "./AddQuestionsModal";
import React, { useEffect, useRef, useState } from "react";
import { DAYS_OF_WEEK } from "../constants/localization";
import {
  Answer,
  deleteQuestion,
  getQuestions,
  publishPoll,
  UserData,
} from "../firebase";
import { ListEmpty } from "./CreatePolls";
import { AcceptedLabel } from "../components/PollTypeButton";
import {
  SafeAreaView,
  StyleSheet,
  Animated,
  Keyboard,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  Platform,
  StatusBar,
  Pressable,
  Modal,
} from "react-native";

type Screen = "Initial" | "Description" | "Loading" | "AddQuestions";
interface LocalPageScreen {
  name: Screen;
  params?: {
    [key: string]: any;
  };
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
    questions: any[]; // "any" for now
    id: string;
  };
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>;
  navigation?: any;
  setLoadingModalVisible?: React.Dispatch<React.SetStateAction<boolean>>;
}
interface Question {
  id: string;
  questionType: AcceptedLabel;
  questionText: string;
  answers: Answer[];
}
interface QuestionContainerProps {
  questions: Question[];
  pollID: string;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setCurrQuestion: React.Dispatch<React.SetStateAction<Question>>;
}
interface QuestionPreviewProps {
  pollID: string;
  question: Question;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setCurrQuestion: React.Dispatch<React.SetStateAction<Question>>;
}
interface QuestionPreviewBannerProps {
  flipAnimationProgress: Animated.Value;
  questionType: AcceptedLabel;
}
interface PollPreviewFlipAnimation {
  flipped: boolean;
  dateDisplayed: string;
  userData: AddQuestionsProps["userData"];
  pollData: AddQuestionsProps["pollData"];
  flipAnimationProgress: Animated.Value;
  fadeAnimationProgress: Animated.Value;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setDisplayDate: React.Dispatch<React.SetStateAction<string>>;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setButtonText: React.Dispatch<React.SetStateAction<string>>;
  setSecondButtonVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
interface QuestionPreviewBacksideProps {
  flipAnimationProgress: Animated.Value;
  pollID: string;
  question: Question;
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setCurrQuestion: React.Dispatch<React.SetStateAction<Question>>;
}
interface PublishingModalProps {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

// gives a relative timestamp similar to iOS
const getRelativeTimestamp = (
  currDate: moment.Moment,
  datePosted: moment.Moment
) => {
  const currCalendarDate = currDate.format("L");
  const postedCalendarDate = datePosted.format("L");
  const timePosted = datePosted.format("LT");

  if (currCalendarDate === postedCalendarDate) return timePosted;

  const currSplitDate = currCalendarDate.split("/");
  const postedSplitDate = postedCalendarDate.split("/");
  const sameMonth =
    currSplitDate[0] === postedSplitDate[0] &&
    currSplitDate[2] === postedSplitDate[2];
  const oneDayApart =
    sameMonth &&
    parseInt(currSplitDate[1]) - parseInt(postedSplitDate[1]) === 1;

  if (oneDayApart) return `Yesterday, ${timePosted}`;

  const currDay = DAYS_OF_WEEK[currDate.isoWeekday() - 1];
  const dayPosted = DAYS_OF_WEEK[datePosted.isoWeekday() - 1];
  if (currDate.diff(datePosted, "weeks") === 0 && currDay !== dayPosted)
    return `${dayPosted}, ${timePosted}`;

  const postedMonthYear = datePosted.format("LL");
  if (
    currDate.diff(datePosted, "years") === 0 &&
    currSplitDate[0] !== postedSplitDate[0]
  )
    return postedMonthYear.split(", ")[0];

  return postedMonthYear;
};

const handleFlipAnimation = (
  flipped: boolean,
  flipAnimationProgress: Animated.Value,
  setShowBackside: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useEffect(() => {
    if (flipped) {
      setShowBackside(true);
      Animated.timing(flipAnimationProgress, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else
      Animated.timing(flipAnimationProgress, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowBackside(false);
      });
  }, [flipped]);
};

const handlePollPreviewFlip = ({
  flipped,
  fadeAnimationProgress,
  setTitle,
  setDisplayDate,
  setDescription,
  setButtonText,
  setSecondButtonVisible,
  userData,
  pollData,
  flipAnimationProgress,
  dateDisplayed,
}: PollPreviewFlipAnimation) => {
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (flipped) {
      Animated.timing(fadeAnimationProgress, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setTitle("Additional Information");
        setDisplayDate(`${userData.email}`);
        setDescription(pollData.additionalInfo);
        setButtonText("Back");
        setSecondButtonVisible(true);
        Animated.sequence([
          Animated.timing(flipAnimationProgress, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimationProgress, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.timing(fadeAnimationProgress, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        setTitle(pollData.title);
        setDisplayDate(dateDisplayed);
        setDescription(pollData.description);
        setButtonText("More");
        setSecondButtonVisible(false);
        Animated.sequence([
          Animated.timing(flipAnimationProgress, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimationProgress, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [flipped]);
};

const PollPreview = ({ userData, pollData, setScreen }: AddQuestionsProps) => {
  const [title, setTitle] = useState(pollData.title);
  const [description, setDescription] = useState(pollData.description);
  const [buttonText, setButtonText] = useState("More");
  const [secondButtonVisible, setSecondButtonVisible] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const fadeAnimationProgress = useRef(new Animated.Value(1)).current;

  // gives a different date depending on timezone of user
  const currDate = moment().tz(Localization.timezone);

  const datePosted = moment(parseInt(pollData.dateCreated)).tz(
    Localization.timezone
  );

  const dateDisplayed = getRelativeTimestamp(currDate, datePosted);
  const [displayDate, setDisplayDate] = useState(dateDisplayed);

  const hasPreviewImage = pollData.previewImageURI !== "";

  handlePollPreviewFlip({
    flipped,
    fadeAnimationProgress,
    setTitle,
    setDisplayDate,
    setDescription,
    setButtonText,
    setSecondButtonVisible,
    userData,
    pollData,
    flipAnimationProgress,
    dateDisplayed,
  });

  return (
    <Animated.View
      style={[
        styles.pollPreviewParent,
        {
          transform: [
            {
              rotateY: flipAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "180deg"],
              }),
            },
            {
              scaleX: flipAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, -1],
              }),
            },
          ],
        },
      ]}
    >
      {hasPreviewImage && (
        // need to put a view over so the container actually looks flipped if we have an image
        <Animated.View
          style={[
            styles.imageContainerParent,
            {
              transform: [
                {
                  scaleX: flipAnimationProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, -1],
                  }),
                },
              ],
            },
          ]}
        >
          <FastImage
            pollID={pollData.id}
            style={{ width: "100%", height: "100%" }}
            uri={pollData.previewImageURI}
            resizeMode="cover"
            blurRadius={25}
            borderRadius={7.5}
          />
        </Animated.View>
      )}
      <Animated.View
        style={[
          {
            height: "100%",
            width: "75%",
            padding: 20,
            opacity: fadeAnimationProgress,
          },
        ]}
      >
        <View style={[hasPreviewImage && styles.pollPreviewTitleContainer]}>
          <Text style={[styles.pollPreviewTitle]}>{title}</Text>
          <Text style={styles.displayDate}>{displayDate}</Text>
        </View>
        <Spacer width="100%" height={20} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[
            {
              flex: 1,
              width: "100%",
            },
            hasPreviewImage && styles.imageContainerTint,
          ]}
        >
          <Text style={styles.pollPreviewDescription}>
            {description.trim() !== ""
              ? description
              : "No additional information."}
          </Text>
        </ScrollView>
      </Animated.View>
      <Animated.View
        style={[
          styles.centerView,
          styles.pollPreviewButtonContainer,
          {
            opacity: fadeAnimationProgress,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setFlipped(!flipped);
          }}
          style={[
            styles.pollPreviewTouchable,
            styles.centerView,
            hasPreviewImage && styles.pollPreviewTouchableShadow,
          ]}
        >
          <Text style={styles.pollPreviewButtonText}>{buttonText}</Text>
        </TouchableOpacity>
        {secondButtonVisible && (
          <>
            <Spacer width="100%" height={10} />
            <TouchableOpacity
              onPress={() => {
                setScreen({
                  name: "Description",
                  params: {
                    ...pollData,
                  },
                });
              }}
              style={[
                styles.pollPreviewTouchable,
                styles.centerView,
                hasPreviewImage && styles.pollPreviewTouchableShadow,
              ]}
            >
              <Text style={styles.pollPreviewButtonText}>{"Edit"}</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const NoPollQuestions = () => {
  return (
    <View style={[styles.centerView, styles.pollQuestionContainer]}>
      <ListEmpty />
    </View>
  );
};

const QuestionPreviewBackside = ({
  flipAnimationProgress,
  pollID,
  question,
  questions,
  setQuestions,
  setCurrQuestion,
}: QuestionPreviewBacksideProps) => {
  return (
    <Animated.View
      style={[
        styles.centerView,
        styles.questionPreviewBackside,
        { opacity: flipAnimationProgress },
      ]}
    >
      <Animated.View
        style={[
          styles.centerView,
          {
            width: 75,
            transform: [
              {
                scaleY: flipAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, -1],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setCurrQuestion(question);
          }}
          style={[styles.questionPreviewButtonContainer, styles.centerView]}
        >
          <Text style={styles.questionPreviewButtonText}>Edit</Text>
        </TouchableOpacity>
        <Spacer width="100%" height={10} />
        <TouchableOpacity
          style={[styles.questionPreviewButtonContainer, styles.centerView]}
          onPress={async () => {
            await deleteQuestion(pollID, question);
            setQuestions(questions.filter((q) => q.id !== question.id));
          }}
        >
          <Text style={styles.questionPreviewButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const QuestionPreviewBanner = ({
  flipAnimationProgress,
  questionType,
}: QuestionPreviewBannerProps) => {
  return (
    <View style={[styles.questionPreviewBanner, styles.centerView]}>
      <View style={styles.bannerContainer1}>
        <View style={[styles.bannerContainer2, styles.centerView]}>
          <Animated.Text
            style={[
              styles.bannerText,
              {
                transform: [
                  {
                    scaleY: flipAnimationProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, -1],
                    }),
                  },
                ],
              },
            ]}
          >
            {questionType}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
};

const QuestionPreview = ({
  pollID,
  question,
  questions,
  setQuestions,
  setCurrQuestion,
}: QuestionPreviewProps) => {
  const [flipped, setFlipped] = useState(false);
  const [showBackside, setShowBackside] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  handleFlipAnimation(flipped, flipAnimationProgress, setShowBackside);

  return (
    <AnimatedPressable
      onPress={() => {
        setFlipped(!flipped);
      }}
      style={[
        styles.questionPreviewContainer,
        styles.centerView,
        {
          transform: [
            {
              rotateX: flipAnimationProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "180deg"],
              }),
            },
          ],
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.questionPreviewText,
          {
            opacity: flipAnimationProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          },
        ]}
      >
        {question.questionText}
      </Animated.Text>
      {showBackside && (
        <QuestionPreviewBackside
          pollID={pollID}
          flipAnimationProgress={flipAnimationProgress}
          question={question}
          questions={questions}
          setQuestions={setQuestions}
          setCurrQuestion={setCurrQuestion}
        />
      )}
      <QuestionPreviewBanner
        flipAnimationProgress={flipAnimationProgress}
        questionType={question.questionType}
      />
    </AnimatedPressable>
  );
};

const QuestionContainer = ({
  questions,
  pollID,
  setQuestions,
  setCurrQuestion,
}: QuestionContainerProps) => {
  // we need to create a component for this to add a key prop to it
  const QuestionPreviewFragment = ({
    index,
    question,
  }: {
    index: number;
    question: Question;
  }) => {
    return (
      <>
        <QuestionPreview
          key={index}
          pollID={pollID}
          question={question}
          questions={questions}
          setQuestions={setQuestions}
          setCurrQuestion={setCurrQuestion}
        />
        {index !== questions.length - 1 && <Spacer width="100%" height={10} />}
      </>
    );
  };

  return (
    <View
      style={[
        styles.centerView,
        styles.pollQuestionContainer,
        styles.flexRowWrap,
      ]}
    >
      {questions.map((question, index) => {
        return (
          <QuestionPreviewFragment
            key={index}
            question={question}
            index={index}
          />
        );
      })}
    </View>
  );
};

const Loading = () => {
  return (
    <View style={[styles.centerView, styles.pollQuestionContainer]}>
      <LoadingScreen color="#FFF" noParentStyle={true} />
    </View>
  );
};

// TODO: add a call that publishes the polls
const AddQuestions = ({
  navigation,
  userData,
  pollData,
  setScreen,
  setLoadingModalVisible,
}: AddQuestionsProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [questions, setQuestions] = useState<Question[]>(undefined);
  const [pollID, setPollID] = useState<string>(undefined);
  const [currQuestion, setCurrQuestion] = useState<Question>(undefined);
  const [refetch, setRefetch] = useState(false);
  const mounted = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fetchingQuestions = questions === undefined || pollID === undefined;

  useEffect(() => {
    if (!mounted.current || refetch)
      try {
        getQuestions(pollData.author, pollData.title).then((result) => {
          setPollID(result.pollID);
          setQuestions(result.questions ?? []);
        });
      } catch (error) {}
    if (refetch) setRefetch(false);
    if (!mounted.current) mounted.current = true;
  }, [refetch]);

  useEffect(() => {
    if (currQuestion === undefined) setModalVisible(false);
    else setModalVisible(true);
  }, [currQuestion]);

  return (
    <ScrollView
      style={styles.addQuestionsScrollView}
      showsVerticalScrollIndicator={false}
      ref={(ref) => (scrollViewRef.current = ref)}
    >
      <Spacer width="100%" height={10} />
      <PollPreview
        userData={userData}
        pollData={pollData}
        setScreen={setScreen}
      />
      <Spacer width="100%" height={20} />
      <Text style={styles.addQuestionsModalLabel}>Questions</Text>
      <Spacer width="100%" height={20} />
      {(() => {
        if (fetchingQuestions) return <Loading />;
        else if (questions.length === 0) return <NoPollQuestions />;
        else
          return (
            <QuestionContainer
              questions={questions}
              pollID={pollID}
              setQuestions={setQuestions}
              setCurrQuestion={setCurrQuestion}
            />
          );
      })()}
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        style={{ alignSelf: "center" }}
        onPress={() => {
          scrollViewRef.current.scrollToEnd({ animated: true });
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" style={{ color: "#FFF", fontSize: 57.5 }} />
      </TouchableOpacity>
      <Spacer width="100%" height={20} />
      {questions && questions.length > 0 && (
        <>
          <TouchableOpacity
            onPress={async () => {
              setLoadingModalVisible(true);
              await publishPoll(pollID);
              setLoadingModalVisible(false);
              navigation.pop();
            }}
            style={{
              alignSelf: "center",
              backgroundColor: "rgba(114, 47, 55, 0.5)",
              padding: 10,
              borderRadius: 5,
              borderColor: "#FFF",
              borderWidth: 1,
            }}
          >
            <Text
              style={{
                fontFamily: "Actor_400Regular",
                fontSize: 17.5,
                color: "#FFF",
              }}
            >
              Submit
            </Text>
          </TouchableOpacity>
          <Spacer width="100%" height={20} />
        </>
      )}
      <AddQuestionsModal
        pollID={pollID}
        pollData={pollData}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        questions={questions}
        setQuestions={setQuestions}
        currQuestion={currQuestion}
        setCurrQuestion={setCurrQuestion}
        setRefetch={setRefetch}
      />
    </ScrollView>
  );
};

// TODO: add poll finish animation + haptic bump
// maybe put a check for the animtion (if there's time)
const PublishingPoll = () => {
  const [loadingText, setLoadingText] = useState("Publishing your poll");
  useEffect(() => {
    setTimeout(() => {
      const ellipsesFilled = loadingText.slice(-3) === "...";
      setLoadingText(
        ellipsesFilled ? "Publishing your poll" : loadingText + "."
      );
    }, 250);
  }, [loadingText]);

  return (
    <Text
      style={{
        fontFamily: "Actor_400Regular",
        color: "#D2042D",
        textAlign: "center",
        fontSize: 25,
      }}
    >
      {loadingText}
    </Text>
  );
};

const PublishingModal = ({
  modalVisible,
  setModalVisible,
}: PublishingModalProps) => {
  return (
    <Modal visible={modalVisible} animationType="fade" transparent>
      <View
        style={[
          styles.centerView,
          {
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        ]}
      >
        <View
          style={[
            styles.centerView,
            {
              width: 300,
              height: 150,
              borderRadius: 7.5,
              backgroundColor: "#FFF",
            },
          ]}
        >
          <PublishingPoll />
        </View>
      </View>
    </Modal>
  );
};

export default function CreatePollScreen({ route, navigation }) {
  const keyboardAnimationVal = useRef(new Animated.Value(0)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const hasInitialScreen = route.params.initialScreen !== undefined;

  const initialScreenParams = hasInitialScreen
    ? route.params.initialScreen.params
    : undefined;

  const [screen, setScreen] = useState<LocalPageScreen>({
    name: !hasInitialScreen ? "Initial" : route.params.initialScreen.name,
    params: initialScreenParams,
  });

  const useCenterView = screen.name !== "Description";

  const [userData, _] = useState<UserData>(
    route.params.userData ?? route.params.initialScreen.params.userData
  );

  const [modalVisible, setModalVisible] = useState(false);

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
            const { title, description, previewImageURI, additionalInfo } =
              screen.params.pollData ?? screen.params;

            return (
              <SetDescriptionInformation
                {...{
                  title,
                  description,
                  keyboardHeight,
                  keyboardAnimationVal,
                  setScreen,
                  dateCreated: screen.params.datecreated,
                  userData: userData,
                  passedPreviewImageURI: previewImageURI,
                  passedAdditionalInfo: additionalInfo,
                }}
              />
            );
          case "AddQuestions":
            if (screen.params.pollData) {
              return (
                <AddQuestions
                  pollData={screen.params.pollData}
                  userData={screen.params.userData}
                  setScreen={setScreen}
                  setLoadingModalVisible={setModalVisible}
                  navigation={navigation}
                />
              );
            }
          case "Loading":
            return <LoadingScreen color="#D2042D" />;
          default:
            return <View />;
        }
      })()}
      <PublishingModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#D2042D",
  },
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  addQuestionsScrollView: {
    width: "100%",
    height: "100%",
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  addQuestionsModalLabel: {
    fontFamily: "Actor_400Regular",
    color: "#FFF",
    fontSize: 30,
    textAlign: "center",
  },
  pollQuestionContainer: {
    width: "100%",
    borderRadius: 7.5,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    padding: 10,
  },
  flexRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    flexWrap: "wrap",
  },
  questionPreviewContainer: {
    width: "100%",
    height: 100,
    backgroundColor: "#FFF",
    borderRadius: 5,
    padding: 10,
  },
  questionPreviewText: {
    color: "#D2042D",
    fontFamily: "Actor_400Regular",
  },
  questionPreviewBanner: {
    position: "absolute",
    width: 40,
    height: 40,
    left: 0,
    top: 0,
  },
  bannerContainer1: {
    width: "200%",
    height: 17.5,
    backgroundColor: "#D2042D",
    transform: [{ rotate: "-45deg" }],
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  bannerContainer2: {
    width: "100%",
    flex: 1,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  bannerText: {
    color: "#FFF",
    fontSize: 7.5,
    fontFamily: "Actor_400Regular",
  },
  questionPreviewBackside: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  questionPreviewButtonContainer: {
    width: "100%",
    padding: 5,
    borderWidth: 1,
    borderColor: "#D2042D",
    borderRadius: 5,
  },
  questionPreviewButtonText: {
    color: "#D2042D",
  },
  pollPreviewParent: {
    width: "100%",
    height: 250,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    borderRadius: 7.5,
    flexDirection: "row",
  },
  imageContainerParent: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  pollPreviewTitleContainer: {
    alignSelf: "flex-start",
    paddingLeft: 5,
    paddingRight: 5,
    paddingBottom: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 5,
  },
  pollPreviewTitle: {
    fontFamily: "Actor_400Regular",
    color: "#FFF",
    fontSize: 25,
  },
  displayDate: {
    fontFamily: "Actor_400Regular",
    color: "#FFF",
    fontSize: 15,
  },
  imageContainerTint: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 5,
    padding: 5,
    paddingTop: 0,
  },
  pollPreviewDescription: {
    fontFamily: "Actor_400Regular",
    color: "#FFF",
    fontSize: 15,
    lineHeight: 25,
    marginBottom: 5,
  },
  pollPreviewButtonContainer: {
    height: "100%",
    flex: 1,
    padding: 20,
    paddingLeft: 0,
  },
  pollPreviewTouchable: {
    width: "100%",
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 5,
  },
  pollPreviewTouchableShadow: {
    shadowColor: "#000",
    shadowOpacity: 1,
    shadowOffset: { width: 1, height: 1 },
    shadowRadius: 8,
  },
  pollPreviewButtonText: {
    fontFamily: "Actor_400Regular",
    fontSize: 15,
    color: "#D2042D",
  },
  closeButtonStyle: {
    fontSize: 25,
    color: "#D2042D",
  },
  editQuestionHeading: {
    fontFamily: "Actor_400Regular",
    fontSize: 35,
    color: "#D2042D",
    marginTop: 10,
    alignSelf: "center",
  },
  outerRed: {
    width: "100%",
    borderRadius: 7.5,
    backgroundColor: "#D2042D",
  },
  innerRed: {
    width: "100%",
    flex: 1,
    borderRadius: 7.5,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    padding: 20,
  },
  editModalHeading: {
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
    color: "#D2042D",
  },
  // modalBackdrop: {
  //   width: SCREEN_WIDTH,
  //   height: SCREEN_HEIGHT,
  //   backgroundColor: "rbga(0, 0, 0, 0.5)",
  // },
});

export type { LocalPageScreen, AddQuestionsProps, Question };
