import { API_HOST, handleApiError } from './core';

/**
 * Helper function to create a delay/pause
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the specified delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Represents a Bluesky post author
 */
export interface BlueskyAuthor {
	did: string;
	handle: string;
	displayName?: string;
	avatar?: string;
	createdAt?: string;
	associated?: {
		chat?: {
			allowIncoming?: string;
		};
		[key: string]: any;
	};
	labels?: any[];
	[key: string]: any;
}

/**
 * Represents a Bluesky post record
 */
export interface BlueskyPostRecord {
	$type: string;
	text: string;
	createdAt: string;
	langs?: string[];
	reply?: {
		parent: {
			cid: string;
			uri: string;
		};
		root: {
			cid: string;
			uri: string;
		};
	};
	embed?: {
		$type: string;
		images?: {
			alt?: string;
			aspectRatio?: {
				height: number;
				width: number;
			};
			image: {
				$type: string;
				ref: {
					$link: string;
				};
				mimeType: string;
				size: number;
			};
		}[];
	};
	[key: string]: any;
}

/**
 * Represents an embedded image in a post
 */
export interface BlueskyEmbedImage {
	thumb: string;
	fullsize: string;
	alt?: string;
	aspectRatio?: {
		height: number;
		width: number;
	};
}

/**
 * Represents a Bluesky post
 */
export interface BlueskyPost {
	uri: string;
	cid: string;
	author: BlueskyAuthor;
	record: BlueskyPostRecord;
	embed?: {
		$type: string;
		images?: BlueskyEmbedImage[];
	};
	replyCount: number;
	repostCount: number;
	likeCount: number;
	quoteCount: number;
	indexedAt: string;
	labels: any[];
	[key: string]: any;
}

/**
 * Represents a feed item in the author feed response
 */
export interface BlueskyFeedItem {
	post: BlueskyPost;
	reply?: {
		root: BlueskyPost;
		parent: BlueskyPost;
	};
}

/**
 * Represents the response from getAuthorFeed
 */
export interface BlueskyAuthorFeedResponse {
	feed: BlueskyFeedItem[];
	cursor?: string;
}

/**
 * Get posts from a user's feed
 * @param handle - The user's handle
 * @param cursor - Pagination cursor for fetching more posts
 * @returns Promise that resolves to the feed response
 */
export async function getUserPosts(
	handle: string,
	cursor?: string
): Promise<BlueskyAuthorFeedResponse> {
	if (!handle) {
		return { feed: [] };
	}

	try {
		let url = `${API_HOST}/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=100`;
		if (cursor) {
			url += `&cursor=${encodeURIComponent(cursor)}`;
		}
		console.log(`the url ${url}`)
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const data: BlueskyAuthorFeedResponse = await response.json();
		return data;
	} catch (error) {
		handleApiError(error, `fetching posts for ${handle}`);
		return { feed: [] }; // TypeScript requires this even though handleApiError throws
	}
}

/**
 * Get multiple batches of posts from a user's feed
 * @param handle - The user's handle
 * @param batchCount - Number of batches to fetch (default: 1)
 * @param onProgress - Optional callback for reporting progress (batch number, total batches, and posts count)
 * @returns Promise that resolves to a combined feed response with all fetched posts
 */
export async function getBatchUserPosts(
	handle: string,
	batchCount: number = 1,
	onProgress?: (current: number, total: number, postsCount: number) => void
): Promise<BlueskyAuthorFeedResponse> {
	if (!handle) {
		return { feed: [] };
	}

	try {
		const allPosts: BlueskyFeedItem[] = [];
		let currentCursor: string | undefined = undefined;

		// Fetch posts in batches
		for (let i = 0; i < batchCount; i++) {
			// Report progress if callback is provided
			if (onProgress) {
				onProgress(i + 1, batchCount, allPosts.length);
			}

			// First request shouldn't have a cursor
			// Log cursor for debugging
			console.log(`Batch ${i + 1} of ${batchCount}: Using cursor: ${i === 0 ? 'undefined' : currentCursor}`);

			// Add a 0.3 second delay before each API call (except the first one)
			if (i > 0) {
				await delay(300); // 300ms = 0.3 seconds
			}

			const result = await getUserPosts(handle, i === 0 ? undefined : currentCursor);

			// Add posts to our collection
			if (result.feed && result.feed.length > 0) {
				allPosts.push(...result.feed);
				console.log(`Retrieved ${result.feed.length} posts, total now: ${allPosts.length}`);
			} else {
				console.log('No posts in this batch, stopping');
				break;
			}

			// Update cursor for next batch
			currentCursor = result.cursor;
			console.log(`Next cursor will be: ${currentCursor}`);

			// If no cursor is returned, we've reached the end of available posts
			if (!currentCursor) {
				console.log('No cursor returned, stopping');
				break;
			}
		}

		if (onProgress) {
			onProgress(batchCount, batchCount, allPosts.length);
		}

		// Return combined result with the last cursor (if available)
		return {
			feed: allPosts,
			cursor: currentCursor
		};
	} catch (error) {
		console.error('Error in getBatchUserPosts:', error);
		handleApiError(error, `fetching batch posts for ${handle}`);
		return { feed: [] };
	}
}
