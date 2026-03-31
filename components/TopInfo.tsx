import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

const ScrollingText = ({ text }) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const textWidth = text.length * 2; // Approximate text width (14px per character)
  const totalWidth = textWidth + screenWidth; // Total distance to scroll

  useEffect(() => {
    const startScrolling = () => {
      scrollX.setValue(screenWidth); // Start text off-screen to the right
      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -textWidth, // Scroll to just before the text ends
          duration: totalWidth * 14, // Adjust speed (20ms per pixel)
          useNativeDriver: true,
        })
      ).start();
    };

    startScrolling();

    return () => {
      Animated.timing(scrollX).stop();
    };
  }, [text, scrollX, textWidth]);

  return (
    <View style={styles.container}>
      <Animated.Text
        style={[
          styles.text,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden', // Prevent text from showing outside the bounds
    width: screenWidth, // Full screen width for scrolling
    height: 18, // Height of the text container
    backgroundColor: '#FDF5E6', // Light yellow background
    justifyContent: 'center',
  },
text: {
    fontSize: 14,
    color: '#F08080',
    fontFamily: 'OpenSansM',
    whiteSpace: 'nowrap', // Ensure text stays on a single line
  },
});

export default ScrollingText;
