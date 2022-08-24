import { NavigationContainer } from "@react-navigation/native";
import { Stack } from "./constants/navigation";
import Homepage from "./screens/Homepage";
import Register from "./screens/Register";
import Login from "./screens/Login";

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
