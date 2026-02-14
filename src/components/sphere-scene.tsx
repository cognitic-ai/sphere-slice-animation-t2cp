import React, { useEffect } from 'react';
import { View, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedSphereCanvas from './animated-sphere-canvas';

const { width, height } = Dimensions.get('window');

export default function SphereScene() {
  const backgroundAnimation = useSharedValue(0);
  const particleAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    // Background color cycling
    backgroundAnimation.value = withRepeat(
      withTiming(1, {
        duration: 10000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Particle movement
    particleAnimation.value = withRepeat(
      withTiming(1, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulse effect
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.out(Easing.exp) }),
        withTiming(0, { duration: 2000, easing: Easing.in(Easing.exp) })
      ),
      -1,
      false
    );
  }, []);

  const backgroundStyle = useAnimatedStyle(() => {
    const color1Progress = interpolate(
      backgroundAnimation.value,
      [0, 0.33, 0.66, 1],
      [0, 1, 0, 0]
    );
    const color2Progress = interpolate(
      backgroundAnimation.value,
      [0, 0.33, 0.66, 1],
      [0, 0, 1, 0]
    );
    const color3Progress = interpolate(
      backgroundAnimation.value,
      [0, 0.33, 0.66, 1],
      [1, 0, 0, 1]
    );

    return {
      opacity: 1,
      transform: [
        {
          scale: interpolate(pulseAnimation.value, [0, 1], [1, 1.02]),
        },
      ],
    };
  });

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(particleAnimation.value, [0, 1], [0, 360])}deg`,
      },
      {
        scale: interpolate(pulseAnimation.value, [0, 1], [0.8, 1.2]),
      },
    ],
    opacity: interpolate(pulseAnimation.value, [0, 0.5, 1], [0.3, 1, 0.3]),
  }));

  // Generate particle positions
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 4 + 1,
    speed: Math.random() * 0.5 + 0.2,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Animated background gradient */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: '100%',
            height: '100%',
          },
          backgroundStyle,
        ]}
      >
        <LinearGradient
          colors={['#0a0a0a', '#1a1a2e', '#16213e', '#0f0f23']}
          locations={[0, 0.3, 0.7, 1]}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Floating particles */}
      {particles.map((particle) => (
        <Animated.View
          key={particle.id}
          style={[
            {
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              borderRadius: particle.size / 2,
              backgroundColor: 'rgba(0, 150, 255, 0.6)',
            },
            particleStyle,
          ]}
        />
      ))}

      {/* Additional glow effects */}
      <View
        style={{
          position: 'absolute',
          top: height * 0.1,
          left: width * 0.1,
          width: width * 0.8,
          height: height * 0.8,
          borderRadius: width * 0.4,
          backgroundColor: 'rgba(0, 150, 255, 0.05)',
        }}
      />

      <View
        style={{
          position: 'absolute',
          top: height * 0.2,
          left: width * 0.2,
          width: width * 0.6,
          height: height * 0.6,
          borderRadius: width * 0.3,
          backgroundColor: 'rgba(0, 255, 136, 0.03)',
        }}
      />

      {/* Main sphere component */}
      <AnimatedSphereCanvas />

      {/* Corner accent lights */}
      <View
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: 'rgba(0, 150, 255, 0.1)',
        }}
      />

      <View
        style={{
          position: 'absolute',
          bottom: 40,
          right: 20,
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
        }}
      />
    </View>
  );
}