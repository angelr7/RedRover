import {
  StyleSheet,
  Text,
  FlatList,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Spacer from "../components/Spacer";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function LandingScreen({ route, navigation }) {
  const { userData } = route.params;

  return (
    <SafeAreaView style={[styles.mainContainer, styles.centerView]}>
      <Text style={styles.titleText}>Create Polls</Text>
      <Spacer width="100%" height={50} />
      <Text style={styles.headingText}>My Polls</Text>
      <View style={styles.flatListContainer}>
        <FlatList
          data={[]}
          renderItem={({ item }) => <View />}
          horizontal={true}
        />
      </View>
      <View style={[styles.addPollContainer, styles.centerView]}>
        <Text style={styles.subHeadingStyle}>New Poll</Text>
        <TouchableOpacity
          onPress={() => {
            navigation.push("CreatePollScreen");
          }}
        >
          <Ionicons name="add-circle" style={styles.addIcon} />
        </TouchableOpacity>
      </View>
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
    fontSize: 100,
    color: "#D2042D",
    textAlign: "center",
    left: 3,
  },
  addPollContainer: {
    position: "absolute",
    bottom: "15%",
  },
  subHeadingStyle: {
    alignSelf: "center",
    fontFamily: "Actor_400Regular",
    color: "#D2042D",
    fontSize: 30,
  },
});
