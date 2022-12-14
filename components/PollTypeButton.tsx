import { StyleSheet, TouchableOpacity, Text, View } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import Spacer from "./Spacer";
import { IMAGE_SELECTION } from "../constants/polls";

type AcceptedIcon = "tasks" | "i-cursor" | "podium" | "numbers" | "images";
type AcceptedLabel =
  | "Multiple Choice"
  | "Free Response"
  | "Ranking"
  | "Number Answer"
  | "Image Selection";
interface Props {
  iconName: AcceptedIcon;
  label: AcceptedLabel;
  index: number;
  currSelected: number | undefined;
  onPress: any;
  containerStyle?: StyleProp;
  iconStyle?: StyleProp;
  textStyle?: StyleProp;
}
interface StyleProp {
  [key: string]: any;
}

export default function PollTypeButton({
  iconName,
  label,
  index,
  currSelected,
  onPress,
  containerStyle,
  iconStyle,
  textStyle,
}: Props) {
  const selected = index === currSelected;
  return (
    <TouchableOpacity
      style={[
        styles.iconButtonStyle,
        {
          marginBottom: index !== IMAGE_SELECTION ? 10 : 0,
        },
        selected && { backgroundColor: "#FFF" },
        containerStyle,
      ]}
      onPress={onPress}
    >
      {(() => {
        switch (iconName) {
          case "podium":
            return (
              <Ionicons
                name={iconName}
                style={[
                  styles.iconStyle,
                  { color: selected ? "rgb(133, 59, 48)" : "#FFF" },
                  iconStyle,
                ]}
              />
            );
          case "numbers": {
            return (
              <View>
                <FontAwesome5
                  name={"sort-numeric-up"}
                  style={[
                    styles.iconStyle,
                    { color: selected ? "rgb(133, 59, 48)" : "#FFF" },
                    iconStyle,
                  ]}
                />
                <FontAwesome5
                  name={"sort-numeric-down"}
                  style={[
                    styles.iconStyle,
                    {
                      position: "absolute",
                      color: selected ? "rgb(133, 59, 48)" : "#FFF",
                    },
                    iconStyle,
                  ]}
                />
              </View>
            );
          }
          default:
            return (
              <FontAwesome5
                name={iconName}
                style={[
                  styles.iconStyle,
                  { color: selected ? "rgb(133, 59, 48)" : "#FFF" },
                  iconStyle,
                ]}
              />
            );
        }
      })()}
      <Spacer width={10} height="100%" />
      <Text
        style={[
          styles.buttonTextStyle,
          { color: selected ? "rgb(133, 59, 48)" : "#FFF" },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconButtonStyle: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFF",
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  iconStyle: {
    fontSize: 17.5,
  },
  buttonTextStyle: {
    color: "#FFF",
    fontFamily: "Lato_400Regular",
    fontSize: 17.5,
  },
});

export type { AcceptedIcon, AcceptedLabel };
