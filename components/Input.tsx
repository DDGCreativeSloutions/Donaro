import Colors from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useColorScheme } from './useColorScheme';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ComponentProps<typeof Feather>['name'];
  error?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(({ label, icon, error, ...props }, ref) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme || 'light'];

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
        {icon && (
          <View style={styles.iconContainer}>
            <Feather name={icon} size={20} color={colors.gray} />
          </View>
        )}
        <TextInput
          ref={ref}
          style={[styles.input, { color: colors.text }]}
          placeholderTextColor={colors.gray}
          selectionColor={colors.primary}
          {...props}
        />
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 50,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
    paddingRight: 15,
  },
  error: {
    marginTop: 5,
    fontSize: 12,
  },
});

export default Input;