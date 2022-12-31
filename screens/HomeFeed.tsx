import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import LoadingScreen from "../components/LoadingScreen";
import { BarChart } from "react-native-chart-kit";
import { Question } from "./CreatePollScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { SCREEN_WIDTH } from "../constants/dimensions";
import { IntakeSurveyIndicator } from "../components/IntakeSurvey";
import React, { useEffect, useRef, useState } from "react";
import { getAllPolls, getPublishedQuestions } from "../firebase";
import {
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type HeartVariant = "heart" | "heart-outline";
type BookmarkVariant = "bookmark" | "bookmark-outline";
type AcceptedTitle =
  | "Polls Started"
  | "Polls Completed"
  | "Polls Liked"
  | "Polls Favorited";
interface PollData {
  additionalInfo: string;
  author: string;
  dateCreated: string;
  description: string;
  previewImageURI: string;
  published: boolean;
  title: string;
  id: string;
}
interface PollPreviewProps {
  isAdmin: boolean;
  isLast: boolean;
  pollData: PollData;
  navigation: any;
}
interface QuestionPreviewProps {
  previewQuestion: Question;
  isAdmin: boolean;
  navigation: any;
}
interface MultipleChoiceBarChartProps {
  answers: Question["answers"];
  isAdmin: boolean;
}
interface InnerModalTitleProps {
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  currTitle: string;
}
interface FilterSwitcherProps {
  globalAnimationProgress: Animated.Value;
  focusedAnimationProgress: Animated.Value;
  setFilterSelected: React.Dispatch<React.SetStateAction<"Global" | "Focused">>;
}
interface InnerModalTopHalfProps {
  isAdmin: boolean;
  currTitle: AcceptedTitle;
  value: number;
  focusedAnimationProgress: Animated.Value;
  globalAnimationProgress: Animated.Value;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setFilterSelected: React.Dispatch<React.SetStateAction<"Global" | "Focused">>;
}
interface InnerModalBottomButtonProps {
  isAdmin: boolean;
}
interface EngagementNumberStatProps {
  value: number;
  title: AcceptedTitle;
}
interface EngagementTabProps {
  isAdmin: boolean;
  value: number;
  title: AcceptedTitle;
  setCurrTitle: React.Dispatch<React.SetStateAction<AcceptedTitle>>;
  setCurrVal: React.Dispatch<React.SetStateAction<number>>;
}
interface GlobalEngagementTabsProps {
  isAdmin: boolean;
  setCurrTitle: React.Dispatch<React.SetStateAction<AcceptedTitle>>;
  setCurrVal: React.Dispatch<React.SetStateAction<number>>;
}
interface TopLogoBar {}
interface NoPollsProps {
  isAdmin: boolean;
}

const getPollDataFromDocData = (docData: any): PollData => {
  const {
    additionalInfo,
    author,
    dateCreated,
    description,
    previewImageURI,
    published,
    title,
  } = docData.data();
  return {
    additionalInfo,
    author,
    dateCreated,
    description,
    previewImageURI,
    published,
    title,
    id: docData.id,
  };
};

const handleFilterSwap = (
  filterSelected: "Global" | "Focused",
  focusedAnimationProgress: Animated.Value,
  globalAnimationProgress: Animated.Value
) => {
  useEffect(() => {
    if (filterSelected === "Global")
      Animated.parallel([
        Animated.timing(focusedAnimationProgress, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(globalAnimationProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    else
      Animated.parallel([
        Animated.timing(focusedAnimationProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(globalAnimationProgress, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
  }, [filterSelected]);
};

const TopLogoBar = () => {
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const [animationVal, setAnimationVal] = useState(0);
  const spinAnimationRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (animationTriggered) {
      Animated.timing(spinAnimationRef, {
        toValue: animationVal + 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setTimeout(() => setAnimationVal(animationVal + 1), 500));
    } else {
      spinAnimationRef.setValue(0);
    }
  }, [animationTriggered, animationVal]);

  return (
    <View style={styles.topLogoContainer}>
      <AnimatedTouchable
        onPress={() => setAnimationTriggered(true)}
        style={{
          flexDirection: "row",
          transform: [
            {
              rotateY: spinAnimationRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        <Text
          style={{
            color: "#853b30",
            fontFamily: "Lato_400Regular",
            fontSize: 45,
            transform: [{ scaleX: -1 }],
          }}
        >
          R
        </Text>
        <Text
          style={{
            color: "#853b30",
            fontFamily: "Lato_400Regular",
            fontSize: 45,
          }}
        >
          R
        </Text>
      </AnimatedTouchable>
    </View>
  );
};

const PollPreviewBottomBar = ({ isAdmin }: { isAdmin: boolean }) => {
  const [heartVariant, setHeartVariant] =
    useState<HeartVariant>("heart-outline");
  const [bookmarkVariant, setBookmarkVaraint] =
    useState<BookmarkVariant>("bookmark-outline");
  const [numLikes, setNumLikes] = useState(0);
  const [numSaved, setNumSaved] = useState(0);
  return (
    <View
      style={[
        styles.pollPreviewBottomBarParent,
        {
          borderColor: isAdmin ? "#853b30" : "#afc9f9",
          paddingLeft: 10,
          paddingRight: 10,
        },
      ]}
    >
      <Text
        style={[
          styles.countdown,
          {
            color: isAdmin ? "#853b30" : "#afc9f9",
          },
        ]}
      >
        Closing in 1:00 hrs
      </Text>
      <Spacer width={"20%"} height={"100%"} />
      <View style={styles.likeAndSaveContainer}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => {
              if (heartVariant !== "heart") setNumLikes(numLikes + 1);
              else setNumLikes(numLikes - 1);
              setHeartVariant(
                heartVariant === "heart" ? "heart-outline" : "heart"
              );
            }}
          >
            <Ionicons
              name={heartVariant}
              style={{
                fontSize: 25,
                color: isAdmin ? "#853b30" : "#afc9f9",
              }}
            />
          </TouchableOpacity>
          <Spacer width={10} height={"100%"} />
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              color: isAdmin ? "#853b30" : "#afc9f9",
            }}
          >
            {numLikes}
          </Text>
        </View>
        <Spacer height="100%" width={10} />
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => {
              if (bookmarkVariant !== "bookmark") setNumSaved(numSaved + 1);
              else setNumSaved(numSaved - 1);
              setBookmarkVaraint(
                bookmarkVariant === "bookmark" ? "bookmark-outline" : "bookmark"
              );
            }}
          >
            <Ionicons
              name={bookmarkVariant}
              style={{
                fontSize: 25,
                color: isAdmin ? "#853b30" : "#afc9f9",
              }}
            />
          </TouchableOpacity>
          <Spacer width={10} height={"100%"} />
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              color: isAdmin ? "#853b30" : "#afc9f9",
            }}
          >
            {numSaved}
          </Text>
        </View>
      </View>
    </View>
  );
};

const MultipleChoiceBarChart = ({
  answers,
  isAdmin,
}: MultipleChoiceBarChartProps) => {
  return (
    <BarChart
      fromZero
      yAxisLabel=""
      yAxisSuffix="%"
      height={200}
      width={SCREEN_WIDTH * 0.75}
      yLabelsOffset={SCREEN_WIDTH * 0.09}
      data={{
        labels: answers.map((answer) => answer.answerText),
        datasets: [
          {
            data: answers.map((answer) => Math.random() * 100),
          },
        ],
      }}
      chartConfig={{
        backgroundGradientFrom: isAdmin ? "#853b30" : "#afc9f9",
        backgroundGradientTo: isAdmin ? "#853b30" : "#afc9f9",
        color: (opacity = 3) => `rgba(255, 255, 255, ${opacity})`,
        decimalPlaces: 0,
      }}
    />
  );
};

const InnerModalTitle = ({
  setModalVisible,
  currTitle,
}: InnerModalTitleProps) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", left: -10 }}>
      <TouchableOpacity
        style={{ padding: 10 }}
        onPress={() => setModalVisible(false)}
      >
        <Octicons name="chevron-left" style={{ fontSize: 25, color: "#FFF" }} />
      </TouchableOpacity>
      <Spacer width={10} height={"100%"} />
      <Text style={styles.topHalfTitle}>{currTitle}</Text>
    </View>
  );
};

const FilterSwitcherContainer = ({
  globalAnimationProgress,
  focusedAnimationProgress,
  setFilterSelected,
}: FilterSwitcherProps) => {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TouchableOpacity onPress={() => setFilterSelected("Global")}>
        <Text style={styles.switcherText}>Global</Text>
        <Animated.View
          style={[
            styles.animatedUnderline,
            {
              transform: [{ scaleX: globalAnimationProgress }],
            },
          ]}
        />
      </TouchableOpacity>
      <Spacer height={"100%"} width={15} />
      <TouchableOpacity onPress={() => setFilterSelected("Focused")}>
        <Text style={styles.switcherText}>Focused</Text>
        <Animated.View
          style={[
            styles.animatedUnderline,
            {
              transform: [{ scaleX: focusedAnimationProgress }],
            },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
};

const InnerModalTopHalf = ({
  isAdmin,
  currTitle,
  setModalVisible,
  value,
  focusedAnimationProgress,
  globalAnimationProgress,
  setFilterSelected,
}: InnerModalTopHalfProps) => {
  return (
    <View
      style={[
        styles.innerModalTopHalf,
        {
          backgroundColor: isAdmin ? "#853b30" : "#afc9f9",
        },
      ]}
    >
      <InnerModalTitle
        currTitle={currTitle}
        setModalVisible={setModalVisible}
      />
      <Spacer width={"100%"} height={20} />
      <FilterSwitcherContainer
        focusedAnimationProgress={focusedAnimationProgress}
        globalAnimationProgress={globalAnimationProgress}
        setFilterSelected={setFilterSelected}
      />
      <View
        style={[
          styles.engagementShowcase,
          {
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <EngagementNumber value={value} title={currTitle} />
      </View>
    </View>
  );
};

const InnerModalBottomButton = ({ isAdmin }: InnerModalBottomButtonProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.innerModalBottomButton,
        { borderColor: isAdmin ? "#853b30" : "#afc9f9" },
      ]}
    >
      <Text
        style={[
          styles.modalButtonText,
          {
            color: isAdmin ? "#853b30" : "#afc9f9",
          },
        ]}
      >
        Questions
      </Text>
    </TouchableOpacity>
  );
};

const EngagementNumber = ({ value, title }: EngagementNumberStatProps) => {
  const [currVal, setCurrVal] = useState(0);
  const [stopAnimation, setStopAnimation] = useState(false);
  const endAnimationProgress = useRef(new Animated.Value(0)).current;

  const handleGrow = () => {
    Animated.timing(endAnimationProgress, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (stopAnimation) {
      setCurrVal(value);
      handleGrow();
      return;
    }

    if (value === currVal && stopAnimation) setStopAnimation(false);
    else if (value === currVal && !stopAnimation) handleGrow();

    if (value !== currVal) {
      if (currVal < value) setTimeout(() => setCurrVal(currVal + 1), 5);
      else if (currVal > value) setTimeout(() => setCurrVal(currVal - 1), 5);
    }
  }, [currVal, stopAnimation, value]);

  return (
    // press the number to skip the animation
    <TouchableOpacity onPress={() => setStopAnimation(!stopAnimation)}>
      <Animated.Text
        style={[
          styles.engagementNumber,
          {
            transform: [
              {
                translateY: endAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {currVal}
      </Animated.Text>
      <Animated.View
        style={{
          transform: [
            {
              scale: endAnimationProgress,
            },
          ],
        }}
      >
        <Text style={styles.engagementNumberLabel}>{title}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const EngagementTab = ({
  isAdmin,
  title,
  value,
  setCurrTitle,
  setCurrVal,
}: EngagementTabProps) => {
  let iconName: string;
  switch (title) {
    case "Polls Started":
      iconName = "user-edit";
      break;
    case "Polls Completed":
      iconName = "clipboard-check";
      break;
    case "Polls Liked":
      iconName = "thumbs-up";
      break;
    case "Polls Favorited":
      iconName = "bookmark";
      break;
    default:
      iconName = "smile";
      break;
  }

  return (
    <TouchableOpacity
      style={[
        styles.engagementTabContainer,
        {
          borderColor: isAdmin ? "#853b30" : "#afc9f9",
        },
      ]}
      onPress={() => {
        setCurrTitle(title);
        setCurrVal(value);
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 25,
            color: isAdmin ? "#853b30" : "#afc9f9",
          }}
        >
          {title}
        </Text>
        <Spacer width="100%" height={10} />
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 25,
            fontWeight: "bold",
            color: isAdmin ? "#853b30" : "#afc9f9",
          }}
        >
          {value}
        </Text>
      </View>
      <View style={styles.engagementTabIconContainer}>
        {iconName === "bookmark" ? (
          <Ionicons
            name={iconName}
            style={{
              color: isAdmin ? "#853b30" : "#afc9f9",
              fontSize: 32.5,
            }}
          />
        ) : (
          <FontAwesome5
            name={iconName}
            style={{
              color: isAdmin ? "#853b30" : "#afc9f9",
              fontSize: 30,
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const GlobalEngagementTabs = ({
  isAdmin,
  setCurrTitle,
  setCurrVal,
}: GlobalEngagementTabsProps) => {
  return (
    <ScrollView
      style={{
        // this gives it a more realistic scroll blend
        // when it goes behind the engagement tab
        paddingTop: 20,
        width: "100%",
        flex: 1,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* started, completed, liked, favorited */}
      <EngagementTab
        isAdmin={isAdmin}
        title={"Polls Started"}
        value={250}
        setCurrTitle={setCurrTitle}
        setCurrVal={setCurrVal}
      />
      <Spacer width="100%" height={20} />
      <EngagementTab
        isAdmin={isAdmin}
        title={"Polls Completed"}
        value={100}
        setCurrTitle={setCurrTitle}
        setCurrVal={setCurrVal}
      />
      <Spacer width="100%" height={20} />
      <EngagementTab
        isAdmin={isAdmin}
        title={"Polls Liked"}
        value={400}
        setCurrTitle={setCurrTitle}
        setCurrVal={setCurrVal}
      />
      <Spacer width="100%" height={20} />
      <EngagementTab
        isAdmin={isAdmin}
        title={"Polls Favorited"}
        value={200}
        setCurrTitle={setCurrTitle}
        setCurrVal={setCurrVal}
      />
      <Spacer width="100%" height={20} />
      <InnerModalBottomButton isAdmin={isAdmin} />
      <Spacer width="100%" height={40} />
    </ScrollView>
  );
};

const AdminPollModal = ({
  isAdmin,
  setModalVisible,
}: {
  isAdmin: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [currTitle, setCurrTitle] = useState<AcceptedTitle>("Polls Started");
  const [currVal, setCurrVal] = useState(250);
  const [filterSelected, setFilterSelected] = useState<"Global" | "Focused">(
    "Global"
  );
  const globalAnimationProgress = useRef(new Animated.Value(0)).current;
  const focusedAnimationProgress = useRef(new Animated.Value(0)).current;

  handleFilterSwap(
    filterSelected,
    focusedAnimationProgress,
    globalAnimationProgress
  );

  return (
    // TODO: add gesture recognizer?
    <View style={styles.modalParent}>
      <InnerModalTopHalf
        currTitle={currTitle}
        focusedAnimationProgress={focusedAnimationProgress}
        globalAnimationProgress={globalAnimationProgress}
        isAdmin={isAdmin}
        value={currVal}
        setFilterSelected={setFilterSelected}
        setModalVisible={setModalVisible}
      />
      <GlobalEngagementTabs
        isAdmin={isAdmin}
        setCurrTitle={setCurrTitle}
        setCurrVal={setCurrVal}
      />
    </View>
  );
};

const QuestionPreview = ({
  previewQuestion,
  isAdmin,
  navigation,
}: QuestionPreviewProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { questionType, answers } = previewQuestion;
  let graph: JSX.Element;
  switch (questionType) {
    case "Multiple Choice":
      graph = <MultipleChoiceBarChart answers={answers} isAdmin={isAdmin} />;
      break;
    default:
      graph = <View />;
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.centerView, styles.touchableWrapper]}
        onPress={() => {
          setModalVisible(true);
        }}
      >
        {graph}
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="fade">
        <AdminPollModal isAdmin={isAdmin} setModalVisible={setModalVisible} />
      </Modal>
    </>
  );
};

const PollPreview = ({
  isAdmin,
  isLast,
  pollData,
  navigation,
}: PollPreviewProps) => {
  const [questions, setQuestions] = useState<Question[]>(undefined);
  const [previewQuestion, setPreviewQuestion] = useState<Question>(undefined);
  const loading = questions === undefined || previewQuestion === undefined;

  useEffect(() => {
    getPublishedQuestions(pollData.id).then((result) => {
      result.sort((a, b) => a.questionText.localeCompare(b.questionText));
      for (const item of result) {
        // find the first question that can be used as a preview.
        // more often than not, this will probably just be the first
        // question
        if (item.questionType !== "Free Response") {
          setPreviewQuestion(item);
          break;
        }
      }
      setQuestions(result);
    });
  }, []);

  return (
    <>
      <View
        style={[
          styles.mainPollPreviewContainer,
          styles.centerView,
          {
            backgroundColor: isAdmin ? "#853b30" : "#afc9f9",
          },
        ]}
      >
        {loading && (
          <View
            style={{
              width: "100%",
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LoadingScreen color={isAdmin ? "#853b30" : "#afc9f9"} />
          </View>
        )}
        {!loading && (
          <>
            <Text style={styles.pollPreviewTitle}>
              {previewQuestion.questionText}
            </Text>
            <QuestionPreview
              previewQuestion={previewQuestion}
              isAdmin={isAdmin}
              navigation={navigation}
            />
            <PollPreviewBottomBar isAdmin={isAdmin} />
          </>
        )}
      </View>
      {!isLast && (
        <>
          <Spacer width="100%" height={25} />
          <View style={styles.separatorBar} />
          <Spacer width="100%" height={25} />
        </>
      )}
      {isLast && <Spacer width={"100%"} height={50} />}
    </>
  );
};

const NoPolls = ({ isAdmin }: NoPollsProps) => {
  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        padding: 50,
      }}
    >
      <Text
        style={{
          color: isAdmin ? "#853b30" : "#afc9f9",
          fontFamily: "Lato_400Regular",
          fontSize: 40,
          textAlign: "center",
        }}
      >
        {"No polls yet! :("}
      </Text>
    </View>
  );
};

export default function HomeFeed({ route, navigation }) {
  const { userData } = route.params;
  const isAdmin = userData.admin;

  return (
    <SafeAreaView style={[styles.mainContainer]}>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFF",
  },
  centerView: {
    display: "flex",
    alignItems: "center",
  },
  scrollView: {
    width: "100%",
    flex: 1,
    marginTop: 20,
  },
  topLogoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 5,
    position: "absolute",
    zIndex: 1,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderColor: "#853b30",
    backgroundColor: "#ffeae9",
  },
  mainPollPreviewContainer: {
    width: SCREEN_WIDTH * 0.9,
    borderRadius: 2.5,
  },
  pollPreviewTitle: {
    fontSize: 30,
    color: "#FFF",
    alignSelf: "center",
    fontFamily: "Lato_400Regular",
    margin: 10,
    marginBottom: 0,
  },
  pollPreviewBottomBarParent: {
    width: "100%",
    height: 60,
    position: "absolute",
    bottom: 0,
    backgroundColor: "#FFF",
    borderWidth: 2.5,
    borderRadius: 2.5,
    flexDirection: "row",
    alignItems: "center",
  },
  countdown: {
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
    marginLeft: 10,
  },
  likeAndSaveContainer: {
    flex: 1,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  separatorBar: {
    width: SCREEN_WIDTH * 0.9,
    height: 1,
    backgroundColor: "#eeeeee",
  },
  touchableWrapper: {
    width: "100%",
    flex: 1,
    marginBottom: 60,
    padding: 20,
  },
  innerModalTopHalf: {
    height: 300,
    width: "100%",
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    padding: 20,
  },
  topHalfTitle: {
    fontFamily: "Lato_400Regular",
    color: "#FFF",
    fontSize: 25,
  },
  switcherText: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 20,
  },
  animatedUnderline: {
    width: "100%",
    height: 1,
    backgroundColor: "#FFF",
  },
  innerModalBottomButton: {
    width: 90,
    height: 50,
    borderWidth: 1.25,
    borderRadius: 5,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  modalButtonText: {
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
    textAlign: "center",
  },
  engagementShowcase: {
    width: "100%",
    flex: 1,
  },
  engagementNumber: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 100,
    bottom: 10,
  },
  engagementNumberLabel: {
    color: "#FFF",
    fontSize: 25,
    fontFamily: "Lato_400Regular",
    alignSelf: "center",
  },
  engagementTabContainer: {
    width: "90%",
    borderWidth: 2.5,
    alignSelf: "center",
    borderRadius: 10,
    padding: 20,
    backgroundColor: "#FFF",
    flexDirection: "row",
    height: 125,
  },
  engagementTabIconContainer: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalParent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e5e5",
  },
});
