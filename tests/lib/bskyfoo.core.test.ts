import { describe, it, expect } from 'vitest';
import { extractPostLink, extractUrlDomain } from '../../src/lib/bskyfoo/core';
import postWithLinkFixture from '../fixtures/posts/regular_post_with_link.json';

describe('bskyfoo.core Functions', () => {
	describe('extractUrlDomain', () => {
		it('should extract domain and remove www. prefix', () => {
			expect(extractUrlDomain('https://www.example.com/page?q=test')).toBe('example.com');
		});

		it('should handle domains without www prefix', () => {
			expect(extractUrlDomain('https://example.com/page')).toBe('example.com');
		});

		it('should convert domain to lowercase', () => {
			expect(extractUrlDomain('https://EXAMPLE.com')).toBe('example.com');
		});

		it('should handle invalid URLs gracefully', () => {
			expect(extractUrlDomain('not-a-url')).toBe('');
		});

		it('should return blank when an empty string is passed', () => {
			expect(extractUrlDomain('')).toBe('');
		});

		it('should remove trailing slash from hostname', () => {
			expect(extractUrlDomain('https://example.com/')).toBe('example.com');
		});
	});

	describe('extractPostLink', () => {
		it('should extract link information from a post with an external embed', () => {
			// Get the post from the fixture
			const post = postWithLinkFixture.post;

			const result = extractPostLink(post);

			expect(result).toEqual({
				url: 'https://www.nytimes.com/live/2025/02/27/us/trump-news?smtyp=cur&smid=bsky-nytimes',
				title: 'Trump Live Updates: News on Mass Firings, Russia-Ukraine and Tariffs',
				domain: 'nytimes.com'
			});
		});

		it('should return empty values for posts without external embeds', () => {
			// Create a post without an external embed
			const postWithoutEmbed = {
				...postWithLinkFixture.post,
				record: {
					...postWithLinkFixture.post.record,
					embed: undefined
				}
			};

			const result = extractPostLink(postWithoutEmbed);

			expect(result).toBeNull();
		});

		it('should handle posts with empty external.uri or external.title', () => {
			// Create a post with empty external.uri and external.title
			const postWithEmptyExternal = {
				...postWithLinkFixture.post,
				record: {
					...postWithLinkFixture.post.record,
					embed: {
						$type: 'app.bsky.embed.external',
						external: {
							uri: '',
							title: '',
							description: '',
							thumb: postWithLinkFixture.post.record.embed.external.thumb
						}
					}
				}
			};

			const result = extractPostLink(postWithEmptyExternal);

			expect(result).toEqual({ url: '', title: '', domain: '' });
		});
	});
});
