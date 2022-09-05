import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

export default function LoadingScreen({ color }: { color?: string }) {
  const [spinVal, setSpinVal] = useState(1);
  const spinAnimationProgress = useRef(new Animated.Value(0)).current;
  const animationStyle = {
    transform: [
      {
        rotateY: spinAnimationProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
  };

  useEffect(() => {
    Animated.timing(spinAnimationProgress, {
      toValue: spinVal,
      duration: 375,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        setSpinVal(spinVal + 1);
      }, 500);
    });
  }, [spinVal]);

  return (
    <View
      style={[
        {
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFF",
        },
      ]}
    >
      <Animated.View style={[styles.logoContainer, animationStyle]}>
        <Text
          style={[
            styles.logoText,
            { transform: [{ scaleX: -1 }], left: 7.5 },
            color && { color },
          ]}
        >
          R
        </Text>
        <Text style={[styles.logoText, { right: 7.5 }, color && { color }]}>
          R
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 100,
    color: "#507DBC",
    fontFamily: "Actor_400Regular",
  },
});
