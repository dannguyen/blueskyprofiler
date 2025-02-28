import { API_HOST, handleApiError } from './core';

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
 * @param limit - Maximum number of posts to return (default: 20)
 * @param cursor - Pagination cursor for fetching more posts
 * @returns Promise that resolves to the feed response
 */
export async function getUserPosts(
	handle: string,
	limit: number = 100,
	cursor?: string
): Promise<BlueskyAuthorFeedResponse> {
	if (!handle) {
		return { feed: [] };
	}

	try {
		let url = `${API_HOST}/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=${limit}`;
		if (cursor) {
			url += `&cursor=${encodeURIComponent(cursor)}`;
		}

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
