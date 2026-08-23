import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'nxt360_';

export async function getData(key, fallback) {
  try {
    const val = await AsyncStorage.getItem(PREFIX + key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}

export async function setData(key, value) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
