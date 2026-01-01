import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

type SkeletonBlockProps = {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = 16,
  radius = 12,
  style,
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const animatedStyle = useMemo(
    () => ({
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }),
    }),
    [pulse],
  );

  return <AnimatedView style={[styles.block, { width, height, borderRadius: radius }, animatedStyle, style]} />;
};

type SkeletonRowProps = {
  lines?: number;
  lineHeight?: number;
  gap?: number;
  style?: ViewStyle;
};

export const SkeletonRow: React.FC<SkeletonRowProps> = ({
  lines = 3,
  lineHeight = 14,
  gap = 10,
  style,
}) => {
  const items = useMemo(() => new Array(lines).fill(0), [lines]);
  return (
    <View style={[styles.column, { gap }, style]}>
      {items.map((_, index) => (
        <SkeletonBlock
          key={index}
          height={lineHeight}
          width={index === items.length - 1 ? '70%' : '100%'}
        />
      ))}
    </View>
  );
};

type SkeletonCardProps = {
  hasAvatar?: boolean;
  lines?: number;
  style?: ViewStyle;
};

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasAvatar = false,
  lines = 3,
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {hasAvatar && (
        <View style={styles.row}>
          <SkeletonBlock width={48} height={48} radius={24} />
          <View style={styles.avatarText}>
            <SkeletonBlock height={14} width="70%" />
            <SkeletonBlock height={12} width="45%" />
          </View>
        </View>
      )}
      <SkeletonRow lines={lines} />
    </View>
  );
};

type SkeletonListProps = {
  count?: number;
  hasAvatar?: boolean;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
};

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 4,
  hasAvatar = false,
  style,
  itemStyle,
}) => {
  const items = useMemo(() => new Array(count).fill(0), [count]);
  return (
    <View style={[styles.column, { gap: 16 }, style]}>
      {items.map((_, index) => (
        <SkeletonCard key={index} hasAvatar={hasAvatar} style={itemStyle} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#FFE999',
  },
  column: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  avatarText: {
    flex: 1,
    gap: 8,
  },
  card: {
    backgroundColor: '#FFF6C9',
    borderRadius: 16,
    padding: 20,
  },
});
