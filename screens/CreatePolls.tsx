import {
  StyleSheet,
  Text,
  FlatList,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { getPolls } from "../firebase";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import LoadingScreen from "../components/LoadingScreen";

interface PollData {
  title: string;
  description: string;
  previewImageURI: string;
  additionalInfo: string;
  author: string;
  dateCreated: string;
  published: boolean;
}

const ListEmpty = () => {
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{ color: "#FFF", fontSize: 25, textAlignVertical: "center" }}
        >
          {"Nothing to see here! "}
        </Text>
        <Text style={{ fontSize: 40 }}>🐕</Text>
      </View>
    </>
  );
};

const PollPreview = ({ pollData }: { pollData: PollData }) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  // TODO: add an edit button and preview items
  return (
    <AnimatedPressable
      style={{
        width: 125,
        height: 125,
        backgroundColor: flipAnimationProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["rgb(255, 255, 255)", "rgb(210, 4, 45)"],
        }),
        borderWidth: 1,
        borderColor: flipAnimationProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["rgb(210, 4, 45)", "rgb(255, 255, 255)"],
        }),
        borderStyle: "solid",
        alignSelf: "center",
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
      onPress={() => {
        if (!flipped)
          Animated.timing(flipAnimationProgress, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }).start(() => {
            setFlipped(true);
          });
        else
          Animated.timing(flipAnimationProgress, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }).start(() => {
            setFlipped(false);
          });
      }}
    ></AnimatedPressable>
  );
};

export default function LandingScreen({ route, navigation }) {
  const [polls, setPolls] = useState<any>();
  const { userData } = route.params;

  const published = [];
  const drafts = [];

  if (polls !== undefined) {
    for (const poll of polls) {
      if (poll.published) published.push(poll);
      else drafts.push(poll);
    }
  }

  useEffect(() => {
    try {
      getPolls(userData.id).then((pollList) => {
        setPolls(pollList);
      });
    } catch (error) {}
  }, []);

  if (polls === undefined) return <LoadingScreen color="#D2042D" />;

  return (
    <SafeAreaView style={[styles.mainContainer, styles.centerView]}>
      <ScrollView
        style={[styles.mainContainer]}
        contentContainerStyle={styles.centerView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.titleText}>Create Polls</Text>
        <Spacer width="100%" height={25} />

        <Text style={styles.headingText}>My Polls</Text>
        <View
          style={[styles.flatListContainer, styles.centerView, { padding: 5 }]}
        >
          {published.length === 0 ? (
            <ListEmpty />
          ) : (
            <FlatList
              data={published}
              horizontal={true}
              renderItem={({ item }) => <View />}
            />
          )}
        </View>
        <Spacer width="100%" height={50} />

        <Text style={styles.headingText}>My Drafts</Text>
        <View
          style={[styles.flatListContainer, styles.centerView, { padding: 5 }]}
        >
          {drafts.length === 0 ? (
            <ListEmpty />
          ) : (
            <FlatList
              data={drafts}
              horizontal={true}
              renderItem={({ item }) => {
                return <PollPreview pollData={item} />;
              }}
            />
          )}
        </View>
        <Spacer width="100%" height={25} />

        <View style={[styles.centerView]}>
          <TouchableOpacity
            onPress={() => {
              navigation.push("CreatePollScreen", { userData });
            }}
          >
            <Ionicons name="add-circle" style={styles.addIcon} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFF",
    paddingLeft: 10,
    paddingRight: 10,
  },
  centerView: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    fontFamily: "Actor_400Regular",
    fontSize: 30,
    textAlign: "center",
    color: "#D2042D",
    fontWeight: "bold",
  },
  scrollView: {
    width: "100%",
    flex: 1,
  },
  headingText: {
    fontFamily: "Actor_400Regular",
    fontSize: 20,
    alignSelf: "flex-start",
    color: "#D2042D",
  },
  flatListContainer: {
    marginTop: 20,
    width: "100%",
    height: 150,
    backgroundColor: "rgba(210, 4, 45, 1)",
    borderRadius: 10,
  },
  addIcon: {
    fontSize: 75,
    color: "#D2042D",
    textAlign: "center",
    left: 3,
  },
  subHeadingStyle: {
    alignSelf: "center",
    fontFamily: "Actor_400Regular",
    color: "#D2042D",
    fontSize: 30,
  },
});
