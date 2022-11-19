import { View, Animated } from "react-native";

interface StyleProps {
  [key: string]: any;
}

interface SpacerProps {
  width?: number | string;
  height?: number | string;
  style?: StyleProps;
}

interface AnimatedSpacerProps {
  width: number | string | Animated.Value | Animated.AnimatedInterpolation;
  height: number | string | Animated.Value | Animated.AnimatedInterpolation;
  style?: StyleProps;
}

export default function Spacer({ width, height, style }: SpacerProps) {
  return <View style={[{ width, height }, style]} />;
}

export function AnimatedSpacer({ width, height, style }: AnimatedSpacerProps) {
  return <Animated.View style={[{ width, height }, style]} />;
}
