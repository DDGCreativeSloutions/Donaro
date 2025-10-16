import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outline' | 'filled';
}

const Card = ({ children, style, variant = 'elevated' }: CardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  const getCardStyle = () => {
    const baseStyle = [styles.card, { backgroundColor: colors.card }, style];
    const variantStyle = {
      elevated: { shadowColor: colors.black, elevation: 5, shadowOpacity: 0.1 },
      outline: { borderWidth: 1, borderColor: colors.border },
      filled: { backgroundColor: colors.background },
    };
    return [...baseStyle, variantStyle[variant]];
  };

  return <View style={getCardStyle()}>{children}</View>;
};

interface CardHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardHeader = ({ children, style }: CardHeaderProps) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
};

interface CardContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardContent = ({ children, style }: CardContentProps) => {
  return <View style={[styles.cardContent, style]}>{children}</View>;
};

interface CardFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardFooter = ({ children, style }: CardFooterProps) => {
  return <View style={[styles.cardFooter, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    marginBottom: 15,
  },
  cardContent: {
    marginBottom: 15,
  },
  cardFooter: {},
});

export { Card, CardHeader, CardContent, CardFooter };