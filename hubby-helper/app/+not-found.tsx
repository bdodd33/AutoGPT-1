import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.text}>This screen does not exist.</Text>
      </View>
    </>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' }, text: { fontSize: 18, color: '#fff' } });
