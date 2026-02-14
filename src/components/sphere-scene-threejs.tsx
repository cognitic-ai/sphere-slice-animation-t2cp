import React from 'react';
import { View, Dimensions } from 'react-native';
import { WebView } from 'expo-web-browser';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import ThreeSphere from './three-sphere';

const { width, height } = Dimensions.get('window');

export default function SphereSceneThreeJS() {
  const backgroundAnimation = useSharedValue(0);
  const particleAnimation = useSharedValue(0);

  React.useEffect(() => {
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
  }, []);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: interpolate(backgroundAnimation.value, [0, 1], [0.8, 1]),
  }));

  const particleStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(particleAnimation.value, [0, 1], [0, 360])}deg`,
      },
    ],
    opacity: interpolate(backgroundAnimation.value, [0, 0.5, 1], [0.2, 0.8, 0.2]),
  }));

  // Generate floating particles
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 3 + 1,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
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
              backgroundColor: 'rgba(0, 150, 255, 0.4)',
            },
            particleStyle,
          ]}
        />
      ))}

      {/* Background glow effects */}
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

      {/* Three.js DOM Component */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        dom={{
          component: ThreeSphere,
          props: {
            width: Math.min(width, height) * 0.9,
            height: Math.min(width, height) * 0.9,
          },
        }}
      />

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