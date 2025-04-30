/**
 * Environment variables utility
 * 
 * This file provides type-safe access to environment variables
 * and ensures they are properly loaded based on the current environment.
 */

// Define the shape of our environment variables
interface EnvVariables {
  VITE_API_URL: string;
  VITE_WS_URL: string;
  VITE_ENV: 'development' | 'staging' | 'production';
  VITE_DEBUG: boolean;
}

// Get environment variables with type safety
export const env: EnvVariables = {
  VITE_API_URL: import.meta.env.VITE_API_URL || 'https://chatspot-backend-8a7y.onrender.com/',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'wss://chatspot-backend-8a7y.onrender.com/',
  VITE_ENV: (import.meta.env.VITE_ENV as EnvVariables['VITE_ENV']) || 'development',
  VITE_DEBUG: import.meta.env.VITE_DEBUG === 'true' || false,
};

// Helper functions
export const isDevelopment = (): boolean => env.VITE_ENV === 'development';
export const isStaging = (): boolean => env.VITE_ENV === 'staging';
export const isProduction = (): boolean => env.VITE_ENV === 'production';
export const isDebugMode = (): boolean => env.VITE_DEBUG;

// API URL helpers
export const getApiUrl = (): string => env.VITE_API_URL;
export const getWsUrl = (): string => env.VITE_WS_URL;

// Conditional logging that only works in development/debug mode
export const debugLog = (...args: any[]): void => {
  if (isDebugMode()) {
    console.log('[DEBUG]', ...args);
  }
};

export default env;
