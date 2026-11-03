import { Image } from "expo-image";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

import { LUCKY_SPIN } from "@/theme";

import type { Prize } from "../types";

// Prize wheel (web PopupShowLuckySpin `Wheel` / `Segment` / `SegmentIcon`). Sector i covers the
// clockwise angles [i·D − 90°, (i+1)·D − 90°] measured from 12 o'clock, so sector 0 starts at
// 9 o'clock; the pointer drawn in the frame artwork is at 12 o'clock. Icons sit on each sector's
// middle angle and stay upright relative to the wheel (the web's two rotations cancel out).

/** Web `transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)`. */
export const SPIN_DURATION_MS = 4000;
const SPIN_EASING = Easing.bezier(0.17, 0.67, 0.12, 0.99);

const WINNER_PULSE = {
  animationName: { "0%": { opacity: 0.55 }, "50%": { opacity: 1 }, "100%": { opacity: 0.55 } },
  animationDuration: "1.5s",
  animationTimingFunction: "ease-in-out",
  animationIterationCount: "infinite",
} as const;

type WheelProps = {
  prizes: Prize[];
  /** Accumulated rotation in degrees; a new value animates there over 4s. */
  rotation: number;
  /** Diameter in px. */
  size: number;
  /** Icon box (web `clamp(…)`), the image inside is `iconScale` times bigger. */
  iconBox: number;
  iconScale: number;
  /** Distance of the icon center from the wheel center, as a multiple of `iconBox` (web translateY %). */
  iconDistance: number;
  winnerIndex: number | null;
};

/** Point on the circle at `angle` degrees clockwise from 12 o'clock. */
function point(center: number, radius: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: center + radius * Math.sin(rad), y: center - radius * Math.cos(rad) };
}

function sectorPath(center: number, radius: number, start: number, sweep: number): string {
  const from = point(center, radius, start);
  const to = point(center, radius, start + sweep);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${center} ${center} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} 1 ${to.x} ${to.y} Z`;
}

export function Wheel({ prizes, rotation, size, iconBox, iconScale, iconDistance, winnerIndex }: WheelProps) {
  const angle = useSharedValue(rotation);

  useEffect(() => {
    angle.set(withTiming(rotation, { duration: SPIN_DURATION_MS, easing: SPIN_EASING, reduceMotion: ReduceMotion.Never }));
  }, [rotation, angle]);

  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.get()}deg` }] }));

  const count = Math.max(prizes.length, 1);
  const sweep = 360 / count;
  const center = size / 2;
  const radius = size / 2;
  const startOf = (index: number) => index * sweep - 90;

  return (
    <Animated.View style={[{ width: size, height: size }, spinStyle]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} fill={LUCKY_SPIN.wheelBase} />
        {prizes.map((prize, index) => (
          <Path
            key={`${prize.id}-${index}`}
            d={sectorPath(center, radius, startOf(index), sweep)}
            fill={prize.color}
            fillOpacity={0.95}
            stroke={LUCKY_SPIN.sectorEdge}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {winnerIndex !== null && prizes[winnerIndex] ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, WINNER_PULSE]}>
          <Svg width={size} height={size}>
            <Path
              d={sectorPath(center, radius, startOf(winnerIndex), sweep)}
              fill={LUCKY_SPIN.winnerGlow}
              fillOpacity={0.22}
              stroke={LUCKY_SPIN.winnerGlow}
              strokeOpacity={0.9}
              strokeWidth={3}
            />
          </Svg>
        </Animated.View>
      ) : null}

      {prizes.map((prize, index) => {
        if (!prize.icon) return null;
        const at = point(center, iconBox * iconDistance, startOf(index) + sweep / 2);
        const imageSize = iconBox * iconScale;
        return (
          <View
            key={`icon-${prize.id}-${index}`}
            pointerEvents="none"
            style={[styles.icon, { left: at.x - imageSize / 2, top: at.y - imageSize / 2, width: imageSize, height: imageSize }]}
          >
            <Image source={{ uri: prize.icon }} style={styles.fill} contentFit="contain" accessibilityLabel={prize.name} />
          </View>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  icon: { position: "absolute" },
  fill: { width: "100%", height: "100%" },
});
