import { API_HOST, handleApiError } from './core';

/**
 * Helper function to create a delay/pause
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the specified delay
 */
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
		record?: BlueskyPostRecord;
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
 * Enhanced Bluesky post with interaction calculations
 */
export class BlueskyThing implements BlueskyPost {
	uri: string;
	cid: string;
	author: BlueskyAuthor;
	record: BlueskyPostRecord;
	embed?: {
		$type: string;
		images?: BlueskyEmbedImage[];
		record?: BlueskyPostRecord;
	};
	replyCount: number;
	repostCount: number;
	likeCount: number;
	quoteCount: number;
	indexedAt: string;
	labels: any[];
	interactions: number;
	[key: string]: any;
	replyRoot: object;
	replyParent: object;
	feedReason: object;
	thingType: string;
	thingSubType: string;
	interactedUser: BlueskyAuthor;
	thingCreatedAt: string;

	constructor(item: BlueskyFeedItem) {
		Object.assign(this, item.post);
		this.thingType = this.constructor.getThingType(item);
		if (this.thingType === 'reply') {
			this.replyRoot = item.reply.root;
			this.replyParent = item.reply.parent;
			this.interactedUser = this.replyParent.author;
		} else if (this.thingType === 'repost') {
			this.feedReason = item.reason;
			this.interactedUser = item.post.author;
		} else if (this.thingType === 'quote') {
			//tktk: make a getThingSubType function
			if (item.post.embed?.$type?.includes('embed.recordWithMedia#view')) {
				this.thingSubType = 'quote-with-media';
				// when doing a quote post with image, we have to refer to embed.record.record
				this.interactedUser = this.embed.record.record.author;
			} else {
				this.interactedUser = this.embed.record.author;
			}
		}

		if (this.thingType === 'repost') {
			this.thingCreatedAt = item.reason.indexedAt;
		} else {
			this.thingCreatedAt = this.record.createdAt;
		}

		this.interactions =
			(this.likeCount || 0) +
			(this.repostCount || 0) +
			(this.replyCount || 0) +
			(this.quoteCount || 0);
	}

	isOriginal(): boolean {
		return this.thingType !== 'repost';
	}

	/**
	 * Get total engagement count for a post
	 */
	getTotalInteractions(): number {
		return this.interactions;
	}

	/**
	 * Determine post type based on its structure and content
	 * @param item - The BlueskyFeedItem to analyze
	 * @returns A string representing the post type ('repost', 'reply', 'quote', or 'post')
	 */
	static getThingType(item: BlueskyFeedItem): string {
		// Check if it's a repost (author handle is different from profile handle)
		const post = item.post;
		let ptype: string = 'repost';

		if (item.reason && item.reason?.$type.includes('reasonRepost')) {
			ptype = 'repost';
		}
		// Check if it's a reply
		else if (item.reply) {
			ptype = 'reply';
		} else if (post.embed?.$type?.includes('app.bsky.embed.record')) {
			ptype = 'quote';
		} else {
			ptype = 'post';
		}
		console.log(`myposts ${ptype}; reply? ${item.reply}`);

		return ptype;
	}
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
	reason?: {
		$type: string;
		by?: BlueskyAuthor;
		indexedAt: string;
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
 * Convert raw post data to BlueskyThing instances
 */
export function convertToBlueskyThings(data: any): BlueskyAuthorFeedResponse {
	if (!data.feed || data.feed.length === 0) {
		return data;
	}

	// Convert each post to a BlueskyThing instance
	const convertedFeed = data.feed.map((item) => {
		const convertedPost = new BlueskyThing(item);

		return {
			post: convertedPost
		};
	});

	return {
		feed: convertedFeed,
		cursor: data.cursor
	};
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
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const data = await response.json();
		return convertToBlueskyThings(data);
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
			console.log(
				`Batch ${i + 1} of ${batchCount}: Using cursor: ${i === 0 ? 'undefined' : currentCursor}`
			);

			// Add a 0.3 second delay before each API call (except the first one)
			if (i > 0) {
				await delay(200); // 300ms = 0.3 seconds
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
