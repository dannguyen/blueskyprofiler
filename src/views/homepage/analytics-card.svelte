<script lang="ts">
	import {
		type BlueskyProfile,
		type BlueskyFeedItem,
		type BlueskyPost,
		getPostType,
		getPostMediaType,
		extractPostLink
	} from '$lib/bskyfoo';
	import { formatDate } from '$lib/utils';

	/**
	 * Process the posts array and count the frequency of domains from external links
	 * @param posts - Array of BlueskyFeedItems to analyze
	 * @returns Array of objects with domain and count, sorted by count in descending order
	 */
	function getDomainFrequency(posts: BlueskyFeedItem[]): Array<{ domain: string; count: number }> {
		// Create a map to store domain counts
		const domainMap = new Map<string, number>();

		// Process each post
		posts.forEach((item) => {
			// Extract link information from the post
			const linkInfo = extractPostLink(item.post);

			// If a domain was found and isn't empty
			if (linkInfo && linkInfo.domain) {
				// Increment the count for this domain
				const currentCount = domainMap.get(linkInfo.domain) || 0;
				domainMap.set(linkInfo.domain, currentCount + 1);
			}
		});

		// Convert the map to an array of objects
		const result = Array.from(domainMap.entries()).map(([domain, count]) => ({
			domain,
			count
		}));

		// Sort by count in descending order
		result.sort((a, b) => b.count - a.count);

		return result;
	}

	export let posts: BlueskyFeedItem[] = [];
	export let profile: BlueskyProfile | null = null;

	function calculatePostAnalytics(posts: BlueskyFeedItem[]) {
		// Default values
		if (!posts.length) return null;

		// Filter out reposts for posting activity summary since they don't have repost timestamps
		const originalPosts = posts.filter(
			(item) => getPostType(item.post, profile?.handle) !== 'repost'
		);

		const regularPosts = originalPosts.filter(
			(item) => !['quote', 'reply'].includes(getPostType(item.post, profile?.handle))
		);

		const linkedDomains = getDomainFrequency(posts);

		// Handle edge case where there are no original posts (only reposts)
		if (originalPosts.length === 0) {
			return {
				totalPosts: posts.length,
				originalPostCount: 0,
				postsPerDay: 0,
				postTypes: { reply: 0, images: 0, video: 0, quote: 0, post: 0, repost: posts.length },
				postMediaTypes: {},
				engagement: {
					replies: { total: 0, average: 0 },
					likes: { total: 0, average: 0 },
					reposts: { total: 0, average: 0 },
					quotes: { total: 0, average: 0 }
				},
				dateRange: { earliest: new Date(), latest: new Date(), days: 0 },
				media: { totalImages: 0, imagesWithAlt: 0, altTextPercentage: 0 },
				linkedDomains: {}
			};
		}

		// Get earliest and latest post dates from original content only
		const postDates = originalPosts.map((item) => new Date(item.post.record.createdAt).getTime());
		const earliestDate = new Date(Math.min(...postDates));
		const latestDate = new Date(Math.max(...postDates));

		// Calculate date range in days
		const dateRangeMs = latestDate.getTime() - earliestDate.getTime();
		const dateRangeDays = Math.max(1, dateRangeMs / (1000 * 60 * 60 * 24));

		// Count post types
		const postTypes = {
			reply: 0,
			quote: 0,
			post: 0,
			repost: 0
		};

		const postMediaTypes = {
			image: 0,
			video: 0,
			text: 0
		};

		// Count engagement
		let totalReplies = 0;
		let totalLikes = 0;
		let totalReposts = 0;
		let totalQuotes = 0;

		// Media metrics
		let totalImages = 0;
		let imagesWithAlt = 0;

		// Analyze each post
		posts.forEach((item) => {
			// Increment post type counter
			const type = getPostType(item.post, profile?.handle);
			postTypes[type as keyof typeof postTypes]++;

			const mType = getPostMediaType(item.post);
			if (type != 'repost') {
				// i.e. an original post
				postMediaTypes[mType as keyof typeof postMediaTypes]++;
			}

			// Add engagement metrics (exclude reposts as they don't represent engagement for the user)
			if (type !== 'repost') {
				totalReplies += item.post.replyCount || 0;
				totalLikes += item.post.likeCount || 0;
				totalReposts += item.post.repostCount || 0;
				totalQuotes += item.post.quoteCount || 0;
			}

			// Count images and check for alt text
			if (type !== 'repost' && item.post.embed?.images) {
				const imageArray = item.post.embed.images;
				totalImages += imageArray.length;

				// Check for meaningful alt text (>5 chars)
				imageArray.forEach((img) => {
					if (img.alt && img.alt.trim().length > 5) {
						imagesWithAlt++;
					}
				});
			}
		});

		// Calculate alt text percentage
		const altTextPercentage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;

		return {
			totalPosts: posts.length,
			originalPostCount: originalPosts.length,
			regularPostCount: regularPosts.length,
			postsPerDay: +(originalPosts.length / dateRangeDays).toFixed(1),
			postTypes,
			postMediaTypes,
			engagement: {
				replies: {
					total: totalReplies,
					average: +(totalReplies / originalPosts.length).toFixed(1)
				},
				likes: {
					total: totalLikes,
					average: +(totalLikes / originalPosts.length).toFixed(1)
				},
				reposts: {
					total: totalReposts,
					average: +(totalReposts / originalPosts.length).toFixed(1)
				},
				quotes: {
					total: totalQuotes,
					average: +(totalQuotes / originalPosts.length).toFixed(1)
				}
			},
			dateRange: {
				earliest: earliestDate,
				latest: latestDate,
				days: Math.round(dateRangeDays)
			},
			media: {
				totalImages,
				imagesWithAlt,
				altTextPercentage
			},
			linkedDomains
		};
	}
</script>

{#if posts.length > 0}
	{@const analytics = calculatePostAnalytics(posts)}
	{#if analytics}
		<section class="analytics-card section">
			<h2 class="section-title">Analytics</h2>
			<div class="deck">
				Based on the most recent {analytics.totalPosts} posts ({analytics.originalPostCount} original,
				{analytics.totalPosts - analytics.originalPostCount} reposts) from {profile?.displayName ||
					profile?.handle}:
			</div>

			<div class="analytics-grid">
				<div class="analytics-section">
					<h4 class="analytics-section-title">Recent Activity</h4>
					<div class="analytics-stat">
						<span class="analytics-label">Date range:</span>
						<span class="analytics-value">{analytics.dateRange.days} days</span>
					</div>
					<div class="analytics-stat">
						<span class="analytics-label">Latest post:</span>
						<span class="analytics-value"
							>{formatDate(analytics.dateRange.latest.toISOString())}</span
						>
					</div>
					<div class="analytics-stat">
						<span class="analytics-label">Recent posts/day rate:</span>
						<span class="analytics-value">{analytics.postsPerDay}</span>
					</div>

					<div class="analytics-subsection">
						<h4 class="analytics-section-title">Engagement (Per Post)</h4>
						<div class="analytics-stat">
							<span class="analytics-label">Likes per post:</span>
							<span class="analytics-value">{analytics.engagement.likes.average}</span>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Reposts per post:</span>
							<span class="analytics-value">{analytics.engagement.reposts.average}</span>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Replies per post:</span>
							<span class="analytics-value">{analytics.engagement.replies.average}</span>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Quotes per post:</span>
							<span class="analytics-value">{analytics.engagement.quotes.average}</span>
						</div>
					</div>
					<div class="analytics-subsection">
						<h4 class="analytics-section-title">Engagement (Total)</h4>
						<div class="analytics-stat">
							<span class="analytics-label">Likes:</span>
							<span class="analytics-value"
								>{analytics.engagement.likes.total.toLocaleString()}</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Reposts:</span>
							<span class="analytics-value"
								>{analytics.engagement.reposts.total.toLocaleString()}</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Replies:</span>
							<span class="analytics-value"
								>{analytics.engagement.replies.total.toLocaleString()}</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Quotes:</span>
							<span class="analytics-value"
								>{analytics.engagement.quotes.total.toLocaleString()}</span
							>
						</div>
					</div>
				</div>

				<div class="analytics-section">
					<h4 class="analytics-section-title">Post Types</h4>

					<div class="analytics-stat">
						<span class="analytics-label">Regular Posts:</span>
						<span class="analytics-value"
							>{analytics.regularPostCount} ({Math.round(
								(analytics.regularPostCount / analytics.totalPosts) * 100
							)}%)</span
						>
					</div>
					<div class="analytics-stat">
						<span class="analytics-label">Quotes:</span>
						<span class="analytics-value"
							>{analytics.postTypes.quote} ({Math.round(
								(analytics.postTypes.quote / analytics.totalPosts) * 100
							)}%)</span
						>
					</div>
					<div class="analytics-stat">
						<span class="analytics-label">Replies:</span>
						<span class="analytics-value"
							>{analytics.postTypes.reply} ({Math.round(
								(analytics.postTypes.reply / analytics.totalPosts) * 100
							)}%)</span
						>
					</div>

					<div class="analytics-stat">
						<span class="analytics-label">Reposts:</span>
						<span class="analytics-value"
							>{analytics.postTypes.repost} ({Math.round(
								(analytics.postTypes.repost / analytics.totalPosts) * 100
							)}%)</span
						>
					</div>

					<div class="analytics-subsection">
						<!-- show the media type per original post -->
						<h4 class="analytics-section-title">Media</h4>
						<div class="analytics-stat">
							<span class="analytics-label">Text only:</span>
							<span class="analytics-value"
								>{analytics.postMediaTypes.text} ({Math.round(
									(analytics.postMediaTypes.text / analytics.originalPostCount) * 100
								)}%)</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">With video:</span>
							<span class="analytics-value"
								>{analytics.postMediaTypes.video} ({Math.round(
									(analytics.postMediaTypes.video / analytics.originalPostCount) * 100
								)}%)</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">With images:</span>
							<span class="analytics-value"
								>{analytics.postMediaTypes.image} ({Math.round(
									(analytics.postMediaTypes.image / analytics.originalPostCount) * 100
								)}%)</span
							>
						</div>

						<div class="analytics-subsection">
							<div class="analytics-stat">
								<span class="analytics-label">Image count:</span>
								<span class="analytics-value">{analytics.media.totalImages}</span>
							</div>
							<div class="analytics-stat">
								<span class="analytics-label">Images w/ ALT text:</span>
								<span class="analytics-value">{analytics.media.imagesWithAlt}</span>
							</div>
							<div class="analytics-stat">
								<span class="analytics-label">ALT text %:</span>
								<span class="analytics-value">{analytics.media.altTextPercentage}%</span>
							</div>
						</div>
					</div>
				</div>

				<div class="analytics-section linking-activity">
					<h4 class="analytics-section-title">Domains Linked</h4>
					<ul class="domains-list">
						{#each analytics.linkedDomains as item}
							<li>{item.domain} ({item.count})</li>
						{/each}
					</ul>
				</div>
			</div>
		</section>
	{/if}
{/if}

<style>
	@reference "../../app.css";

	.analytics-grid {
		@apply grid grid-cols-2 md:grid-cols-3 gap-4 mt-2;
	}

	.analytics-section {
		@apply bg-gray-800/50 rounded p-3;
	}

	.analytics-subsection {
		@apply mt-3;
		.analytics-subsection {
			@apply mt-0;
			@apply pl-3;
		}
	}
	.analytics-section-title {
		@apply text-sm text-gray-300 font-medium mb-2 border-b border-gray-700 pb-1;
	}

	.analytics-stat {
		@apply flex justify-between py-1 text-sm sm:flex-row sm:justify-between flex-col items-start;
	}

	.analytics-label {
		@apply text-gray-400;
	}

	.analytics-value {
		@apply text-white font-medium sm:mt-0 mt-1;
	}

	.domains-list li {
		@apply text-sm text-gray-400;
	}
</style>
