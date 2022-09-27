import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import LoadingScreen from "../components/LoadingScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useEffect, useRef, useState } from "react";
import { getPolls, removePoll } from "../firebase";
import {
  StyleSheet,
  Text,
  FlatList,
  View,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Animated,
  Modal,
} from "react-native";
import FastImage from "../components/FastImage";

interface PollData {
  title: string;
  description: string;
  previewImageURI: string;
  additionalInfo: string;
  author: string;
  dateCreated: string;
  published: boolean;
  id: string;
}
interface PollPreviewProps {
  pollData: PollData;
  navigation: any;
  userData: any;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setPollData: React.Dispatch<React.SetStateAction<PollData>>;
  selectedDraft: React.MutableRefObject<any>;
}

const ListEmpty = () => {
  return (
    <>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          style={{
            color: "#FFF",
            fontSize: 25,
            textAlignVertical: "center",
            fontFamily: "Actor_400Regular",
          }}
        >
          {"Nothing to see here! "}
        </Text>
        <Text style={{ fontSize: 40 }}>🐕</Text>
      </View>
    </>
  );
};

const PollPreview = ({
  pollData,
  navigation,
  userData,
  setModalVisible,
  setPollData,
  selectedDraft,
}: PollPreviewProps) => {
  const [flipped, setFlipped] = useState(false);
  const flipAnimationProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  return (
    <AnimatedPressable
      style={[
        styles.pollPreviewContainer,
        {
          backgroundColor: flipAnimationProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgb(255, 255, 255)", "rgb(210, 4, 45)"],
          }),
          borderColor: flipAnimationProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ["rgb(210, 4, 45)", "rgb(255, 255, 255)"],
          }),
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
      onPress={() => {
        if (!flipped) {
          if (selectedDraft.current !== null) {
            Animated.parallel([
              Animated.timing(selectedDraft.current.animationRef, {
                toValue: 0,
                duration: 500,
                useNativeDriver: false,
              }),
              Animated.timing(flipAnimationProgress, {
                toValue: 1,
                duration: 500,
                useNativeDriver: false,
              }),
            ]).start(() => {
              selectedDraft.current.setFlipped(false);
              selectedDraft.current = {
                animationRef: flipAnimationProgress,
                setFlipped: setFlipped,
              };
              setFlipped(true);
            });
          } else
            Animated.timing(flipAnimationProgress, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }).start(() => {
              selectedDraft.current = {
                animationRef: flipAnimationProgress,
                setFlipped: setFlipped,
              };
              setFlipped(true);
            });
        } else
          Animated.timing(flipAnimationProgress, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }).start(() => {
            selectedDraft.current = null;
            setFlipped(false);
          });
      }}
    >
      {pollData.previewImageURI && (
        <Animated.View
          style={[
            {
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: 5,
              opacity: flipAnimationProgress.interpolate({
                // setting a smaller input range allows our
                // opacity animation to be slightly faster
                // and not overlap w/ the fade-in of the button
                inputRange: [0, 0.5],
                outputRange: [1, 0],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <FastImage
            style={[
              {
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: 5,
              },
            ]}
            pollID={pollData.id}
            uri={pollData.previewImageURI}
          />
          <View
            style={[
              {
                width: "90%",
                height: 30,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                alignSelf: "center",
                marginTop: 10,
                borderRadius: 5,
                padding: 5,
              },
              styles.centerView,
            ]}
          >
            <Text
              style={{
                color: "#FFF",
                fontFamily: "Actor_400Regular",
              }}
              ellipsizeMode="tail"
            >
              {pollData.title}
            </Text>
          </View>
        </Animated.View>
      )}
      {pollData.previewImageURI === "" && (
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            opacity: flipAnimationProgress.interpolate({
              inputRange: [0, 0.5],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          }}
        >
          <View
            style={[
              {
                width: "90%",
                height: 30,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                alignSelf: "center",
                marginTop: 10,
                borderRadius: 5,
              },
              styles.centerView,
            ]}
          >
            <Text
              style={{
                color: "#FFF",
                fontFamily: "Actor_400Regular",
                maxWidth: "90%",
              }}
              ellipsizeMode="tail"
            >
              {pollData.title}
            </Text>
          </View>
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              bottom: 15,
              borderRadius: 5,
              zIndex: -1,
            }}
          >
            <Text
              style={{
                fontSize: 50,
                transform: [{ scaleX: -1 }],
                left: 3,
                color: "#D2042D",
              }}
            >
              R
            </Text>
            <Text style={{ fontSize: 50, right: 3, color: "#D2042D" }}>R</Text>
          </View>
        </Animated.View>
      )}
      <View style={[{ width: "100%", height: "100%" }, styles.centerView]}>
        <AnimatedTouchable
          disabled={!flipped}
          style={[
            styles.pollPreviewButton,
            styles.centerView,
            { opacity: flipAnimationProgress },
          ]}
          onPress={() => {
            navigation.push("CreatePollScreen", {
              initialScreen: {
                name: "AddQuestions",
                params: { pollData, userData },
              },
            });
          }}
        >
          <Text
            style={{
              color: "#D2042D",
              fontFamily: "Actor_400Regular",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Edit
          </Text>
        </AnimatedTouchable>

        <Spacer width="100%" height={5} />

        <AnimatedTouchable
          disabled={!flipped}
          style={[
            styles.pollPreviewButton,
            styles.centerView,
            { opacity: flipAnimationProgress },
          ]}
          onPress={() => {
            setPollData(pollData);
            setModalVisible(true);
          }}
        >
          <Text
            style={{
              color: "#D2042D",
              fontFamily: "Actor_400Regular",
              fontSize: 12,
              textAlign: "center",
            }}
          >
            Delete
          </Text>
        </AnimatedTouchable>
      </View>
    </AnimatedPressable>
  );
};

const DeleteMessageModal = ({
  pollData,
  modalVisible,
  setModalVisible,
  setRefetch,
}: {
  pollData: PollData;
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Modal visible={modalVisible} animationType="fade" transparent>
      <View
        style={[
          {
            flex: 1,
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          styles.centerView,
        ]}
      >
        <View
          style={{
            width: 300,
            backgroundColor: "#FFF",
            borderRadius: 7.5,
            padding: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              width: "100%",
              alignItems: "center",
            }}
          >
            <FontAwesome5
              name="trash-alt"
              style={{ fontSize: 30, color: "#D2042D" }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#D2042D",
                  alignSelf: "center",
                  fontSize: 27.5,
                  fontFamily: "Actor_400Regular",
                }}
              >
                {"Delete Draft?"}
              </Text>
            </View>
          </View>
          <Spacer width="100%" height={20} />
          <View
            style={[styles.centerView, { width: "100%", flexDirection: "row" }]}
          >
            <TouchableOpacity
              onPress={async () => {
                await removePoll(
                  pollData.id,
                  pollData.previewImageURI !== "",
                  pollData.published
                );
                setRefetch(true);
                setModalVisible(false);
              }}
              style={[
                styles.centerView,
                {
                  backgroundColor: "#F00",
                  width: 100,
                  height: 40,
                  borderRadius: 5,
                },
              ]}
            >
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Actor_400Regular",
                  fontSize: 15,
                }}
              >
                Yes, I'm Sure
              </Text>
            </TouchableOpacity>
            <Spacer width={10} height="100%" />
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
              }}
              style={[
                styles.centerView,
                {
                  borderWidth: 1,
                  borderColor: "#F00",
                  backgroundColor: "#FFF",
                  width: 100,
                  height: 40,
                  borderRadius: 5,
                },
              ]}
            >
              <Text
                style={{
                  color: "#F00",
                  fontFamily: "Actor_400Regular",
                  fontSize: 15,
                }}
              >
                No, Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function LandingScreen({ route, navigation }) {
  const [polls, setPolls] = useState<any>();
  const [modalVisible, setModalVisible] = useState(false);
  const [pollData, setPollData] = useState<PollData>();
  const [refetch, setRefetch] = useState(false);
  const mounted = useRef(false);
  const selectedDraft = useRef(null);

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
    if (!mounted.current || refetch)
      try {
        getPolls(userData.id).then((pollList) => {
          setPolls(pollList);
        });
      } catch (error) {}

    if (refetch) setRefetch(false);
    if (!mounted.current) mounted.current = true;
  }, [refetch]);

  // when the screen loads up, we are going to make sure to trigger a refresh
  useEffect(() => {
    navigation.addListener("focus", () => {
      setRefetch(true);
    });
  });

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
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => {
                return <Spacer width={10} height="100%" />;
              }}
              renderItem={({ item }) => {
                return (
                  <PollPreview
                    pollData={item}
                    navigation={navigation}
                    userData={userData}
                    setModalVisible={setModalVisible}
                    setPollData={setPollData}
                    selectedDraft={selectedDraft}
                  />
                );
              }}
            />
          )}
        </View>
        <Spacer width="100%" height={50} />

        <Text style={styles.headingText}>My Drafts</Text>
        <View
          style={[styles.flatListContainer, styles.centerView, { padding: 10 }]}
        >
          {drafts.length === 0 ? (
            <ListEmpty />
          ) : (
            <FlatList
              data={drafts}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => {
                return <Spacer width={10} height="100%" />;
              }}
              renderItem={({ item }) => {
                return (
                  <PollPreview
                    pollData={item}
                    navigation={navigation}
                    userData={userData}
                    setModalVisible={setModalVisible}
                    setPollData={setPollData}
                    selectedDraft={selectedDraft}
                  />
                );
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
      <DeleteMessageModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        pollData={pollData}
        setRefetch={setRefetch}
      />
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
    color: "#D2042D",
    fontFamily: "Actor_400Regular",
    fontSize: 30,
    textAlign: "center",
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
  pollPreviewContainer: {
    width: 125,
    height: 125,
    borderWidth: 1,
    borderStyle: "solid",
    alignSelf: "center",
    borderRadius: 5,
  },
  pollPreviewButton: {
    width: 75,
    height: 40,
    backgroundColor: "#FFF",
    borderRadius: 5,

    // when we see this button, it's flipped, so we need to flip it here
    // so we can read it
    transform: [{ scaleX: -1 }],
  },
});

export { ListEmpty };
