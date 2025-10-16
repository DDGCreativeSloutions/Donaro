import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useColorScheme } from './useColorScheme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  icon?: React.ComponentProps<typeof Feather>['name'];
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function Button({ title, onPress, variant = 'primary', size = 'medium', icon, iconPosition = 'left', disabled = false, style }: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const getButtonStyles = () => {
    const baseStyle = [styles.button, styles[size]];
    const variantStyle = {
      primary: { backgroundColor: colors.primary, borderWidth: 0 },
      secondary: { backgroundColor: colors.secondary, borderWidth: 0 },
      danger: { backgroundColor: colors.danger, borderWidth: 0 },
      outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary },
      ghost: { backgroundColor: 'transparent', borderWidth: 0 },
    };
    return [...baseStyle, variantStyle[variant]];
  };

  const getTextStyle = () => {
    const baseStyle = [styles.text, styles[`${size}Text`]];
    const variantStyle = {
      primary: { color: colors.white },
      secondary: { color: colors.white },
      danger: { color: colors.white },
      outline: { color: colors.primary },
      ghost: { color: colors.primary },
    };
    return [...baseStyle, variantStyle[variant]];
  };

  // Extract the color from text styles properly
  const getTextColor = () => {
    const textStyles = getTextStyle();
    for (const styleObj of textStyles) {
      if ('color' in styleObj && typeof styleObj.color === 'string') {
        return styleObj.color;
      }
    }
    return colors.primary; // fallback color
  };

  const renderIcon = () => {
    if (!icon) return null;
    return <Feather name={icon} size={size === 'small' ? 16 : 20} color={getTextColor()} style={styles.icon} />;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyles(), disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.content}>
        {iconPosition === 'left' && renderIcon()}
        <Text style={getTextStyle()}>{title}</Text>
        {iconPosition === 'right' && renderIcon()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  icon: {
    marginHorizontal: 5,
  },
  disabled: {
    opacity: 0.5,
  },
});