import { Platform } from 'react-native';

const forcedTV = process.env.EXPO_PUBLIC_TARGET_TV === 'true';

export const isTV = forcedTV || Platform.isTV || Platform.OS === 'web';
