import { StyleSheet, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Poll({ navigation, route }) {
  return (
    <SafeAreaView
      style={[styles.mainContainer, styles.centerView]}
    ></SafeAreaView>
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
    fontFamily: "Lato_400Regular",
    fontSize: 30,
    textAlign: "center",
    color: "#507DBC",
    fontWeight: "bold",
    position: "absolute",
  },
  scrollView: {
    width: "100%",
    flex: 1,
    paddingTop: 8, // stop overlap w/ title
  },
});
