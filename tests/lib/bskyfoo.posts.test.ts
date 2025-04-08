import { describe, it, expect, vi, beforeEach, test } from 'vitest';
import { convertToBlueskyThings, BlueskyThing } from '../../src/lib/bskyfoo';
import feedFixture from '../fixtures/feeds/author_feed.json';
import simpleItem from '../fixtures/posts/regular_post_text_only.json';
import quoteItem from '../fixtures/posts/quote.json';

// Create a copy of the fixture to use in tests
const mockFeed = { ...feedFixture };
const mockSimplePostFeedItem = { ...simpleItem };
const mockQuoteItem = { ...quoteItem };

// Mock the global fetch function
global.fetch = vi.fn();

describe('bskyfoo API handling', () => {
	describe('convertToBlueskyThings', () => {
		beforeEach(() => {
			vi.resetAllMocks();
		});

		it('should convert feed object to a BlueskyAuthorFeedResponse', () => {
			const authorFeed = convertToBlueskyThings(mockFeed);

			expect(authorFeed.cursor).toContain('2025-02');

			expect(authorFeed.feed.length).toBeGreaterThan(1);
		});
	});
});

const simpleTest = test.extend({
	thing: new BlueskyThing(mockSimplePostFeedItem)
});

const quoteTest = test.extend({
	thing: new BlueskyThing(mockQuoteItem)
});

describe('bksyfoo BlueskyThing', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	describe('basic constructor and attributes', () => {
		simpleTest('should have basic attributes', ({ thing }) => {
			expect(thing.thingType).toEqual('original');
			expect(thing.isOriginal).toBe(true);
			expect(thing.url).toContain(`https://bsky.app/profile/${thing.author.handle}`);
			expect(thing.interactedUser).toBeUndefined();
			expect(thing.interactions).toBeGreaterThan(17000);
		});
	});

	describe('Quote posts', () => {
		quoteTest('should have type quote', ({ thing }) => {
			expect(thing.thingType).toEqual('quote');
		});

		quoteTest('should have an interactedUser', ({ thing }) => {
			expect(thing.interactedUser).toBeDefined();
		});
	});
});
