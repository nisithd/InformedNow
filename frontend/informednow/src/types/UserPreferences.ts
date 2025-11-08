// src/types/userPreferences.ts
export interface UserPreferencesData {
  userId?: string | null;
  categories: string[];
  createdAt?: string;
  updatedAt?: string;
  offline?: boolean;
  skipped?: boolean;
}
