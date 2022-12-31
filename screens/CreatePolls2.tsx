import moment from "moment";
import * as Haptics from "expo-haptics";
import Spacer from "../components/Spacer";
import * as Localization from "expo-localization";
import EditPollModal from "../components/EditPollModal";
import LoadingScreen from "../components/LoadingScreen";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import CreatePollModal from "../components/CreatePollModal";
import PublishPollModal from "../components/PublishPollModal";
import AddQuestionsModal2 from "../components/AddQuestionsModal2";
import React, { useEffect, useRef, useState } from "react";
import { DAYS_OF_WEEK } from "../constants/localization";
import {
  PollDraftInfo,
  getPollDrafts,
  updatePollDraft,
  removePollDraft,
  getPublishedPollsForUser,
  PublishedPollWithID,
} from "../firebase";
import {
  Text,
  View,
  Modal,
  Animated,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";

interface UserData {
  admin: boolean;
  createdAt: string;
  email: string;
  id: string;
  intakeSurvey: boolean;
}
interface PollDraftInfoExtended extends PollDraftInfo {
  openInteractionMenu: React.Dispatch<React.SetStateAction<boolean>>;
}
interface CAEModalsProps {
  questionsModalActive: PollDraftInfo | undefined;
  editPollActive: PollDraftInfo | undefined;
  createPollActive: boolean;
  deletingModalActive: PollDraftInfoExtended | undefined;
  publishingPollActive: PollDraftInfo | undefined;
  setQuestionsModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setEditPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setDeletingModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfoExtended | undefined>
  >;
  setCreatePollActive: React.Dispatch<React.SetStateAction<boolean>>;
  userData: UserData;
  setDraftsChanged: React.Dispatch<React.SetStateAction<boolean>>;
  setPublishingPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
}
interface PollDraftSliderProps {
  slideAnimationRef: Animated.Value;
  description: string;
  additionalInfo: string;
}
interface DraftButtonContainerProps {
  draft: PollDraftInfo;
  openCircularRef: Animated.Value;
  interactionMenuOpen: boolean;
  openInteractionMenu: React.Dispatch<React.SetStateAction<boolean>>;
  setDeletingModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfoExtended | undefined>
  >;
  setEditPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setQuestionsModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setPublishingPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
}
interface PollDraftContainerProps {
  drafts: PollDraftInfo[];
  setDeletingModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfoExtended | undefined>
  >;
  setEditPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setQuestionsModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setPublishingPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
}
interface PollDraftPreviewProps {
  draft: PollDraftInfo;
  last: boolean;
  setDeletingModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfoExtended | undefined>
  >;
  setEditPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setQuestionsModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
  setPublishingPollActive: React.Dispatch<
    React.SetStateAction<PollDraftInfo | undefined>
  >;
}
interface PublishedPollPreviewProps {
  poll: PublishedPollWithID;
  last: boolean;
}
interface DeleteDraftModalProps {
  userData: {
    admin: boolean;
    createdAt: string;
    email: string;
    id: string;
    intakeSurvey: boolean;
  };
  deletingModalActive: PollDraftInfoExtended | undefined;
  setDeletingModalActive: React.Dispatch<
    React.SetStateAction<PollDraftInfoExtended | undefined>
  >;
}
interface TopLogoBarProps {
  refresh: boolean;
  setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}
interface PublishedPollContainerProps {
  published: PublishedPollWithID[];
}
interface PublishedButtonContainerProps {
  poll: PublishedPollWithID;
  openCircularRef: Animated.Value;
  interactionMenuOpen: boolean;
  openInteractionMenu: React.Dispatch<React.SetStateAction<boolean>>;
}

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

const handleDraftAnimations = (
  extraInfoOpen: boolean,
  interactionMenuOpen: boolean,
  slideAnimationRef: Animated.Value,
  openCircularRef: Animated.Value
) => {
  useEffect(() => {
    if (!extraInfoOpen) {
      Animated.timing(slideAnimationRef, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnimationRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [extraInfoOpen]);

  useEffect(() => {
    if (!interactionMenuOpen) {
      Animated.timing(openCircularRef, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(openCircularRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [interactionMenuOpen]);
};

const TopLogoBar = ({ refresh, setRefresh }: TopLogoBarProps) => {
  const [animationVal, setAnimationVal] = useState(0);
  const spinslideRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(Pressable);

  useEffect(() => {
    if (refresh) {
      Animated.timing(spinslideRef, {
        toValue: animationVal + 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setTimeout(() => setAnimationVal(animationVal + 1), 500));
    } else {
      spinslideRef.setValue(0);
    }
  }, [refresh, animationVal]);

  return (
    <View style={styles.topLogoContainer}>
      <AnimatedTouchable
        disabled={refresh}
        onPress={() => setRefresh(true)}
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

const EmptyPoll = () => {
  const slideRef = useRef(new Animated.Value(0)).current;
  const textFadeRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(textFadeRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Animated.View
        style={{
          flex: slideRef.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0],
          }),
        }}
      />
      <Animated.Text
        style={[
          {
            fontSize: 40,
            color: "#FFF",
          },
        ]}
      >
        🐕
      </Animated.Text>
      <Animated.Text
        style={[
          styles.emptyPollText,
          {
            opacity: textFadeRef,
          },
        ]}
      >
        Uh oh! It's empty here!
      </Animated.Text>
    </View>
  );
};

// TODO: move this to its own file
const DeleteDraftModal = ({
  userData,
  deletingModalActive,
  setDeletingModalActive,
}: DeleteDraftModalProps) => {
  const [deleteTriggered, triggerDelete] = useState(false);
  const deleteFadeRef = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (deleteTriggered) {
      Animated.timing(deleteFadeRef, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(async () => {
        deletingModalActive.openInteractionMenu(false);
        await removePollDraft(userData.id, deletingModalActive.id);
        setDeletingModalActive(undefined);
        triggerDelete(false);
      });
    } else {
      deleteFadeRef.setValue(1);
    }
  }, [deleteTriggered]);

  return (
    <Modal
      transparent
      visible={deletingModalActive !== undefined}
      animationType="fade"
    >
      <Pressable
        onPress={() => setDeletingModalActive(undefined)}
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
            alignItems: "center",
          }}
        >
          <Animated.Text
            style={{
              color: "#853b30",
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              opacity: deleteFadeRef,
            }}
          >
            Deleting Poll!
          </Animated.Text>
          <Spacer width="100%" height={10} />
          <Animated.View
            style={[styles.centerView, { flex: 1, opacity: deleteFadeRef }]}
          >
            <Text>
              <Text
                style={{
                  color: "#853b30",
                  fontFamily: "Lato_400Regular",
                  fontSize: 17.5,
                  flexDirection: "row",
                }}
              >
                Are you sure you want to delete your poll draft?
              </Text>
              <Text
                style={{
                  fontWeight: "bold",
                  color: "#853b30",
                  fontFamily: "Lato_700Bold",
                  fontSize: 17.5,
                  flexDirection: "row",
                }}
              >
                {" This cannot be undone."}
              </Text>
            </Text>
            <View
              style={{
                flex: 1,
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => triggerDelete(true)}
                style={[
                  styles.centerView,
                  {
                    padding: 10,
                    backgroundColor: "#853b30",
                    borderRadius: 5,
                  },
                ]}
              >
                <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
                  Yes, Delete My Poll
                </Text>
              </TouchableOpacity>
              <Spacer width="100%" height={10} />
              <TouchableOpacity
                onPress={() => setDeletingModalActive(undefined)}
                style={[
                  styles.centerView,
                  {
                    padding: 10,
                    backgroundColor: "#853b30",
                    borderRadius: 5,
                  },
                ]}
              >
                <Text style={{ color: "#FFF", fontFamily: "Lato_400Regular" }}>
                  No, take me back.
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          <Animated.View
            style={{
              zIndex: -1,
              position: "absolute",
              width: "100%",
              height: "100%",
              // for some reason, the parent's padding don't offset it the way we want
              marginTop: 10,
              opacity: deleteFadeRef.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
            }}
          >
            <LoadingScreen color="#853b30" />
          </Animated.View>
        </View>
      </Pressable>
    </Modal>
  );
};

const CreateAndEditModals = ({
  questionsModalActive,
  editPollActive,
  deletingModalActive,
  createPollActive,
  publishingPollActive,
  setQuestionsModalActive,
  setEditPollActive,
  setDeletingModalActive,
  setCreatePollActive,
  setPublishingPollActive,
  userData,
  setDraftsChanged,
}: CAEModalsProps) => {
  return (
    <>
      <CreatePollModal
        userData={userData}
        visible={createPollActive}
        setVisible={setCreatePollActive}
      />
      <DeleteDraftModal
        userData={userData}
        deletingModalActive={deletingModalActive}
        setDeletingModalActive={setDeletingModalActive}
      />
      <EditPollModal
        userData={userData}
        visible={editPollActive}
        setVisible={setEditPollActive}
      />
      <PublishPollModal
        userData={userData}
        visible={publishingPollActive}
        setVisible={setPublishingPollActive}
      />
      <AddQuestionsModal2
        {...{
          userData,
          questionsModalActive,
          setQuestionsModalActive,
          setDraftsChanged,
        }}
      />
    </>
  );
};

// This "sliding" window is what holds the description and additional information for the poll
const PollDraftSlider = ({
  slideAnimationRef,
  description,
  additionalInfo,
}: PollDraftSliderProps) => {
  return (
    <Animated.View
      style={[
        styles.slidingWindowParent,
        {
          padding: slideAnimationRef.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 10],
          }),
          width: slideAnimationRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Animated.Text
          style={{
            textAlign: "center",
            fontSize: 17.5,
            color: "#853b30",
            opacity: slideAnimationRef.interpolate({
              inputRange: [0.95, 1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          }}
        >
          Description
        </Animated.Text>
        <Spacer width="100%" height={10} />
        <Animated.Text
          ellipsizeMode="tail"
          numberOfLines={1000}
          style={{
            flex: 1,
            fontSize: 12.5,
            color: "#853b30",
            opacity: slideAnimationRef.interpolate({
              inputRange: [0.95, 1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          }}
        >
          {description}
        </Animated.Text>
      </View>
      <Spacer height="100%" width={10} />
      <Animated.View
        style={{
          height: "100%",
          width: 1,
          backgroundColor: "#853b30",
          opacity: slideAnimationRef.interpolate({
            inputRange: [0.95, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      />
      <Spacer height="100%" width={10} />
      <View style={{ flex: 1 }}>
        <Animated.Text
          style={{
            textAlign: "center",
            fontSize: 17.5,
            color: "#853b30",
            opacity: slideAnimationRef.interpolate({
              inputRange: [0.95, 1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          }}
        >
          Additional Information
        </Animated.Text>
        <Spacer width="100%" height={10} />
        <Animated.Text
          ellipsizeMode="tail"
          numberOfLines={1000}
          style={{
            flex: 1,
            width: "100%",
            fontSize: 12.5,
            color: "#853b30",
            opacity: slideAnimationRef.interpolate({
              inputRange: [0.95, 1],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          }}
        >
          {additionalInfo}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const DraftButtonContainer = ({
  draft,
  openCircularRef,
  interactionMenuOpen,
  openInteractionMenu,
  setDeletingModalActive,
  setEditPollActive,
  setQuestionsModalActive,
  setPublishingPollActive,
}: DraftButtonContainerProps) => {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  return (
    <Animated.View
      style={{
        zIndex: 2,
        position: "absolute",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
        width: openCircularRef.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
        height: openCircularRef.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
        // doesn't work on Android
        borderRadius: openCircularRef.interpolate({
          inputRange: [0.5, 1],
          outputRange: ["50%", "0%"],
          extrapolate: "clamp",
        }),
      }}
    >
      <AnimatedPressable
        onPress={() => openInteractionMenu(false)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
          padding: 10,
          opacity: openCircularRef.interpolate({
            inputRange: [0.5, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <FontAwesome5 name="times" style={{ fontSize: 20, color: "#853b30" }} />
      </AnimatedPressable>
      <Animated.View
        style={{
          justifyContent: "space-evenly",
          height: "100%",
          opacity: openCircularRef.interpolate({
            inputRange: [0.5, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          onPress={() => setEditPollActive(draft)}
          style={styles.draftButtonContainer}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            Edit Draft
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          onPress={() => setQuestionsModalActive(draft)}
          style={styles.draftButtonContainer}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            Add Questions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          style={styles.draftButtonContainer}
          onPress={() => setPublishingPollActive(draft)}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            Publish Draft
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          style={styles.draftButtonContainer}
          onPress={() =>
            setDeletingModalActive({ ...draft, openInteractionMenu })
          }
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            Delete Draft
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const LineSeparator = () => {
  return (
    <>
      <Spacer width="100%" height={20} />
      <View
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "#FFFFFF90",
          borderRadius: 2.5,
        }}
      />
      <Spacer width="100%" height={20} />
    </>
  );
};

const PollDraftPreview = ({
  draft,
  last,
  setDeletingModalActive,
  setEditPollActive,
  setQuestionsModalActive,
  setPublishingPollActive,
}: PollDraftPreviewProps) => {
  const { title, dateCreated, description, additionalInfo } = draft;
  const relativeTimestamp = getRelativeTimestamp(
    moment().tz(Localization.timezone),
    moment(parseInt(dateCreated)).tz(Localization.timezone)
  );

  const [extraInfoOpen, openExtraInfo] = useState(false);
  const [interactionMenuOpen, openInteractionMenu] = useState(false);
  const slideAnimationRef = useRef(new Animated.Value(0)).current;
  const openCircularRef = useRef(new Animated.Value(0)).current;

  handleDraftAnimations(
    extraInfoOpen,
    interactionMenuOpen,
    slideAnimationRef,
    openCircularRef
  );

  return (
    <>
      <View style={styles.pollDraftMain}>
        <Pressable
          onPress={() => openExtraInfo(!extraInfoOpen)}
          onLongPress={() => {
            if (!interactionMenuOpen) {
              Haptics.selectionAsync();
              openInteractionMenu(true);
            }
          }}
          style={[styles.centerView, { flex: 1 }]}
        >
          <PollDraftSlider
            additionalInfo={additionalInfo}
            description={description}
            slideAnimationRef={slideAnimationRef}
          />
          <DraftButtonContainer
            draft={draft}
            openCircularRef={openCircularRef}
            interactionMenuOpen={interactionMenuOpen}
            openInteractionMenu={openInteractionMenu}
            setDeletingModalActive={setDeletingModalActive}
            setEditPollActive={setEditPollActive}
            setQuestionsModalActive={setQuestionsModalActive}
            setPublishingPollActive={setPublishingPollActive}
          />
          <Text style={[styles.pollDraftTitle, { padding: 20 }]}>{title}</Text>
        </Pressable>
        <View
          style={[
            styles.centerView,
            {
              width: "100%",
              height: 50,
              backgroundColor: "#FFF",
            },
          ]}
        >
          <Text style={styles.pollDraftBottomText}>
            Last Modified: {relativeTimestamp}
          </Text>
        </View>
      </View>
      {!last && <LineSeparator />}
    </>
  );
};

const PollDraftContainer = ({
  drafts,
  setDeletingModalActive,
  setEditPollActive,
  setQuestionsModalActive,
  setPublishingPollActive,
}: PollDraftContainerProps) => {
  return (
    <View style={styles.pollContainer}>
      {drafts.length === 0 ? (
        <EmptyPoll />
      ) : (
        <View
          style={{
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          {drafts.map((draft, index) => (
            <PollDraftPreview
              key={index}
              draft={draft}
              last={index === drafts.length - 1}
              setDeletingModalActive={setDeletingModalActive}
              setEditPollActive={setEditPollActive}
              setQuestionsModalActive={setQuestionsModalActive}
              setPublishingPollActive={setPublishingPollActive}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const PublishedButtonContainer = ({
  poll,
  openCircularRef,
  interactionMenuOpen,
  openInteractionMenu,
}: PublishedButtonContainerProps) => {
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const buttonsDisabled = !interactionMenuOpen;
  return (
    <Animated.View
      style={{
        zIndex: 2,
        position: "absolute",
        backgroundColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
        width: openCircularRef.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
        height: openCircularRef.interpolate({
          inputRange: [0, 1],
          outputRange: ["0%", "100%"],
        }),
        // doesn't work on Android
        borderRadius: openCircularRef.interpolate({
          inputRange: [0.5, 1],
          outputRange: ["50%", "0%"],
          extrapolate: "clamp",
        }),
      }}
    >
      <AnimatedPressable
        onPress={() => openInteractionMenu(false)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 2,
          padding: 10,
          opacity: openCircularRef.interpolate({
            inputRange: [0.5, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <FontAwesome5 name="times" style={{ fontSize: 20, color: "#853b30" }} />
      </AnimatedPressable>
      <Animated.View
        style={{
          justifyContent: "space-evenly",
          height: "100%",
          opacity: openCircularRef.interpolate({
            inputRange: [0.5, 1],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
        }}
      >
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          style={styles.draftButtonContainer}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            View Results
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          style={styles.draftButtonContainer}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            Extend Deadline
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!interactionMenuOpen}
          style={styles.draftButtonContainer}
        >
          <Text
            style={{
              color: "#FFF",
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
            }}
          >
            Close Poll
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const PublishedPollPreview = ({ poll, last }: PublishedPollPreviewProps) => {
  const { title, description, additionalInfo } = poll.pollData;
  const { expirationTime } = poll;
  const parsedTimestamp = moment(parseInt(expirationTime))
    .tz(Localization.timezone)
    .format("LLLL")
    .split(" ");

  const [extraInfoOpen, openExtraInfo] = useState(false);
  const [interactionMenuOpen, openInteractionMenu] = useState(false);
  const openCircularRef = useRef(new Animated.Value(0)).current;
  const slideAnimationRef = useRef(new Animated.Value(0)).current;

  handleDraftAnimations(
    extraInfoOpen,
    interactionMenuOpen,
    slideAnimationRef,
    openCircularRef
  );

  return (
    <>
      <View style={styles.pollDraftMain}>
        <Pressable
          onPress={() => openExtraInfo(!extraInfoOpen)}
          onLongPress={() => {
            if (!interactionMenuOpen) {
              Haptics.selectionAsync();
              openInteractionMenu(true);
            }
          }}
          style={[styles.centerView, { flex: 1 }]}
        >
          <PollDraftSlider
            additionalInfo={additionalInfo}
            description={description}
            slideAnimationRef={slideAnimationRef}
          />
          <PublishedButtonContainer
            poll={poll}
            openCircularRef={openCircularRef}
            interactionMenuOpen={interactionMenuOpen}
            openInteractionMenu={openInteractionMenu}
          />
          <Text style={[styles.pollDraftTitle, { padding: 20 }]}>{title}</Text>
        </Pressable>
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
          <Text style={styles.pollDraftBottomText}>
            Available Until: {parsedTimestamp[0]} {parsedTimestamp[1]}{" "}
            {parsedTimestamp[2]} {parsedTimestamp[3]} at {parsedTimestamp[4]}{" "}
            {parsedTimestamp[5]}
          </Text>
        </View>
      </View>
      {!last && <LineSeparator />}
    </>
  );
};

const PublishedPollContainer = ({ published }: PublishedPollContainerProps) => {
  return (
    <View style={styles.pollContainer}>
      {published.length === 0 ? (
        <EmptyPoll />
      ) : (
        <View
          style={{
            justifyContent: "space-evenly",
            alignItems: "center",
          }}
        >
          {published.map((poll, index) => (
            <PublishedPollPreview
              key={index}
              poll={poll}
              last={index === published.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default function CreatePolls2({ route, navigation }) {
  const [refresh, setRefresh] = useState(false);
  const [draftsChanged, setDraftsChanged] = useState(false);
  const [published, setPublished] = useState<PublishedPollWithID[]>([]);
  const [drafts, setDrafts] = useState<PollDraftInfo[]>([]);
  const [createPollActive, setCreatePollActive] = useState(false);
  const [deletingModalActive, setDeletingModalActive] = useState(undefined);
  const [editPollActive, setEditPollActive] = useState<
    PollDraftInfo | undefined
  >();
  const [publishingPollActive, setPublishingPollActive] = useState<
    PollDraftInfo | undefined
  >();
  const [questionsModalActive, setQuestionsModalActive] = useState<
    PollDraftInfo | undefined
  >(undefined);
  const { userData } = route.params;

  // needs its own check, doesn't update w/ the rest of the values
  useEffect(() => {
    if (refresh) {
      getPollDrafts(userData.id).then((pollDrafts) => {
        setRefresh(false);
        setDrafts(
          // this puts the newest drafts first
          pollDrafts.sort(
            (a, b) => -(parseInt(a.dateCreated) - parseInt(b.dateCreated))
          )
        );
      });
    }
  }, [refresh]);

  useEffect(() => {
    if (!createPollActive) {
      getPollDrafts(userData.id).then((pollDrafts) =>
        setDrafts(
          // this puts the newest drafts first
          pollDrafts.sort(
            (a, b) => -(parseInt(a.dateCreated) - parseInt(b.dateCreated))
          )
        )
      );
    } else if (!deletingModalActive) {
      getPollDrafts(userData.id).then((pollDrafts) =>
        setDrafts(
          // this puts the newest drafts first
          pollDrafts.sort(
            (a, b) => -(parseInt(a.dateCreated) - parseInt(b.dateCreated))
          )
        )
      );
    } else if (!editPollActive) {
      getPollDrafts(userData.id).then((pollDrafts) =>
        setDrafts(
          // this puts the newest drafts first
          pollDrafts.sort(
            (a, b) => -(parseInt(a.dateCreated) - parseInt(b.dateCreated))
          )
        )
      );
    } else if (!questionsModalActive) {
      getPollDrafts(userData.id).then((pollDrafts) => {
        if (draftsChanged) {
          setDraftsChanged(false);
          setDrafts(
            // this puts the newest drafts first
            pollDrafts.sort(
              (a, b) => -(parseInt(a.dateCreated) - parseInt(b.dateCreated))
            )
          );
        }
      });
    } else if (!publishingPollActive) {
      getPollDrafts(userData.id).then((pollDrafts) => {
        if (draftsChanged) {
          setDraftsChanged(false);
          setDrafts(
            // this puts the newest drafts first
            pollDrafts.sort(
              (a, b) => -(parseInt(a.dateCreated) - parseInt(b.dateCreated))
            )
          );
        }
      });
    }
  }, [
    createPollActive,
    deletingModalActive,
    editPollActive,
    questionsModalActive,
    publishingPollActive,
  ]);

  useEffect(() => {
    if (!publishingPollActive)
      getPublishedPollsForUser(userData.id).then((publishedPolls) => {
        setPublished(publishedPolls);
      });
  }, [publishingPollActive]);

  useEffect(() => {
    if (draftsChanged) {
      updatePollDraft(userData.id, questionsModalActive.id, {
        additionalInfo: questionsModalActive.additionalInfo,
        description: questionsModalActive.description,
        title: questionsModalActive.title,
      });
    }
  }, [draftsChanged]);

  return (
    <ScrollView
      style={styles.mainContainer}
      showsVerticalScrollIndicator={false}
    >
      <TopLogoBar refresh={refresh} setRefresh={setRefresh} />
      <Spacer width="100%" height={20} />
      <View style={{ width: "100%", flex: 1, padding: 10 }}>
        <Text style={styles.titleText}>Published Polls</Text>
        <Spacer width="100%" height={5} />
        <PublishedPollContainer published={published} />
        <Spacer width="100%" height={40} />
        <Text style={styles.titleText}>Drafts</Text>
        <Spacer width="100%" height={5} />
        <PollDraftContainer
          drafts={drafts}
          setDeletingModalActive={setDeletingModalActive}
          setEditPollActive={setEditPollActive}
          setQuestionsModalActive={setQuestionsModalActive}
          setPublishingPollActive={setPublishingPollActive}
        />
      </View>
      <Spacer height={10} width="100%" />
      <View style={[styles.centerView, { flex: 1 }]}>
        <TouchableOpacity
          onPress={() => setCreatePollActive(true)}
          style={styles.newPollPressable}
        >
          <Text style={styles.pollPressableText}>Create New Poll</Text>
        </TouchableOpacity>
      </View>
      <Spacer width="100%" height={20} />
      <CreateAndEditModals
        questionsModalActive={questionsModalActive}
        editPollActive={editPollActive}
        createPollActive={createPollActive}
        deletingModalActive={deletingModalActive}
        setQuestionsModalActive={setQuestionsModalActive}
        setEditPollActive={setEditPollActive}
        setCreatePollActive={setCreatePollActive}
        setDeletingModalActive={setDeletingModalActive}
        userData={userData}
        setDraftsChanged={setDraftsChanged}
        publishingPollActive={publishingPollActive}
        setPublishingPollActive={setPublishingPollActive}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFF",
  },
  titleText: {
    fontFamily: "Lato_400Regular",
    fontSize: 20,
    color: "#853b30",
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
    borderColor: "#853b30",
    backgroundColor: "#ffeae9",
  },
  pollContainer: {
    backgroundColor: "#853b30",
    width: "100%",
    padding: 20,
    borderRadius: 5,
  },
  emptyPollText: {
    color: "#FFF",
    fontSize: 20,
    textAlign: "center",
    flex: 1,
    position: "absolute",
    width: "100%",
    paddingLeft: 20,
    fontFamily: "Lato_400Regular",
  },
  newPollPressable: {
    padding: 20,
    backgroundColor: "#853b30",
    borderRadius: 7.5,
  },
  pollPressableText: {
    color: "#FFF",
    fontSize: 20,
    fontFamily: "Lato_400Regular",
  },
  pollDraftMain: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
    backgroundColor: "#853b30",
    borderWidth: 2.5,
    borderColor: "#FFF",
  },
  pollDraftBottomText: {
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
    color: "#853b30",
  },
  pollDraftTitle: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 25,
    textAlign: "center",
  },
  slidingWindowParent: {
    zIndex: 2,
    flexDirection: "row",
    left: 0,
    height: "100%",
    position: "absolute",
    backgroundColor: "#FFF",
  },
  draftButtonContainer: {
    backgroundColor: "#853b30",
    padding: 7.5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
