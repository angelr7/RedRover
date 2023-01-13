import moment from "moment-timezone";
import * as Haptics from "expo-haptics";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import Slider from "@react-native-community/slider";
import LoadingScreen from "../components/LoadingScreen";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import React, { useEffect, useState, useRef } from "react";
import { BarChart } from "react-native-chart-kit";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  PublishedPollWithID,
  ExtendedQuestion,
  getPublishedPollsForNonAdmin,
  submitPollResponse,
  handleLike,
  handleDislike,
} from "../firebase";
import {
  StyleSheet,
  Text,
  View,
  Animated,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Keyboard,
} from "react-native";
import IntakeSurvey from "../components/IntakeSurvey";

interface TopLogoBarProps {
  setPublishedPolls: React.Dispatch<
    React.SetStateAction<PublishedPollWithID[]>
  >;
  refreshing: boolean;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Vote {
  answer: string;
  userID: string;
}

type TimeUnit =
  | "years"
  | "year"
  | "months"
  | "month"
  | "weeks"
  | "week"
  | "days"
  | "day"
  | "hours"
  | "hour"
  | "minutes"
  | "minute"
  | "seconds"
  | "second";

const getLargestUnit = (
  years: number,
  months: number,
  weeks: number,
  days: number,
  hours: number,
  minutes: number,
  seconds: number
): TimeUnit => {
  if (years > 1) return "years";
  else if (years == 1) return "year";
  else if (months > 1) return "months";
  else if (months == 1) return "month";
  else if (weeks > 1) return "weeks";
  else if (weeks == 1) return "week";
  else if (days > 1) return "days";
  else if (days == 1) return "day";
  else if (hours > 1) return "hours";
  else if (hours == 1) return "hour";
  else if (minutes > 1) return "minutes";
  else if (minutes == 1) return "minute";
  else if (seconds > 1) return "seconds";
  else if (seconds == 1) return "second";
  else return "seconds";
};

const hasUserVoted = (votes: Vote[], userID: string) => {
  for (const vote of votes) if (vote.userID === userID) return true;
  return false;
};

const getClosingTime = (endTime: string) => {
  const diff = moment.duration(moment(parseInt(endTime)).diff(moment()));
  const years = diff.asYears();
  const months = diff.asMonths();
  const weeks = diff.asWeeks();
  const days = diff.asDays();
  const hours = diff.asHours();
  const minutes = diff.asMinutes();
  const seconds = diff.asSeconds();
  const unitMap = { years, months, weeks, days, hours, minutes, seconds };

  const largestUnit = getLargestUnit(
    years,
    months,
    weeks,
    days,
    hours,
    minutes,
    seconds
  );

  if (largestUnit === "hours") {
    let flooredHours = Math.floor(hours);
    const leftOverMinutes = minutes - 60 * flooredHours;
    let flooredMins = Math.floor(leftOverMinutes) + 1;

    if (flooredMins == 60) {
      flooredHours++;
      flooredMins = 0;
    }

    const minuteUnit = flooredMins == 1 ? "minute" : "minutes";
    return leftOverMinutes == 0 || flooredMins === 0
      ? `${flooredHours} hours`
      : `${flooredHours} hours and ${flooredMins} ${minuteUnit}`;
  } else if (largestUnit === "minutes") {
    let flooredMinutes = Math.floor(minutes);
    const leftOverSeconds = seconds - 60 * flooredMinutes;
    let flooredSeconds = Math.floor(leftOverSeconds) + 1;

    if (flooredSeconds == 60) {
      flooredMinutes++;
      flooredSeconds = 0;
    }

    const secondUnit = flooredSeconds == 1 ? "second" : "seconds";
    return leftOverSeconds == 0 || flooredSeconds === 0
      ? `${flooredMinutes} minutes`
      : `${flooredMinutes} minutes and ${flooredSeconds} ${secondUnit}`;
  }

  if (largestUnit.slice(-1) !== "s") return `1 ${largestUnit}`;
  // Math.round(number * 10) / 10 rounds the number to one decimal place
  else return `${Math.round(unitMap[largestUnit] * 10) / 10} ${largestUnit}`;
};

const BarChartBar = ({
  percentage,
  setBarAnimationDone,
}: {
  percentage: number;
  setBarAnimationDone: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const barHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barHeight, {
      delay: 500,
      toValue: percentage,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setBarAnimationDone(true));
  }, []);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: barHeight.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        backgroundColor: "#FFF",
        bottom: 0,
      }}
    />
  );
};

const MCBarChartBar = ({
  percentage,
  answer,
}: {
  percentage: number;
  answer: string;
}) => {
  const [barAnimationDone, setBarAnimationDone] = useState(false);
  const percentageOpacity = useRef(new Animated.Value(0)).current;

  if (isNaN(percentage)) percentage = 0;

  useEffect(() => {
    if (barAnimationDone)
      Animated.timing(percentageOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
  }, [barAnimationDone]);

  return (
    <View style={{ width: "22.5%", height: "100%", left: "7.5%" }}>
      <Spacer width="100%" height={2.5} />
      <View style={{ width: "100%", flex: 1 }}>
        <View
          style={{
            height: "100%",
            width: "100%",
            flexDirection: "row",
            alignItems: "flex-end",
          }}
        >
          <BarChartBar
            percentage={percentage}
            setBarAnimationDone={setBarAnimationDone}
          />
        </View>
      </View>
      <Spacer width="100%" height={2.5} />
      <Text
        ellipsizeMode="tail"
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 12.5,
          color: "#FFF",
          alignSelf: "center",
        }}
      >
        {answer}
      </Text>

      <Animated.Text
        style={{
          position: "absolute",
          fontFamily: "Lato_400Regular",
          fontSize: 12.5,
          color: "#FFF",
          top: "50%",
          left: -25,
          transform: [{ rotate: "-90deg" }],
          opacity: percentageOpacity,
        }}
      >{`${percentage * 100}%`}</Animated.Text>
    </View>
  );
};

const MCBarChart = ({ question }: { question: ExtendedQuestion }) => {
  let { answers } = question;
  if (answers.length > 3) answers = answers.slice(0, 3);

  const answerCounts = answers.map(() => 0);
  let totalVotes = 0;
  for (const vote of question.votes) {
    const answerIndex = answers.indexOf(vote.answer);
    if (answerIndex !== -1) answerCounts[answerIndex]++;
    totalVotes++;
  }

  // get a decimal rounded to three decimal places
  const answerPercentages = answerCounts.map(
    (count) => Math.round((count / totalVotes) * 1000) / 1000
  );

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        padding: 5,
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "flex-end",
      }}
    >
      {answers.map((answer, index) => (
        <MCBarChartBar
          key={index}
          percentage={answerPercentages[index]}
          answer={answer}
        />
      ))}
    </View>
  );
};

const RankingItemPreview = ({ question }: { question: ExtendedQuestion }) => {
  let itemCounts = question.answers.map((_item, index) => {
    return { count: 0, index };
  });
  for (const vote of question.votes) {
    const topItem = vote.answer.split(";")[0];
    const index = question.answers.indexOf(topItem);
    itemCounts[index].count++;
  }

  itemCounts.sort((a, b) => b.count - a.count);
  if (itemCounts.length > 3) itemCounts = itemCounts.slice(0, 3);

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <Text
        style={{
          alignSelf: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 12.5,
          color: "#FFF",
        }}
      >
        Top 3 Answers
      </Text>
      <Spacer width="100%" height={10} />
      <View
        style={{
          width: "100%",
          flex: 1,
          alignItems: "center",
          justifyContent: "space-evenly",
        }}
      >
        {itemCounts.map((item, index) => {
          let rawPercentage = item.count / question.votes.length;
          if (isNaN(rawPercentage)) rawPercentage = 0;
          const roundedPercentage = Math.round(rawPercentage * 1000) * 1000;
          return (
            <Text>
              <Text
                key={index}
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 15,
                  color: "#FFF",
                }}
              >
                {question.answers[item.index]}
                {"    -  "}
                {roundedPercentage}
                {"%"}
              </Text>
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const SliderAveragePreview = ({ question }: { question: ExtendedQuestion }) => {
  const [currVal, setCurrVal] = useState(0);

  let average = 0;
  for (const vote of question.votes)
    average += parseInt(
      vote.answer[0] === "$" ? vote.answer.slice(1) : vote.answer
    );
  average /= question.votes.length;

  useEffect(() => {
    let curr = 0;
    const id = setInterval(() => {
      if (curr === average) {
        clearInterval(id);
        return;
      }
      setCurrVal(curr + 1);
      curr++;
    }, 5);
  }, []);

  return (
    <View
      style={{
        width: "100%",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontFamily: "Lato_700Bold", fontSize: 25, color: "#FFF" }}>
        Average: {currVal}
      </Text>
    </View>
  );
};

const FreeResponseRandomPreview = ({
  question,
}: {
  question: ExtendedQuestion;
}) => {
  const getRandomIndex = (max: number, min: number) =>
    Math.floor(Math.random() * (max - min + 1) + min);

  const [randomIndex, setRandomIndex] = useState(
    getRandomIndex(0, question.votes.length - 1)
  );
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setRandomIndex(getRandomIndex(0, question.votes.length - 1));
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
  }, []);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  if (question.votes.length < 5)
    return (
      <View
        style={{
          width: "100%",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#853b30",
            fontSize: 20,
            textAlign: "center",
          }}
        >
          We need some more data before we can give you a preview :/{"\n"}Feel
          free to check back later!
        </Text>
      </View>
    );
  else
    return (
      <View
        style={{
          width: "100%",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#853b30",
            fontSize: 22.5,
            textAlign: "center",
            opacity,
          }}
        >
          {question.votes[randomIndex].answer}
        </Animated.Text>
      </View>
    );
};

const getPreviewPages = (
  questions: ExtendedQuestion[],
  opacity: Animated.Value
): JSX.Element[] => {
  let i = 0;
  const previewQuestions: ExtendedQuestion[] = [];
  while (i < questions.length && previewQuestions.length <= 3) {
    if (questions[i].category !== "Free Response")
      previewQuestions.push(questions[i]);
    i++;
  }

  return previewQuestions.map((question) => {
    return (
      <Animated.View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          paddingLeft: 55,
          paddingRight: 55,
          zIndex: -1,
          opacity,
        }}
      >
        <Spacer width="100%" height={10} />
        <Text
          ellipsizeMode="tail"
          numberOfLines={2}
          style={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            fontSize: 25,
            textAlign: "center",
            maxHeight: 60,
          }}
        >
          {question.question}
        </Text>
        <View
          style={{
            padding: 5,
            width: "100%",
            flex: 1,
            ...(question.category === "Multiple Choice"
              ? { borderWidth: 2, borderColor: "#FFF", borderRadius: 5 }
              : {}),
          }}
        >
          {question.votes.length === 0 ? (
            <View
              style={{
                width: "100%",
                height: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Animated.Text
                style={{
                  fontFamily: "Lato_700Bold",
                  fontSize: 25,
                  color: "#FFF",
                  textAlign: "center",
                }}
              >
                Be the first to vote!
              </Animated.Text>
            </View>
          ) : (
            (() => {
              switch (question.category) {
                case "Multiple Choice":
                  return <MCBarChart question={question} />;
                case "Ranking":
                  return <RankingItemPreview question={question} />;
                case "Range (Slider)":
                  return <SliderAveragePreview question={question} />;
                case "Free Response":
                  return <FreeResponseRandomPreview question={question} />;
                default:
                  return <View />;
              }
            })()
          )}
        </View>
        <Spacer width="100%" height={10} />
      </Animated.View>
    );
  });
};

const getScreenViews = (
  poll: PublishedPollWithID,
  opacity: Animated.Value,
  openPoll: () => void
) => {
  const additionalInfo: JSX.Element[] = [];
  if (poll.pollData.additionalInfo.trim() !== "")
    additionalInfo.push(
      <Animated.View
        style={{
          position: "absolute",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          paddingLeft: 65,
          paddingRight: 65,
          zIndex: -1,
          opacity,
        }}
      >
        <Spacer width="100%" height={20} />
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#FFF",
            fontSize: 25,
            textAlign: "center",
          }}
        >
          Additional Information
        </Text>
        <Spacer width="100%" height={20} />
        <ScrollView
          contentContainerStyle={{
            justifyContent: "center",
            alignItems: "center",
          }}
          style={{
            flex: 1,
            width: "100%",
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 15,
              color: "#FFF",
              textAlign: "center",
            }}
          >
            {poll.pollData.additionalInfo}
          </Text>
        </ScrollView>
        <Spacer width="100%" height={20} />
      </Animated.View>
    );

  return [
    <Animated.View
      style={{
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        paddingLeft: 75,
        paddingRight: 75,
        zIndex: -1,
        opacity,
      }}
    >
      <Text
        style={{
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          color: "#FFF",
          fontSize: 25,
        }}
      >
        {poll.pollData.title}
      </Text>
    </Animated.View>,
    <Animated.View
      style={{
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        paddingLeft: 65,
        paddingRight: 65,
        zIndex: -1,
        opacity,
      }}
    >
      <Spacer width="100%" height={20} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          color: "#FFF",
          fontSize: 25,
          textAlign: "center",
        }}
      >
        Poll Description
      </Text>
      <Spacer width="100%" height={20} />
      <ScrollView
        contentContainerStyle={{
          justifyContent: "center",
          alignItems: "center",
        }}
        style={{
          flex: 1,
          width: "100%",
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 15,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          {poll.pollData.description}
        </Text>
      </ScrollView>
      <Spacer width="100%" height={20} />
    </Animated.View>,

    // dont have the additional information tab if it's unnecessary
    ...additionalInfo,

    // gives a max of three preview pages for now. can be changed
    ...getPreviewPages(poll.questions, opacity),

    <Animated.View
      style={{
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        paddingLeft: 65,
        paddingRight: 65,
        zIndex: -1,
        opacity,
      }}
    >
      <TouchableOpacity
        onPress={() => openPoll()}
        style={{ backgroundColor: "#FFF", padding: 15, borderRadius: 5 }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#507DBC",
            fontSize: 20,
          }}
        >
          Vote Now!
        </Text>
      </TouchableOpacity>
    </Animated.View>,
  ];
};

const TopLogoBar = ({
  setPublishedPolls,
  refreshing,
  setRefreshing,
}: TopLogoBarProps) => {
  const [loading, setLoading] = useState(true);
  const [currAnimationVal, setCurrAnimationVal] = useState(0);
  const spinslideRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (loading) {
      getPublishedPollsForNonAdmin().then((published) => {
        setPublishedPolls(published);
        setLoading(false);
        setRefreshing(false);
      });
    }
  }, [loading]);

  useEffect(() => {
    if (loading) {
      Animated.timing(spinslideRef, {
        toValue: currAnimationVal,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        if (loading) setCurrAnimationVal(currAnimationVal + 1);
      });
    }
  }, [currAnimationVal, loading]);

  useEffect(() => {
    if (refreshing) setLoading(true);
  }, [refreshing]);

  return (
    <View style={styles.topLogoContainer}>
      <AnimatedTouchable
        disabled={loading}
        onPress={() => setLoading(!loading)}
        style={{
          flexDirection: "row",
          transform: [
            {
              rotateY: spinslideRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["0deg", "360deg"],
              }),
            },
          ],
        }}
      >
        <Animated.Text
          style={{
            color: "#507DBC",
            fontFamily: "Lato_400Regular",
            fontSize: 45,
            transform: [{ scaleX: -1 }],
          }}
        >
          R
        </Animated.Text>
        <Animated.Text
          style={{
            color: "#507DBC",
            fontFamily: "Lato_400Regular",
            fontSize: 45,
          }}
        >
          R
        </Animated.Text>
      </AnimatedTouchable>
    </View>
  );
};

const EngagementBar = ({
  visible,
  opacity,
  userID,
  pollData,
  reset,
  setReset,
}: {
  visible: boolean;
  opacity: Animated.Value;
  userID: string;
  pollData: PublishedPollWithID;
  reset: number;
  setReset: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [numLikes, setNumLikes] = useState((() => pollData.likes.length)());
  const [liked, setLiked] = useState(
    (() => {
      for (const like of pollData.likes) {
        if (like.userID === userID) return true;
      }
      return false;
    })()
  );

  return (
    <Animated.View
      style={{
        top: -55,
        right: 0,
        height: 50,
        paddingLeft: 5,
        borderRadius: 5,
        flexDirection: "row",
        alignItems: "center",
        position: "absolute",
        justifyContent: "space-between",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        opacity: visible ? opacity : 0,
        width: visible
          ? opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 90] })
          : 90,
      }}
    >
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 25,
          color: "#507DBC",
        }}
      >
        {numLikes}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setReset(reset + 1);
          if (!liked) {
            handleLike(userID, pollData.id).catch(() => setLiked(false));
            setNumLikes(numLikes + 1);
          } else {
            handleDislike(userID, pollData.id)
              .then((value) => {
                if (value === -1) setLiked(true);
              })
              .catch(() => setLiked(true));
            setNumLikes(numLikes - 1);
          }

          setLiked(!liked);
        }}
        style={{ padding: 5 }}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          style={{ color: "#507DBC", fontSize: 35 }}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const UserSliderAnswer = ({
  question,
  answers,
  index,
  setAnswers,
  questionGrow,
  answersFade,
  setCurrQuestion,
  updateTriggered,
  triggerUpdate,
}: {
  question: ExtendedQuestion;
  answers: string[];
  index: number;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  questionGrow: Animated.Value;
  answersFade: Animated.Value;
  setCurrQuestion: React.Dispatch<React.SetStateAction<number>>;
  updateTriggered: number;
  triggerUpdate: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { minRange, maxRange, dollarSign } = question;
  const [sliderVal, setSliderVal] = useState(minRange);
  useEffect(() => {
    if (updateTriggered !== 0 && updateTriggered !== undefined) {
      triggerUpdate(undefined);
      answers[index] = `${dollarSign ? "$" : ""}${sliderVal}`;
      setAnswers(answers);
      Animated.parallel([
        Animated.timing(questionGrow, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(answersFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrQuestion(index + updateTriggered);
        triggerUpdate(0);
      });
    }
  }, [updateTriggered]);

  return (
    <Animated.View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        opacity: answersFade,
      }}
    >
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          color: "#FFF",
          fontSize: 30,
        }}
      >
        {`${dollarSign ? "$" : ""}${sliderVal}`}
      </Text>
      <Spacer width="100%" height={40} />
      <Slider
        step={1}
        value={sliderVal}
        minimumValue={minRange}
        maximumValue={maxRange}
        minimumTrackTintColor={"#FFF"}
        maximumTrackTintColor={"#FFF"}
        thumbTintColor={"#FFF"}
        style={{ width: "100%" }}
        onValueChange={(value) => {
          setSliderVal(value);
        }}
      />
    </Animated.View>
  );
};

const MCIndividualAnswer = ({
  answer,
  index,
  last,
  selected,
  selectedAnswer,
  setSelectedAnswer,
}: {
  answer: string;
  index: number;
  last: boolean;
  selected: boolean;
  selectedAnswer: number;
  setSelectedAnswer: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const borderAnimation = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.timing(borderAnimation, {
      toValue: selected ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  return (
    <>
      <AnimatedTouchable
        onPress={() => {
          setSelectedAnswer(selectedAnswer === index ? -1 : index);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          padding: 20,
          justifyContent: "space-between",
          borderRadius: 5,
          borderWidth: borderAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2.5],
          }),
          borderColor: "#FFF",
        }}
      >
        <Animated.View
          style={{
            width: 25,
            height: 25,
            borderRadius: 25,
            borderWidth: 1.5,
            borderColor: "#FFF",
            backgroundColor: borderAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"],
            }),
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#FFF",
              fontSize: 20,
            }}
          >
            {answer}
          </Text>
        </View>
      </AnimatedTouchable>
      {!last && (
        <>
          <Spacer width="100%" height={10} />
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "#FFF",
              borderRadius: 1,
            }}
          />
          <Spacer width="100%" height={10} />
        </>
      )}
    </>
  );
};

const UserMultipleChoiceAnswers = ({
  question,
  answers,
  index,
  setAnswers,
  questionGrow,
  answersFade,
  setCurrQuestion,
  updateTriggered,
  triggerUpdate,
  setPreventNext,
}: {
  question: ExtendedQuestion;
  answers: string[];
  index: number;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  questionGrow: Animated.Value;
  answersFade: Animated.Value;
  setCurrQuestion: React.Dispatch<React.SetStateAction<number>>;
  updateTriggered: number;
  triggerUpdate: React.Dispatch<React.SetStateAction<number>>;
  setPreventNext: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(-1);

  useEffect(() => {
    if (updateTriggered !== 0 && updateTriggered !== undefined) {
      triggerUpdate(undefined);
      answers[index] = question.answers[selectedAnswer];
      setAnswers(answers);
      Animated.parallel([
        Animated.timing(questionGrow, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(answersFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrQuestion(index + updateTriggered);
        triggerUpdate(0);
      });
    }
  }, [updateTriggered]);

  useEffect(() => {
    setPreventNext(selectedAnswer === -1);
  }, [selectedAnswer]);

  return (
    <Animated.View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        opacity: answersFade,
        paddingTop: 40,
      }}
    >
      <ScrollView
        style={{ width: "100%", height: "75%" }}
        showsVerticalScrollIndicator={false}
      >
        {question.answers.map((answer, index) => (
          <MCIndividualAnswer
            key={index}
            answer={answer}
            last={index === question.answers.length - 1}
            selected={selectedAnswer === index}
            index={index}
            selectedAnswer={selectedAnswer}
            setSelectedAnswer={setSelectedAnswer}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const RankingIndiviualAnswer = ({
  answer,
  last,
  answers,
  setAnswers,
}: {
  answer: string;
  last: boolean;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const index = answers.indexOf(answer);
  return (
    <>
      <AnimatedTouchable
        onPress={() => {
          if (index === -1) {
            setAnswers(answers.concat(answer));
          } else {
            if (answers.length === 1) setAnswers([]);
            else {
              const answersCopy = [...answers];
              answersCopy.splice(index, 1);
              setAnswers(answersCopy);
            }
          }
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          padding: 20,
          justifyContent: "space-between",
          borderRadius: 5,
          borderColor: "#FFF",
        }}
      >
        <Animated.View
          style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: "#FFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: "Lato_400Regular", color: "#FFF" }}>
            {index === -1 ? "" : index + 1}
          </Text>
        </Animated.View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#FFF",
              fontSize: 20,
            }}
          >
            {answer}
          </Text>
        </View>
      </AnimatedTouchable>
      {!last && (
        <>
          <Spacer width="100%" height={10} />
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "#FFF",
              borderRadius: 1,
            }}
          />
          <Spacer width="100%" height={10} />
        </>
      )}
    </>
  );
};

const UserRankingAnswers = ({
  question,
  answers,
  index,
  questionGrow,
  answersFade,
  setCurrQuestion,
  updateTriggered,
  triggerUpdate,
  setPreventNext,
  setAnswers,
}: {
  question: ExtendedQuestion;
  answers: string[];
  index: number;
  questionGrow: Animated.Value;
  answersFade: Animated.Value;
  setCurrQuestion: React.Dispatch<React.SetStateAction<number>>;
  updateTriggered: number;
  triggerUpdate: React.Dispatch<React.SetStateAction<number>>;
  setPreventNext: React.Dispatch<React.SetStateAction<boolean>>;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [ranked, setRanked] = useState<string[]>([]);

  useEffect(() => {
    setPreventNext(ranked.length !== question.answers.length);
  }, [ranked]);

  useEffect(() => {
    if (updateTriggered !== 0 && updateTriggered !== undefined) {
      triggerUpdate(undefined);
      let answer = "";
      for (const item of ranked) answer += `${item};`;

      answers[index] = answer;
      setAnswers(answers);
      Animated.parallel([
        Animated.timing(questionGrow, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(answersFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrQuestion(index + updateTriggered);
        triggerUpdate(0);
      });
    }
  }, [updateTriggered]);

  return (
    <Animated.View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        opacity: answersFade,
        paddingTop: 40,
      }}
    >
      <ScrollView
        style={{ width: "100%", height: "75%" }}
        showsVerticalScrollIndicator={false}
      >
        {question.answers.map((answer, index) => (
          <RankingIndiviualAnswer
            key={index}
            answer={answer}
            answers={ranked}
            setAnswers={setRanked}
            last={index === question.answers.length - 1}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const UserFreeResponseAnswer = ({
  answersFade,
  question,
  index,
  answers,
  questionGrow,
  setCurrQuestion,
  updateTriggered,
  triggerUpdate,
  setPreventNext,
  setAnswers,
}: {
  question: ExtendedQuestion;
  index: number;
  questionGrow: Animated.Value;
  answersFade: Animated.Value;
  setCurrQuestion: React.Dispatch<React.SetStateAction<number>>;
  updateTriggered: number;
  answers: string[];
  triggerUpdate: React.Dispatch<React.SetStateAction<number>>;
  setPreventNext: React.Dispatch<React.SetStateAction<boolean>>;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [inputVal, setInputVal] = useState("");
  const { wordCount, letterCount, multiline } = question;
  const wordCountDisplayed = inputVal
    .split(/\s+/)
    .filter((item) => item !== "").length;

  const wordColor = useRef(new Animated.Value(0)).current;
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let preventNext = inputVal === "";
    if (wordCount !== 0) {
      // if the input value isn't "", prevent next if word count is
      // over limit
      if (!preventNext) preventNext = wordCountDisplayed > wordCount;
      Animated.timing(wordColor, {
        toValue: wordCountDisplayed > wordCount ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
    setPreventNext(preventNext);
  }, [inputVal]);

  useEffect(() => {
    if (updateTriggered !== 0 && updateTriggered !== undefined) {
      triggerUpdate(undefined);
      answers[index] = inputVal;
      setAnswers(answers);
      Animated.parallel([
        Animated.timing(questionGrow, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(answersFade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrQuestion(index + updateTriggered);
        triggerUpdate(0);
      });
    }
  }, [updateTriggered]);

  useEffect(() => {
    setInputVal(answers[index]);
  }, [question]);

  return (
    <Animated.View
      style={{
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        height: "75%",
        opacity: answersFade,
        transform: [
          {
            translateY: keyboardDodgeRef.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -SCREEN_HEIGHT / 10],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Animated.Text
          style={{
            fontFamily: "Lato_400Regular_Italic",
            fontSize: 12.5,
            opacity: wordCount === 0 ? 0 : 1,
            color: wordColor.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#F00"],
            }),
          }}
        >
          Word Count:{"  "}
          {wordCountDisplayed}
        </Animated.Text>
        <Text
          style={{
            fontFamily: "Lato_400Regular_Italic",
            color: "#FFF",
            fontSize: 12.5,
            opacity: letterCount === 0 ? 0 : 1,
          }}
        >
          Letter Count:{"  "}
          {inputVal.length}
        </Text>
      </View>
      <Spacer width="100%" height={5} />
      <TextInput
        {...(letterCount === 0 ? {} : { maxLength: letterCount })}
        multiline={multiline}
        selectionColor="#507DBC"
        value={inputVal}
        onChangeText={(text) => setInputVal(text)}
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
          fontSize: 25,
          fontFamily: "Lato_400Regular",
          color: "#507DBC",
          backgroundColor: "#FFF",
          width: "100%",
          padding: 15,
          borderRadius: 5,
          paddingTop: 15,
          maxHeight: 225,
        }}
      />
    </Animated.View>
  );
};

const QuestionScreen = ({
  question,
  answersFade,
  questionGrow,
  setCurrQuestion,
  last,
  index,
  answers,
  setAnswers,
}: {
  answersFade: Animated.Value;
  questionGrow: Animated.Value;
  question: ExtendedQuestion;
  setCurrQuestion: React.Dispatch<React.SetStateAction<number>>;
  last: boolean;
  index: number;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [updateTriggered, triggerUpdate] = useState(0);
  const [preventNext, setPreventNext] = useState(
    question.category !== "Range (Slider)"
  );

  const { category } = question;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    // making this top element a pressable allows the user to easily
    // dismiss the keyboard when typing free response answers
    <Pressable
      onPress={() => Keyboard.dismiss()}
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "space-evenly",
      }}
    >
      <Animated.Text
        style={{
          color: "#FFF",
          fontFamily: "Lato_400Regular",
          alignSelf: "center",
          textAlign: "center",
          fontSize: 30,
          transform: [{ scale: questionGrow }],
        }}
      >
        {question.question}
      </Animated.Text>
      {(() => {
        switch (category) {
          case "Range (Slider)":
            return (
              <UserSliderAnswer
                {...{
                  answers,
                  answersFade,
                  index,
                  question,
                  questionGrow,
                  setAnswers,
                  setCurrQuestion,
                  triggerUpdate,
                  updateTriggered,
                }}
              />
            );
          case "Multiple Choice":
            return (
              <UserMultipleChoiceAnswers
                {...{
                  answers,
                  answersFade,
                  index,
                  question,
                  questionGrow,
                  setAnswers,
                  setCurrQuestion,
                  triggerUpdate,
                  updateTriggered,
                  setPreventNext,
                }}
              />
            );
          case "Ranking":
            return (
              <UserRankingAnswers
                {...{
                  answersFade,
                  index,
                  question,
                  questionGrow,
                  answers,
                  setAnswers,
                  setCurrQuestion,
                  triggerUpdate,
                  updateTriggered,
                  setPreventNext,
                }}
              />
            );
          case "Free Response":
            return (
              <UserFreeResponseAnswer
                {...{
                  answersFade,
                  index,
                  question,
                  questionGrow,
                  answers,
                  setAnswers,
                  setCurrQuestion,
                  triggerUpdate,
                  updateTriggered,
                  setPreventNext,
                }}
              />
            );
          default:
            return <View />;
        }
      })()}
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-evenly",
        }}
      >
        {index !== 0 && (
          <AnimatedTouchable
            disabled={updateTriggered !== 0}
            onPress={() => {
              triggerUpdate(-1);
            }}
            style={{
              padding: 15,
              backgroundColor: "#FFF",
              borderRadius: 5,
              opacity: answersFade,
            }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#507DBC",
              }}
            >
              Back
            </Text>
          </AnimatedTouchable>
        )}
        {!last && !preventNext && (
          <AnimatedTouchable
            disabled={updateTriggered !== 0}
            onPress={() => {
              triggerUpdate(1);
            }}
            style={{
              padding: 15,
              backgroundColor: "#FFF",
              borderRadius: 5,
              opacity: answersFade,
            }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#507DBC",
              }}
            >
              Next
            </Text>
          </AnimatedTouchable>
        )}
        {last && !preventNext && (
          <AnimatedTouchable
            disabled={updateTriggered !== 0}
            onPress={() => {
              triggerUpdate(1);
            }}
            style={{
              padding: 15,
              backgroundColor: "#FFF",
              borderRadius: 5,
              opacity: answersFade,
            }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#507DBC",
              }}
            >
              Submit
            </Text>
          </AnimatedTouchable>
        )}
      </View>
      <Spacer width="100%" height={20} />
    </Pressable>
  );
};

const UserAnswerPreview = ({
  question,
  index,
  userAnswers,
  focus,
}: {
  question: ExtendedQuestion;
  index: number;
  userAnswers: string[];
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
}) => {
  let currAnswer = userAnswers[index];
  if (question.category === "Ranking") {
    const ranked = currAnswer.split(";");
    let newAns = "";

    // -1 b/c there will always be an extra empty string at the end
    for (let i = 0; i < ranked.length - 1; i++)
      newAns += `${i + 1}.) ${ranked[i]}${
        i !== ranked.length - 1 ? "    " : ""
      }`;
    currAnswer = newAns;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() =>
          focus({
            question: question,
            userAnswer: userAnswers[index],
            questionIndex: index,
          })
        }
        style={{
          width: "100%",
          padding: 20,
          borderRadius: 5,
          borderWidth: 2.5,
          borderColor: "#FFF",
        }}
      >
        <Text
          style={{ fontFamily: "Lato_700Bold", color: "#FFF", fontSize: 15 }}
        >
          {question.question}
        </Text>
        <Spacer width="100%" height={10} />
        <Text
          style={{
            fontFamily: "Lato_400Regular_Italic",
            color: "#FFF",
            fontSize: 12.5,
          }}
        >
          {currAnswer}
        </Text>
      </TouchableOpacity>
      {index !== userAnswers.length - 1 && (
        <>
          <Spacer width="100%" height={20} />
          <View
            style={{
              width: "100%",
              height: 1,
              borderRadius: 1,
              backgroundColor: "#FFF",
            }}
          />
          <Spacer width="100%" height={20} />
        </>
      )}
    </>
  );
};

const MiniSlider = ({
  answerInfo,
  sliderVal,
  setSliderVal,
  answers,
  setAnswers,
  focus,
}: {
  answerInfo: UserAnswerInfo;
  sliderVal: number;
  setSliderVal: React.Dispatch<React.SetStateAction<number>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
}) => {
  const { minRange, maxRange } = answerInfo.question;
  return (
    <View
      style={{
        width: "100%",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#507DBC",
        }}
      >
        {sliderVal}
      </Text>
      <Spacer width="100%" height={20} />
      <Slider
        step={1}
        value={sliderVal}
        minimumValue={minRange}
        maximumValue={maxRange}
        minimumTrackTintColor="#507DBC"
        maximumTrackTintColor="#507DBC"
        thumbTintColor="#507DBC"
        style={{ width: "100%" }}
        onValueChange={(value) => {
          setSliderVal(value);
        }}
      />
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        onPress={() => {
          answers[answerInfo.questionIndex] = `${sliderVal}`;
          setAnswers(answers);
          focus(undefined);
        }}
        style={{ padding: 10, backgroundColor: "#507DBC", borderRadius: 5 }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#FFF",
            fontSize: 15,
          }}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const MiniMCAnswer = ({
  answerInfo,
  index,
  selectedAnswer,
  setSelectedAnswer,
}: {
  answerInfo: UserAnswerInfo;
  index: number;
  selectedAnswer: number;
  setSelectedAnswer: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const colorChangeRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const { answers } = answerInfo.question;
  const last = index === answers.length - 1;

  useEffect(() => {
    Animated.timing(colorChangeRef, {
      toValue: selectedAnswer === index ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [selectedAnswer]);

  return (
    <>
      <AnimatedTouchable
        onPress={() => setSelectedAnswer(selectedAnswer === index ? -1 : index)}
        style={{
          width: 250,
          padding: 12.5,
          borderRadius: 5,
          borderColor: "#507DBC",
          borderWidth: 2.5,
          alignItems: "center",
          backgroundColor: colorChangeRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["#FFF", "#507DBC"],
          }),
        }}
      >
        <Animated.Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 15,
            alignItems: "center",
            color: colorChangeRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#507DBC", "#FFF"],
            }),
          }}
        >
          {answers[index]}
        </Animated.Text>
      </AnimatedTouchable>
      {!last && (
        <>
          <Spacer width="100%" height={20} />
        </>
      )}
    </>
  );
};

const MiniMCAnswers = ({
  answerInfo,
  answers,
  setAnswers,
  focus,
}: {
  answerInfo: UserAnswerInfo;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(-1);
  const submitOpacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    const invalid =
      selectedAnswer === -1 ||
      selectedAnswer ===
        answerInfo.question.answers.indexOf(answerInfo.userAnswer);
    Animated.timing(submitOpacity, {
      toValue: invalid ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [selectedAnswer]);

  return (
    <>
      <View style={{ width: "100%", flex: 1 }}>
        <FlatList
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ alignItems: "center" }}
          style={{
            width: "100%",
          }}
          data={answerInfo.question.answers}
          renderItem={({ item, index }) => (
            <MiniMCAnswer
              index={index}
              answerInfo={answerInfo}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
            />
          )}
        />
      </View>
      <Spacer width="100%" height={20} />
      <AnimatedTouchable
        disabled={selectedAnswer === -1}
        onPress={() => {
          answers[answerInfo.questionIndex] =
            answerInfo.question.answers[selectedAnswer];
          setAnswers(answers);
          focus(undefined);
        }}
        style={{
          padding: 10,
          backgroundColor: "#507DBC",
          alignSelf: "center",
          borderRadius: 5,
          opacity: submitOpacity,
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 15,
            color: "#FFF",
          }}
        >
          Submit
        </Text>
      </AnimatedTouchable>
    </>
  );
};

const MiniRankItem = ({
  item,
  index,
  answerInfo,
  ranked,
  setRanked,
}: {
  item: string;
  index: number;
  answerInfo: UserAnswerInfo;
  ranked: string[];
  setRanked: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const last = index === answerInfo.question.answers.length - 1;
  let itemLocation = ranked.indexOf(item);

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (itemLocation === -1) setRanked(ranked.concat(item));
          else {
            const rankedCopy = [...ranked];
            rankedCopy.splice(itemLocation, 1);
            setRanked(rankedCopy);
          }
        }}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <View
          style={{
            borderRadius: 5,
            borderWidth: 1.5,
            borderColor: "#507DBC",
            width: 30,
            height: 30,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#507DBC",
              fontSize: 20,
              textAlign: "center",
            }}
          >
            {itemLocation === -1 ? "" : itemLocation + 1}
          </Text>
        </View>
        <Spacer height="100%" width={10} />
        <View
          style={{
            flex: 1,
            padding: 15,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#507DBC",
              fontFamily: "Lato_400Regular",
              fontSize: 20,
            }}
          >
            {item}
          </Text>
        </View>
      </TouchableOpacity>
      {!last && (
        <>
          <Spacer width="100%" height={10} />
          <View
            style={{ width: "100%", height: 1, backgroundColor: "#507DBC50" }}
          />
          <Spacer width="100%" height={10} />
        </>
      )}
    </>
  );
};

const MiniRanking = ({
  answerInfo,
  answers,
  setAnswers,
  focus,
}: {
  answerInfo: UserAnswerInfo;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
}) => {
  const [ranked, setRanked] = useState<string[]>([]);
  const submitButtonOpacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.timing(submitButtonOpacity, {
      toValue: ranked.length === answerInfo.question.answers.length ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [ranked]);

  return (
    <>
      <FlatList
        showsVerticalScrollIndicator={false}
        style={{ width: "100%", height: 300 }}
        data={answerInfo.question.answers}
        renderItem={({ item, index }) => (
          <MiniRankItem {...{ item, answerInfo, index, ranked, setRanked }} />
        )}
      />
      <Spacer width="100%" height={20} />
      <AnimatedTouchable
        onPress={() => {
          let newAnswer = "";
          for (const item of ranked) newAnswer += `${item};`;
          answers[answerInfo.questionIndex] = newAnswer;
          setAnswers(answers);
          focus(undefined);
        }}
        disabled={ranked.length !== answerInfo.question.answers.length}
        style={{
          padding: 10,
          alignSelf: "center",
          backgroundColor: "#507DBC",
          borderRadius: 5,
          justifyContent: "center",
          alignItems: "center",
          opacity: submitButtonOpacity,
        }}
      >
        <Text
          style={{ fontFamily: "Lato_400Regular", fontSize: 15, color: "#FFF" }}
        >
          Submit
        </Text>
      </AnimatedTouchable>
    </>
  );
};

const MiniFR = ({
  answerInfo,
  keyboardDodgeRef,
  answers,
  setAnswers,
  focus,
}: {
  answerInfo: UserAnswerInfo;
  keyboardDodgeRef: Animated.Value;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
}) => {
  const [valid, setValid] = useState(false);
  const [inputVal, setInputVal] = useState(
    answerInfo !== undefined ? answerInfo.userAnswer : ""
  );
  const buttonRef = useRef(new Animated.Value(0)).current;
  const letterColor = useRef(new Animated.Value(0)).current;
  const wordColor = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const { letterCount, wordCount } = answerInfo.question;
  const letterCountDisplayed: string =
    letterCount === 0 ? "Unlimited" : `${inputVal.length}`;
  const wordCountDisplayed: string =
    wordCount === 0
      ? "Unlimited"
      : `${inputVal.split(/\s+/).filter((item) => item !== "").length}`;

  useEffect(() => {
    Animated.timing(buttonRef, {
      toValue: valid ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [valid]);

  useEffect(() => {
    if (inputVal === "" || inputVal === answerInfo.userAnswer) setValid(false);
    else {
      let valid = true;
      if (letterCountDisplayed !== "Unlimited")
        valid = parseInt(letterCountDisplayed) <= letterCount;
      if (valid && wordCountDisplayed !== "Unlimited")
        // if it's not valid, this check doesn't matter.
        // anything after the top will be invalid
        valid = parseInt(wordCountDisplayed) <= wordCount;

      setValid(valid);
    }
  }, [inputVal]);

  useEffect(() => {
    const animations = [];
    if (letterCountDisplayed !== "Unlimited") {
      const parsed = parseInt(letterCountDisplayed);
      if (parsed > letterCount)
        animations.push(
          Animated.timing(letterColor, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          })
        );
      else
        animations.push(
          Animated.timing(letterColor, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          })
        );
    }

    if (wordCountDisplayed !== "Unlimited") {
      const parsed = parseInt(wordCountDisplayed);
      if (parsed > wordCount)
        animations.push(
          Animated.timing(wordColor, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          })
        );
      else
        animations.push(
          Animated.timing(wordColor, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          })
        );
    }

    Animated.parallel(animations).start();
  }, [inputVal]);

  return (
    <View style={{ width: "100%", flex: 1 }}>
      {/* labels */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Animated.Text
          style={{
            opacity: wordCount === 0 ? 0 : 1,
            fontSize: 12.5,
            fontFamily: "Lato_400Regular_Italic",
            color: wordColor.interpolate({
              inputRange: [0, 1],
              outputRange: ["#507DBC", "#F00"],
            }),
          }}
        >
          Words:{"  "}
          {wordCountDisplayed}
        </Animated.Text>
        <Animated.Text
          style={{
            opacity: letterCount === 0 ? 0 : 1,
            fontSize: 12.5,
            fontFamily: "Lato_400Regular_Italic",
            color: letterColor.interpolate({
              inputRange: [0, 1],
              outputRange: ["#507DBC", "#F00"],
            }),
          }}
        >
          Letters:{"  "}
          {letterCountDisplayed}
        </Animated.Text>
      </View>
      <Spacer width="100%" height={2.5} />
      <TextInput
        // only implement maxLength if we actually have a letter count
        {...(letterCount !== 0 ? { maxLength: letterCount } : {})}
        selectionColor="#FFF"
        multiline={answerInfo.question.multiline}
        value={inputVal}
        onChangeText={(text) => setInputVal(text)}
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
          maxHeight: 150,
          width: "100%",
          padding: 15,
          paddingTop: 15,
          backgroundColor: "#507DBC",
          borderRadius: 5,
          fontFamily: "Lato_400Regular",
          fontSize: 15,
          color: "#FFF",
        }}
      />
      <View
        style={{
          flex: 1,
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AnimatedTouchable
          disabled={!valid}
          onPress={() => {
            answers[answerInfo.questionIndex] = inputVal;
            setAnswers(answers);
            focus(undefined);
          }}
          style={{
            alignSelf: "center",
            padding: 10,
            backgroundColor: "#507DBC",
            borderRadius: 5,
            opacity: buttonRef,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#FFF",
              fontSize: 15,
            }}
          >
            Submit
          </Text>
        </AnimatedTouchable>
      </View>
    </View>
  );
};

const MiniAnswers = ({
  answerInfo,
  answers,
  setAnswers,
  focus,
  keyboardDodgeRef,
}: {
  answerInfo: UserAnswerInfo;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
  keyboardDodgeRef: Animated.Value;
}) => {
  const [sliderVal, setSliderVal] = useState(
    answerInfo === undefined ? undefined : parseInt(answerInfo.userAnswer)
  );

  useEffect(() => {
    setSliderVal(
      answerInfo === undefined ? undefined : parseInt(answerInfo.userAnswer)
    );
  }, [answerInfo]);

  if (answerInfo === undefined) return <></>;

  const { category } = answerInfo.question;

  switch (category) {
    case "Multiple Choice":
      return (
        <MiniMCAnswers
          answerInfo={answerInfo}
          answers={answers}
          setAnswers={setAnswers}
          focus={focus}
        />
      );
    case "Range (Slider)":
      return (
        <MiniSlider
          {...{
            answerInfo,
            answers,
            focus,
            setAnswers,
            setSliderVal,
            sliderVal,
          }}
        />
      );
    case "Ranking":
      return <MiniRanking {...{ answerInfo, answers, setAnswers, focus }} />;
    case "Free Response":
      return (
        <MiniFR
          {...{ answerInfo, keyboardDodgeRef, answers, setAnswers, focus }}
        />
      );
    default:
      return <View />;
  }
};

const SubmitAnswerSubModal = ({
  visible,
  answerInfo,
  answers,
  focus,
  setAnswers,
}: {
  visible: boolean;
  answerInfo: UserAnswerInfo;
  answers: string[];
  focus: React.Dispatch<React.SetStateAction<UserAnswerInfo>>;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const useAltHeight =
    answerInfo !== undefined &&
    answerInfo.question.category !== "Range (Slider)" &&
    answerInfo.question.category !== "Free Response";
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <Pressable
        onPress={() => focus(undefined)}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, .5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* 
          making this a Pressable allows us to click on it without
          dismissing the modal 
        */}
        <AnimatedPressable
          style={{
            width: 300,
            minHeight: useAltHeight ? 400 : 300,
            backgroundColor: "#FFF",
            borderRadius: 7.5,
            padding: 20,
            transform: [
              {
                translateY: keyboardDodgeRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -SCREEN_HEIGHT / 7.5],
                }),
              },
            ],
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_700Bold",
              color: "#507DBC",
              fontSize: 20,
            }}
          >
            {answerInfo === undefined ? "" : answerInfo.question.question}
          </Text>
          <Spacer width="100%" height={20} />
          <MiniAnswers
            keyboardDodgeRef={keyboardDodgeRef}
            answerInfo={answerInfo}
            setAnswers={setAnswers}
            answers={answers}
            focus={focus}
          />
        </AnimatedPressable>
      </Pressable>
    </Modal>
  );
};

interface UserAnswerInfo {
  userAnswer: string;
  question: ExtendedQuestion;
  questionIndex: number;
}

const SubmitScreen = ({
  pollData,
  userAnswers,
  answersFade,
  questionGrow,
  answers,
  setAnswers,
  userID,
  closeScreen,
}: {
  userAnswers: string[];
  answersFade: Animated.Value;
  questionGrow: Animated.Value;
  pollData: PublishedPollWithID;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  userID: string;
  closeScreen: () => void;
}) => {
  const [focusedAnswer, focusAnswer] = useState<UserAnswerInfo>(undefined);

  useEffect(() => {
    Animated.timing(questionGrow, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        alignItems: "center",
      }}
    >
      <Animated.Text
        style={{
          color: "#FFF",
          fontFamily: "Lato_400Regular",
          alignSelf: "center",
          textAlign: "center",
          fontSize: 30,
          transform: [{ scale: questionGrow }],
        }}
      >
        Submit Answers
      </Animated.Text>
      <Spacer width="100%" height={20} />
      <Animated.View style={{ flex: 1, width: "100%", opacity: answersFade }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ height: "100%", width: "100%" }}
        >
          {pollData.questions.map((question, index) => (
            <UserAnswerPreview
              key={question.id}
              index={index}
              question={question}
              userAnswers={userAnswers}
              focus={focusAnswer}
            />
          ))}
        </ScrollView>
      </Animated.View>
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        onPress={async () => {
          await submitPollResponse(pollData, userID, answers);
          closeScreen();
        }}
        style={{
          padding: 10,
          backgroundColor: "#FFF",
          borderRadius: 5,
          bottom: 20,
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#507DBC",
            fontSize: 20,
          }}
        >
          Submit
        </Text>
      </TouchableOpacity>
      <SubmitAnswerSubModal
        visible={focusedAnswer !== undefined}
        answerInfo={focusedAnswer}
        answers={answers}
        focus={focusAnswer}
        setAnswers={setAnswers}
      />
    </Animated.View>
  );
};

const PollModal = ({
  poll,
  visible,
  setVisible,
  userID,
  hasVoted,
}: {
  poll: PublishedPollWithID;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  userID: string;
  hasVoted: boolean;
}) => {
  const [currQuestion, setCurrQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(
    poll.questions.map(() => "")
  );
  const questionGrow = useRef(new Animated.Value(0)).current;
  const answersFade = useRef(new Animated.Value(0)).current;

  const close = () => {
    Animated.parallel([
      Animated.timing(questionGrow, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
        delay: 250,
      }),
      Animated.timing(answersFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => setVisible(false));
  };

  useEffect(() => {
    if (visible)
      Animated.sequence([
        Animated.timing(questionGrow, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          delay: 500,
        }),
        Animated.timing(answersFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
  }, [visible]);

  useEffect(() => {
    if (visible)
      Animated.sequence([
        Animated.timing(questionGrow, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
          delay: 500,
        }),
        Animated.timing(answersFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
  }, [currQuestion]);

  return !hasVoted ? (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={{ width: "100%", height: "100%", backgroundColor: "#507DBC" }}
      >
        <TouchableOpacity
          onPress={() => close()}
          style={{
            padding: 15,
            width: 50,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesome5 name="times" style={{ color: "#FFF", fontSize: 30 }} />
        </TouchableOpacity>
        <View style={{ width: "100%", flex: 1, padding: 20, paddingTop: 0 }}>
          {currQuestion === poll.questions.length ? (
            <SubmitScreen
              answers={answers}
              setAnswers={setAnswers}
              questionGrow={questionGrow}
              answersFade={answersFade}
              userAnswers={answers}
              pollData={poll}
              userID={userID}
              closeScreen={close}
            />
          ) : (
            <QuestionScreen
              question={poll.questions[currQuestion]}
              setCurrQuestion={setCurrQuestion}
              questionGrow={questionGrow}
              answersFade={answersFade}
              last={currQuestion === poll.questions.length - 1}
              index={currQuestion}
              setAnswers={setAnswers}
              answers={answers}
            />
          )}
        </View>
      </View>
    </Modal>
  ) : (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        onPress={() => setVisible(false)}
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <View
          style={{
            width: 300,
            height: 300,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#FFF",
            borderRadius: 10,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              color: "#507DBC",
              textAlign: "center",
            }}
          >
            Sorry, you've already responded to this poll!
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
};

const PublishedPollPreview = ({
  poll,
  last,
  userID,
  triggerRefresh,
}: {
  poll: PublishedPollWithID;
  last: boolean;
  userID: string;
  triggerRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  // reset must be a number so it can overwrite the current timer if already resetting
  const [reset, setReset] = useState(-1);
  const [currScreen, setCurrScreen] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeoutID, setTimeoutID] = useState<NodeJS.Timeout>();
  const [refresh, setRefresh] = useState<
    { direction: "left" | "right" } | undefined
  >(undefined);
  const [closingTime, setClosingTime] = useState(
    getClosingTime(poll.expirationTime)
  );
  const opacity = useRef(new Animated.Value(1)).current;
  const engagementBarOpacity = useRef(new Animated.Value(1)).current;

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  const openPoll = () => {
    Haptics.impactAsync();
    setModalVisible(true);
  };
  const screenViews = getScreenViews(poll, opacity, openPoll);
  const hasVoted = hasUserVoted(poll.questions[0].votes, userID);

  useEffect(() => {
    const unit = closingTime.split(" ").slice(-1)[0];
    if (unit === "seconds" || unit === "second" || "minutes")
      setTimeout(() => {
        setClosingTime(getClosingTime(poll.expirationTime));
      }, 1000);
  }, [closingTime]);

  useEffect(() => {
    setTimeoutID(
      setTimeout(() => {
        Animated.timing(engagementBarOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }, 2500)
    );
    setMounted(true);
  }, []);

  useEffect(() => {
    if (reset !== -1) {
      setReset(-1);
      clearTimeout(timeoutID);
      Animated.timing(engagementBarOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setTimeoutID(
          setTimeout(() => {
            Animated.timing(engagementBarOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            }).start();
          }, 2500)
        );
      });
    }
  }, [reset]);

  useEffect(() => {
    if (refresh !== undefined)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(engagementBarOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setRefresh(undefined);
        clearInterval(timeoutID);
        setTimeoutID(
          setTimeout(() => {
            Animated.timing(engagementBarOpacity, {
              toValue: 0,
              duration: 250,
              useNativeDriver: false,
            }).start();
          }, 2500)
        );
      });
  }, [currScreen]);

  useEffect(() => {
    if (refresh !== undefined)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(engagementBarOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start(() =>
        setCurrScreen(
          refresh.direction === "left" ? currScreen - 1 : currScreen + 1
        )
      );
  }, [refresh]);

  useEffect(() => {
    if (mounted && !modalVisible) {
      triggerRefresh(true);
    }
  }, [modalVisible]);

  return (
    <>
      <Pressable
        onPress={() => setReset(reset + 1)}
        onLongPress={() => openPoll()}
        style={{
          width: "100%",
          borderWidth: 5,
          minHeight: 250,
          borderColor: "#507DBC",
          backgroundColor: "#507DBC",
        }}
      >
        <View
          style={{
            flex: 1,
            width: "100%",
            minHeight: 200,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <AnimatedTouchable
            disabled={currScreen === 0 || refresh !== undefined}
            onPress={() => setRefresh({ direction: "left" })}
            style={{
              backgroundColor: "#FFF",
              width: 40,
              height: 40,
              borderRadius: 40,
              left: 5,
              justifyContent: "center",
              alignItems: "center",
              opacity: currScreen === 0 ? 0 : opacity,
            }}
          >
            <FontAwesome5
              name="arrow-left"
              style={{ color: "#507DBC", fontSize: 25 }}
            />
          </AnimatedTouchable>
          {screenViews[currScreen]}
          <AnimatedTouchable
            disabled={
              currScreen === screenViews.length - 1 || refresh !== undefined
            }
            onPress={() => setRefresh({ direction: "right" })}
            style={{
              backgroundColor: "#FFF",
              width: 40,
              height: 40,
              borderRadius: 40,
              right: 5,
              justifyContent: "center",
              alignItems: "center",
              opacity: currScreen === screenViews.length - 1 ? 0 : opacity,
            }}
          >
            <FontAwesome5
              name="arrow-right"
              style={{ color: "#507DBC", fontSize: 25 }}
            />
          </AnimatedTouchable>
        </View>
        <View
          style={{
            minHeight: 50,
            flex: 1,
            backgroundColor: "#FFF",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          <EngagementBar
            visible={currScreen === 0}
            opacity={engagementBarOpacity}
            userID={userID}
            pollData={poll}
            reset={reset}
            setReset={setReset}
          />
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 17.5,
              color: "#507DBC",
            }}
          >
            {`Closes in ${closingTime}`}
          </Text>
        </View>
        <PollModal
          visible={modalVisible}
          setVisible={setModalVisible}
          poll={poll}
          userID={userID}
          hasVoted={hasVoted}
        />
      </Pressable>
      <Spacer width="100%" height={10} />
      {!last && (
        <>
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "#507DBC50",
              borderRadius: 1,
            }}
          />
          <Spacer width="100%" height={10} />
        </>
      )}
    </>
  );
};

export default function ExploreFeed({ route, navigation }) {
  const [publishedPolls, setPublishedPolls] =
    useState<PublishedPollWithID[]>(undefined);
  const [refreshing, triggerRefresh] = useState(false);
  const [intakeSurvey, setIntakeSurvey] = useState(
    route.params.userData.intakeSurvey
  );

  const userData = route.params.userData;

  return (
    <SafeAreaView style={[styles.mainContainer]}>
      <TopLogoBar
        refreshing={refreshing}
        setPublishedPolls={setPublishedPolls}
        setRefreshing={triggerRefresh}
      />
      <View
        style={{
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          top: -25,
          paddingLeft: 20,
          paddingRight: 20,
        }}
      >
        {(() => {
          if (publishedPolls === undefined)
            return <LoadingScreen color="#507DBC" />;
          else if (!intakeSurvey) {
            return (
              <IntakeSurvey
                setIntakeSurvey={setIntakeSurvey}
                userID={userData.id}
              />
            );
          } else if (publishedPolls.length === 0)
            return (
              <Text
                style={{
                  textAlign: "center",
                  fontFamily: "Lato_400Regular",
                  fontSize: 30,
                  color: "#507DBC",
                  lineHeight: 50,
                }}
              >
                There are no available polls right now {":("}
              </Text>
            );
          else
            return (
              <FlatList
                data={publishedPolls}
                style={{ width: "100%", flex: 1 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <PublishedPollPreview
                    key={item.id}
                    poll={item}
                    last={index === publishedPolls.length - 1}
                    userID={userData.id}
                    triggerRefresh={triggerRefresh}
                  />
                )}
              />
            );
        })()}
      </View>
    </SafeAreaView>
  );
}

export { PublishedPollPreview };

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
  titleText: {
    fontFamily: "Lato_400Regular",
    fontSize: 30,
    textAlign: "center",
    color: "#507DBC",
    fontWeight: "bold",
  },
  scrollView: {
    width: "100%",
    flex: 1,
  },
  topLogoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 5,
    zIndex: 1,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderColor: "#507DBC",
    backgroundColor: "#FFF",
    top: -50,
  },
});
