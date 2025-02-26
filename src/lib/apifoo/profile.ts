import { API_HOST, handleApiError } from './core';

/**
 * Represents a Bluesky user profile
 */
export interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  indexedAt?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
  [key: string]: any; // For other properties that may be in the response
}

/**
 * Get a Bluesky user profile by handle
 * @param handle - The Bluesky handle to search for
 * @returns Promise that resolves to the profile data
 */
export async function getProfile(handle: string | null | undefined): Promise<BlueskyProfile | null> {
  if (!handle) {
    return null;
  }
  
  try {
    const response = await fetch(`${API_HOST}/xrpc/app.bsky.actor.getProfile?actor=${handle}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const profileData: BlueskyProfile = await response.json();
    return profileData;
  } catch (error) {
    handleApiError(error, `fetching profile for ${handle}`);
  }
}