import { StyleSheet, View, Animated } from "react-native";
import React, { useEffect, useRef } from "react";
import Colors from "@/constants/colors";

export default function TypingIndicator() {
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
    };

    const animation = Animated.loop(
      Animated.parallel([
        animateDot(dot1Opacity, 0),
        animateDot(dot2Opacity, 200),
        animateDot(dot3Opacity, 400),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [dot1Opacity, dot2Opacity, dot3Opacity]);

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
          <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    alignSelf: "flex-start",
  },
  bubble: {
    backgroundColor: Colors.light.aiBubble,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 10,
    width: 40,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.darkGray,
    marginHorizontal: 2,
  },
});