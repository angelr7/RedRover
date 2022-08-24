import { View } from "react-native";

interface SpacerProps {
  width: number | string;
  height: number | string;
}

export default function Spacer({ width, height }: SpacerProps) {
  return <View style={{ width, height }} />;
}
