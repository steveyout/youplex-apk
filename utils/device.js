import { Platform } from 'react-native';
export const isTV = Platform.isTV || Platform.OS === 'web';