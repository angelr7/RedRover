import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

export default function LoadingScreen({ color }: { color?: string }) {
  const [triggerAnimation, setTriggerAnimation] = useState(false);
  const spinAnimationProgress = useRef(new Animated.Value(0)).current;
  const animationStyle = {
    transform: [
      {
        rotate: spinAnimationProgress.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "360deg"],
        }),
      },
      {
        scale: spinAnimationProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
  };

  useEffect(() => {
    setTriggerAnimation(true);
  }, []);
  useEffect(() => {
    if (triggerAnimation) {
      Animated.timing(spinAnimationProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.elastic(1),
      }).start(() => {
        Animated.timing(spinAnimationProgress, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.elastic(1),
        }).start();
        setTimeout(() => {
          setTriggerAnimation(false);
        }, 500);
      });
    } else {
      setTriggerAnimation(true);
    }
  }, [triggerAnimation]);

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
            { transform: [{ scaleX: -1 }], left: 10 },
            color && { color },
          ]}
        >
          R
        </Text>
        <Text style={[styles.logoText, { right: 10 }, color && { color }]}>
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
    fontSize: 150,
    color: "#507DBC",
    fontFamily: "Actor_400Regular",
  },
});
