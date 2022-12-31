import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";

export default function Settings({ route, navigation }) {
  const { userData, triggerSignOut } = route.params;

  return (
    <SafeAreaView style={{ width: "100%", height: "100%" }}>
      <Text
        style={[
          styles.titleText,
          { color: userData.admin ? "#853b30" : "#507DBC" },
        ]}
      >
        Settings
      </Text>
      <View
        style={{
          flex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            signOut(auth);
            triggerSignOut(true);
          }}
          style={{
            padding: 15,
            borderRadius: 5,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: userData.admin ? "#853b30" : "#507DBC",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              alignSelf: "center",
              fontFamily: "Lato_400Regular",
              color: "#FFF",
            }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontFamily: "Lato_400Regular",
    fontSize: 30,
    alignSelf: "center",
    top: -20,
  },
});
