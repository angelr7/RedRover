// TODO: have some front-end checking to make sure that polls don't have duplicate names
import * as Localization from "expo-localization";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoadingScreen from "../components/LoadingScreen";
import moment from "moment-timezone";
import Spacer from "../components/Spacer";
import SetDescriptionInformation from "./SetDescriptionInformation";
import InitialPrompt from "./InitialPrompt";
import AddQuestionsModal from "./AddQuestionsModal";
import React, { useEffect, useRef, useState } from "react";
import { DAYS_OF_WEEK } from "../constants/localization";
import { UserData } from "../firebase";
import { ListEmpty } from "./CreatePolls";
import {
  SafeAreaView,
  StyleSheet,
  Animated,
  Keyboard,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  ImageBackground,
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
  };
  setScreen: React.Dispatch<React.SetStateAction<LocalPageScreen>>;
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

const PollPreview = ({ userData, pollData, setScreen }: AddQuestionsProps) => {
  const [title, setTitle] = useState(pollData.title);
  const [description, setDescription] = useState(pollData.description);
  const [buttonText, setButtonText] = useState("More");
  const [secondButtonVisible, setSecondButtonVisible] = useState(false);
  const mounted = useRef(false);

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

  return (
    <Animated.View
      style={{
        width: "100%",
        height: 250,
        backgroundColor: "rgba(114, 47, 55, 0.5)",
        borderRadius: 7.5,
        flexDirection: "row",

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
      }}
    >
      {hasPreviewImage && (
        // need to put a view over so the container actually looks flipped if we have an image
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
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
          <ImageBackground
            style={{ width: "100%", height: "100%" }}
            source={{ uri: pollData.previewImageURI }}
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
        <View
          style={[
            hasPreviewImage && {
              alignSelf: "flex-start",
              paddingLeft: 5,
              paddingRight: 5,
              paddingBottom: 5,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: 5,
            },
          ]}
        >
          <Text
            style={[
              {
                fontFamily: "Actor_400Regular",
                color: "#FFF",
                fontSize: 25,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Actor_400Regular",
              fontSize: 12.5,
            }}
          >
            {displayDate}
          </Text>
        </View>
        <Spacer width="100%" height={20} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[
            {
              flex: 1,
              width: "100%",
            },
            hasPreviewImage && {
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              borderRadius: 5,
              padding: 5,
              paddingTop: 0,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: "Actor_400Regular",
              color: "#FFF",
              fontSize: 15,
              lineHeight: 25,
              marginBottom: 5,
            }}
          >
            {description.trim() !== ""
              ? description
              : "No additional information."}
          </Text>
        </ScrollView>
      </Animated.View>
      <Animated.View
        style={[
          styles.centerView,
          {
            height: "100%",
            flex: 1,
            padding: 20,
            paddingLeft: 0,
            opacity: fadeAnimationProgress,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setFlipped(!flipped);
          }}
          style={[
            {
              width: "100%",
              height: 50,
              backgroundColor: "#FFF",
              borderRadius: 5,
            },
            styles.centerView,
            hasPreviewImage && {
              shadowColor: "#000",
              shadowOpacity: 1,
              shadowOffset: { width: 1, height: 1 },
              shadowRadius: 8,
            },
          ]}
        >
          <Text
            style={{
              fontFamily: "Actor_400Regular",
              fontSize: 15,
              color: "#D2042D",
            }}
          >
            {buttonText}
          </Text>
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
                {
                  width: "100%",
                  height: 50,
                  backgroundColor: "#FFF",
                  borderRadius: 5,
                },
                styles.centerView,
                hasPreviewImage && {
                  shadowColor: "#000",
                  shadowOpacity: 1,
                  shadowOffset: { width: 1, height: 1 },
                  shadowRadius: 8,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: "Actor_400Regular",
                  fontSize: 15,
                  color: "#D2042D",
                }}
              >
                {"Edit"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
};

const NoPollQuestions = () => {
  return (
    <View
      style={[
        styles.centerView,
        {
          width: "100%",
          height: 125,
          borderRadius: 7.5,
          backgroundColor: "rgba(114, 47, 55, 0.5)",
        },
      ]}
    >
      <ListEmpty />
    </View>
  );
};

const AddQuestions = ({ userData, pollData, setScreen }: AddQuestionsProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <ScrollView
      style={[
        { width: "100%", height: "100%", paddingLeft: 10, paddingRight: 10 },
      ]}
    >
      <Spacer width="100%" height={10} />
      <PollPreview
        userData={userData}
        pollData={pollData}
        setScreen={setScreen}
      />
      <Spacer width="100%" height={20} />
      <Text
        style={{
          fontFamily: "Actor_400Regular",
          color: "#FFF",
          fontSize: 30,
          textAlign: "center",
        }}
      >
        Questions
      </Text>
      <Spacer width="100%" height={20} />
      {pollData.questions.length === 0 ? <NoPollQuestions /> : <View />}
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        style={{ alignSelf: "center" }}
        onPress={() => {
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" style={{ color: "#FFF", fontSize: 57.5 }} />
      </TouchableOpacity>
      <AddQuestionsModal
        pollData={pollData}
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
      />
    </ScrollView>
  );
};

export default function CreatePollScreen({ route }) {
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
                />
              );
            }
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
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export type { LocalPageScreen, AddQuestionsProps };
