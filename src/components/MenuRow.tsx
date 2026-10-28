import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { useTheme } from '../state/ThemeContext';
export function MenuRow({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: IconName;
  onPress: () => void;
}) {
  const { styles, colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { paddingVertical: 18, opacity: pressed ? 0.65 : 1 }]}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 13,
          backgroundColor: colors.mint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} color={colors.accent} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.subtitle}>{title}</Text>
        <Text style={styles.small}>{description}</Text>
      </View>
      <Icon name="chevron" size={17} color={colors.muted} />
    </Pressable>
  );
}
