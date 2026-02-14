import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface WireframeLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  delay?: number;
}

const WireframeLine: React.FC<WireframeLineProps> = ({ x1, y1, x2, y2, opacity, delay = 0 }) => {
  const animatedOpacity = useSharedValue(0);

  useEffect(() => {
    animatedOpacity.value = withDelay(
      delay,
      withTiming(opacity, { duration: 1000, easing: Easing.out(Easing.exp) })
    );
  }, [opacity, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
    transform: [
      {
        scaleX: interpolate(animatedOpacity.value, [0, 1], [0, 1]),
      },
    ],
  }));

  const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x1,
          top: y1,
          width: length,
          height: 2,
          backgroundColor: '#0096ff',
          transformOrigin: 'left center',
          transform: [{ rotate: `${angle}deg` }],
        },
        animatedStyle,
      ]}
    />
  );
};

interface SliceLineProps {
  centerX: number;
  centerY: number;
  angle: number;
  radius: number;
  progress: number;
}

const SliceLine: React.FC<SliceLineProps> = ({ centerX, centerY, angle, radius, progress }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress,
    transform: [
      {
        scale: interpolate(progress, [0, 1], [0.5, 1.2]),
      },
      {
        rotate: `${angle}deg`,
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: centerX - radius,
          top: centerY - 2,
          width: radius * 2,
          height: 4,
          backgroundColor: '#ff6b35',
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export default function AnimatedSphereCanvas() {
  const size = Math.min(screenWidth, screenHeight) * 0.8;
  const center = { x: size / 2, y: size / 2 };
  const radius = size * 0.35;

  // Animation values
  const rotationProgress = useSharedValue(0);
  const sliceProgress = useSharedValue(0);
  const wireframeOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Generate wireframe circle approximation
  const wireframeLines = React.useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
    const segments = 32;

    // Outer circle
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      lines.push({
        x1: center.x + Math.cos(angle1) * radius,
        y1: center.y + Math.sin(angle1) * radius,
        x2: center.x + Math.cos(angle2) * radius,
        y2: center.y + Math.sin(angle2) * radius,
        opacity: 0.8,
      });
    }

    // Inner circles
    for (let r = 0.3; r <= 0.9; r += 0.3) {
      const currentRadius = radius * r;
      for (let i = 0; i < segments; i += 2) {
        const angle1 = (i / segments) * Math.PI * 2;
        const angle2 = ((i + 1) / segments) * Math.PI * 2;

        lines.push({
          x1: center.x + Math.cos(angle1) * currentRadius,
          y1: center.y + Math.sin(angle1) * currentRadius,
          x2: center.x + Math.cos(angle2) * currentRadius,
          y2: center.y + Math.sin(angle2) * currentRadius,
          opacity: 0.6 * r,
        });
      }
    }

    // Radial lines
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      lines.push({
        x1: center.x + Math.cos(angle) * radius * 0.3,
        y1: center.y + Math.sin(angle) * radius * 0.3,
        x2: center.x + Math.cos(angle) * radius,
        y2: center.y + Math.sin(angle) * radius,
        opacity: 0.4,
      });
    }

    return lines;
  }, [center, radius]);

  useEffect(() => {
    // Continuous rotation
    rotationProgress.value = withRepeat(
      withTiming(1, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulse effect
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.9, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );

    // Slicing animation
    const sliceAnimation = () => {
      sliceProgress.value = 0;
      wireframeOpacity.value = 1;

      sliceProgress.value = withSequence(
        withDelay(1000, withTiming(1, { duration: 2000, easing: Easing.out(Easing.exp) })),
        withDelay(1000, withTiming(0, { duration: 1000, easing: Easing.in(Easing.exp) }))
      );

      wireframeOpacity.value = withSequence(
        withDelay(1000, withTiming(0.2, { duration: 500 })),
        withDelay(2500, withTiming(1, { duration: 1000 }))
      );
    };

    sliceAnimation();
    const interval = setInterval(sliceAnimation, 6000);

    return () => clearInterval(interval);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(rotationProgress.value, [0, 1], [0, 360])}deg`,
      },
      {
        scale: interpolate(pulseScale.value, [0.9, 1.1], [0.95, 1.05]),
      },
    ],
  }));

  const wireframeStyle = useAnimatedStyle(() => ({
    opacity: wireframeOpacity.value,
  }));

  const sliceStyle = useAnimatedStyle(() => ({
    opacity: sliceProgress.value,
  }));

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      {/* Background glow */}
      <View
        style={{
          position: 'absolute',
          width: radius * 2.5,
          height: radius * 2.5,
          borderRadius: radius * 1.25,
          backgroundColor: 'rgba(0, 150, 255, 0.1)',
        }}
      />

      <Animated.View
        style={[
          {
            width: size,
            height: size,
            position: 'relative',
          },
          containerStyle,
        ]}
      >
        {/* Wireframe lines */}
        <Animated.View style={[{ width: '100%', height: '100%' }, wireframeStyle]}>
          {wireframeLines.map((line, index) => (
            <WireframeLine
              key={index}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              opacity={line.opacity}
              delay={index * 50}
            />
          ))}
        </Animated.View>

        {/* Slice lines */}
        <Animated.View style={[{ width: '100%', height: '100%' }, sliceStyle]}>
          {Array.from({ length: 8 }, (_, i) => (
            <SliceLine
              key={i}
              centerX={center.x}
              centerY={center.y}
              angle={(i / 8) * 360}
              radius={radius * 0.8}
              progress={sliceProgress.value}
            />
          ))}
        </Animated.View>

        {/* Central point */}
        <View
          style={{
            position: 'absolute',
            left: center.x - 6,
            top: center.y - 6,
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: '#00ff88',
            shadowColor: '#00ff88',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }}
        />
      </Animated.View>
    </View>
  );
}