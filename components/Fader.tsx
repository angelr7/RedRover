import React, { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

export default function Fader({
  fadeIn,
  callback,
}: {
  fadeIn: boolean;
  callback?: () => any;
}) {
  const [zIndex, setZIndex] = useState(-1);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (fadeIn) {
      setZIndex(1);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => callback && callback());
    }
  }, [fadeIn]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        backgroundColor: "#853b30",
        zIndex,
        opacity,
      }}
    />
  );
}
