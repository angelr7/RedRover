import { StyleSheet, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IntakeSurveyIndicator } from "../components/IntakeSurvey";

export default function Settings({ route, navigation }) {
  const { userData } = route.params;

  return (
    <SafeAreaView style={[styles.mainContainer, styles.centerView]}>
      <Text style={styles.titleText}>Settings</Text>
      {!userData.intakeSurvey && (
        <IntakeSurveyIndicator navigation={navigation} />
      )}
      {/* <FlatList
        style={styles.scrollView}
        data={data}
        renderItem={({ item }) => <Text>Yo</Text>}
      ></FlatList> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFF",
  },
  centerView: {
    display: "flex",
    alignItems: "center",
  },
  titleText: {
    fontFamily: "Actor_400Regular",
    fontSize: 30,
    textAlign: "center",
    color: "#507DBC",
    fontWeight: "bold",
  },
  scrollView: {
    width: "100%",
    flex: 1,
  },
});
