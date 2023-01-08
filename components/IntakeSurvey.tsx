import Spacer, { AnimatedSpacer } from "./Spacer";
import * as Haptics from "expo-haptics";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useRef, useState } from "react";
import { COUNTRIES, MONTHS } from "../constants/localization";
import { SCREEN_HEIGHT } from "../constants/dimensions";
import { UNIVERSITIES } from "../constants/us_institutions";
import { STATES_CITIES } from "../constants/US_States_and_Cities";
import {
  AFFILIATION,
  EDUCATION_LEVEL,
  EDUCATION_LEVELS,
  GENDER,
  GENDERS,
  INCOME_LEVEL,
  INCOME_LEVELS,
  JOB,
  JOBS,
  LIVING_SITUATIONS,
  LS,
  PET,
  PETS,
  POLITICAL_AFFILIATION,
  RACE,
  RACES,
  RELIGION,
  RELIGIONS,
  convertToEL,
  convertToIL,
  convertToJob,
  convertToLS,
  convertToPet,
  convertToRace,
  convertToReligion,
  getPA,
} from "../constants/demographics";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Keyboard,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Slider, { SliderComponent } from "@react-native-community/slider";
import { submitIntakeSurvey } from "../firebase";
import LoadingScreen from "./LoadingScreen";

const NUM_SCREENS = 15;

const QUESTIONS: string[] = [
  "What's your name?",
  "What school/university do you attend? (if any)",
  "What is your highest level of education?",
  "Where are you located?",
  "When is your birthday?",
  "What gender do you identify as? (if you're comfortable)",
  "What is your race?",
  "Are you Hispanic or Latino?",
  "Where do you lie on the political spectrum?",
  "Are you a member of the LGBTQ community?",
  "What is your annual household income?",
  "Do you work?",
  "Do you practice a religion?",
  "Do you have any pets?",
  "What is your current living situation?",
];

export function IntakeSurveyIndicator({ navigation }) {
  const growAnimationProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(growAnimationProgress, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
        Animated.timing(growAnimationProgress, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.indicatorContainer, styles.centerView]}>
      <Animated.Text
        style={[
          styles.promptText,
          {
            transform: [
              {
                scale: growAnimationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
            ],
          },
        ]}
      >
        Please take the intake survey to get started!
      </Animated.Text>
      <Spacer width="100%" height={100} />
      <TouchableOpacity
        style={[styles.openSurveyButton, styles.centerView]}
        onPress={() => {
          navigation.push("Poll");
        }}
      >
        <Text style={styles.buttonText}>Open Survey</Text>
      </TouchableOpacity>
    </View>
  );
}

const getQuestionScreens = (
  keyboardDodgeRef: Animated.Value,
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>,
  answers: string[],
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>,
  userID: string,
  triggerClose: React.Dispatch<React.SetStateAction<boolean>>,
  setIntakeSurvey: React.Dispatch<React.SetStateAction<boolean>>
) => {
  return [
    <NameScreen
      keyboardDodgeRef={keyboardDodgeRef}
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <SchoolScreen
      keyboardDodgeRef={keyboardDodgeRef}
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <EducationScreen
      keyboardDodgeRef={keyboardDodgeRef}
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <LocationScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <BirthdayScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <GenderScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <RaceScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <EthnicityScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <PAScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <LGBTQScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <IncomeScreen
      answers={answers}
      setAnswers={setAnswers}
      triggerSwitch={triggerSwitch}
    />,
    <OccupationScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <ReligionScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <PetScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <LivingSituationScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
    />,
    <SubmitScreen
      triggerSwitch={triggerSwitch}
      answers={answers}
      setAnswers={setAnswers}
      userID={userID}
      triggerClose={triggerClose}
      setIntakeSurvey={setIntakeSurvey}
    />,
  ];
};

const DataSpacer = () => {
  return (
    <>
      <Spacer width="100%" height={20} />
      <View
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "#507DBC50",
          borderRadius: 2.5,
        }}
      />
      <Spacer width="100%" height={20} />
    </>
  );
};

const RequiredData = ({
  description,
  forUSOnly,
  iconName,
  label,
}: {
  description: string;
  forUSOnly?: boolean;
  iconName: string;
  label: string;
}) => {
  return (
    <View
      style={{
        width: "100%",
        flexDirection: "row",
        padding: 10,
        borderRadius: 5,
        borderWidth: 1.25,
        borderColor: "#507DBC",
      }}
    >
      <FontAwesome5
        name={iconName}
        backgroundColor="#507DBC"
        style={{
          fontSize: 20,
          color: "#507DBC",
          borderWidth: 1,
          borderRadius: 5,
          padding: 5,
          borderColor: "#507DBC",
          alignSelf: "center",
        }}
      />
      <Spacer width={10} height="100%" />
      <View style={{ flex: 1, height: "100%", top: -5 }}>
        <Text
          style={{ fontFamily: "Lato_700Bold", color: "#507DBC", fontSize: 20 }}
        >
          {label}
        </Text>
        <Spacer width="100%" height={5} />
        <Text>
          {forUSOnly && (
            <Text
              style={{
                fontFamily: "Lato_700Bold",
                fontSize: 12.5,
                color: "#507DBC",
              }}
            >
              {"For US Users Only\n"}
            </Text>
          )}
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 12.5,
              color: "#507DBC",
            }}
          >
            {description}
          </Text>
        </Text>
      </View>
    </View>
  );
};

const NameScreen = ({
  keyboardDodgeRef,
  triggerSwitch,
  answers,
  setAnswers,
}: {
  keyboardDodgeRef: Animated.Value;
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [first, last] = answers[0].split(";");
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [next, goNext] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const submitButtonRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(submitButtonRef, {
      toValue: lastName === "" || firstName === "" ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [firstName, lastName]);

  useEffect(() => {
    if (next) {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => triggerSwitch(1));
      answers[0] = `${firstName};${lastName}`;
      setAnswers(answers);
    }
  }, [next]);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        // top: -40,
        opacity,
        transform: [
          {
            translateY: keyboardDodgeRef.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -SCREEN_HEIGHT / 5],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
        style={{
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            top: -40,
            fontFamily: "Lato_400Regular",
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          What's your name?
        </Text>
        <View style={{ top: -40 }}>
          <Spacer width="100%" height={40} />
        </View>
        <Text
          style={{
            top: -40,
            fontFamily: "Lato_400Regular",
            fontSize: 12.5,
            color: "#FFF",
            alignSelf: "flex-start",
            left: "10%",
          }}
        >
          First Name
        </Text>
        <View style={{ top: -40 }}>
          <Spacer width="100%" height={5} />
        </View>
        <TextInput
          autoCapitalize="words"
          selectionColor="#507DBC"
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
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
            width: "80%",
            backgroundColor: "#FFF",
            padding: 10,
            borderRadius: 5,
            textAlign: "center",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#507DBC",
            top: -40,
          }}
        />
        <View style={{ top: -40 }}>
          <Spacer width="100%" height={40} />
        </View>
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 12.5,
            color: "#FFF",
            alignSelf: "flex-start",
            left: "10%",
            top: -40,
          }}
        >
          Last Name
        </Text>
        <View style={{ top: -40 }}>
          <Spacer width="100%" height={5} />
        </View>
        <TextInput
          autoCapitalize="words"
          selectionColor="#507DBC"
          value={lastName}
          onChangeText={(text) => setLastName(text)}
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
            width: "80%",
            backgroundColor: "#FFF",
            padding: 10,
            borderRadius: 5,
            textAlign: "center",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#507DBC",
            top: -40,
          }}
        />
        <AnimatedTouchable
          disabled={firstName === "" || lastName === ""}
          onPress={() => goNext(true)}
          style={{
            position: "absolute",
            padding: 10,
            alignSelf: "center",
            borderRadius: 5,
            backgroundColor: "#FFF",
            bottom: 40,
            opacity: submitButtonRef,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              color: "#507DBC",
              fontSize: 20,
            }}
          >
            Next
          </Text>
        </AnimatedTouchable>
      </Pressable>
    </Animated.View>
  );
};

const SchoolScreen = ({
  keyboardDodgeRef,
  triggerSwitch,
  answers,
  setAnswers,
}: {
  keyboardDodgeRef: Animated.Value;
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [query, setQuery] = useState(answers[1]);
  const [searching, search] = useState(false);
  const [matchedUniversities, setMatchedUniversities] = useState<
    { institution: string }[]
  >([]);
  const opacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => search(false), [matchedUniversities]);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (searching) {
      if (query === "") setMatchedUniversities([]);
      else
        setMatchedUniversities(
          UNIVERSITIES.filter(({ institution }) =>
            RegExp(`${query}`, "i").test(institution)
          )
        );
    }
  }, [searching]);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        top: -20,
        opacity,
        transform: [
          {
            translateY: keyboardDodgeRef.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          What school/university do you attend? {"(if any)"}
        </Text>
        <Spacer width="100%" height={40} />
        <View
          style={{
            flexDirection: "row",
            width: "90%",
            borderWidth: 1,
            borderRadius: 7.5,
            borderColor: "#FFF",
            padding: 15,
            alignItems: "center",
          }}
        >
          <FontAwesome5 name="search" style={{ fontSize: 20, color: "#FFF" }} />
          <Spacer width={15} height="100%" />
          <View
            style={{
              width: 1,
              height: "100%",
              backgroundColor: "rgba(255, 255, 255, 0.75)",
            }}
          />
          <TextInput
            value={query}
            selectionColor="#FFF"
            onChangeText={(text) => setQuery(text)}
            onFocus={() =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
              }).start()
            }
            onBlur={() => {
              Animated.timing(keyboardDodgeRef, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start();
              search(true);
            }}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              color: "#FFF",
            }}
          />
        </View>
        <Spacer width="100%" height={40} />
        {searching ? (
          <View
            style={{
              flex: 1,
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator color="#FFF" size="large" />
          </View>
        ) : (
          <View
            style={{
              flex: 1,
              width: "100%",
            }}
          >
            <FlatList
              style={{ flex: 1, width: "100%" }}
              showsVerticalScrollIndicator={false}
              data={
                matchedUniversities.length <= 100 ? matchedUniversities : []
              }
              renderItem={({ item, index }) => (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setQuery(item.institution);
                      search(true);
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Lato_400Regular",
                        fontSize: 22.5,
                        color: "#FFF",
                        textAlign: "center",
                      }}
                    >
                      {item.institution}
                    </Text>
                  </TouchableOpacity>
                  {index === matchedUniversities.length - 1 ? (
                    <Spacer width="100%" height={40} />
                  ) : (
                    <>
                      <Spacer width="100%" height={20} />
                      <View
                        style={{
                          width: "100%",
                          height: 1,
                          backgroundColor: "rgba(255, 255, 255, 0.5)",
                        }}
                      />
                      <Spacer width="100%" height={20} />
                    </>
                  )}
                </>
              )}
            />
          </View>
        )}
        <Spacer width="100%" height={20} />
        <View
          style={{
            justifyContent: "center",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1));
            }}
            style={{
              padding: 10,
              borderRadius: 5,
              backgroundColor: "#FFF",
              width: 75,
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
              Back
            </Text>
          </TouchableOpacity>
          <Spacer height="100%" width={40} />
          <AnimatedTouchable
            onPress={() => {
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(1));
              answers[1] = query;
              setAnswers(answers);
            }}
            style={{
              padding: 10,
              borderRadius: 5,
              backgroundColor: "#FFF",
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
              Next
            </Text>
          </AnimatedTouchable>
        </View>
        <Spacer width="100%" height={40} />
      </Pressable>
    </Animated.View>
  );
};

const EducationLevel = ({
  index,
  level,
  selected,
  setSelected,
}: {
  index: number;
  level: EDUCATION_LEVEL;
  selected: EDUCATION_LEVEL;
  setSelected: React.Dispatch<React.SetStateAction<EDUCATION_LEVEL>>;
}) => {
  const selectionRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.timing(selectionRef, {
      toValue: selected === level ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  return (
    <>
      <AnimatedTouchable
        onPress={() => setSelected(selected === level ? undefined : level)}
        style={{
          padding: 20,
          borderRadius: 7.5,
          borderWidth: 2.5,
          borderColor: "#FFF",
          backgroundColor: selectionRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["#507DBC", "#FFF"],
          }),
        }}
      >
        <Animated.Text
          style={{
            alignSelf: "center",
            textAlign: "center",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: selectionRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#507DBC"],
            }),
          }}
        >
          {level}
        </Animated.Text>
      </AnimatedTouchable>
      {index !== EDUCATION_LEVELS.length - 1 ? (
        <>
          {/* making the spacers pressable makes it easy to scroll */}
          <Pressable style={{ width: "100%", height: 20 }} />
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              borderRadius: 2.5,
            }}
          />
          <Pressable style={{ width: "100%", height: 20 }} />
        </>
      ) : (
        <Spacer width="100%" height={40} />
      )}
    </>
  );
};

const EducationScreen = ({
  keyboardDodgeRef,
  triggerSwitch,
  answers,
  setAnswers,
}: {
  keyboardDodgeRef: Animated.Value;
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [selected, setSelected] = useState<EDUCATION_LEVEL>(
    convertToEL(answers[2])
  );
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
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
        top: -20,
        opacity,
        transform: [
          {
            translateY: keyboardDodgeRef.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            fontSize: 30,
            color: "#FFF",
            alignSelf: "center",
            textAlign: "center",
          }}
        >
          What is your highest level of education?
        </Text>
        <Spacer width="100%" height={40} />
        <ScrollView showsVerticalScrollIndicator={false}>
          {EDUCATION_LEVELS.map((level, index) => (
            <EducationLevel
              key={index}
              {...{ index, level, selected, setSelected }}
            />
          ))}
        </ScrollView>
        <Spacer width="100%" height={20} />
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{
              padding: 10,
              borderRadius: 5,
              backgroundColor: "#FFF",
              justifyContent: "center",
              alignItems: "center",
              width: 75,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                color: "#507DBC",
                fontFamily: "Lato_400Regular",
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          {selected !== undefined && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[2] = selected;
                  setAnswers(answers);
                }}
                style={{
                  padding: 10,
                  borderRadius: 5,
                  backgroundColor: "#FFF",
                  justifyContent: "center",
                  alignItems: "center",
                  width: 75,
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: "#507DBC",
                    fontFamily: "Lato_400Regular",
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
        <Spacer width="100%" height={40} />
      </Pressable>
    </Animated.View>
  );
};

const UpArrow = () => {
  return (
    <FontAwesome5 name="angle-up" style={{ fontSize: 20, color: "#FFF" }} />
  );
};

const DownArrow = () => {
  return (
    <FontAwesome5 name="angle-down" style={{ fontSize: 20, color: "#FFF" }} />
  );
};

const TickIcon = () => {
  return <FontAwesome5 name="check" style={{ fontSize: 20, color: "#FFF" }} />;
};

const LocationScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const result = answers[3].split(";");
  let country: string | null = null;
  let state: string | null = null;
  let hometown: string | null = null;
  if (result.length === 3) {
    country = result[0];
    state = result[1];
    hometown = result[2];
  }

  const [valid, setValid] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [hometownOpen, setHometownOpen] = useState(false);
  const [countryValue, setCountryValue] = useState<string | null>(country);
  const [stateValue, setStateValue] = useState<string | null>(state);
  const [hometownValue, setHometownValue] = useState<string | null>(hometown);
  const [countryItems, setCountryItems] = useState(
    COUNTRIES.map(({ country }) => {
      return { label: country, value: country };
    })
  );
  const [stateItems, setStateItems] = useState(
    (() => {
      const toReturn = [];
      for (const label in STATES_CITIES) toReturn.push({ label, value: label });
      return toReturn;
    })()
  );
  const [hometownItems, setHometownItems] = useState([]);

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (stateValue !== null)
      setHometownItems(
        STATES_CITIES[stateValue].map((label: string) => {
          return { label, value: label };
        })
      );
    else setHometownItems([]);
  }, [stateValue]);

  useEffect(() => {
    if (countryValue === null) setValid(false);
    else {
      if (countryValue !== "United States") setValid(true);
      else setValid(hometownValue !== null);
    }
  }, [countryValue, hometownValue]);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        {!stateOpen && !hometownOpen && (
          <>
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#FFF",
                fontSize: 30,
                textAlign: "center",
              }}
            >
              What is your home country?
            </Text>
            <Spacer width="100%" height={40} />
            <DropDownPicker
              searchable
              searchPlaceholder="Enter a country"
              searchPlaceholderTextColor="#FFF"
              searchContainerStyle={{ borderBottomColor: "#FFF" }}
              searchTextInputProps={{ selectionColor: "#FFF" }}
              searchTextInputStyle={{
                color: "#FFF",
                fontFamily: "Lato_400Regular",
                borderColor: "#FFF",
                textAlign: "center",
              }}
              placeholder="Select a country"
              placeholderStyle={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#FFF",
              }}
              open={countryOpen}
              value={countryValue}
              items={countryItems}
              setOpen={setCountryOpen}
              setValue={setCountryValue}
              setItems={setCountryItems}
              ArrowDownIconComponent={DownArrow}
              ArrowUpIconComponent={UpArrow}
              TickIconComponent={TickIcon}
              tickIconContainerStyle={{ position: "absolute", right: 10 }}
              textStyle={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#FFF",
                textAlign: "center",
              }}
              dropDownContainerStyle={{
                backgroundColor: "#507DBC",
                borderColor: "#FFF",
              }}
              style={{ borderColor: "#FFF", backgroundColor: "#507DBC" }}
            />
          </>
        )}
        {!countryOpen && countryValue === "United States" && (
          <>
            {!hometownOpen && (
              <>
                <Spacer width="100%" height={40} />
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#FFF",
                    fontSize: 30,
                    textAlign: "center",
                  }}
                >
                  What is your home state?
                </Text>
                <Spacer width="100%" height={40} />
                <DropDownPicker
                  searchable
                  searchPlaceholder="Enter a state"
                  searchPlaceholderTextColor="#FFF"
                  searchContainerStyle={{ borderBottomColor: "#FFF" }}
                  searchTextInputProps={{ selectionColor: "#FFF" }}
                  searchTextInputStyle={{
                    color: "#FFF",
                    fontFamily: "Lato_400Regular",
                    borderColor: "#FFF",
                    textAlign: "center",
                  }}
                  placeholder="Select a state"
                  placeholderStyle={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 20,
                    color: "#FFF",
                  }}
                  open={stateOpen}
                  value={stateValue}
                  items={stateItems}
                  setOpen={setStateOpen}
                  setValue={setStateValue}
                  setItems={setStateItems}
                  ArrowDownIconComponent={DownArrow}
                  ArrowUpIconComponent={UpArrow}
                  TickIconComponent={TickIcon}
                  tickIconContainerStyle={{ position: "absolute", right: 10 }}
                  textStyle={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 20,
                    color: "#FFF",
                    textAlign: "center",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: "#507DBC",
                    borderColor: "#FFF",
                  }}
                  style={{ borderColor: "#FFF", backgroundColor: "#507DBC" }}
                />
              </>
            )}
            {!stateOpen && stateValue !== null && (
              <>
                <Spacer width="100%" height={40} />
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#FFF",
                    fontSize: 30,
                    textAlign: "center",
                  }}
                >
                  What is your hometown?
                </Text>
                <Spacer width="100%" height={40} />
                <DropDownPicker
                  searchable
                  searchPlaceholder="Enter your hometown"
                  searchPlaceholderTextColor="#FFF"
                  searchContainerStyle={{ borderBottomColor: "#FFF" }}
                  searchTextInputProps={{ selectionColor: "#FFF" }}
                  searchTextInputStyle={{
                    color: "#FFF",
                    fontFamily: "Lato_400Regular",
                    borderColor: "#FFF",
                    textAlign: "center",
                  }}
                  placeholder="Select your hometown"
                  placeholderStyle={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 20,
                    color: "#FFF",
                  }}
                  open={hometownOpen}
                  value={hometownValue}
                  items={hometownItems}
                  setOpen={setHometownOpen}
                  setValue={setHometownValue}
                  setItems={setHometownItems}
                  ArrowDownIconComponent={DownArrow}
                  ArrowUpIconComponent={UpArrow}
                  TickIconComponent={TickIcon}
                  tickIconContainerStyle={{ position: "absolute", right: 10 }}
                  textStyle={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 20,
                    color: "#FFF",
                    textAlign: "center",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: "#507DBC",
                    borderColor: "#FFF",
                  }}
                  style={{ borderColor: "#FFF", backgroundColor: "#507DBC" }}
                />
              </>
            )}
          </>
        )}
        <View
          style={{
            position: "absolute",
            bottom: 20,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            flexDirection: "row",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{
              bottom: 20,
              padding: 10,
              backgroundColor: "#FFF",
              borderRadius: 5,
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
          </TouchableOpacity>
          {valid && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[3] =
                    countryValue === "United States"
                      ? `${countryValue};${stateValue};${hometownValue}`
                      : `${countryValue}`;
                  setAnswers(answers);
                }}
                style={{
                  bottom: 20,
                  padding: 10,
                  backgroundColor: "#FFF",
                  borderRadius: 5,
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
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const BirthdayScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const originalDate = useRef(new Date()).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const [valid, setValid] = useState(false);
  const [birthday, setBirthday] = useState(
    answers[4] === "" ? originalDate : new Date(answers[4])
  );

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    setValid(
      birthday.toLocaleDateString() !== originalDate.toLocaleDateString() &&
        birthday < originalDate
    );
  }, [birthday]);

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          When is your birthday?
        </Text>
        <View
          style={{
            width: "100%",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <View
            style={{ backgroundColor: "#FFF", borderRadius: 10, padding: 10 }}
          >
            <DateTimePicker
              mode="date"
              value={birthday}
              display="inline"
              themeVariant="light"
              accentColor="#507DBC"
              textColor="#507DBC"
              onChange={(event, selectedDate) => {
                setBirthday(selectedDate);
              }}
            />
          </View>
        </View>
        <Spacer width="100%" height={40} />
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ padding: 10, borderRadius: 5, backgroundColor: "#FFF" }}
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
          </TouchableOpacity>
          {valid && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                disabled={!valid}
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[4] = birthday.toLocaleDateString();
                  setAnswers(answers);
                }}
                style={{
                  padding: 10,
                  borderRadius: 5,
                  backgroundColor: "#FFF",
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
              </TouchableOpacity>
            </>
          )}
        </View>
        <Spacer width="100%" height={40} />
      </Pressable>
    </Animated.View>
  );
};

const convertToGender = (arg: string): GENDER => {
  switch (arg) {
    case "Female":
      return "Female";
    case "Male":
      return "Male";
    case "Non-Binary":
      return "Non-Binary";
    default:
      return "Prefer Not To Say";
  }
};

const convertToString = (arg: any): string => {
  return arg;
};

const GenderScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const gender: GENDER = convertToGender(answers[5]);

  const [index, setIndex] = useState(
    convertToString(gender) === "" ? -1 : GENDERS.indexOf(gender)
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const itemSwapRef = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    Animated.timing(itemSwapRef, {
      toValue: -1,
      duration: 125,
      useNativeDriver: true,
    }).start(() => {
      setIndex((index + 1) % GENDERS.length);
      itemSwapRef.setValue(1);
      Animated.timing(itemSwapRef, {
        toValue: 0,
        duration: 125,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(
    () =>
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(),
    []
  );

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            color: "#FFF",
            fontSize: 30,
            textAlign: "center",
          }}
        >
          What gender do you identify as?{" (if you're comfortable)"}
        </Text>
        <Spacer width="100%" height={40} />
        <Pressable
          onPress={() => {
            // this error is caused by some inconsistencies w/ the types
            // in the Haptics library. this is the correct argument.
            Haptics.impactAsync();
            goNext();
          }}
          style={{
            width: 250,
            padding: 15,
            borderRadius: 5,
            backgroundColor: "#FFF",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#507DBC",
              textAlign: "center",
              transform: [
                {
                  translateY: itemSwapRef.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-50, 0, 50],
                  }),
                },
              ],
            }}
          >
            {index === -1 ? "Press to select" : GENDERS[index]}
          </Animated.Text>
        </Pressable>
        <View
          style={{
            bottom: 20,
            position: "absolute",
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ backgroundColor: "#FFF", borderRadius: 5, padding: 10 }}
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
          </TouchableOpacity>
          {index !== -1 && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[5] = GENDERS[index];
                  setAnswers(answers);
                }}
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 5,
                  padding: 10,
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
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const RaceItem = ({
  race,
  last,
  index,
  selected,
  setSelected,
  scrollViewRef,
  otherVal,
  setOtherVal,
}: {
  race: RACE;
  last: boolean;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  index: number;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  otherVal: string;
  setOtherVal: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [focused, focus] = useState(false);
  const spacerHeight = useRef(new Animated.Value(0)).current;
  const selectionRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const isOther = index === RACES.length - 1;

  useEffect(() => {
    focus(selected !== undefined && selected === index);
  }, [selected]);

  useEffect(() => {
    Animated.timing(selectionRef, {
      toValue: focused ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  return (
    <>
      {last ? (
        // animatedtouchable doesn't work as a parent w/ a textinput as a child
        <TouchableOpacity
          onPress={() => setSelected(selected === index ? undefined : index)}
          style={{
            borderColor: "#FFF",
            borderWidth: 2.5,
            borderRadius: 7.5,
          }}
        >
          <Animated.View
            style={{
              width: "100%",
              padding: 15,
              backgroundColor: selectionRef.interpolate({
                inputRange: [0, 0.25],
                outputRange: ["#507DBC", "#FFF"],
                extrapolate: "clamp",
              }),
            }}
          >
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 22.5,
                textAlign: "center",
                color: selectionRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#FFF", "#507DBC"],
                }),
              }}
            >
              {race}
            </Animated.Text>
            {isOther && (
              <Animated.View
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  backgroundColor: "#FFF",
                  left: 15,
                  top: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  zIndex: selectionRef.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-1, 1],
                  }),
                  opacity: selectionRef,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 15,
                    color: "#507DBC",
                  }}
                >
                  Specify
                </Text>
                <Spacer width={15} height="100%" />
                <View
                  style={{
                    backgroundColor: "#507DBC",
                    width: 1,
                    height: "100%",
                  }}
                />
                <TextInput
                  selectionColor="#507DBC"
                  value={otherVal}
                  onChangeText={(text) => setOtherVal(text)}
                  onFocus={() =>
                    Animated.timing(spacerHeight, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: false,
                    }).start(() => scrollViewRef.current.scrollToEnd())
                  }
                  onBlur={() =>
                    Animated.timing(spacerHeight, {
                      toValue: 0,
                      duration: 250,
                      useNativeDriver: false,
                    }).start()
                  }
                  style={{
                    flex: 1,
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    textAlign: "center",
                    fontSize: 22.5,
                  }}
                />
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <AnimatedTouchable
          onPress={() => setSelected(selected === index ? undefined : index)}
          style={{
            padding: 15,
            borderColor: "#FFF",
            borderWidth: 2.5,
            borderRadius: 7.5,
            backgroundColor: selectionRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#507DBC", "#FFF"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              textAlign: "center",
              color: selectionRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#FFF", "#507DBC"],
              }),
            }}
          >
            {race}
          </Animated.Text>
          {isOther && (
            <Animated.View
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                backgroundColor: "#FFF",
                left: 15,
                top: 15,
                flexDirection: "row",
                alignItems: "center",
                zIndex: selectionRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-1, 1],
                }),
                opacity: selectionRef,
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 15,
                  color: "#507DBC",
                }}
              >
                Specify
              </Text>
              <Spacer width={15} height="100%" />
              <View
                style={{ backgroundColor: "#507DBC", width: 1, height: "100%" }}
              />
              <TextInput
                selectionColor="#507DBC"
                value={otherVal}
                onChangeText={(text) => setOtherVal(text)}
                onFocus={() =>
                  Animated.timing(spacerHeight, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: false,
                  }).start(() => scrollViewRef.current.scrollToEnd())
                }
                onBlur={() =>
                  Animated.timing(spacerHeight, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                  }).start()
                }
                style={{
                  flex: 1,
                  fontFamily: "Lato_400Regular",
                  color: "#507DBC",
                  textAlign: "center",
                  fontSize: 22.5,
                }}
              />
            </Animated.View>
          )}
        </AnimatedTouchable>
      )}
      {!last && (
        <>
          <Pressable style={{ width: "100%", height: 20 }} />
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            }}
          />
          <Pressable style={{ width: "100%", height: 20 }} />
        </>
      )}
      {last && (
        <AnimatedSpacer
          width="100%"
          height={spacerHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, SCREEN_HEIGHT * 0.525],
          })}
        />
      )}
    </>
  );
};

const RaceScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  let answerIndex = RACES.indexOf(convertToRace(answers[6]));
  if (answerIndex === -1) answerIndex = RACES.length - 1;

  const [otherVal, setOtherVal] = useState(
    answerIndex === RACES.length - 1 ? answers[6] : ""
  );
  const [selected, setSelected] = useState<number>(
    answers[6] === "" ? undefined : answerIndex
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(
    () =>
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(),
    []
  );

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 30,
            color: "#FFF",
            alignSelf: "center",
            textAlign: "center",
          }}
        >
          What is your race?
        </Text>
        <Spacer width="100%" height={40} />
        <ScrollView
          ref={(ref) => (scrollViewRef.current = ref)}
          showsVerticalScrollIndicator={false}
        >
          {RACES.map((race, index) => (
            <RaceItem
              key={index}
              race={race}
              selected={selected}
              setSelected={setSelected}
              index={index}
              last={index === RACES.length - 1}
              scrollViewRef={scrollViewRef}
              otherVal={otherVal}
              setOtherVal={setOtherVal}
            />
          ))}
        </ScrollView>
        <Spacer width="100%" height={40} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ backgroundColor: "#FFF", borderRadius: 5, padding: 10 }}
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
          </TouchableOpacity>
          {selected !== undefined &&
            !(selected === RACES.length - 1 && otherVal === "") && (
              <>
                <Spacer width={40} height="100%" />
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(opacity, {
                      toValue: 0,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => triggerSwitch(1));
                    answers[6] =
                      selected === RACES.length - 1
                        ? otherVal
                        : RACES[selected];
                    setAnswers(answers);
                  }}
                  style={{
                    backgroundColor: "#FFF",
                    borderRadius: 5,
                    padding: 10,
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
                </TouchableOpacity>
              </>
            )}
        </View>
        <Spacer width="100%" height={40} />
      </Pressable>
    </Animated.View>
  );
};

const getYesNo = (arg: string) => {
  switch (arg.toLowerCase()) {
    case "yes":
      return "yes";
    default:
      return "no";
  }
};

const EthnicityScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [selected, setSelected] = useState<"yes" | "no">(
    answers[7] === "" ? undefined : getYesNo(answers[7])
  );
  const noRef = useRef(new Animated.Value(0)).current;
  const yesRef = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (selected === undefined)
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    else if (selected === "yes")
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    else
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
  }, [selected]);

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            color: "#FFF",
            fontSize: 30,
            alignSelf: "center",
            textAlign: "center",
          }}
        >
          Are you Hispanic or Latino?
        </Text>
        <Spacer width="100%" height={80} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedTouchable
            onPress={() => setSelected(selected === "yes" ? undefined : "yes")}
            style={{
              padding: 10,
              borderRadius: 5,
              borderColor: "#FFF",
              borderWidth: 2.5,
              backgroundColor: yesRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#507DBC", "#FFF"],
              }),
            }}
          >
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: yesRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#FFF", "#507DBC"],
                }),
              }}
            >
              Yes
            </Animated.Text>
          </AnimatedTouchable>
          <Spacer width={40} height="100%" />
          <AnimatedTouchable
            onPress={() => setSelected(selected === "no" ? undefined : "no")}
            style={{
              padding: 10,
              borderRadius: 5,
              borderWidth: 2.5,
              borderColor: "#FFF",
              backgroundColor: noRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#507DBC", "#FFF"],
              }),
            }}
          >
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: noRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#FFF", "#507DBC"],
                }),
              }}
            >
              No
            </Animated.Text>
          </AnimatedTouchable>
        </View>
        <View
          style={{
            position: "absolute",
            flexDirection: "row",
            bottom: 0,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, padding: 10, backgroundColor: "#FFF" }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          {selected !== undefined && (
            <>
              <Spacer width={40} height={"100%"} />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[7] = selected;
                  setAnswers(answers);
                }}
                style={{
                  borderRadius: 5,
                  padding: 10,
                  backgroundColor: "#FFF",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    fontSize: 20,
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const PAScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [sliderVal, setSliderVal] = useState(
    answers[8] === "" ? 2 : POLITICAL_AFFILIATION.indexOf(getPA(answers[8]))
  );
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            color: "#FFF",
            fontSize: 30,
            textAlign: "center",
          }}
        >
          Where do you lie on the political spectrum?
        </Text>
        <Spacer width="100%" height={80} />
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#FFF",
            fontSize: 22.5,
          }}
        >
          {POLITICAL_AFFILIATION[sliderVal]}
        </Text>
        <Spacer width="100%" height={20} />
        <View style={{ width: "100%" }}>
          <Slider
            tapToSeek
            value={sliderVal}
            onValueChange={(value) => setSliderVal(Math.round(value))}
            thumbTintColor="#FFF"
            maximumTrackTintColor="#FFF"
            minimumTrackTintColor="#FFF"
            minimumValue={0}
            maximumValue={4}
          />
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          <Spacer width={40} height="100%" />
          <TouchableOpacity
            onPress={() => {
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(1));
              answers[8] = POLITICAL_AFFILIATION[sliderVal];
              setAnswers(answers);
            }}
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const LGBTQScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [selected, setSelected] = useState<"yes" | "no">(
    answers[9] === "" ? undefined : getYesNo(answers[9])
  );
  const noRef = useRef(new Animated.Value(0)).current;
  const yesRef = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (selected === undefined)
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    else if (selected === "yes")
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    else
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
  }, [selected]);

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            color: "#FFF",
            fontSize: 30,
            alignSelf: "center",
            textAlign: "center",
          }}
        >
          Are you a member of the LGBTQ community?
        </Text>
        <Spacer width="100%" height={80} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AnimatedTouchable
            onPress={() => setSelected(selected === "yes" ? undefined : "yes")}
            style={{
              padding: 10,
              borderRadius: 5,
              borderColor: "#FFF",
              borderWidth: 2.5,
              backgroundColor: yesRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#507DBC", "#FFF"],
              }),
            }}
          >
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: yesRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#FFF", "#507DBC"],
                }),
              }}
            >
              Yes
            </Animated.Text>
          </AnimatedTouchable>
          <Spacer width={40} height="100%" />
          <AnimatedTouchable
            onPress={() => setSelected(selected === "no" ? undefined : "no")}
            style={{
              padding: 10,
              borderRadius: 5,
              borderWidth: 2.5,
              borderColor: "#FFF",
              backgroundColor: noRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#507DBC", "#FFF"],
              }),
            }}
          >
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: noRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#FFF", "#507DBC"],
                }),
              }}
            >
              No
            </Animated.Text>
          </AnimatedTouchable>
        </View>
        <View
          style={{
            position: "absolute",
            flexDirection: "row",
            bottom: 0,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, padding: 10, backgroundColor: "#FFF" }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          {selected !== undefined && (
            <>
              <Spacer width={40} height={"100%"} />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[9] = selected;
                  setAnswers(answers);
                }}
                style={{
                  borderRadius: 5,
                  padding: 10,
                  backgroundColor: "#FFF",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    fontSize: 20,
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const IncomeScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const incomeLevel = convertToIL(answers[10]);

  const [sliderVal, setSliderVal] = useState(
    answers[10] === "" ? 0 : INCOME_LEVELS.indexOf(incomeLevel)
  );

  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            color: "#FFF",
            fontSize: 30,
            textAlign: "center",
          }}
        >
          What is your annual household income?
        </Text>
        <Spacer width="100%" height={80} />
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            color: "#FFF",
            fontSize: 22.5,
          }}
        >
          {INCOME_LEVELS[sliderVal]}
        </Text>
        <Spacer width="100%" height={20} />
        <View style={{ width: "100%" }}>
          <Slider
            tapToSeek
            value={sliderVal}
            onValueChange={(value) => setSliderVal(Math.round(value))}
            thumbTintColor="#FFF"
            maximumTrackTintColor="#FFF"
            minimumTrackTintColor="#FFF"
            minimumValue={0}
            maximumValue={4}
          />
        </View>
        <View
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          <Spacer width={40} height="100%" />
          <TouchableOpacity
            onPress={() => {
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(1));
              answers[10] = INCOME_LEVELS[sliderVal];
              setAnswers(answers);
            }}
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Next
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const OccupationScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [index, setIndex] = useState(
    answers[11] === "" ? -1 : JOBS.indexOf(convertToJob(answers[11]))
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const swapRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const goNext = () => {
    Animated.timing(swapRef, {
      toValue: -1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIndex((index + 1) % JOBS.length);
      swapRef.setValue(0);
      Animated.timing(swapRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          Do you work?
        </Text>
        <Spacer width="100%" height={80} />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync();
            goNext();
          }}
          style={{
            borderWidth: 2.5,
            borderColor: "#FFF",
            backgroundColor: "#FFF",
            borderRadius: 5,
            padding: 15,
            justifyContent: "center",
            alignItems: "center",
            width: 325,
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              color: "#507DBC",
              textAlign: "center",
              opacity: swapRef.interpolate({
                inputRange: [-0.75, 0, 0.75],
                outputRange: [0, 1, 0],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: swapRef.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-50, 0, 50],
                  }),
                },
              ],
            }}
          >
            {index === -1 ? "Press to select" : JOBS[index]}
          </Animated.Text>
        </TouchableOpacity>
        <View
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          {index !== -1 && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[11] = JOBS[index];
                  setAnswers(answers);
                }}
                style={{
                  borderRadius: 5,
                  backgroundColor: "#FFF",
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    fontSize: 20,
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const ReligionItem = ({
  religion,
  last,
  index,
  selected,
  setSelected,
  scrollViewRef,
  otherVal,
  setOtherVal,
}: {
  religion: RELIGION;
  last: boolean;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  index: number;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  otherVal: string;
  setOtherVal: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [focused, focus] = useState(false);
  const spacerHeight = useRef(new Animated.Value(0)).current;
  const selectionRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const isOther = index === RACES.length - 1;

  useEffect(() => {
    focus(selected !== undefined && selected === index);
  }, [selected]);

  useEffect(() => {
    Animated.timing(selectionRef, {
      toValue: focused ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  return (
    <>
      {last ? (
        // animatedtouchable doesn't work as a parent w/ a textinput as a child
        <TouchableOpacity
          onPress={() => setSelected(selected === index ? undefined : index)}
          style={{
            borderColor: "#FFF",
            borderWidth: 2.5,
            borderRadius: 7.5,
          }}
        >
          <Animated.View
            style={{
              width: "100%",
              padding: 15,
              backgroundColor: selectionRef.interpolate({
                inputRange: [0, 0.25],
                outputRange: ["#507DBC", "#FFF"],
                extrapolate: "clamp",
              }),
            }}
          >
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 22.5,
                textAlign: "center",
                color: selectionRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#FFF", "#507DBC"],
                }),
              }}
            >
              {religion}
            </Animated.Text>
            {isOther && (
              <Animated.View
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  backgroundColor: "#FFF",
                  left: 15,
                  top: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  zIndex: selectionRef.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-1, 1],
                  }),
                  opacity: selectionRef,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    fontSize: 15,
                    color: "#507DBC",
                  }}
                >
                  Specify
                </Text>
                <Spacer width={15} height="100%" />
                <View
                  style={{
                    backgroundColor: "#507DBC",
                    width: 1,
                    height: "100%",
                  }}
                />
                <TextInput
                  selectionColor="#507DBC"
                  value={otherVal}
                  onChangeText={(text) => setOtherVal(text)}
                  onFocus={() =>
                    Animated.timing(spacerHeight, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: false,
                    }).start(() => scrollViewRef.current.scrollToEnd())
                  }
                  onBlur={() =>
                    Animated.timing(spacerHeight, {
                      toValue: 0,
                      duration: 250,
                      useNativeDriver: false,
                    }).start()
                  }
                  style={{
                    flex: 1,
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    textAlign: "center",
                    fontSize: 22.5,
                  }}
                />
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <AnimatedTouchable
          onPress={() => setSelected(selected === index ? undefined : index)}
          style={{
            padding: 15,
            borderColor: "#FFF",
            borderWidth: 2.5,
            borderRadius: 7.5,
            backgroundColor: selectionRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#507DBC", "#FFF"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              textAlign: "center",
              color: selectionRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#FFF", "#507DBC"],
              }),
            }}
          >
            {religion}
          </Animated.Text>
          {isOther && (
            <Animated.View
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                backgroundColor: "#FFF",
                left: 15,
                top: 15,
                flexDirection: "row",
                alignItems: "center",
                zIndex: selectionRef.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-1, 1],
                }),
                opacity: selectionRef,
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 15,
                  color: "#507DBC",
                }}
              >
                Specify
              </Text>
              <Spacer width={15} height="100%" />
              <View
                style={{ backgroundColor: "#507DBC", width: 1, height: "100%" }}
              />
              <TextInput
                selectionColor="#507DBC"
                value={otherVal}
                onChangeText={(text) => setOtherVal(text)}
                onFocus={() =>
                  Animated.timing(spacerHeight, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: false,
                  }).start(() => scrollViewRef.current.scrollToEnd())
                }
                onBlur={() =>
                  Animated.timing(spacerHeight, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                  }).start()
                }
                style={{
                  flex: 1,
                  fontFamily: "Lato_400Regular",
                  color: "#507DBC",
                  textAlign: "center",
                  fontSize: 22.5,
                }}
              />
            </Animated.View>
          )}
        </AnimatedTouchable>
      )}
      {!last && (
        <>
          <Pressable style={{ width: "100%", height: 20 }} />
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            }}
          />
          <Pressable style={{ width: "100%", height: 20 }} />
        </>
      )}
      {last && (
        <AnimatedSpacer
          width="100%"
          height={spacerHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, SCREEN_HEIGHT * 0.5],
          })}
        />
      )}
    </>
  );
};

const ReligionScreen = ({
  triggerSwitch,
  setAnswers,
  answers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  let index: number = undefined;
  let other = "";
  if (answers[12] !== "")
    index = RELIGIONS.indexOf(convertToReligion(answers[12]));
  if (index === RELIGIONS.length - 1 && answers[12] !== "Other")
    other = answers[12];

  const [otherVal, setOtherVal] = useState(other);
  const [selected, setSelected] = useState<number>(index);

  const scrollViewRef = useRef<ScrollView>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(
    () =>
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(),
    []
  );

  return (
    <Animated.View
      style={{
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 30,
            color: "#FFF",
            alignSelf: "center",
            textAlign: "center",
          }}
        >
          Do you practice a religion?
        </Text>
        <Spacer width="100%" height={40} />
        <ScrollView
          ref={(ref) => (scrollViewRef.current = ref)}
          showsVerticalScrollIndicator={false}
        >
          {RELIGIONS.map((religion, index) => (
            <ReligionItem
              key={index}
              selected={selected}
              setSelected={setSelected}
              setOtherVal={setOtherVal}
              scrollViewRef={scrollViewRef}
              index={index}
              last={index === RELIGIONS.length - 1}
              otherVal={otherVal}
              religion={religion}
            />
          ))}
        </ScrollView>
        <Spacer width="100%" height={40} />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ backgroundColor: "#FFF", borderRadius: 5, padding: 10 }}
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
          </TouchableOpacity>
          {selected !== undefined &&
            !(selected === RACES.length - 1 && otherVal === "") && (
              <>
                <Spacer width={40} height="100%" />
                <TouchableOpacity
                  onPress={() => {
                    Animated.timing(opacity, {
                      toValue: 0,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => triggerSwitch(1));
                    if (selected === RACES.length - 1) answers[12] = otherVal;
                    else answers[12] = RELIGIONS[selected];
                    setAnswers(answers);
                  }}
                  style={{
                    backgroundColor: "#FFF",
                    borderRadius: 5,
                    padding: 10,
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
                </TouchableOpacity>
              </>
            )}
        </View>
        <Spacer width="100%" height={40} />
      </Pressable>
    </Animated.View>
  );
};

const PetScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [index, setIndex] = useState(
    answers[13] === "" ? -1 : PETS.indexOf(convertToPet(answers[13]))
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const swapRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const goNext = () => {
    Animated.timing(swapRef, {
      toValue: -1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIndex((index + 1) % PETS.length);
      swapRef.setValue(0);
      Animated.timing(swapRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          Do you have any pets?
        </Text>
        <Spacer width="100%" height={80} />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync();
            goNext();
          }}
          style={{
            borderWidth: 2.5,
            borderColor: "#FFF",
            backgroundColor: "#FFF",
            borderRadius: 5,
            padding: 15,
            justifyContent: "center",
            alignItems: "center",
            width: 225,
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              color: "#507DBC",
              textAlign: "center",
              opacity: swapRef.interpolate({
                inputRange: [-0.75, 0, 0.75],
                outputRange: [0, 1, 0],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: swapRef.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-50, 0, 50],
                  }),
                },
              ],
            }}
          >
            {index === -1 ? "Press to select" : PETS[index]}
          </Animated.Text>
        </TouchableOpacity>
        <View
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          {index !== -1 && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[13] = PETS[index];
                  setAnswers(answers);
                }}
                style={{
                  borderRadius: 5,
                  backgroundColor: "#FFF",
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    fontSize: 20,
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const LivingSituationScreen = ({
  triggerSwitch,
  answers,
  setAnswers,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [index, setIndex] = useState(
    answers[14] === ""
      ? -1
      : LIVING_SITUATIONS.indexOf(convertToLS(answers[14]))
  );
  const opacity = useRef(new Animated.Value(0)).current;
  const swapRef = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  const goNext = () => {
    Animated.timing(swapRef, {
      toValue: -1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIndex((index + 1) % LIVING_SITUATIONS.length);
      swapRef.setValue(0);
      Animated.timing(swapRef, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <Pressable
        onPress={() => Keyboard.dismiss()}
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
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
          }}
        >
          What is your current living situation?
        </Text>
        <Spacer width="100%" height={80} />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync();
            goNext();
          }}
          style={{
            borderWidth: 2.5,
            borderColor: "#FFF",
            borderRadius: 5,
            padding: 15,
            justifyContent: "center",
            alignItems: "center",
            width: 225,
            backgroundColor: "#FFF",
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              color: "#507DBC",
              textAlign: "center",
              opacity: swapRef.interpolate({
                inputRange: [-0.75, 0, 0.75],
                outputRange: [0, 1, 0],
                extrapolate: "clamp",
              }),
              transform: [
                {
                  translateY: swapRef.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-50, 0, 50],
                  }),
                },
              ],
            }}
          >
            {index === -1 ? "Press to select" : LIVING_SITUATIONS[index]}
          </Animated.Text>
        </TouchableOpacity>
        <View
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{ borderRadius: 5, backgroundColor: "#FFF", padding: 10 }}
          >
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#507DBC",
                fontSize: 20,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
          {index !== -1 && (
            <>
              <Spacer width={40} height="100%" />
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(opacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                  }).start(() => triggerSwitch(1));
                  answers[14] = LIVING_SITUATIONS[index];
                  setAnswers(answers);
                }}
                style={{
                  borderRadius: 5,
                  backgroundColor: "#FFF",
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato_400Regular",
                    color: "#507DBC",
                    fontSize: 20,
                  }}
                >
                  Next
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const NameScreenAP = ({
  keyboardDodgeRef,
  answers,
  setAnswers,
  setVisible,
}: {
  keyboardDodgeRef: Animated.Value;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [fn, ln] = answers[0].split(";");

  const [firstName, setFirstName] = useState(fn);
  const [lastName, setLastName] = useState(ln);

  return (
    <>
      <Spacer width="100%" height={40} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          color: "#507DBC",
          fontSize: 17.5,
        }}
      >
        First Name
      </Text>
      <Spacer width="100%" height={10} />
      <TextInput
        selectionColor="#FFF"
        value={firstName}
        onChangeText={(text) => setFirstName(text)}
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
          width: "100%",
          backgroundColor: "#507DBC",
          padding: 10,
          borderRadius: 5,
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#FFF",
        }}
      />
      <Spacer width="100%" height={40} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          color: "#507DBC",
          fontSize: 17.5,
        }}
      >
        Last Name
      </Text>
      <Spacer width="100%" height={10} />
      <TextInput
        selectionColor="#FFF"
        value={lastName}
        onChangeText={(text) => setLastName(text)}
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
          width: "100%",
          backgroundColor: "#507DBC",
          padding: 10,
          borderRadius: 5,
          textAlign: "center",
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#FFF",
        }}
      />
      <Spacer width="100%" height={40} />
      <TouchableOpacity
        onPress={() => {
          answers[0] = `${firstName};${lastName}`;
          setAnswers(answers);
          setVisible(false);
        }}
        style={{
          padding: 10,
          borderRadius: 5,
          backgroundColor: "#507DBC",
          alignSelf: "center",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            fontSize: 20,
          }}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </>
  );
};

const SchoolScreenAP = ({
  keyboardDodgeRef,
  answers,
  setAnswers,
  setVisible,
}: {
  keyboardDodgeRef: Animated.Value;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState(
    UNIVERSITIES.map((item) => {
      return { label: item.institution, value: item.institution };
    })
  );

  return (
    <>
      <Spacer width="100%" height={40} />
      <DropDownPicker
        searchable
        searchPlaceholder="Enter a school's name"
        searchPlaceholderTextColor="#FFF"
        searchContainerStyle={{ borderBottomColor: "#FFF" }}
        searchTextInputProps={{
          selectionColor: "#FFF",
          onFocus: () =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 1.75,
              duration: 250,
              useNativeDriver: true,
            }).start(),
          onBlur: () =>
            Animated.timing(keyboardDodgeRef, {
              toValue: 0,
              duration: 250,
              useNativeDriver: true,
            }).start(),
        }}
        searchTextInputStyle={{
          color: "#FFF",
          fontFamily: "Lato_400Regular",
          borderColor: "#FFF",
          textAlign: "center",
        }}
        placeholder="Select a school"
        placeholderStyle={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#FFF",
        }}
        open={open}
        value={value}
        items={items}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setItems}
        ArrowDownIconComponent={DownArrow}
        ArrowUpIconComponent={UpArrow}
        TickIconComponent={TickIcon}
        tickIconContainerStyle={{ position: "absolute", right: 10 }}
        textStyle={{
          fontFamily: "Lato_400Regular",
          fontSize: 20,
          color: "#FFF",
          textAlign: "center",
        }}
        dropDownContainerStyle={{
          backgroundColor: "#507DBC",
          borderColor: "#FFF",
        }}
        style={{ borderColor: "#FFF", backgroundColor: "#507DBC" }}
      />
      <Spacer width="100%" height={40} />
      <TouchableOpacity
        onPress={() => {
          answers[1] = value;
          setAnswers(answers);
          setVisible(false);
        }}
        style={{
          padding: 10,
          backgroundColor: "#507DBC",
          borderRadius: 5,
          alignSelf: "center",
        }}
      >
        <Text
          style={{ fontFamily: "Lato_400Regular", color: "#FFF", fontSize: 20 }}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </>
  );
};

const TouchableSwitcherAP = ({
  answers,
  setAnswers,
  setVisible,
  values,
  answerIndex,
  useOther,
}: {
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  values: string[];
  answerIndex: number;
  useOther?: boolean;
}) => {
  let location = values.indexOf(answers[answerIndex]);
  let other = "";
  if (location === -1) {
    location = values.length - 1;
    other = answers[answerIndex];
  }

  const [index, setIndex] = useState(location);
  const [otherVal, setOtherVal] = useState(other);
  const switchRef = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    Animated.timing(switchRef, {
      toValue: -1,
      duration: 125,
      useNativeDriver: true,
    }).start(() => {
      setIndex((index + 1) % values.length);
      switchRef.setValue(1);
      Animated.timing(switchRef, {
        toValue: 0,
        duration: 125,
        useNativeDriver: true,
      }).start();
    });
  };

  return (
    <>
      <Spacer width="100%" height={20} />
      <View
        style={{
          height: 150,
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync();
            goNext();
          }}
          style={{
            padding: 15,
            backgroundColor: "#507DBC",
            borderRadius: 5,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {useOther && index === values.length - 1 ? (
            <View
              style={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  color: "#FFF",
                  fontSize: 15,
                }}
              >
                Specify
              </Text>
              <Spacer width={10} height="100%" />
              <View
                style={{ height: "100%", width: 1, backgroundColor: "#FFF" }}
              />
              <TextInput
                selectionColor="#FFF"
                value={otherVal}
                onChangeText={(text) => setOtherVal(text)}
                style={{
                  flex: 1,
                  fontFamily: "Lato_400Regular",
                  fontSize: 20,
                  color: "#FFF",
                  textAlign: "center",
                  height: "100%",
                }}
              />
            </View>
          ) : (
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                color: "#FFF",
                fontSize: 20,
                textAlign: "center",
                transform: [
                  {
                    translateY: switchRef.interpolate({
                      inputRange: [-1, 0, 1],
                      outputRange: [-50, 0, 50],
                    }),
                  },
                ],
              }}
            >
              {values[index]}
            </Animated.Text>
          )}
        </Pressable>
      </View>
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        onPress={() => {
          if (useOther && index === values.length - 1)
            answers[answerIndex] = otherVal;
          else answers[answerIndex] = values[index];
          setAnswers(answers);
          setVisible(false);
        }}
        style={{
          padding: 10,
          backgroundColor: "#507DBC",
          borderRadius: 5,
          alignSelf: "center",
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 20,
            fontFamily: "Lato_400Regular",
          }}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </>
  );
};

const LocationScreenAP = ({
  answers,
  keyboardDodgeRef,
  setAnswers,
  setVisible,
}: {
  answers: string[];
  keyboardDodgeRef: Animated.Value;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [country, state, city] = answers[3].split(";");
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countryValue, setCountryValue] = useState<string | null>(country);
  const [stateValue, setStateValue] = useState<string | null>(state);
  const [cityValue, setCityValue] = useState<string | null>(city);
  const [countryItems, setCountryItems] = useState(
    COUNTRIES.map((country) => {
      return { label: country.country, value: country.country };
    })
  );
  const [stateItems, setStateItems] = useState(
    (() => {
      const states: { label: string; value: string }[] = [];
      if (country === "United States")
        for (const state in STATES_CITIES)
          states.push({ label: state, value: state });
      return states;
    })()
  );
  const [cityItems, setCityItems] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    if (countryValue !== "United States") setStateItems([]);
    else {
      const states: { label: string; value: string }[] = [];
      for (const state in STATES_CITIES)
        states.push({ label: state, value: state });
      setStateItems(states);
    }
  }, [countryValue]);

  useEffect(() => {
    if (stateValue !== null) {
      setCityItems(
        STATES_CITIES[stateValue].map((item: string) => {
          return { label: item, value: item };
        })
      );
    }
  }, [stateValue]);

  return (
    <View
      style={{
        alignItems: "center",
        width: "100%",
        height: 300,
        justifyContent:
          countryOpen ||
          stateOpen ||
          cityOpen ||
          countryValue !== "United States"
            ? "flex-start"
            : "space-between",
      }}
    >
      {countryValue === "United States" &&
      !countryOpen &&
      !stateOpen &&
      !cityOpen ? (
        <Spacer width="100%" height={1} />
      ) : (
        <Spacer width="100%" height={20} />
      )}
      {countryValue !== "United States" && <Spacer width="100%" height={40} />}
      {!stateOpen && !cityOpen && (
        <DropDownPicker
          searchable
          searchPlaceholder="Enter a country"
          searchPlaceholderTextColor="#FFF"
          searchContainerStyle={{ borderBottomColor: "#FFF" }}
          searchTextInputProps={{
            selectionColor: "#FFF",
            onFocus: () =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 1.75,
                duration: 250,
                useNativeDriver: true,
              }).start(),
            onBlur: () =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(),
          }}
          searchTextInputStyle={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            borderColor: "#FFF",
            textAlign: "center",
          }}
          placeholder="Select a country"
          placeholderStyle={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
          }}
          open={countryOpen}
          value={countryValue}
          items={countryItems}
          setOpen={setCountryOpen}
          setValue={setCountryValue}
          setItems={setCountryItems}
          ArrowDownIconComponent={DownArrow}
          ArrowUpIconComponent={UpArrow}
          TickIconComponent={TickIcon}
          tickIconContainerStyle={{ position: "absolute", right: 10 }}
          textStyle={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
            textAlign: "center",
          }}
          dropDownContainerStyle={{
            backgroundColor: "#507DBC",
            borderColor: "#FFF",
          }}
          style={{
            borderColor: "#FFF",
            backgroundColor: "#507DBC",
          }}
        />
      )}
      {!countryOpen && !cityOpen && countryValue === "United States" && (
        <DropDownPicker
          searchable
          searchPlaceholder="Enter a state"
          searchPlaceholderTextColor="#FFF"
          searchContainerStyle={{ borderBottomColor: "#FFF" }}
          searchTextInputProps={{
            selectionColor: "#FFF",
            onFocus: () =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 1.75,
                duration: 250,
                useNativeDriver: true,
              }).start(),
            onBlur: () =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(),
          }}
          searchTextInputStyle={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            borderColor: "#FFF",
            textAlign: "center",
          }}
          placeholder="Select a state"
          placeholderStyle={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
          }}
          open={stateOpen}
          value={stateValue}
          items={stateItems}
          setOpen={setStateOpen}
          setValue={setStateValue}
          setItems={setStateItems}
          ArrowDownIconComponent={DownArrow}
          ArrowUpIconComponent={UpArrow}
          TickIconComponent={TickIcon}
          tickIconContainerStyle={{ position: "absolute", right: 10 }}
          textStyle={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
            textAlign: "center",
          }}
          dropDownContainerStyle={{
            backgroundColor: "#507DBC",
            borderColor: "#FFF",
          }}
          style={{ borderColor: "#FFF", backgroundColor: "#507DBC" }}
        />
      )}
      {!countryOpen && !stateOpen && countryValue === "United States" && (
        <DropDownPicker
          searchable
          searchPlaceholder="Enter a city"
          searchPlaceholderTextColor="#FFF"
          searchContainerStyle={{ borderBottomColor: "#FFF" }}
          searchTextInputProps={{
            selectionColor: "#FFF",
            onFocus: () =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 1.75,
                duration: 250,
                useNativeDriver: true,
              }).start(),
            onBlur: () =>
              Animated.timing(keyboardDodgeRef, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(),
          }}
          searchTextInputStyle={{
            color: "#FFF",
            fontFamily: "Lato_400Regular",
            borderColor: "#FFF",
            textAlign: "center",
          }}
          placeholder="Select a city"
          placeholderStyle={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
          }}
          open={cityOpen}
          value={cityValue}
          items={cityItems}
          setOpen={setCityOpen}
          setValue={setCityValue}
          setItems={setCityItems}
          ArrowDownIconComponent={DownArrow}
          ArrowUpIconComponent={UpArrow}
          TickIconComponent={TickIcon}
          tickIconContainerStyle={{ position: "absolute", right: 10 }}
          textStyle={{
            fontFamily: "Lato_400Regular",
            fontSize: 20,
            color: "#FFF",
            textAlign: "center",
          }}
          dropDownContainerStyle={{
            backgroundColor: "#507DBC",
            borderColor: "#FFF",
          }}
          style={{ borderColor: "#FFF", backgroundColor: "#507DBC" }}
        />
      )}
      {countryValue !== "United States" && (
        <View style={{ flex: 1, width: "100%" }} />
      )}
      {!countryOpen &&
        !stateOpen &&
        !cityOpen &&
        ((countryValue !== "United States" && countryValue !== null) ||
          (countryValue === "United States" &&
            stateValue !== null &&
            cityValue !== null)) && (
          <TouchableOpacity
            onPress={() => {
              answers[3] =
                countryValue === "United States"
                  ? `${countryValue};${stateValue};${cityValue}`
                  : countryValue;
              setAnswers(answers);
              setVisible(false);
            }}
            style={{ borderRadius: 5, padding: 10, backgroundColor: "#507DBC" }}
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
          </TouchableOpacity>
        )}
    </View>
  );
};

const BirthdayScreenAP = ({
  answers,
  setAnswers,
  setVisible,
}: {
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const originalDate = useRef(new Date()).current;
  const [birthday, setBirthday] = useState(new Date(answers[4]));
  const [valid, setValid] = useState(false);
  const submitButtonOpacity = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    setValid(birthday < originalDate);
  }, [birthday]);

  useEffect(() => {
    Animated.timing(submitButtonOpacity, {
      toValue: valid ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [valid]);

  return (
    <>
      <Spacer width="100%" height={20} />
      <DateTimePicker
        mode="date"
        value={birthday}
        display="spinner"
        themeVariant="light"
        accentColor="#507DBC"
        textColor="#507DBC"
        onChange={(event, selectedDate) => setBirthday(selectedDate)}
      />
      <Spacer width="100%" height={20} />
      <TouchableOpacity
        disabled={!valid}
        onPress={() => {
          answers[4] = birthday.toLocaleDateString();
          setAnswers(answers);
          setVisible(false);
        }}
        style={{
          padding: 10,
          backgroundColor: "#507DBC",
          alignSelf: "center",
          borderRadius: 5,
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
      </TouchableOpacity>
    </>
  );
};

const YesNoAP = ({
  answers,
  setAnswers,
  setVisible,
  answerIndex,
}: {
  answers: string[];
  answerIndex: number;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selected, setSelected] = useState<"Yes" | "No">(
    answers[answerIndex] === "Yes" ? "Yes" : "No"
  );
  const yesRef = useRef(new Animated.Value(selected === "Yes" ? 1 : 0)).current;
  const noRef = useRef(new Animated.Value(selected === "No" ? 1 : 0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (selected === "Yes") {
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(noRef, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(yesRef, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selected]);

  return (
    <>
      <Spacer width="100%" height={40} />
      <View
        style={{
          width: 80,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AnimatedTouchable
          onPress={() => setSelected("Yes")}
          style={{
            borderColor: "#507DBC",
            borderWidth: 2.5,
            padding: 10,
            borderRadius: 5,
            backgroundColor: yesRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#507DBC"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: yesRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#507DBC", "#FFF"],
              }),
            }}
          >
            Yes
          </Animated.Text>
        </AnimatedTouchable>
        <Spacer height="100%" width={40} />
        <AnimatedTouchable
          onPress={() => setSelected("No")}
          style={{
            borderColor: "#507DBC",
            borderWidth: 2.5,
            padding: 10,
            borderRadius: 5,
            backgroundColor: noRef.interpolate({
              inputRange: [0, 1],
              outputRange: ["#FFF", "#507DBC"],
            }),
          }}
        >
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: noRef.interpolate({
                inputRange: [0, 1],
                outputRange: ["#507DBC", "#FFF"],
              }),
            }}
          >
            No
          </Animated.Text>
        </AnimatedTouchable>
      </View>
      <Spacer width="100" height={40} />
      <TouchableOpacity
        onPress={() => {
          answers[answerIndex] = selected;
          setAnswers(answers);
          setVisible(false);
        }}
        style={{
          padding: 10,
          borderRadius: 5,
          backgroundColor: "#507DBC",
          alignSelf: "center",
        }}
      >
        <Text
          style={{ fontFamily: "Lato_400Regular", color: "#FFF", fontSize: 20 }}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </>
  );
};

const SliderAP = ({
  answerIndex,
  answers,
  setAnswers,
  setVisible,
  values,
}: {
  answers: string[];
  answerIndex: number;
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  values: string[];
}) => {
  const [sliderVal, setSliderVal] = useState(
    values.indexOf(answers[answerIndex])
  );

  return (
    <>
      <Spacer width="100%" height={40} />
      <Text
        style={{
          fontFamily: "Lato_400Regular",
          fontSize: 25,
          alignSelf: "center",
          textAlign: "center",
          color: "#507DBC",
        }}
      >
        {values[sliderVal]}
      </Text>
      <Spacer width="100%" height={20} />
      <Slider
        tapToSeek
        value={sliderVal}
        onValueChange={(value) => setSliderVal(Math.round(value))}
        thumbTintColor="#507DBC"
        maximumTrackTintColor="#507DBC"
        minimumTrackTintColor="#507DBC"
        minimumValue={0}
        maximumValue={4}
      />
      <Spacer width="100%" height={40} />
      <TouchableOpacity
        onPress={() => {
          answers[answerIndex] = values[sliderVal];
          setAnswers(answers);
          setVisible(false);
        }}
        style={{
          padding: 10,
          alignSelf: "center",
          backgroundColor: "#507DBC",
          borderRadius: 5,
        }}
      >
        <Text
          style={{ fontFamily: "Lato_400Regular", fontSize: 20, color: "#FFF" }}
        >
          Submit
        </Text>
      </TouchableOpacity>
    </>
  );
};

const SubmitAnswerPreview = ({
  question,
  index,
  answers,
  setAnswers,
}: {
  question: string;
  index: number;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;

  let answer: string = answers[index];
  if (index === 0) answer = answer.replace(";", " ");
  else if (index === 3) {
    const splitted = answer.split(";");
    if (splitted.length === 3) {
      const [country, state, city] = answer.split(";");
      answer = `${city}, ${state}, ${country}`;
    }
  } else if (index === 4) {
    const [month, day, year] = answer.split("/");
    answer = `${MONTHS[parseInt(month) - 1]} ${day}, ${year}`;
  } else if (index === 7 || index === 9)
    answer = answer.slice(0, 1).toUpperCase() + answer.slice(1);

  return (
    <TouchableOpacity onPress={() => setModalVisible(true)}>
      <Text
        style={{
          fontFamily: "Lato_700Bold",
          fontSize: 25,
          color: "#FFF",
        }}
      >
        {question}
      </Text>
      <Spacer width="100%" height={10} />
      <Text
        style={{
          fontFamily: "Lato_400Regular_Italic",
          fontSize: 20,
          color: "#FFF",
        }}
      >
        {answer}
      </Text>
      {index !== answers.length - 1 && (
        <>
          <Spacer width="100%" height={40} />
          <View
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            }}
          />
          <Spacer width="100%" height={40} />
        </>
      )}
      <Modal transparent visible={modalVisible} animationType="fade">
        <Pressable
          onPress={() => setModalVisible(false)}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <Animated.View
            style={{
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
            <Pressable
              style={{
                width: 300,
                borderRadius: 10,
                padding: 20,
                backgroundColor: "#FFF",
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 25,
                  color: "#507DBC",
                  alignSelf: "center",
                  textAlign: "center",
                }}
              >
                {question}
              </Text>
              {(() => {
                switch (index) {
                  case 0:
                    return (
                      <NameScreenAP
                        keyboardDodgeRef={keyboardDodgeRef}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 1:
                    return (
                      <SchoolScreenAP
                        keyboardDodgeRef={keyboardDodgeRef}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 2:
                    return (
                      <TouchableSwitcherAP
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={EDUCATION_LEVELS}
                        answerIndex={2}
                      />
                    );
                  case 3:
                    return (
                      <LocationScreenAP
                        keyboardDodgeRef={keyboardDodgeRef}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 4:
                    return (
                      <BirthdayScreenAP
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 5:
                    return (
                      <TouchableSwitcherAP
                        answerIndex={5}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={GENDERS}
                      />
                    );
                  case 6:
                    return (
                      <TouchableSwitcherAP
                        answerIndex={6}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={RACES}
                        useOther={true}
                      />
                    );
                  case 7:
                    return (
                      <YesNoAP
                        answerIndex={7}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 8:
                    return (
                      <SliderAP
                        values={POLITICAL_AFFILIATION}
                        answerIndex={8}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 9:
                    return (
                      <YesNoAP
                        answerIndex={9}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 10:
                    return (
                      <SliderAP
                        values={INCOME_LEVELS}
                        answers={answers}
                        answerIndex={10}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                      />
                    );
                  case 11:
                    return (
                      <TouchableSwitcherAP
                        answerIndex={11}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={JOBS}
                      />
                    );
                  case 12:
                    return (
                      <TouchableSwitcherAP
                        useOther
                        answerIndex={12}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={RELIGIONS}
                      />
                    );
                  case 13:
                    return (
                      <TouchableSwitcherAP
                        answerIndex={13}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={PETS}
                      />
                    );
                  case 14:
                    return (
                      <TouchableSwitcherAP
                        answerIndex={14}
                        answers={answers}
                        setAnswers={setAnswers}
                        setVisible={setModalVisible}
                        values={LIVING_SITUATIONS}
                      />
                    );
                  default:
                    return <View />;
                }
              })()}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </TouchableOpacity>
  );
};

const SubmitScreen = ({
  answers,
  setAnswers,
  triggerSwitch,
  userID,
  triggerClose,
  setIntakeSurvey,
}: {
  triggerSwitch: React.Dispatch<React.SetStateAction<-1 | 0 | 1>>;
  answers: string[];
  setAnswers: React.Dispatch<React.SetStateAction<string[]>>;
  userID: string;
  triggerClose: React.Dispatch<React.SetStateAction<boolean>>;
  setIntakeSurvey: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [submitting, triggerSubmit] = useState(false);
  const [loading, setLoading] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        top: -20,
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <View
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <Text
          style={{
            alignSelf: "center",
            fontSize: 30,
            color: "#FFF",
            textAlign: "center",
            fontFamily: "Lato_400Regular",
          }}
        >
          Your Answers
        </Text>
        <Spacer width="100%" height={40} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ width: "100%", flex: 1 }}
        >
          {QUESTIONS.map((question, index) => (
            <SubmitAnswerPreview
              key={index}
              question={question}
              index={index}
              answers={answers}
              setAnswers={setAnswers}
            />
          ))}
        </ScrollView>
        <Spacer width="100%" height={110} />
        <View
          style={{
            position: "absolute",
            bottom: 20,
            width: "100%",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() =>
              Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
              }).start(() => triggerSwitch(-1))
            }
            style={{
              padding: 10,
              backgroundColor: "#FFF",
              borderRadius: 5,
              width: 90,
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
              Back
            </Text>
          </TouchableOpacity>
          <Spacer width={40} height="100%" />
          <TouchableOpacity
            onPress={() => triggerSubmit(true)}
            style={{
              padding: 10,
              backgroundColor: "#FFF",
              borderRadius: 5,
              width: 90,
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
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal transparent visible={submitting} animationType="fade">
        <Pressable
          onPress={() => triggerSubmit(false)}
          style={{
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <Pressable
            style={{
              width: 300,
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
                alignSelf: "center",
                textAlign: "center",
              }}
            >
              Submitting Intake Survey!
            </Text>
            <Spacer width="100%" height={40} />
            <Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 20,
                color: "#507DBC",
              }}
            >
              <Text>Are you sure that you want to submit this survey?</Text>
              <Text style={{ fontFamily: "Lato_700Bold" }}>
                {" "}
                You will be able to change some of this information in a future
                update.
              </Text>
            </Text>
            <Spacer width="100%" height={40} />
            <TouchableOpacity
              onPress={async () => {
                setLoading(true);
                await submitIntakeSurvey(userID, answers);
                triggerSubmit(false);
                triggerClose(true);
                setLoading(false);
                setIntakeSurvey(true);
              }}
              style={{
                padding: 10,
                backgroundColor: "#507DBC",
                borderRadius: 5,
                alignSelf: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato_400Regular",
                  fontSize: 20,
                  color: "#FFF",
                }}
              >
                Yes, Submit
              </Text>
            </TouchableOpacity>
            {loading && (
              <View
                style={{
                  top: 20,
                  left: 20,
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                }}
              >
                <LoadingScreen color="#507DBC" />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
};

const ScreenSwitcher = ({
  userID,
  triggerClose,
  setIntakeSurvey,
}: {
  userID: string;
  triggerClose: React.Dispatch<React.SetStateAction<boolean>>;
  setIntakeSurvey: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [switchTriggered, triggerSwitch] = useState<-1 | 0 | 1>(0);
  const [answers, setAnswers] = useState<string[]>(
    (() => {
      const toReturn: string[] = [];
      for (let i = 0; i < NUM_SCREENS; i++) toReturn.push("");
      return toReturn;
    })()
  );

  const keyboardDodgeRef = useRef(new Animated.Value(0)).current;
  const questionScreens: JSX.Element[] = getQuestionScreens(
    keyboardDodgeRef,
    triggerSwitch,
    answers,
    setAnswers,
    userID,
    triggerClose,
    setIntakeSurvey
  );

  useEffect(() => {
    if (switchTriggered !== 0) {
      setQuestionIndex(questionIndex + switchTriggered);
      triggerSwitch(0);
    }
  }, [switchTriggered]);

  return (
    <View style={{ width: "100%", flex: 1 }}>
      {questionScreens[questionIndex]}
    </View>
  );
};

const IntakeSurveyModal = ({
  visible,
  setVisible,
  userID,
  setIntakeSurvey,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  userID: string;
  setIntakeSurvey: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [pollOpen, openPoll] = useState(false);
  const [closing, triggerClose] = useState(false);
  const [agreementClicked, setAgreementClicked] = useState(false);
  const [openingText, setOpeningText] = useState(
    "Let's get some things straight"
  );

  const ref1 = useRef(new Animated.Value(0)).current;
  const ref2 = useRef(new Animated.Value(0)).current;
  const ref3 = useRef(new Animated.Value(0)).current;
  const ref4 = useRef(new Animated.Value(0)).current;
  const ref5 = useRef(new Animated.Value(0)).current;
  const buttonRef = useRef(new Animated.Value(0)).current;
  const pollFadeRef = useRef(new Animated.Value(0)).current;
  const agreementRef = useRef(new Animated.Value(0)).current;
  const masterFadeRef = useRef(new Animated.Value(1)).current;
  const openingTextOpacity = useRef(new Animated.Value(0)).current;

  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    if (visible && !pollOpen)
      Animated.timing(openingTextOpacity, {
        delay: 350,
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        Animated.sequence([
          Animated.timing(ref1, {
            delay: 350,
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref2, {
            delay: 1000,
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref3, {
            delay: 1000,
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref4, {
            delay: 1000,
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref5, {
            delay: 1500,
            toValue: 1,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start();
        if (openingText.slice(-3) !== "...") {
          setOpeningText(openingText + ".");
        }
      });
  }, [visible]);

  useEffect(() => {
    // need this extra check to make sure this doesn't trigger until
    // its updated by the hook above
    if (openingText.slice(-1) === "." && openingText.slice(-3) !== "...")
      setTimeout(() => {
        setOpeningText(openingText + ".");
      }, 100);
  }, [openingText]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(agreementRef, {
        toValue: agreementClicked ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(buttonRef, {
        toValue: agreementClicked ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [agreementClicked]);

  useEffect(() => {
    if (closing) {
      if (pollOpen) {
        setVisible(false);
        triggerClose(false);
      } else
        Animated.parallel([
          Animated.timing(openingTextOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(buttonRef, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref1, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref2, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref3, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref4, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
          Animated.timing(ref5, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
          }),
        ]).start(() => {
          setVisible(false);
          setAgreementClicked(false);
          triggerClose(false);
        });
    }
  }, [closing]);

  useEffect(() => {
    if (pollOpen)
      Animated.timing(pollFadeRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
  }, [pollOpen]);

  return (
    <Modal visible={visible} animationType="slide">
      <Animated.View
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#507DBC",
          padding: 20,
          opacity: masterFadeRef,
        }}
      >
        <Spacer width="100%" height={10} />
        <TouchableOpacity
          disabled={pollOpen}
          onPress={() => {
            if (agreementClicked) setAgreementClicked(false);
            triggerClose(true);
          }}
          style={{
            padding: 20,
            left: -20,
            alignSelf: "flex-start",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesome5 name="times" style={{ color: "#FFF", fontSize: 25 }} />
        </TouchableOpacity>
        <View style={{ width: "100%", flex: 1 }}>
          <Animated.Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 30,
              color: "#FFF",
              alignSelf: "center",
              textAlign: "center",
              opacity: openingTextOpacity,
            }}
          >
            {openingText}
          </Animated.Text>
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spacer width="100%" height={80} />
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 22.5,
                color: "#FFF",
                opacity: ref1,
                width: "100%",
                textAlign: "center",
              }}
            >
              At RedRover, we care about you and your privacy.{" "}
            </Animated.Text>
            <Spacer width="100%" height={40} />
            <Animated.Text style={{ width: "100%", textAlign: "center" }}>
              <Animated.Text
                style={{
                  fontFamily: "Lato_700Bold",
                  fontSize: 22.5,
                  color: "#FFF",
                  opacity: ref2,
                }}
              >
                No poll creator will ever be able to match your identity to your
                demographic data.{" "}
              </Animated.Text>
              <Animated.Text
                style={{
                  fontFamily: "Lato_700Bold",
                  fontSize: 22.5,
                  color: "#FFF",
                  opacity: ref3,
                }}
              >
                Ever.
              </Animated.Text>
            </Animated.Text>
            <Spacer width="100%" height={40} />
            <Animated.Text
              style={{
                fontFamily: "Lato_400Regular",
                fontSize: 22.5,
                color: "#FFF",
                opacity: ref4,
                width: "100%",
                textAlign: "center",
              }}
            >
              All of your data is safe with us. Any personal information is
              strictly used for analytical purposes.
            </Animated.Text>
          </View>
          <View
            style={{
              width: "100%",
              flex: 1,
              alignItems: "center",
            }}
          >
            <Spacer width="100%" height={40} />
            <Animated.View
              style={{
                flexDirection: "row",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
                opacity: ref5,
              }}
            >
              <AnimatedTouchable
                onPress={() => setAgreementClicked(!agreementClicked)}
                style={{
                  borderWidth: 1,
                  borderColor: "#FFF",
                  borderRadius: 5,
                  width: 30,
                  height: 30,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: agreementRef.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#507DBC", "#FFF"],
                  }),
                }}
              >
                <FontAwesome5
                  name="check"
                  style={{
                    fontSize: 22.5,
                    color: "#507DBC",
                  }}
                />
              </AnimatedTouchable>
              <Spacer width={20} height="100%" />
              <Text
                style={{
                  fontFamily: "Lato_700Bold",
                  fontSize: 22.5,
                  color: "#FFF",
                }}
              >
                Sounds good to me!
              </Text>
            </Animated.View>
            <Spacer width="100%" height={60} />
            <AnimatedTouchable
              disabled={!agreementClicked}
              onPress={() => openPoll(true)}
              style={{
                padding: 10,
                borderRadius: 5,
                backgroundColor: "#FFF",
                opacity: buttonRef,
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
          </View>
        </View>
      </Animated.View>
      <Animated.View
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "#507DBC",
          padding: 20,
          opacity: pollFadeRef,
          zIndex: pollFadeRef.interpolate({
            inputRange: [0, 1],
            outputRange: [-1, 1],
          }),
        }}
      >
        <TouchableOpacity
          onPress={() => triggerClose(true)}
          style={{
            padding: 20,
            left: -20,
            alignSelf: "flex-start",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FontAwesome5 name="times" style={{ color: "#FFF", fontSize: 25 }} />
        </TouchableOpacity>
        <ScreenSwitcher
          userID={userID}
          triggerClose={triggerClose}
          setIntakeSurvey={setIntakeSurvey}
        />
      </Animated.View>
    </Modal>
  );
};

export default function IntakeSurvey({
  userID,
  setIntakeSurvey,
}: {
  userID: string;
  setIntakeSurvey: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [spun, triggerSpin] = useState(false);
  const [visible, setVisible] = useState(false);
  const textRef = useRef(new Animated.Value(0)).current;
  const spinRef = useRef(new Animated.Value(0)).current;
  const growthRef = useRef(new Animated.Value(0)).current;
  const button1Ref = useRef(new Animated.Value(0)).current;
  const button2Ref = useRef(new Animated.Value(0)).current;
  const letUsKnowRef = useRef(new Animated.Value(0)).current;
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(growthRef, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(textRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(letUsKnowRef, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(button1Ref, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(button2Ref, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    Animated.timing(spinRef, {
      toValue: spun ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [spun]);

  return (
    <>
      <Animated.View
        style={{
          width: "100%",
          flex: 1,
          borderRadius: 10,
          borderWidth: 2.5,
          borderColor: spinRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["#FFF", "#507DBC"],
          }),
          backgroundColor: spinRef.interpolate({
            inputRange: [0, 1],
            outputRange: ["#507DBC", "#FFF"],
          }),
          transform: [
            { scale: growthRef },
            {
              scaleX: spinRef.interpolate({
                inputRange: [0, 1],
                outputRange: [1, -1],
              }),
            },
          ],
          padding: 20,
        }}
      >
        <Animated.Text
          style={{
            fontFamily: "Lato_400Regular",
            fontSize: 30,
            alignSelf: "center",
            color: "#FFF",
            opacity: textRef,
          }}
        >
          Intake Survey
        </Animated.Text>
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
              fontSize: 25,
              alignSelf: "center",
              textAlign: "center",
              color: "#FFF",
              opacity: letUsKnowRef,
            }}
          >
            Help us get to know you better!
          </Animated.Text>
          <Spacer width="100%" height={20} />
        </View>
        <AnimatedTouchable
          onPress={() => triggerSpin(true)}
          disabled={spun}
          style={{
            alignSelf: "center",
            padding: 10,
            backgroundColor: "#FFF",
            borderRadius: 5,
            width: 175,
            justifyContent: "center",
            alignItems: "center",
            opacity: spinRef.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                scaleX: button1Ref,
              },
            ],
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#507DBC",
            }}
          >
            What We Need
          </Text>
        </AnimatedTouchable>
        <Spacer width="100%" height={20} />
        <AnimatedTouchable
          onPress={() => setVisible(true)}
          disabled={spun}
          style={{
            alignSelf: "center",
            padding: 10,
            backgroundColor: "#FFF",
            borderRadius: 5,
            width: 175,
            justifyContent: "center",
            alignItems: "center",
            opacity: spinRef.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
            transform: [
              {
                scaleX: button2Ref,
              },
            ],
          }}
        >
          <Text
            style={{
              fontFamily: "Lato_400Regular",
              fontSize: 20,
              color: "#507DBC",
            }}
          >
            Get Started
          </Text>
        </AnimatedTouchable>
        <Animated.View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            transform: [{ scaleX: -1 }],
            alignSelf: "center",
            top: 20,
            opacity: spinRef.interpolate({
              inputRange: [0.5, 1],
              outputRange: [0, 1],
            }),
            zIndex: spinRef.interpolate({
              inputRange: [0, 1],
              outputRange: [-1, 0],
            }),
          }}
        >
          <Text
            style={{
              alignSelf: "center",
              fontFamily: "Lato_400Regular",
              fontSize: 22.5,
              color: "#507DBC",
            }}
          >
            What We Need From You
          </Text>
          <Spacer width="100%" height={20} />
          <ScrollView
            style={{ width: "100%", flex: 1 }}
            showsVerticalScrollIndicator={false}
          >
            <RequiredData
              iconName="user-graduate"
              label="Your School/University"
              description="Knowing what school you're affiliated with helps us see what trends are booming, and where!"
            />
            <DataSpacer />
            <RequiredData
              iconName="globe-americas"
              label="Your Country"
              description="This helps creators find out where users are engaging with their polls!"
            />
            <DataSpacer />
            <RequiredData
              forUSOnly
              iconName="map-marked-alt"
              label="Your State"
              description="Let us know your home state!"
            />
            <DataSpacer />
            <RequiredData
              forUSOnly
              iconName="city"
              label="Your Hometown"
              description="Let us know your hometown!"
            />
            <DataSpacer />
            <RequiredData
              iconName="birthday-cake"
              label="Your Birthday"
              description="Giving us your age helps poll creators understand their audiences better."
            />
            <DataSpacer />
            <RequiredData
              iconName="user-circle"
              label="Your Gender"
              description="Let us know your gender (if you'd like). This can help poll creators identify some trends in their poll data, but it isnt necessary!"
            />
            <DataSpacer />
            <RequiredData
              iconName="smile"
              label="Your Race/Ethnicity"
              description="Giving us this information helps poll creators match data to particular demographics."
            />
            <DataSpacer />
            <RequiredData
              iconName="landmark"
              label="Your Political Affiliation"
              description="Giving us this information helps poll creators identify how data varies among different groups."
            />
            <DataSpacer />
            <RequiredData
              iconName="heart"
              label="Your Sexual Orientation"
              description="This isn't super necessary, but it allows poll creators to better understand their audiences."
            />
            <DataSpacer />
            <RequiredData
              iconName="money-bill"
              label="Your Annual Household Income"
              description="This isn't always used by poll creators, but it helps some understand their audiences and data trends much better!"
            />
            <DataSpacer />
            <RequiredData
              iconName="briefcase"
              label="Your Job"
              description="Some poll creators love to see how people in different occupations vote on certain questions."
            />
            <DataSpacer />
            <RequiredData
              iconName="praying-hands"
              label="Your Religion (if any)"
              description="If you practice a particular religion, letting us know can help poll creators understand their audiences better. This is totally optional!"
            />
            <DataSpacer />
            <RequiredData
              iconName="paw"
              label="Your Pet(s) (if any)"
              description="If you have any pets, what kind of pets do you have?"
            />
            <DataSpacer />
            <RequiredData
              iconName="home"
              label="Your Living Situation"
              description="Letting us know what your living situation looks like helps poll creators understand their audiences much better."
            />
          </ScrollView>
          <Spacer width="100%" height={20} />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => triggerSpin(false)}
              style={{
                backgroundColor: "#507DBC",
                padding: 10,
                borderRadius: 5,
              }}
            >
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Lato_400Regular",
                  fontSize: 15,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
            <Spacer height="100%" width={20} />
            <TouchableOpacity
              onPress={() => setVisible(true)}
              style={{
                backgroundColor: "#507DBC",
                padding: 10,
                borderRadius: 5,
              }}
            >
              <Text
                style={{
                  color: "#FFF",
                  fontFamily: "Lato_400Regular",
                  fontSize: 15,
                }}
              >
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <IntakeSurveyModal
          visible={visible}
          setVisible={setVisible}
          userID={userID}
          setIntakeSurvey={setIntakeSurvey}
        />
      </Animated.View>
      <Spacer width="100%" height={40} />
    </>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    width: 350,
    height: 500,
    top: "5%",
    borderRadius: 8,
    borderColor: "rgb(80, 125, 188)",
    borderWidth: 5,
    backgroundColor: "rgb(80, 125, 188)",
  },
  promptText: {
    fontFamily: "Lato_400Regular",
    color: "#FFF",
    fontSize: 30,
    textAlign: "center",
    paddingLeft: 20,
    paddingRight: 20,
  },
  centerView: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  openSurveyButton: {
    width: 100,
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 5,
  },
  buttonText: {
    fontFamily: "Lato_400Regular",
    color: "rgb(80, 125, 188)",
  },
});
