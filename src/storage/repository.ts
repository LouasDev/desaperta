import AsyncStorage from '@react-native-async-storage/async-storage';
import { createRepository } from './snapshotRepository';
export const repository = createRepository(AsyncStorage);
