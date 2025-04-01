<script lang="ts">
	import {
		type BlueskyProfile,
		type BlueskyFeedItem,
		type BlueskyPost,
		getPostMediaType,
		extractPostLink
	} from '$lib/bskyfoo';
	import { formatDate } from '$lib/utils';
	import HourlyPostsChart from './analytics/chart-posts-hourly.svelte';
	import WeekdayPostsChart from './analytics/chart-posts-dayofweek.svelte';
	import { DateTime, Duration } from 'luxon';

	export function toRoughHumanDuration(start: DateTime, end: DateTime): string {
		const units = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
		const duration = end.diff(start, units).toObject();

		if ('seconds' in duration) {
			duration.seconds = Math.round(duration.seconds!);
		}

		const durationList = Object.entries(duration);
		const cleanedDurationList = [];
		const ix = durationList.findIndex((v) => v[1] > 0);
		const jx = ix + 1;

		if (ix >= 0) {
			cleanedDurationList.push(durationList[ix]);
			if (jx < units.length) {
				if (durationList[jx][1] > 0) {
					cleanedDurationList.push(durationList[jx]);
				}
			}
		} else {
			cleanedDurationList.push(['seconds', 0]);
		}

		const cleanedDuration = Object.fromEntries(cleanedDurationList);

		return Duration.fromObject(cleanedDuration).toHuman();
	}

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

	/**
	 * Process the posts array and count the frequency of domains from external links
	 * @param posts - Array of BlueskyFeedItems to analyze
	 * @returns Array of objects with domain and count, sorted by count in descending order
	 */
	function getInteractedUsers(posts: BlueskyFeedItem[]): Array<{ domain: string; count: number }> {
		// Create a map to store domain counts
		const handleMap = new Map<string, number>();

		// Process each post
		posts.forEach((item) => {
			// Extract link information from the post
			const userInfo = item.post.interactedUser;

			// If a domain was found and isn't empty
			if (userInfo && userInfo.handle) {
				// Increment the count for this domain
				const currentCount = handleMap.get(userInfo.handle) || 0;
				handleMap.set(userInfo.handle, currentCount + 1);
			}
		});

		// Convert the map to an array of objects
		const result = Array.from(handleMap.entries()).map(([handle, count]) => ({
			handle,
			count
		}));

		// Sort by count in descending order
		result.sort((a, b) => b.count - a.count);

		return result;
	}

	export let posts: BlueskyFeedItem[] = [];
	export let profile: BlueskyProfile | null = null;

	// For limiting displayed linked domains
	let showAllDomains = false;
	let showAllInteractions = false;
	const DOMAIN_DISPLAY_LIMIT = 10;

	function calculatePostAnalytics(posts: BlueskyFeedItem[]) {
		// Default values
		if (!posts.length) return null;

		// Filter out reposts for posting activity summary since they don't have repost timestamps
		const originalPosts = posts.filter((item) => item.post.isOriginal());
		const reposts = posts.filter((item) => item.post.thingType == 'repost');

		const regularPosts = originalPosts.filter(
			(item) => !['quote', 'reply'].includes(item.post.thingType)
		);

		const replies = originalPosts.filter((item) => item.post.thingType === 'reply');
		const linkedDomains = getDomainFrequency(posts);
		const interactedUsers = getInteractedUsers(posts);

		// Handle edge case where there are no original posts (only reposts)
		if (originalPosts.length === 0) {
			return {
				totalPosts: posts.length,
				originalPostCount: 0,
				postsPerDay: 0,
				repostsPerDay: 0,
				repliesPerDay: 0,
				postsInLast12Hours: 0,
				postsInLast24Hours: 0,
				postsInLast4Hours: 0,
				postTypes: { reply: 0, images: 0, video: 0, quote: 0, post: 0, repost: posts.length },
				postMediaTypes: {},
				engagement: {
					replies: { total: 0, average: 0 },
					likes: { total: 0, average: 0 },
					reposts: { total: 0, average: 0 },
					quotes: { total: 0, average: 0 }
				},
				dateRange: { earliest: new Date(), latest: new Date(), timespan: '0 seconds' },
				media: { totalImages: 0, imagesWithAlt: 0, altTextPercentage: 0 },
				linkedDomains: {},
				interactedUsers: {},
				timezone: ''
			};
		}

		// Get earliest and latest post dates from original content only
		const postDates = posts.map((item) => new Date(item.post.thingCreatedAt).getTime());
		const earliestDate = new Date(Math.min(...postDates));
		const latestDate = new Date(Math.max(...postDates));

		// Calculate date range in days
		const dateRangeMs = latestDate.getTime() - earliestDate.getTime();
		const msPerHour = 60 * 60 * 1000;
		const dateRangeDays = dateRangeMs / (msPerHour * 24);

		// Calculate posts in last 12 hours and last hour
		const _24HoursAgo = new Date(Date.now() - 24 * msPerHour);
		const twelveHoursAgo = new Date(Date.now() - 12 * msPerHour);
		const fourHoursAgo = new Date(Date.now() - 4 * msPerHour);

		const postsInLast24Hours = originalPosts.filter(
			(item) => new Date(item.post.record.createdAt) >= _24HoursAgo
		).length;
		const postsInLast12Hours = originalPosts.filter(
			(item) => new Date(item.post.record.createdAt) >= twelveHoursAgo
		).length;
		const postsInLast4Hours = originalPosts.filter(
			(item) => new Date(item.post.record.createdAt) >= fourHoursAgo
		).length;

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
			postTypes[item.post.thingType as keyof typeof postTypes]++;

			const mType = getPostMediaType(item.post);
			if (item.post.isOriginal()) {
				// i.e. an original post
				postMediaTypes[mType as keyof typeof postMediaTypes]++;
			}

			// Add engagement metrics (exclude reposts as they don't represent engagement for the user)
			if (item.post.isOriginal()) {
				totalReplies += item.post.replyCount || 0;
				totalLikes += item.post.likeCount || 0;
				totalReposts += item.post.repostCount || 0;
				totalQuotes += item.post.quoteCount || 0;
			}

			// Count images and check for alt text
			if (item.post.isOriginal() && item.post.embed?.images) {
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

		const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		// Calculate alt text percentage
		const altTextPercentage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;

		return {
			totalPosts: posts.length,
			originalPostCount: originalPosts.length,
			regularPostCount: regularPosts.length,
			postsPerDay: +(originalPosts.length / dateRangeDays).toFixed(1),
			repostsPerDay: +(reposts.length / dateRangeDays).toFixed(1),
			repliesPerDay: +(replies.length / dateRangeDays).toFixed(1),
			postsInLast12Hours,
			postsInLast24Hours,
			postsInLast4Hours,
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
				timespan: toRoughHumanDuration(
					DateTime.fromJSDate(earliestDate),
					DateTime.fromJSDate(latestDate)
				)
			},
			media: {
				totalImages,
				imagesWithAlt,
				altTextPercentage
			},
			linkedDomains,
			interactedUsers,
			timezone
		};
	}
</script>

{#if posts.length > 0}
	{@const analytics = calculatePostAnalytics(posts)}
	{#if analytics}
		<section class="analytics-card section">
			<h2 class="section-title">Analytics</h2>
			<div class="deck">
				Over the past
				<span class="highlight"> {analytics.dateRange.timespan}</span>,
				<a class="interacted-user" href="https://bsky.app/profile/{profile?.handle}"
					>@{profile?.handle}</a
				>
				made

				<span class="highlight">{analytics.totalPosts} posts</span>

				({analytics.originalPostCount} original,
				{analytics.totalPosts - analytics.originalPostCount} reposts).
			</div>

			<div class="note">
				Date/timestamps are based on the web browser's timezone: <code class="highlight"
					>{analytics.timezone}</code
				>
			</div>

			<div class="analytics-section">
				<div class="charts-container">
					<div class="chart-wrapper weekday-chart">
						<WeekdayPostsChart {posts} />
					</div>

					<div class="chart-wrapper hourly-chart">
						<HourlyPostsChart {posts} />
					</div>
				</div>
			</div>

			<div class="analytics-grid">
				<div class="analytics-section">
					<h4 class="analytics-section-title">Recent Posting Activity</h4>
					<div class="analytics-stat">
						<span class="analytics-label">Latest post:</span>
						<span class="analytics-value">
							{DateTime.fromJSDate(analytics.dateRange.latest).toRelative()}
						</span>
					</div>

					<div class="analytics-stat">
						<span class="analytics-label">Posts in past 4 hours:</span>
						<span class="analytics-value">{analytics.postsInLast4Hours}</span>
					</div>
					<div class="analytics-stat">
						<span class="analytics-label">Posts in past 12 hours:</span>
						<span class="analytics-value">{analytics.postsInLast12Hours}</span>
					</div>
					<div class="analytics-stat">
						<span class="analytics-label">Posts in past 24 hours:</span>
						<span class="analytics-value">{analytics.postsInLast24Hours}</span>
					</div>

					<div class="analytics-stat">
						<span class="analytics-label">Recent posts/day rate:</span>
						<span class="analytics-value">{analytics.postsPerDay}</span>
					</div>

					<div class="analytics-stat">
						<span class="analytics-label">Recent replies/day rate:</span>
						<span class="analytics-value">{analytics.repliesPerDay}</span>
					</div>

					<div class="analytics-stat">
						<span class="analytics-label">Recent reposts/day rate:</span>
						<span class="analytics-value">{analytics.repostsPerDay}</span>
					</div>
				</div>

				<div class="analytics-section">
					<h4 class="analytics-section-title">Engagement</h4>
					<h5 class="analytics-section-subtitle">Total for Recent Posts</h5>

					<div class="analytics-stat">
						<span class="analytics-label">Likes:</span>
						<span class="analytics-value">{analytics.engagement.likes.total.toLocaleString()}</span>
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
						<span class="analytics-value">{analytics.engagement.quotes.total.toLocaleString()}</span
						>
					</div>

					<div class="analytics-subsection">
						<h5 class="analytics-section-subtitle">Average Per Recent Post</h5>

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
						<h5 class="analytics-section-subtitle">Media</h5>
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
								>{analytics.postMediaTypes.video} ({(
									(analytics.postMediaTypes.video / analytics.originalPostCount) *
									100
								).toFixed(1)}%)</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">With images:</span>
							<span class="analytics-value"
								>{analytics.postMediaTypes.image} ({(
									(analytics.postMediaTypes.image / analytics.originalPostCount) *
									100
								).toFixed(1)}%)</span
							>
						</div>
						<div class="analytics-stat">
							<span class="analytics-label">Images w/ ALT text:</span>
							<span class="analytics-value"
								>{analytics.media.imagesWithAlt} of
								{analytics.media.totalImages} ({analytics.media.altTextPercentage}%)
							</span>
						</div>
					</div>
				</div>

				<div class="analytics-section linking-activity list-section">
					<h4 class="analytics-section-title">Users Interacted</h4>
					<ul class="domains-list">
						{#if analytics.interactedUsers.length > 0}
							{#each showAllInteractions ? analytics.interactedUsers : analytics.interactedUsers.slice(0, DOMAIN_DISPLAY_LIMIT) as item}
								<li>
									{item.count}:

									<a
										class="interacted-user"
										target="_blank"
										href="https://bsky.app/profile/{item.handle}">@{item.handle}</a
									>
								</li>
							{/each}

							{#if analytics.interactedUsers.length > DOMAIN_DISPLAY_LIMIT}
								<li class="show-more">
									<button
										on:click={() => (showAllInteractions = !showAllInteractions)}
										class="show-more-btn"
									>
										{showAllInteractions
											? `Show fewer`
											: `Show all (${analytics.interactedUsers.length})`}
									</button>
								</li>
							{/if}
						{:else}
							<li class="no-domains">No interacted users found</li>
						{/if}
					</ul>
				</div>

				<div class="analytics-section users-interacted list-section">
					<h4 class="analytics-section-title">Domains Linked</h4>
					<ul class="domains-list">
						{#if analytics.linkedDomains.length > 0}
							{#each showAllDomains ? analytics.linkedDomains : analytics.linkedDomains.slice(0, DOMAIN_DISPLAY_LIMIT) as item}
								<li>
									{item.count}:

									<a class="domain-linked" target="_blank" href="https://{item.domain}"
										>{item.domain}</a
									>
								</li>
							{/each}

							{#if analytics.linkedDomains.length > DOMAIN_DISPLAY_LIMIT}
								<li class="show-more">
									<button on:click={() => (showAllDomains = !showAllDomains)} class="show-more-btn">
										{showAllDomains
											? `Show less (${DOMAIN_DISPLAY_LIMIT} of ${analytics.linkedDomains.length})`
											: `Show all (${analytics.linkedDomains.length})`}
									</button>
								</li>
							{/if}
						{:else}
							<li class="no-domains">No linked domains found</li>
						{/if}
					</ul>
				</div>
			</div>
		</section>
	{/if}
{/if}

<style>
	@reference "../../app.css";

	.analytics-grid {
		@apply grid grid-cols-6  gap-4 mt-2;
	}

	.analytics-section {
		@apply bg-gray-800/50 rounded p-3 col-span-2 md:col-span-2;
	}

	.analytics-subsection {
		@apply mt-3;
	}

	.analytics-section-title {
		@apply text-lg text-gray-300 font-medium mb-2 border-b border-gray-700 pb-1;
	}

	.analytics-section-subtitle {
		@apply text-sm;
	}

	.list-section {
		@apply col-span-6 md:col-span-3;
	}

	.analytics-stat {
		@apply flex justify-between py-1 text-sm sm:flex-row sm:justify-between flex-col items-start;
	}

	.analytics-label {
		@apply text-gray-400;
	}

	.analytics-value {
		@apply text-white font-medium sm:mt-0 mt-1;
		text-align: right;
	}

	.deck {
		@apply text-lg;
	}

	.highlight {
		@apply font-bold text-yellow-400;
	}

	.domain-linked {
		@apply text-blue-400;
	}
	.interacted-user {
		@apply text-blue-400;
	}

	.domains-list li {
		@apply text-sm text-gray-400;
	}

	.show-more {
		@apply mt-2 border-t border-gray-700 pt-2;
	}

	.show-more-btn {
		@apply text-blue-400 hover:text-blue-300 bg-transparent border-none p-0 cursor-pointer text-left text-xs;
	}

	.note {
		@apply text-xs;
	}
	.no-domains {
		@apply text-gray-500 italic;
	}

	/* Charts layout */
	.charts-container {
		@apply grid grid-cols-1 gap-6;
	}

	.chart-wrapper {
		@apply w-full;
	}

	@media (min-width: 1024px) {
		.charts-container {
			@apply grid-cols-5 gap-4;
		}

		.hourly-chart {
			@apply col-span-3;
		}

		.weekday-chart {
			@apply col-span-2;
		}
	}
</style>
