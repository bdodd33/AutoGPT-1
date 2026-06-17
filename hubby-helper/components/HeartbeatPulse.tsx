import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';
import { GlowingHeart } from './SVGMotifs';

interface HeartbeatPulseProps {
  urgency?: 'low' | 'medium' | 'high';
  size?: number;
}

export function HeartbeatPulse({ urgency = 'low', size = 80 }: HeartbeatPulseProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const ring1Anim = useRef(new Animated.Value(0)).current;
  const ring2Anim = useRef(new Animated.Value(0)).current;

  const duration = urgency === 'high' ? 600 : urgency === 'medium' ? 900 : 1400;

  useEffect(() => {
    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0.97,
            duration: duration * 0.15,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.08,
            duration: duration * 0.15,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    const ripple1 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Anim, {
          toValue: 1,
          duration: duration * 1.2,
          useNativeDriver: true,
        }),
        Animated.timing(ring1Anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    const ripple2 = Animated.loop(
      Animated.sequence([
        Animated.delay(duration * 0.4),
        Animated.timing(ring2Anim, {
          toValue: 1,
          duration: duration * 1.2,
          useNativeDriver: true,
        }),
        Animated.timing(ring2Anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    heartbeat.start();
    ripple1.start();
    ripple2.start();

    return () => {
      heartbeat.stop();
      ripple1.stop();
      ripple2.stop();
    };
  }, [urgency]);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: size * 1.8,
    height: size * 1.8,
    borderRadius: size,
    borderWidth: 1.5,
    borderColor: Colors.gold.DEFAULT,
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.6],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 0.3, 0],
    }),
  });

  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      <Animated.View style={ringStyle(ring1Anim)} />
      <Animated.View style={ringStyle(ring2Anim)} />
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <GlowingHeart size={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
