/**
 * Base URL for the Bluesky API
 */
export const API_HOST = 'https://public.api.bsky.app';

/**
 * Common error handler for API requests
 * @param error - The error that occurred
 * @param context - Additional context about the error
 */
export function handleApiError(error: unknown, context: string): never {
	console.error(`Error ${context}:`, error);
	throw error;
}

// Import type from the appropriate module
import type { BlueskyPost } from './post';

/**
 * Determine the media type of a post
 * @param post - The BlueskyPost to analyze
 * @returns A string representing the media type ('image', 'video', or 'text')
 */
export function getPostMediaType(post: BlueskyPost): string {
	if (post.embed?.$type?.includes('app.bsky.embed.images')) {
		return 'image';
	}
	// Check if it's a quote post
	else if (post.embed?.$type?.includes('app.bsky.embed.video')) {
		return 'video';
	} else {
		return 'text';
	}
}

/**
 * Generate a direct URL to the post on Bluesky's web interface
 * @param post - The BlueskyPost to generate a URL for
 * @returns A URL string
 */
export function postURL(post: BlueskyPost): string {
	// Extract the final element from the URI (the post ID)
	const uriParts = post.uri.split('/');
	const postId = uriParts[uriParts.length - 1];

	// Construct the URL using the author's handle and post ID
	return `https://bsky.app/profile/${post.author.handle}/post/${postId}`;
}

/**
 * Extract and normalize a domain from a URL
 * @param url - The URL to extract domain from
 * @returns The normalized domain
 */
export function extractUrlDomain(url: string): string {
	try {
		// Create a URL object to parse the URL
		const urlObj = new URL(url);
		// Get the hostname and normalize it
		let hostname = urlObj.hostname.toLowerCase();

		// Remove trailing slash
		hostname = hostname.endsWith('/') ? hostname.slice(0, -1) : hostname;

		// Remove "www." prefix if it exists
		hostname = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

		return hostname;
	} catch (error) {
		// Return empty string if URL is invalid
		return '';
	}
}

/**
 * Extract link information from a Bluesky post
 * @param post - The BlueskyPost to extract link from
 * @returns An object containing url, title, and domain
 */
export function extractPostLink(
	post: BlueskyPost
): { url: string; title: string; domain: string } | null {
	// Default values
	let url = '';
	let title = '';

	// Check if post has an external embed
	if (post.record?.embed?.$type === 'app.bsky.embed.external' && post.record.embed.external) {
		// Extract URL and title from the embed
		url = post.record.embed.external.uri || '';
		title = post.record.embed.external.title || '';
		// Extract domain from URL
		const domain = extractUrlDomain(url);

		return {
			url,
			title,
			domain
		};
	} else {
		return null;
	}
}
