import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Pressable, StyleSheet } from "react-native";

export default function BackCaretPressable({
  setVisible,
  altAction,
  style,
}: {
  altAction: () => any | undefined;
  setVisible?: React.Dispatch<React.SetStateAction<boolean>>;
  style?: { [key: string]: any };
}) {
  return (
    <Pressable
      onPress={() => {
        if (altAction !== undefined) altAction();
        else setVisible(false);
      }}
      style={[{ paddingTop: 20 }, style]}
    >
      <FontAwesome5 name="angle-left" style={styles.backCaret} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backCaret: {
    color: "#FFF",
    fontSize: 37.5,
  },
});
