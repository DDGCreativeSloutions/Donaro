import { Link, Stack, useRouter } from 'expo-router';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page not found' }} />
      <View style={styles.container}>
  <Image source={require('../assets/images/favicon.png')} style={styles.icon} />

        <Text style={styles.title}>404 — Page not found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </Text>

        <View style={styles.buttonsRow}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.primaryButton} accessibilityLabel="Go to home">
              <Text style={styles.primaryButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <Text style={styles.secondaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.hint}>
          If you arrived here from a link inside the app, try returning to the previous
          screen or reopening the menu.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  icon: {
    width: 96,
    height: 96,
    marginBottom: 20,
    borderRadius: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 420,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#6C63FF',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    maxWidth: 480,
  },
});
