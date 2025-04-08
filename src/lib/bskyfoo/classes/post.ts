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

	get isOriginal(): boolean {
		return this.thingType !== 'repost';
	}

	get url(): string {
		// Extract the final element from the URI (the post ID)
		const uriParts = this.uri.split('/');
		const postId = uriParts[uriParts.length - 1];

		// Construct the URL using the author's handle and post ID
		return `https://bsky.app/profile/${this.author.handle}/post/${postId}`;
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
			ptype = 'original';
		}

		return ptype;
	}
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
