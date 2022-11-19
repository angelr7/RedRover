import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { Stack } from "./constants/navigation";
import Homepage from "./screens/Homepage";
import Register from "./screens/Register";
import Login from "./screens/Login";
import { auth } from "./firebase";
import { View } from "react-native";
import LoadingScreen from "./components/LoadingScreen";
import {
  useFonts,
  Lato_400Regular,
  Lato_700Bold,
} from "@expo-google-fonts/lato";
import UserHomeScreen from "./screens/UserHomeScreen";
import Poll from "./screens/Poll";
import CreatePollScreen from "./screens/CreatePollScreen";

export default function App() {
  const [fontsLoaded] = useFonts({ Lato_400Regular, Lato_700Bold });
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user ?? null);
    });
  }, []);

  if (!fontsLoaded) return <View />;
  if (user === undefined) return <LoadingScreen />;
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user === null ? "Auth" : "UserHomeScreen"}
      >
        <Stack.Screen
          name="Auth"
          component={Homepage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserHomeScreen"
          component={UserHomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NoAnimationUserHomeScreen"
          component={UserHomeScreen}
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen
          name="Poll"
          component={Poll}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatePollScreen"
          component={CreatePollScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
