import { View, Animated } from "react-native";

interface SpacerProps {
  width: number | string;
  height: number | string;
}

interface StyleProps {
  [key: string]: any;
}

interface AnimatedSpacerProps {
  width: number | string | Animated.Value | Animated.AnimatedInterpolation;
  height: number | string | Animated.Value | Animated.AnimatedInterpolation;
  style?: StyleProps;
}

export default function Spacer({ width, height }: SpacerProps) {
  return <View style={{ width, height }} />;
}

export function AnimatedSpacer({ width, height, style }: AnimatedSpacerProps) {
  return <Animated.View style={[{ width, height }, style]} />;
}
