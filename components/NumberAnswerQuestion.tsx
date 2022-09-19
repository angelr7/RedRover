import Spacer from "./Spacer";
import Slider from "@react-native-community/slider";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type NumberAnswerVariant = "Percentage" | "Number";
interface VariantButtonContainerProps {
  variant: NumberAnswerVariant;
  setVariant: React.Dispatch<React.SetStateAction<NumberAnswerVariant>>;
}
interface RangeSliderContainerProps {
  variant: NumberAnswerVariant;
  minValue: number;
  maxValue: number;
  setMinValue: React.Dispatch<React.SetStateAction<number>>;
  setMaxValue: React.Dispatch<React.SetStateAction<number>>;
}
interface NumberAnswerProps {
  questionText: string;
}

const VariantButtonContainer = ({
  variant,
  setVariant,
}: VariantButtonContainerProps) => {
  const selectedButtonText = { color: "#D2042D" };
  const selectedButtonContainer = { backgroundColor: "#FFF" };

  return (
    <View style={styles.outerRed}>
      <View style={[styles.wineColor, styles.buttonHolder]}>
        <TouchableOpacity
          onPress={() => setVariant("Percentage")}
          style={[
            styles.buttonContainer,
            variant === "Percentage" && selectedButtonContainer,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Percentage" && selectedButtonText,
            ]}
          >
            Percentage
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setVariant("Number")}
          style={[
            styles.buttonContainer,
            variant === "Number" && selectedButtonContainer,
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              variant === "Number" && selectedButtonText,
            ]}
          >
            Number
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const RangeSliders = ({
  variant,
  minValue,
  maxValue,
  setMinValue,
  setMaxValue,
}: RangeSliderContainerProps) => {
  return (
    <>
      <View style={styles.rangeInputContainer}>
        <View>
          <Text style={styles.innerContainerText}>Min Value</Text>
          <Text style={styles.sliderValue}>
            {minValue}
            {variant === "Percentage" && "%"}
          </Text>
        </View>
        <Spacer width={10} height="100%" />
        <View style={[styles.centerView, styles.sliderContainer]}>
          <Slider
            step={1}
            value={minValue > maxValue ? maxValue : minValue}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={"#FFF"}
            maximumTrackTintColor={"#FFF"}
            thumbTintColor={"#FFF"}
            style={{ width: "100%" }}
            onValueChange={(value) => {
              setMinValue(value);
            }}
          />
        </View>
      </View>
      <Spacer width="100%" height={20} />
      <View style={styles.rangeInputContainer}>
        <View>
          <Text style={styles.innerContainerText}>Max Value</Text>
          <Text style={styles.sliderValue}>
            {maxValue}
            {variant === "Percentage" && "%"}
          </Text>
        </View>
        <Spacer width={10} height="100%" />
        <View style={[styles.centerView, styles.sliderContainer]}>
          <Slider
            step={1}
            value={maxValue < minValue ? minValue : maxValue}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={"#FFF"}
            maximumTrackTintColor={"#FFF"}
            thumbTintColor={"#FFF"}
            onValueChange={(value) => setMaxValue(value)}
            style={{ width: "100%" }}
          />
        </View>
      </View>
    </>
  );
};

export default function NumberAnswer({ questionText }: NumberAnswerProps) {
  const [variant, setVariant] = useState<NumberAnswerVariant>(undefined);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(0);
  const [animationTriggered, setAnimationTriggered] = useState(false);
  const fadeAnimationProgress = useRef(new Animated.Value(0)).current;
  const invalidRange = minValue === maxValue || questionText === "";

  useEffect(() => {
    if (!animationTriggered) {
      setAnimationTriggered(true);
      if (minValue >= maxValue) {
        Animated.timing(fadeAnimationProgress, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setAnimationTriggered(false));
      } else {
        Animated.timing(fadeAnimationProgress, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setAnimationTriggered(false));
      }
    }
  }, [invalidRange]);

  return (
    <>
      <Text style={styles.heading}>Select Variant</Text>
      <Spacer width="100%" height={10} />
      <VariantButtonContainer variant={variant} setVariant={setVariant} />
      {variant !== undefined && (
        <>
          <Spacer width="100%" height={40} />
          <Text style={styles.heading}>Set Range</Text>
          <Spacer width="100%" height={10} />
          <View style={styles.outerRed}>
            <View style={styles.wineColor}>
              <RangeSliders
                variant={variant}
                minValue={minValue}
                maxValue={maxValue}
                setMinValue={setMinValue}
                setMaxValue={setMaxValue}
              />
            </View>
          </View>
          <Spacer width="100%" height={10} />
          <Animated.View
            style={[
              styles.outerSubmitButtonContainer,
              { opacity: fadeAnimationProgress },
            ]}
          >
            <TouchableOpacity
              disabled={invalidRange}
              style={styles.submitButtonContainer}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  centerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
    color: "#D2042D",
  },
  outerRed: {
    backgroundColor: "#D2042D",
    width: "100%",
    borderRadius: 7.5,
  },
  wineColor: {
    backgroundColor: "rgba(114, 47, 55, 0.5)",
    width: "100%",
    flex: 1,
    padding: 20,
    borderRadius: 7.5,
  },
  buttonHolder: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  buttonContainer: {
    padding: 10,
    borderRadius: 5,
    borderColor: "#FFF",
    borderWidth: 1,
  },
  buttonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
  },
  innerContainerText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
    width: 80,
  },
  rangeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sliderContainer: {
    flex: 1,
    height: 30,
    borderRadius: 5,
  },
  sliderValue: {
    color: "#FFF",
  },
  submitButtonContainer: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgba(114, 47, 55, 0.5)",
  },
  submitButtonText: {
    color: "#FFF",
    fontFamily: "Actor_400Regular",
    fontSize: 17.5,
  },
  outerSubmitButtonContainer: {
    alignSelf: "center",
    backgroundColor: "#D2042D",
    borderRadius: 5,
  },
});
