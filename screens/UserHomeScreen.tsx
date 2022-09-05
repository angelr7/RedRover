import { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadingScreen from "../components/LoadingScreen";
import { auth, getUserData } from "../firebase";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SCREEN_WIDTH } from "../constants/dimensions";
import Ionicons from "@expo/vector-icons/Ionicons";
import HomeFeed from "./HomeFeed";
import ExploreFeed from "./ExploreFeed";
import Settings from "./Settings";
import { StatusBar } from "expo-status-bar";
import CreatePolls from "./CreatePolls";

const BottomTabs = createBottomTabNavigator();

type RouteLabel = "bar-chart" | "home" | "compass" | "create" | "settings";

type IconLabel =
  | "bar-chart"
  | "bar-chart-outline"
  | "home"
  | "home-outline"
  | "compass"
  | "compass-outline"
  | "create"
  | "create-outline"
  | "settings"
  | "settings-outline";

interface UserInfo {
  createdAt: string;
  email: string;
  id: string;
  intakeSurvey: boolean;
  admin: boolean;
}

function TabBar({ state, descriptors, navigation, admin }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-evenly",
        width: SCREEN_WIDTH + 16,
        height: 80,
        alignItems: "center",
        backgroundColor: "transparent",
        paddingLeft: 8,
        paddingRight: 8,
        left: -8,
      }}
    >
      {state.routes.map(
        (route: { key: string | number; name: any }, index: any) => {
          const { options } = descriptors[route.key];
          const label: RouteLabel = route.name;
          let screenName: string;
          switch (label) {
            case "home":
              screenName = "Home";
              break;
            case "compass":
              screenName = "Explore";
              break;
            case "settings":
              screenName = "Settings";
              break;
            case "create":
              screenName = "Create";
              break;
            case "bar-chart":
              screenName = "Polls";
              break;
            default:
              screenName = label;
              break;
          }

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // The `merge: true` option makes sure that the params inside the tab screen are preserved
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          const iconName: IconLabel = `${label}${isFocused ? "" : "-outline"}`;

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={{
                display: "flex",
                flexDirection: "column",
                alignContent: "center",
                paddingLeft: 40,
                paddingRight: 40,
              }}
            >
              <Ionicons
                name={iconName}
                // compass looks just a tad smaller than the rest
                size={label === "compass" ? 36 : 32}
                color="#FFF"
                style={{ textAlign: "center" }}
              />
              <Text style={styles.labelText}>{screenName}</Text>
            </TouchableOpacity>
          );
        }
      )}
    </View>
  );
}

export default function UserHomeScreen({ navigation }) {
  const [userData, setUserData] = useState<UserInfo | undefined>(undefined);

  useEffect(() => {
    getUserData(auth.currentUser, setUserData);
  }, []);

  if (userData === undefined) return <LoadingScreen />;

  return (
    <SafeAreaView
      style={[
        styles.container,
        styles.centerView,
        userData.admin && { backgroundColor: "#D2042D" },
      ]}
    >
      <BottomTabs.Navigator
        tabBar={(props) => <TabBar {...props} admin={userData.admin} />}
      >
        {userData.admin ? (
          <>
            <BottomTabs.Screen
              name="create"
              component={CreatePolls}
              options={{ headerShown: false }}
              initialParams={{ userData }}
            />
            <BottomTabs.Screen
              name="bar-chart"
              component={HomeFeed}
              options={{ headerShown: false }}
              initialParams={{ userData }}
            />
            <BottomTabs.Screen
              name="settings"
              component={HomeFeed}
              options={{ headerShown: false }}
              initialParams={{ userData }}
            />
          </>
        ) : (
          <>
            <BottomTabs.Screen
              name="home"
              component={HomeFeed}
              options={{ headerShown: false }}
              initialParams={{ userData }}
            />
            <BottomTabs.Screen
              name="compass"
              component={ExploreFeed}
              options={{ headerShown: false }}
              initialParams={{ userData }}
            />
            <BottomTabs.Screen
              name="settings"
              component={Settings}
              options={{ headerShown: false }}
              initialParams={{ userData }}
            />
          </>
        )}
      </BottomTabs.Navigator>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgb(80, 125, 188)",
  },
  centerView: {
    display: "flex",
    justifyContent: "center",
    alignItem: "center",
  },
  labelText: {
    fontFamily: "Actor_400Regular",
    color: "#FFF",
    marginTop: 8,
  },
});