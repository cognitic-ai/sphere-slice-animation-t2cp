import React, { useEffect, useMemo } from 'react';
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
const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

export default function AnimatedSphere() {
  const size = Math.min(screenWidth, screenHeight) * 0.8;
  const center = { x: size / 2, y: size / 2 };
  const radius = size * 0.35;

  // Animation values
  const rotationY = useSharedValue(0);
  const rotationX = useSharedValue(0);
  const sliceProgress = useSharedValue(0);
  const wireframeOpacity = useSharedValue(1);
  const sliceOpacity = useSharedValue(0);

  // Generate sphere wireframe points
  const wireframeLines = useMemo(() => {
    const lines: { start: Point3D; end: Point3D }[] = [];
    const segments = 16;

    // Longitude lines (vertical circles)
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      for (let j = 0; j < segments; j++) {
        const theta1 = (j / segments) * Math.PI;
        const theta2 = ((j + 1) / segments) * Math.PI;

        lines.push({
          start: {
            x: Math.sin(theta1) * Math.cos(angle) * radius,
            y: Math.cos(theta1) * radius,
            z: Math.sin(theta1) * Math.sin(angle) * radius,
          },
          end: {
            x: Math.sin(theta2) * Math.cos(angle) * radius,
            y: Math.cos(theta2) * radius,
            z: Math.sin(theta2) * Math.sin(angle) * radius,
          },
        });
      }
    }

    // Latitude lines (horizontal circles)
    for (let i = 1; i < segments; i++) {
      const theta = (i / segments) * Math.PI;
      const r = Math.sin(theta) * radius;
      const y = Math.cos(theta) * radius;

      for (let j = 0; j < segments; j++) {
        const angle1 = (j / segments) * Math.PI * 2;
        const angle2 = ((j + 1) / segments) * Math.PI * 2;

        lines.push({
          start: {
            x: Math.cos(angle1) * r,
            y: y,
            z: Math.sin(angle1) * r,
          },
          end: {
            x: Math.cos(angle2) * r,
            y: y,
            z: Math.sin(angle2) * r,
          },
        });
      }
    }

    return lines;
  }, [radius]);

  // Project 3D point to 2D
  const project3DTo2D = (point: Point3D, rotX: number, rotY: number): Point2D => {
    // Apply rotation
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    // Rotate around Y axis
    let x = point.x * cosY + point.z * sinY;
    let z = -point.x * sinY + point.z * cosY;
    let y = point.y;

    // Rotate around X axis
    const newY = y * cosX - z * sinX;
    z = y * sinX + z * cosX;
    y = newY;

    // Project to 2D (simple orthographic projection)
    return {
      x: center.x + x,
      y: center.y + y,
    };
  };

  // Generate slice paths
  const slicePaths = useMemo(() => {
    const paths: string[] = [];
    const sliceCount = 8;

    for (let i = 0; i < sliceCount; i++) {
      const angle = (i / sliceCount) * Math.PI * 2;
      const sliceRadius = radius * 0.9;

      // Create a curved slice path
      const startAngle = angle - 0.3;
      const endAngle = angle + 0.3;

      const startPoint = {
        x: center.x + Math.cos(startAngle) * sliceRadius,
        y: center.y + Math.sin(startAngle) * sliceRadius,
      };

      const endPoint = {
        x: center.x + Math.cos(endAngle) * sliceRadius,
        y: center.y + Math.sin(endAngle) * sliceRadius,
      };

      const controlPoint = {
        x: center.x + Math.cos(angle) * sliceRadius * 1.2,
        y: center.y + Math.sin(angle) * sliceRadius * 1.2,
      };

      paths.push(`M ${startPoint.x} ${startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`);
    }

    return paths;
  }, [center, radius]);

  useEffect(() => {
    // Start continuous rotation
    rotationY.value = withRepeat(
      withTiming(Math.PI * 2, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    rotationX.value = withRepeat(
      withTiming(Math.PI * 0.2, {
        duration: 4000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    // Animate slicing effect
    const sliceAnimation = () => {
      sliceProgress.value = 0;
      sliceOpacity.value = 0;
      wireframeOpacity.value = 1;

      sliceProgress.value = withSequence(
        withDelay(1000, withTiming(1, { duration: 2000, easing: Easing.out(Easing.exp) })),
        withDelay(1000, withTiming(0, { duration: 1000, easing: Easing.in(Easing.exp) }))
      );

      sliceOpacity.value = withSequence(
        withDelay(1000, withTiming(1, { duration: 500 })),
        withDelay(2500, withTiming(0, { duration: 1000 }))
      );

      wireframeOpacity.value = withSequence(
        withDelay(1000, withTiming(0.3, { duration: 500 })),
        withDelay(2500, withTiming(1, { duration: 1000 }))
      );
    };

    sliceAnimation();
    const interval = setInterval(sliceAnimation, 5000);

    return () => clearInterval(interval);
  }, []);

  // Animated props for wireframe
  const wireframeAnimatedProps = useAnimatedProps(() => ({
    opacity: wireframeOpacity.value,
  }));

  // Animated props for slices
  const sliceAnimatedProps = useAnimatedProps(() => ({
    opacity: sliceOpacity.value,
  }));

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Svg width={size} height={size}>
        {/* Background glow effect */}
        <Circle
          cx={center.x}
          cy={center.y}
          r={radius * 1.1}
          fill="none"
          stroke="rgba(0, 150, 255, 0.1)"
          strokeWidth="20"
        />

        {/* Wireframe sphere */}
        <AnimatedG animatedProps={wireframeAnimatedProps}>
          {wireframeLines.map((line, index) => {
            const rotX = interpolate(rotationX.value, [0, Math.PI * 0.2], [0, Math.PI * 0.2]);
            const rotY = interpolate(rotationY.value, [0, Math.PI * 2], [0, Math.PI * 2]);

            const start2D = project3DTo2D(line.start, rotX, rotY);
            const end2D = project3DTo2D(line.end, rotX, rotY);

            // Calculate depth for opacity
            const avgZ = (line.start.z + line.end.z) / 2;
            const opacity = Math.max(0.2, (avgZ + radius) / (2 * radius));

            return (
              <Line
                key={index}
                x1={start2D.x}
                y1={start2D.y}
                x2={end2D.x}
                y2={end2D.y}
                stroke={`rgba(0, 150, 255, ${opacity * 0.8})`}
                strokeWidth="1"
              />
            );
          })}
        </AnimatedG>

        {/* Animated slices */}
        <AnimatedG animatedProps={sliceAnimatedProps}>
          {slicePaths.map((path, index) => {
            const delay = index * 100;
            const progress = interpolate(
              sliceProgress.value,
              [0, 0.3, 1],
              [0, 0, 1],
              'clamp'
            );

            return (
              <AnimatedPath
                key={index}
                d={path}
                fill="none"
                stroke="#ff6b35"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="10 5"
                strokeOpacity={progress}
                animatedProps={useAnimatedProps(() => ({
                  strokeDashoffset: interpolate(
                    sliceProgress.value,
                    [0, 1],
                    [100, 0]
                  ),
                }))}
              />
            );
          })}
        </AnimatedG>

        {/* Central glow point */}
        <Circle
          cx={center.x}
          cy={center.y}
          r="4"
          fill="#00ff88"
          opacity="0.8"
        >
          <AnimatedCircle
            animatedProps={useAnimatedProps(() => ({
              r: 4 + Math.sin(sliceProgress.value * Math.PI * 4) * 2,
            }))}
          />
        </Circle>
      </Svg>
    </View>
  );
}