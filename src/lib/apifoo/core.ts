/**
 * Base URL for the Bluesky API
 */
export const API_HOST = "https://public.api.bsky.app";

/**
 * Common error handler for API requests
 * @param error - The error that occurred
 * @param context - Additional context about the error
 */
export function handleApiError(error: unknown, context: string): never {
  console.error(`Error ${context}:`, error);
  throw error;
}