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
import percentRound from "percent-round";
import React, { useEffect, useRef, useState } from "react";
import { DAYS_OF_WEEK, TIME_UNITS } from "../constants/localization";
import {
  PollDraftInfo,
  getPollDrafts,
  updatePollDraft,
  removePollDraft,
  getPublishedPollsForUser,
  PublishedPollWithID,
  extendPollDeadline,
  closePublishedPoll,
  getPollStatus,
  INTAKE_FILTERS,
  getFilterData,
  DEMOGRAPHIC_FILTER,
  FilteredInfo,
  FilteredQuestionInfo,
  getFilterDataForQuestion,
  ExtendedQuestion,
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
  TextInput,
  InteractionManager,
} from "react-native";
import { SCREEN_HEIGHT } from "../constants/dimensions";

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
  alt?: boolean;
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
  pollStatus: string;
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
        ????
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

const ResultButton = ({
  description,
  iconName,
  label,
  selected,
  setSelected,
  index,
}: {
  index: number;
  iconName: string;
  label: string;
  description: string;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const animationRef = useRef(
    new Animated.Value(selected === index ? 1 : 0)
  ).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome5);

  useEffect(() => {
    Animated.timing(animationRef, {
      toValue: selected === index ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  return (
    <AnimatedTouchable
      onPress={() => setSelected(index)}
      style={{
        width: "100%",
        borderWidth: 2.5,
        borderColor: "#FFF",
        padding: 15,
        borderRadius: 7.5,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: animationRef.interpolate({
          inputRange: [0, 1],
          outputRange: ["#853b30", "#FFF"],
        }),
      }}
    >
      <AnimatedIcon
        name={iconName}
        style={{
          fontSize: 30,
          color: animationRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["#FFF", "#853b30"],
          }),
        }}
      />
      <Spacer width={15} height="100%" />
      <Animated.View
        style={{
          width: 1,
          height: "100%",
          backgroundColor: animationRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["#FFF", "#853b30"],
          }),
        }}
      />
      <Spacer width={15} height="100%" />
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.Text
          style={{
            fontFamily: "Lato_700Bold",
            fontSize: 22.5,
            color: animationRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
          }}
        >
          {label}
        </Animated.Text>
        <Spacer width="100%" height={5} />
        <Animated.Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 15,
            color: animationRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
          }}
        >
          {description}
        </Animated.Text>
      </View>
    </AnimatedTouchable>
  );
};

const RBSpacer = () => (
  <>
    <Spacer width="100%" height={20} />
    <View
      style={{
        width: "100%",
        height: 1,
        backgroundColor: "#FFFFFF50",
      }}
    />
    <Spacer width="100%" height={20} />
  </>
);

const Counter = ({
  countTo,
  label,
  animationState,
}: {
  countTo: number;
  label: string;
  animationState: boolean;
}) => {
  const [count, setCount] = useState(0);
  const countAnimationRef = useRef(new Animated.Value(0)).current;
  const labelAnimationRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animationState)
      Animated.timing(countAnimationRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        let currCount = 0;
        const id = setInterval(() => {
          if (currCount === countTo) {
            Animated.timing(labelAnimationRef, {
              toValue: 1,
              duration: 250,
              useNativeDriver: false,
            }).start(() => clearInterval(id));
          } else {
            setCount(currCount + 1);
            currCount++;
          }
        }, 5);
      });
  }, [animationState]);

  return (
    <View
      style={{
        flexDirection: "row",
        width: "27.5%",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Animated.Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 30,
          color: "#853b30",
          transform: [{ scale: countAnimationRef }],
        }}
      >
        {count}
      </Animated.Text>
      <Animated.Text
        style={{
          fontFamily: "Lato_400Regular",
          color: "#853b30",
          fontSize: labelAnimationRef.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 30],
          }),
          width: labelAnimationRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
        }}
      >
        {" "}
        {countTo === 1 ? label.slice(0, -1) : label}
      </Animated.Text>
    </View>
  );
};

const DemographicSwitcher = ({
  filterRef,
  dataByFilter,
  filterLabel,
}: {
  filterRef: Animated.Value;
  dataByFilter: FilteredInfo;
  filterLabel: string;
}) => {
  const [selected, setSelected] = useState<"votes" | "likes">("votes");
  const voteRef = useRef(new Animated.Value(1)).current;
  const likeRef = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const votePercentages = percentRound(
    dataByFilter[filterLabel].map((item: any) => item.votes)
  );
  const likePercentages = percentRound(
    dataByFilter[filterLabel].map((item: any) => item.likes)
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(voteRef, {
        toValue: selected === "votes" ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(likeRef, {
        toValue: selected === "likes" ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selected]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#FFF",
        opacity: filterRef,
        zIndex: filterRef.interpolate({
          inputRange: [0, 1],
          outputRange: [-1, 1],
        }),
      }}
    >
      <Spacer width="100%" height={20} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync();
            setSelected("votes");
          }}
          style={{
            padding: 7.5,
            borderRadius: 5,
            borderWidth: 1.25,
            borderColor: "#853b30",
            backgroundColor: voteRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 15,
              color: voteRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#853b30", "#FFF"],
              }),
            }}
          >
            Votes
          </Animated.Text>
        </AnimatedPressable>
        <Spacer height={"100%"} width={40} />
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync();
            setSelected("likes");
          }}
          style={{
            padding: 7.5,
            borderRadius: 5,
            borderWidth: 1.25,
            borderColor: "#853b30",
            backgroundColor: likeRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 15,
              color: likeRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#853b30", "#FFF"],
              }),
            }}
          >
            Likes
          </Animated.Text>
        </AnimatedPressable>
      </View>
      <Spacer width="100%" height={20} />
      <View style={{ width: "100%", flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ alignItems: "center" }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {dataByFilter[filterLabel]
            .sort((a: any, b: any) => b.votes - a.votes)
            .map((item: any, index: number) => {
              let label = item[filterLabel];
              if (filterLabel === "hispanicOrLatino")
                label = label ? "Hispanic/Latino" : "Not Hispanic/Latino";
              if (filterLabel === "lgbtq")
                label = label ? "LGBTQ" : "Not LGBTQ";
              return (
                <Text
                  key={item}
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 20,
                    color: "#853b30",
                  }}
                >
                  {label}:{" "}
                  {selected === "votes"
                    ? `${votePercentages[index]}%`
                    : `${likePercentages[index]}%`}
                </Text>
              );
            })}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

const GlobalResultsScreen = ({
  pollData,
  animationState,
}: {
  pollData: PublishedPollWithID;
  animationState: boolean;
}) => {
  const [filtered, filter] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);
  const [dataByFilter, setDataByFilter] = useState<FilteredInfo>();
  const filterRef = useRef(new Animated.Value(0)).current;
  const buttonProgress = useRef(new Animated.Value(0)).current;
  const switchRef = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const currentFilter: DEMOGRAPHIC_FILTER =
    dataByFilter === undefined ? undefined : INTAKE_FILTERS[filterIndex];
  let filterLabel: string;
  if (currentFilter !== undefined) {
    switch (currentFilter) {
      case "Hispanic/Latino":
        filterLabel = "hispanicOrLatino";
        break;
      case "Political Affiliation":
        filterLabel = "politicalAffiliation";
        break;
      case "LGBTQ":
        filterLabel = "lgbtq";
        break;
      case "Income Level":
        filterLabel = "incomeLevel";
        break;
      case "Living Situation":
        filterLabel = "livingSituation";
        break;
      default:
        filterLabel = currentFilter.toLowerCase();
    }
  }

  const goNext = () => {
    Animated.timing(switchRef, {
      toValue: -1,
      duration: 125,
      useNativeDriver: true,
    }).start(() => {
      setFilterIndex((filterIndex + 1) % INTAKE_FILTERS.length);
      switchRef.setValue(1);
      Animated.timing(switchRef, {
        toValue: 0,
        duration: 125,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(buttonProgress, {
        toValue: filtered ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(filterRef, {
        toValue: filtered ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [filtered]);

  useEffect(() => {
    getFilterData(pollData.questions[0].votes, pollData.likes).then(
      (filterData) => setDataByFilter(filterData)
    );
  }, []);

  if (dataByFilter === undefined) return <LoadingScreen color="#853b30" />;

  return (
    <View style={{ width: "100%", height: "100%", padding: 20 }}>
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          alignItems: "center",
        }}
      >
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync();
            filter(!filtered);
          }}
          style={{
            padding: 5,
            borderRadius: 5,
            alignSelf: "flex-start",
            backgroundColor: buttonProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
            borderWidth: 1.25,
            borderColor: "#853b30",
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 15,
              color: buttonProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ["#853b30", "#FFF"],
              }),
            }}
          >
            Filter
          </Animated.Text>
        </AnimatedPressable>
        <Spacer width={10} height="100%" />
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: filterRef,
            width: filterRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        >
          <Animated.Text
            numberOfLines={1}
            style={{
              fontFamily: "Lato_400Regular",
              color: "#853b30",
              fontSize: 15,
            }}
          >
            Filtering By:{"  "}
          </Animated.Text>
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync();
              goNext();
            }}
            style={{
              padding: 5,
              flex: 1,
              backgroundColor: "#FFF",
              borderRadius: 5,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1.25,
              borderColor: "#853b30",
              opacity: filterRef.interpolate({
                inputRange: [0.25, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            <Animated.Text
              numberOfLines={1}
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 15,
                color: "#853b30",
                opacity: switchRef.interpolate({
                  inputRange: [-0.8, 0, 0.8],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateY: switchRef.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-30, 0, 30],
                    }),
                  },
                ],
              }}
            >
              {currentFilter}
            </Animated.Text>
          </AnimatedPressable>
        </Animated.View>
      </View>
      <View
        style={{
          width: "100%",
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Counter
          countTo={pollData.questions[0].votes.length}
          label={"Votes"}
          animationState={animationState}
        />
        <Spacer width="100%" height={40} />
        <Counter
          countTo={pollData.likes.length}
          label={"Likes"}
          animationState={animationState}
        />
        <Spacer width="100%" height={40} />
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 17.5,
            color: "#853b30",
          }}
        >
          More options coming soon!
        </Text>
        <DemographicSwitcher {...{ dataByFilter, filterLabel, filterRef }} />
      </View>
    </View>
  );
};

const getMCAnswerTotals = (
  votes: { answer: string; userID: string }[],
  answers: string[]
) => {
  const counter: number[] = [];
  for (const answer of answers) counter.push(0);

  for (const vote of votes) counter[answers.indexOf(vote.answer)]++;
  return counter;
};

const MCAnswerTotal = ({
  answer,
  percentage,
  last,
}: {
  answer: string;
  percentage: number;
  last: boolean;
}) => {
  return (
    <>
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#853b30",
        }}
      >
        {answer}: {percentage}%
      </Text>
      {!last && (
        <>
          <Spacer width="100%" height={10} />
          <View
            style={{
              height: 1,
              width: "100%",
              backgroundColor: "#853b3050",
            }}
          />
          <Spacer width="100%" height={10} />
        </>
      )}
    </>
  );
};

const FreeResponseGlobal = ({
  pollData,
  questionIndex,
}: {
  pollData: PublishedPollWithID;
  questionIndex: number;
}) => {
  const [currWordCount, setCurrWordCount] = useState(0);
  const [currLetterCount, setCurrLetterCount] = useState(0);
  const [mode, setMode] = useState<"stats" | "answers">("stats");
  const statsRef = useRef(new Animated.Value(1)).current;
  const answersRef = useRef(new Animated.Value(0)).current;
  const labelSlideRef = useRef(new Animated.Value(0)).current;
  const { votes } = pollData.questions[questionIndex];
  let averageWordCount = 0;
  let averageLetterCount = 0;
  if (votes.length > 0) {
    for (const vote of votes) {
      averageLetterCount += vote.answer.length;
      averageWordCount += vote.answer
        .split(/\s+/)
        .filter((item) => item !== "").length;
    }

    averageWordCount = Math.round((averageWordCount * 10) / votes.length) / 10;
    averageLetterCount =
      Math.round((averageLetterCount * 10) / votes.length) / 10;
  }

  useEffect(() => {
    Animated.timing(labelSlideRef, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      let wc = 0;
      let lc = 0;
      const id1 = setInterval(() => {
        if (wc === averageWordCount) {
          clearInterval(id1);
          return;
        }
        setCurrWordCount(wc + 1);
        wc++;
      }, 5);
      const id2 = setInterval(() => {
        if (lc === averageLetterCount) {
          clearInterval(id2);
          return;
        }
        setCurrLetterCount(lc + 1);
        lc++;
      }, 5);
    });
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(statsRef, {
        toValue: mode === "stats" ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(answersRef, {
        toValue: mode === "answers" ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mode]);

  return (
    <>
      <Spacer width="100%" height={10} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync();
            setMode("stats");
          }}
          style={{ alignItems: "center" }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
            }}
          >
            Stats
          </Text>
          <Spacer width="100%" height={2.5} />
          <Animated.View
            style={{
              height: 1,
              backgroundColor: "#853b30",
              width: "125%",
              transform: [{ scaleX: statsRef }],
            }}
          />
        </Pressable>
        <Spacer style={{ width: 40, height: "100%" }} />
        <Pressable
          onPress={() => {
            Haptics.impactAsync();
            setMode("answers");
          }}
          style={{ alignItems: "center" }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#853b30",
            }}
          >
            Answers
          </Text>
          <Spacer width="100%" height={2.5} />
          <Animated.View
            style={{
              height: 1,
              backgroundColor: "#853b30",
              width: "125%",
              transform: [{ scaleX: answersRef }],
            }}
          />
        </Pressable>
      </View>
      {mode === "stats" ? (
        <Animated.View
          style={{
            flex: 1,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            opacity: statsRef,
          }}
        >
          <Animated.Text
            numberOfLines={1}
            style={{
              fontFamily: "Lato_700Bold",
              color: "#853b30",
              left: 0,
              fontSize: 22.5,
              width: labelSlideRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          >
            Average Word Count: {currWordCount}
          </Animated.Text>
          <Spacer width={"100%"} height={20} />
          <Animated.Text
            numberOfLines={1}
            style={{
              fontFamily: "Lato_700Bold",
              color: "#853b30",
              left: 0,
              fontSize: 25,
              width: labelSlideRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            }}
          >
            Average Letter Count: {currLetterCount}
          </Animated.Text>
        </Animated.View>
      ) : votes.length === 0 ? (
        <Animated.View
          style={{
            flex: 1,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            opacity: answersRef,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              color: "#853b30",
              textAlign: "center",
            }}
          >
            Uh oh! There's no data for this question {":("}
          </Text>
        </Animated.View>
      ) : (
        <Animated.ScrollView
          contentContainerStyle={[
            {
              alignItems: "center",
            },
          ]}
          style={{
            flex: 1,
            width: "100%",
            opacity: answersRef,
          }}
        >
          {votes.map((vote, index) => (
            <>
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 20,
                  color: "#853b30",
                  textAlign: "center",
                }}
              >
                {vote.answer}
              </Text>
              {index !== votes.length - 1 && (
                <>
                  <Spacer width="100%" height={10} />
                  <View
                    style={{
                      width: "100%",
                      height: 1,
                      backgroundColor: "#853b30",
                    }}
                  />
                  <Spacer width="100%" height={10} />
                </>
              )}
            </>
          ))}
        </Animated.ScrollView>
      )}
    </>
  );
};

const SliderResponseGlobal = ({
  pollData,
  questionIndex,
  animationState,
}: {
  pollData: PublishedPollWithID;
  questionIndex: number;
  animationState: boolean;
}) => {
  const [currCount, setCurrCount] = useState(0);
  const avgRef = useRef(new Animated.Value(0)).current;
  const { votes } = pollData.questions[questionIndex];
  let average = 0;
  if (votes.length > 0) {
    for (const vote of votes) {
      average += parseInt(
        vote.answer[0] === "$" ? vote.answer.slice(1) : vote.answer
      );
    }
    average /= votes.length;
  }

  useEffect(() => {
    let current = 0;
    const id = setInterval(() => {
      if (current === average) {
        Animated.timing(avgRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
        clearInterval(id);
        return;
      }
      setCurrCount(current + 1);
      current++;
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
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 25,
          color: "#853b30",
        }}
      >
        {currCount}
      </Text>
      <Animated.View>
        <Spacer width="100%" height={5} />
        <Animated.Text
          numberOfLines={1}
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 25,
            color: "#853b30",
            alignSelf: "center",
            width: avgRef.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 157.5],
            }),
          }}
        >
          Average Value
        </Animated.Text>
      </Animated.View>
    </View>
  );
};

const GlobalQuestionData = ({
  pollData,
  questionIndex,
  animationState,
}: {
  pollData: PublishedPollWithID;
  questionIndex: number;
  animationState: boolean;
}) => {
  return (
    <View style={{ width: "100%", flex: 1 }}>
      {(() => {
        switch (pollData.questions[questionIndex].category) {
          case "Multiple Choice":
            const answerTotals = getMCAnswerTotals(
              pollData.questions[questionIndex].votes,
              pollData.questions[questionIndex].answers
            );
            const answerPercentages = percentRound(answerTotals);

            return (
              <>
                <Spacer width="100%" height={10} />
                <Text
                  style={{
                    alignSelf: "center",
                    fontFamily: "Lato_700Bold",
                    fontSize: 20,
                    color: "#853b30",
                  }}
                >
                  Answer Totals
                </Text>
                <Spacer width="100%" height={10} />
                <ScrollView
                  contentContainerStyle={{ alignItems: "center" }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                >
                  {pollData.questions[questionIndex].answers.map(
                    (answer: string, index: number, array: string[]) => (
                      <MCAnswerTotal
                        key={index}
                        answer={answer}
                        percentage={answerPercentages[index]}
                        last={index === array.length - 1}
                      />
                    )
                  )}
                </ScrollView>
              </>
            );
          case "Free Response":
            return <FreeResponseGlobal {...{ pollData, questionIndex }} />;
          case "Range (Slider)":
            return (
              <SliderResponseGlobal
                {...{ pollData, questionIndex, animationState }}
              />
            );
          default:
            return <View />;
        }
      })()}
    </View>
  );
};

const MCDemographicComponent = ({
  filterRef,
  filterLabel,
  dataByFilter,
}: {
  filterRef: Animated.Value;
  filterLabel: string;
  dataByFilter: FilteredQuestionInfo;
}) => {
  const answerCounts: any[] = [];
  for (const item of dataByFilter[filterLabel]) {
    const toPush: any = {};
    toPush[filterLabel] = item[filterLabel];

    for (const answer of item.answerTallies) {
      if (!(answer in toPush)) toPush[answer] = 1;
      else toPush[answer]++;
    }

    answerCounts.push(toPush);
  }

  for (const item of answerCounts) {
    const countArr: number[] = [];
    for (const key in item) if (key !== filterLabel) countArr.push(item[key]);
    const percentages = percentRound(countArr, 1);

    for (const key in item) {
      if (key !== filterLabel) {
        const foundIndex = countArr.indexOf(item[key]);
        item[key] = percentages[foundIndex];
      }
    }
  }

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#FFF",
        opacity: filterRef,
        zIndex: filterRef.interpolate({
          inputRange: [0, 1],
          outputRange: [-1, 1],
        }),
      }}
    >
      <Spacer width="100%" height={10} />
      <ScrollView style={{ width: "100%", flex: 1 }}>
        {answerCounts.map((item, index) => {
          const answers: string[] = [];
          for (const key in item) if (key !== filterLabel) answers.push(key);

          let displayedLabel = item[filterLabel];
          switch (filterLabel) {
            case "hispanicOrLatino":
              displayedLabel = displayedLabel
                ? "Hispanic/Latino"
                : "Not Hispanic/Latino";
              break;
            case "lgbtq":
              displayedLabel = displayedLabel ? "LGBTQ" : "Not LGBTQ";
          }

          return (
            <View key={index}>
              <Text
                style={{
                  fontFamily: "Lato_700Bold",
                  fontSize: 20,
                  color: "#853b30",
                }}
              >
                {displayedLabel}
              </Text>
              {answers.map((answer, index) => (
                <View key={index} style={{ width: "100%" }}>
                  <Spacer width="100%" height={5} />
                  <Text
                    style={{
                      fontFamily: "Lato_400Regular_Italic",
                      color: "#853b30",
                      fontSize: 15,
                    }}
                  >
                    {"\u2022\t"}
                    {answer}: {item[answer]}%
                  </Text>
                </View>
              ))}
              {index !== answerCounts.length - 1 && (
                <>
                  <Spacer width="100%" height={10} />
                  <View
                    style={{
                      width: "100%",
                      height: 1,
                      backgroundColor: "#853b3050",
                    }}
                  />
                  <Spacer width="100%" height={10} />
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
};

const SliderDemographicComponent = ({
  dataByFilter,
  filterLabel,
  filterRef,
}: {
  filterRef: Animated.Value;
  filterLabel: string;
  dataByFilter: FilteredQuestionInfo;
}) => {
  const data = dataByFilter[filterLabel];

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#FFF",
        opacity: filterRef,
        zIndex: filterRef.interpolate({
          inputRange: [0, 1],
          outputRange: [-1, 1],
        }),
      }}
    >
      {data.length > 0 ? (
        <>
          <Spacer width="100%" height={10} />
          <ScrollView style={{ width: "100%", flex: 1 }}>
            {data.map((item: any, index: number) => {
              let average = 0;
              for (const answer of item.answerTallies) {
                let num = parseInt(
                  answer[0] === "$" ? answer.slice(1) : answer
                );
                average += num;
              }
              average /= item.answerTallies.length;

              let displayedLabel = item[filterLabel];
              switch (filterLabel) {
                case "hispanicOrLatino":
                  displayedLabel = displayedLabel
                    ? "Hispanic/Latino"
                    : "Not Hispanic/Latino";
                  break;
                case "lgbtq":
                  displayedLabel = displayedLabel ? "LGBTQ" : "Not LGBTQ";
              }

              return (
                <View key={index} style={{ width: "100%" }}>
                  <Spacer width="100%" height={10} />
                  <Text
                    style={{
                      fontFamily: "Lato_400Regular_Italic",
                      color: "#853b30",
                      fontSize: 15,
                    }}
                  >
                    {"\u2022\t"}
                    {displayedLabel}: {average}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : (
        <View
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              color: "#853b30",
              textAlign: "center",
            }}
          >
            Uh oh! There's no data for this question {":("}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const DemographicSwitcherForQuestion = ({
  filterLabel,
  filterRef,
  dataByFilter,
  category,
}: {
  filterLabel: string;
  filterRef: Animated.Value;
  dataByFilter: FilteredQuestionInfo;
  category: ExtendedQuestion["category"];
}) => {
  switch (category) {
    case "Multiple Choice":
      return (
        <MCDemographicComponent {...{ dataByFilter, filterLabel, filterRef }} />
      );
    case "Range (Slider)":
      return (
        <SliderDemographicComponent
          {...{ dataByFilter, filterLabel, filterRef }}
        />
      );
    default:
      return (
        <Animated.View
          style={{
            position: "absolute",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#FFF",
            opacity: filterRef,
            zIndex: filterRef.interpolate({
              inputRange: [0, 1],
              outputRange: [-1, 1],
            }),
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 30,
              color: "#853b30",
            }}
          >
            Coming soon!
          </Text>
        </Animated.View>
      );
  }
};

const QuestionResults = ({
  pollData,
  questionIndex,
  animationState,
}: {
  pollData: PublishedPollWithID;
  questionIndex: number;
  animationState: boolean;
}) => {
  const [filtered, filter] = useState(false);
  const [filterIndex, setFilterIndex] = useState(0);
  const [dataByFilter, setDataByFilter] = useState<FilteredQuestionInfo>();
  const opacity = useRef(new Animated.Value(0)).current;
  const filterRef = useRef(new Animated.Value(0)).current;
  const switchRef = useRef(new Animated.Value(0)).current;
  const buttonProgress = useRef(new Animated.Value(0)).current;
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const currentFilter: DEMOGRAPHIC_FILTER = INTAKE_FILTERS[filterIndex];
  let filterLabel: string;
  if (currentFilter !== undefined) {
    switch (currentFilter) {
      case "Hispanic/Latino":
        filterLabel = "hispanicOrLatino";
        break;
      case "Political Affiliation":
        filterLabel = "politicalAffiliation";
        break;
      case "LGBTQ":
        filterLabel = "lgbtq";
        break;
      case "Income Level":
        filterLabel = "incomeLevel";
        break;
      case "Living Situation":
        filterLabel = "livingSituation";
        break;
      default:
        filterLabel = currentFilter.toLowerCase();
    }
  }

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const goNext = () => {
    Animated.timing(switchRef, {
      toValue: -1,
      duration: 125,
      useNativeDriver: true,
    }).start(() => {
      setFilterIndex((filterIndex + 1) % INTAKE_FILTERS.length);
      switchRef.setValue(1);
      Animated.timing(switchRef, {
        toValue: 0,
        duration: 125,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(buttonProgress, {
        toValue: filtered ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(filterRef, {
        toValue: filtered ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [filtered]);

  useEffect(() => {
    getFilterDataForQuestion(pollData.questions[questionIndex]).then((data) =>
      setDataByFilter(data)
    );
  }, []);

  if (dataByFilter === undefined) return <LoadingScreen color="#853b30" />;

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        padding: 20,
        opacity,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          width: "100%",
          alignItems: "center",
        }}
      >
        <AnimatedPressable
          onPress={() => {
            Haptics.impactAsync();
            filter(!filtered);
          }}
          style={{
            padding: 5,
            borderRadius: 5,
            alignSelf: "flex-start",
            backgroundColor: buttonProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#853b30"],
            }),
            borderWidth: 1.25,
            borderColor: "#853b30",
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 15,
              color: buttonProgress.interpolate({
                inputRange: [0, 1],
                outputRange: ["#853b30", "#FFF"],
              }),
            }}
          >
            Filter
          </Animated.Text>
        </AnimatedPressable>
        <Spacer width={10} height="100%" />
        <Animated.View
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: filterRef,
            width: filterRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          }}
        >
          <Animated.Text
            numberOfLines={1}
            style={{
              fontFamily: "Lato_400Regular",
              color: "#853b30",
              fontSize: 15,
            }}
          >
            Filtering By:{"  "}
          </Animated.Text>
          <AnimatedPressable
            onPress={() => {
              Haptics.impactAsync();
              goNext();
            }}
            style={{
              padding: 5,
              flex: 1,
              backgroundColor: "#FFF",
              borderRadius: 5,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1.25,
              borderColor: "#853b30",
              opacity: filterRef.interpolate({
                inputRange: [0.25, 1],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            }}
          >
            <Animated.Text
              numberOfLines={1}
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 15,
                color: "#853b30",
                opacity: switchRef.interpolate({
                  inputRange: [-0.8, 0, 0.8],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateY: switchRef.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-30, 0, 30],
                    }),
                  },
                ],
              }}
            >
              {currentFilter}
            </Animated.Text>
          </AnimatedPressable>
        </Animated.View>
      </View>
      <View
        style={{
          width: "100%",
          flex: 1,
          alignItems: "center",
        }}
      >
        <Animated.Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#853b30",
            fontSize: 25,
            position: "absolute",
            top: -30,
            opacity: filterRef.interpolate({
              inputRange: [0, 0.25],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          }}
        >
          {pollData.questions[questionIndex].question}
        </Animated.Text>
        <GlobalQuestionData
          pollData={pollData}
          questionIndex={questionIndex}
          animationState={animationState}
        />
        <DemographicSwitcherForQuestion
          {...{
            filterLabel,
            filterRef,
            dataByFilter,
            category: pollData.questions[questionIndex].category,
          }}
        />
      </View>
    </Animated.View>
  );
};

const getResultScreen = (
  mode: number,
  pollData: PublishedPollWithID,
  animationState: boolean
) => {
  switch (mode) {
    case 0:
      return (
        <GlobalResultsScreen
          pollData={pollData}
          animationState={animationState}
        />
      );
    case 1:
      return (
        <QuestionResults
          pollData={pollData}
          questionIndex={mode - 1}
          animationState={animationState}
        />
      );
    default:
      return <View />;
  }
};

const ViewResultsModal = ({
  visible,
  setVisible,
  pollData,
  animationState,
  setAnimationState,
}: {
  visible: boolean;
  animationState: boolean;
  pollData: PublishedPollWithID;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setAnimationState: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [mode, setMode] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const animationProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // helps once its closed to restart animation back up
    if (animationState) setVisible(true);

    Animated.parallel([
      Animated.timing(animationProgress, {
        delay: animationState ? 350 : 0,
        toValue: animationState ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!animationState) setVisible(false);
    });
  }, [animationState]);

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
          backgroundColor: "#853b30",
          padding: 20,
        }}
      >
        <TouchableOpacity
          onPress={() => setAnimationState(false)}
          style={{ padding: 10, left: -10, top: -10 }}
        >
          <FontAwesome5 name="times" style={{ fontSize: 25, color: "#FFF" }} />
        </TouchableOpacity>
        <Animated.Text
          style={{
            alignSelf: "center",
            fontSize: 45,
            fontFamily: "Lato_400Regular",
            color: "#FFF",
            top: -40,
            transform: [{ scale: animationProgress }],
          }}
        >
          {pollData.pollData.title}
        </Animated.Text>
        <Animated.View
          style={{
            top: -25,
            width: "100%",
            flex: 1,
            alignItems: "center",
            opacity: animationProgress,
          }}
        >
          <View
            style={{
              width: "100%",
              height: 300,
              backgroundColor: "#FFF",
              borderRadius: 10,
            }}
          >
            {getResultScreen(mode, pollData, animationState)}
          </View>
          <Spacer width="100%" height={20} />
          <ScrollView style={{ width: "100%", flex: 1 }}>
            <ResultButton
              description="See aggregate information for your poll! Here you can find
              your poll's total likes, total votes, and more!"
              iconName="globe-americas"
              label="Global Poll Information"
              selected={mode}
              setSelected={setMode}
              index={0}
            />
            <RBSpacer />
            {pollData.questions.map((question, index) => {
              return (
                <ResultButton
                  key={index}
                  iconName="poll"
                  label={question.question}
                  description={`See results for question #${index + 1}!`}
                  selected={mode}
                  setSelected={setMode}
                  index={index + 1}
                />
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const PublishedButtonContainer = ({
  poll,
  openCircularRef,
  interactionMenuOpen,
  openInteractionMenu,
  pollStatus,
}: PublishedButtonContainerProps) => {
  const [extendTimeModalVisible, setETModalVisible] = useState(false);
  const [closePollModalVisible, setCloseModalVisible] = useState(false);
  const [viewResultsModalVisible, setVRModalVisible] = useState(false);
  const [vrAnimationState, setVRAnimationState] = useState(false);

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
          onPress={() => setVRAnimationState(true)}
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
        {pollStatus !== "expired" && (
          <TouchableOpacity
            onPress={() => setETModalVisible(true)}
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
        )}
        {pollStatus !== "expired" && (
          <TouchableOpacity
            disabled={!interactionMenuOpen}
            style={styles.draftButtonContainer}
            onPress={() => setCloseModalVisible(true)}
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
        )}
      </Animated.View>
      <ExtendTimeModal
        visible={extendTimeModalVisible}
        setVisible={setETModalVisible}
        pollData={poll}
      />
      <ClosePollModal
        pollData={poll}
        visible={closePollModalVisible}
        setVisible={setCloseModalVisible}
      />
      <ViewResultsModal
        pollData={poll}
        visible={viewResultsModalVisible}
        setVisible={setVRModalVisible}
        animationState={vrAnimationState}
        setAnimationState={setVRAnimationState}
      />
    </Animated.View>
  );
};

const ClosePollModal = ({
  visible,
  pollData,
  setVisible,
}: {
  visible: boolean;
  pollData: PublishedPollWithID;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        onPress={() => setVisible(false)}
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        }}
      >
        <Pressable
          style={{
            width: 300,
            height: 300,
            padding: 20,
            borderRadius: 10,
            backgroundColor: "#FFF",
          }}
        >
          <Text
            style={{
              alignSelf: "center",
              fontFamily: "Lato_400Regular",
              fontSize: 25,
              color: "#853b30",
            }}
          >
            Closing Published Poll!
          </Text>
          <View
            style={{
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 22.5,
                color: "#853b30",
              }}
            >
              <Text>Are you sure that you want to close this poll? </Text>
              <Text style={{ fontFamily: "Lato_700Bold" }}>
                This cannot be undone.
              </Text>
            </Text>
          </View>
          <Spacer width="100%" height={20} />
          <View style={{ width: "65%", alignSelf: "center" }}>
            <TouchableOpacity
              onPress={async () => {
                await closePublishedPoll(pollData.id);
                setVisible(false);
              }}
              style={{
                padding: 10,
                backgroundColor: "#853b30",
                borderRadius: 5,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 15,
                    color: "#FFF",
                  }}
                >
                  Yes,{" "}
                </Text>
                <Text
                  style={{
                    fontFamily: "Lato_700Bold",
                    fontSize: 15,
                    color: "#FFF",
                  }}
                >
                  Close My Poll
                </Text>
              </Text>
            </TouchableOpacity>
            <Spacer width="100%" height={20} />
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{
                padding: 10,
                backgroundColor: "#853b30",
                borderRadius: 5,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 15,
                    color: "#FFF",
                  }}
                >
                  No,{" "}
                </Text>
                <Text
                  style={{
                    fontFamily: "Lato_700Bold",
                    fontSize: 15,
                    color: "#FFF",
                  }}
                >
                  Take Me Back
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const ExtendTimeModal = ({
  visible,
  pollData,
  setVisible,
}: {
  visible: boolean;
  pollData: PublishedPollWithID;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [unitID, setUnitID] = useState(0);
  const [deadlineVal, setDeadlineVal] = useState("");
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;
  const textAnimationRef = useRef(new Animated.Value(0)).current;
  const submitButtonOpacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    let valid: boolean;
    if (deadlineVal === "") valid = false;
    else {
      const parsed = parseInt(deadlineVal);
      if (parsed === 0 || isNaN(parsed)) valid = false;
      else valid = true;
    }

    Animated.timing(submitButtonOpacity, {
      toValue: valid ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [deadlineVal]);

  const getNextUnit = () => {
    Animated.timing(textAnimationRef, {
      toValue: -1,
      duration: 125,
      useNativeDriver: true,
    }).start(() => {
      setUnitID((unitID + 1) % TIME_UNITS.length);
      textAnimationRef.setValue(1);
      Animated.timing(textAnimationRef, {
        toValue: 0,
        duration: 125,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable
        onPress={() => setVisible(false)}
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Animated.View
          style={{
            width: 300,
            borderRadius: 5,
            backgroundColor: "#FFF",
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
          <Pressable>
            <Text
              style={{
                alignSelf: "center",
                fontFamily: "Lato_400Regular",
                fontSize: 25,
                color: "#853b30",
              }}
            >
              Extend Deadline
            </Text>
            <Spacer width="100%" height={20} />
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                keyboardType="number-pad"
                selectionColor="#FFF"
                value={deadlineVal}
                onChangeText={(text) => setDeadlineVal(text)}
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
                  flex: 1,
                  height: "100%",
                  borderRadius: 5,
                  backgroundColor: "#853b30",
                  padding: 10,
                  fontSize: 20,
                  fontFamily: "Lato_400Regular",
                  color: "#FFF",
                  textAlign: "center",
                }}
              />
              <Spacer width={20} height="100%" />
              <TouchableOpacity
                onPress={() => getNextUnit()}
                style={{
                  width: 100,
                  height: "100%",
                  borderRadius: 5,
                  borderWidth: 2.5,
                  borderColor: "#853b30",
                }}
              >
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
                      fontSize: 20,
                      color: "#853b30",
                      opacity: textAnimationRef.interpolate({
                        inputRange: [-1, 0, 1],
                        outputRange: [0, 1, 0],
                        extrapolate: "clamp",
                      }),
                      transform: [
                        {
                          translateY: textAnimationRef.interpolate({
                            inputRange: [-1, 0, 1],
                            outputRange: [-40, 0, 40],
                          }),
                        },
                      ],
                    }}
                  >
                    {TIME_UNITS[unitID]}
                  </Animated.Text>
                </View>
              </TouchableOpacity>
            </View>
            <Spacer width="100%" height={20} />
            <AnimatedTouchable
              onPress={() => {
                extendPollDeadline(
                  pollData,
                  parseInt(deadlineVal),
                  TIME_UNITS[unitID]
                );
                setVisible(false);
              }}
              disabled={deadlineVal === ""}
              style={{
                alignSelf: "center",
                padding: 10,
                backgroundColor: "#853b30",
                borderRadius: 5,
                opacity: submitButtonOpacity,
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 20,
                  color: "#FFF",
                }}
              >
                Submit
              </Text>
            </AnimatedTouchable>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const PublishedPollPreview = ({
  poll,
  last,
  alt,
}: PublishedPollPreviewProps) => {
  const { title, description, additionalInfo } = poll.pollData;
  const { expirationTime } = poll;
  const parsedTimestamp = moment(parseInt(expirationTime))
    .tz(Localization.timezone)
    .format("LLLL")
    .split(" ");

  const [extraInfoOpen, openExtraInfo] = useState(false);
  const [interactionMenuOpen, openInteractionMenu] = useState(false);
  const [pollStatus, setPollStatus] = useState("");
  const openCircularRef = useRef(new Animated.Value(0)).current;
  const slideAnimationRef = useRef(new Animated.Value(0)).current;

  handleDraftAnimations(
    extraInfoOpen,
    interactionMenuOpen,
    slideAnimationRef,
    openCircularRef
  );

  useEffect(() => {
    getPollStatus(poll.id).then((status) =>
      setPollStatus(status === undefined ? "" : status)
    );
  }, []);

  return (
    <>
      <View style={[styles.pollDraftMain, alt && { borderColor: "#853b30" }]}>
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
            pollStatus={pollStatus}
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
          {pollStatus === "expired" ? (
            <Text style={styles.pollDraftBottomText}>Poll Expired!</Text>
          ) : (
            <Text style={styles.pollDraftBottomText}>
              Available Until: {parsedTimestamp[0]} {parsedTimestamp[1]}{" "}
              {parsedTimestamp[2]} {parsedTimestamp[3]} at {parsedTimestamp[4]}{" "}
              {parsedTimestamp[5]}
            </Text>
          )}
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
      getPublishedPollsForUser(userData.id).then((publishedPolls) => {
        setPublished(publishedPolls);
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

export { PublishedPollPreview };

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
