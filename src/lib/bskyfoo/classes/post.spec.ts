import { describe, it, expect } from 'vitest';
import { BlueskyThing, type BlueskyFeedItem, type BlueskyAuthor, type BlueskyPost } from './post';

// --- MOCK DATA ---
const mockAuthor: BlueskyAuthor = {
	did: 'did:plc:author',
	handle: 'author.bsky.social',
	displayName: 'The Author'
};

const mockOtherAuthor: BlueskyAuthor = {
	did: 'did:plc:other',
	handle: 'other.bsky.social',
	displayName: 'Another User'
};

const baseMockPost: BlueskyPost = {
	uri: 'at://did:plc:author/app.bsky.feed.post/post1',
	cid: 'cid1',
	author: mockAuthor,
	record: {
		$type: 'app.bsky.feed.post',
		text: 'This is an original post.',
		createdAt: '2023-10-26T10:00:00.000Z'
	},
	replyCount: 1,
	repostCount: 2,
	likeCount: 3,
	quoteCount: 4,
	indexedAt: '2023-10-26T10:00:00.000Z',
	labels: []
};

// --- TESTS ---
describe('BlueskyThing', () => {
	describe('getThingType', () => {
		it('should identify an original post', () => {
			const item: BlueskyFeedItem = { post: baseMockPost };
			expect(BlueskyThing.getThingType(item)).toBe('original');
		});

		it('should identify a reply', () => {
			const item: BlueskyFeedItem = {
				post: { ...baseMockPost, record: { ...baseMockPost.record, text: 'This is a reply' } },
				reply: {
					root: { ...baseMockPost, author: mockOtherAuthor },
					parent: { ...baseMockPost, author: mockOtherAuthor }
				}
			};
			expect(BlueskyThing.getThingType(item)).toBe('reply');
		});

		it('should identify a repost', () => {
			const item: BlueskyFeedItem = {
				post: { ...baseMockPost, author: mockOtherAuthor },
				reason: {
					$type: 'app.bsky.feed.defs#reasonRepost',
					by: mockAuthor,
					indexedAt: '2023-10-26T11:00:00.000Z'
				}
			};
			expect(BlueskyThing.getThingType(item)).toBe('repost');
		});

		it('should identify a quote post', () => {
			const item: BlueskyFeedItem = {
				post: {
					...baseMockPost,
					embed: {
						$type: 'app.bsky.embed.record#view',
						record: { ...baseMockPost.record, author: mockOtherAuthor }
					}
				}
			};
			expect(BlueskyThing.getThingType(item)).toBe('quote');
		});
	});

	describe('constructor', () => {
		it('should correctly process an original post', () => {
			const item: BlueskyFeedItem = { post: baseMockPost };
			const thing = new BlueskyThing(item);

			expect(thing.thingType).toBe('original');
			expect(thing.interactedUser).toBeUndefined();
			expect(thing.thingCreatedAt).toBe(baseMockPost.record.createdAt);
			expect(thing.interactions).toBe(10); // 1+2+3+4
			expect(thing.isOriginal).toBe(true);
			expect(thing.url).toBe(`https://bsky.app/profile/${mockAuthor.handle}/post/post1`);
		});

		it('should correctly process a reply', () => {
			const item: BlueskyFeedItem = {
				post: { ...baseMockPost, record: { ...baseMockPost.record, text: 'A reply' } },
				reply: {
					root: { ...baseMockPost, author: mockOtherAuthor },
					parent: { ...baseMockPost, author: mockOtherAuthor }
				}
			};
			const thing = new BlueskyThing(item);

			expect(thing.thingType).toBe('reply');
			expect(thing.interactedUser).toBe(mockOtherAuthor);
			expect(thing.thingCreatedAt).toBe(item.post.record.createdAt);
		});

		it('should correctly process a repost', () => {
			const repostTime = '2023-10-26T11:00:00.000Z';
			const item: BlueskyFeedItem = {
				post: { ...baseMockPost, author: mockOtherAuthor }, // The post being reposted
				reason: {
					$type: 'app.bsky.feed.defs#reasonRepost',
					by: mockAuthor, // The user who reposted
					indexedAt: repostTime
				}
			};
			const thing = new BlueskyThing(item);

			expect(thing.thingType).toBe('repost');
			expect(thing.interactedUser).toBe(mockOtherAuthor);
			expect(thing.thingCreatedAt).toBe(repostTime);
			expect(thing.isOriginal).toBe(false);
		});

		it('should correctly process a quote post', () => {
			const item: BlueskyFeedItem = {
				post: {
					...baseMockPost,
					embed: {
						$type: 'app.bsky.embed.record#view',
						record: { ...baseMockPost.record, author: mockOtherAuthor }
					}
				}
			};
			const thing = new BlueskyThing(item);

			expect(thing.thingType).toBe('quote');
			expect(thing.interactedUser).toBe(mockOtherAuthor);
			expect(thing.thingCreatedAt).toBe(item.post.record.createdAt);
		});

		it('should correctly process a quote post with media', () => {
			const item: BlueskyFeedItem = {
				post: {
					...baseMockPost,
					embed: {
						$type: 'app.bsky.embed.recordWithMedia#view',
						record: {
							record: { ...baseMockPost.record, author: mockOtherAuthor }
						},
						media: {
							$type: 'app.bsky.embed.images#view',
							images: []
						}
					}
				}
			};
			const thing = new BlueskyThing(item);

			expect(thing.thingType).toBe('quote');
			expect(thing.thingSubType).toBe('quote-with-media');
			expect(thing.interactedUser).toBe(mockOtherAuthor);
		});
	});
});
