<script lang="ts">
	import { BlueskyProfile, type BlueskyFeedItem } from '$lib/bskyfoo';
	import { humanizeTimeFromNow } from '$lib/utils';
	import { calculatePostAnalytics } from '$lib/bskyfoo/analytics';
	import HourlyPostsChart from './analytics/chart-posts-hourly.svelte';
	import WeekdayPostsChart from './analytics/chart-posts-dayofweek.svelte';

	export let posts: BlueskyFeedItem[] = [];
	export let profile: BlueskyProfile | null = null;

	// For limiting displayed linked domains
	let showAllDomains = false;
	let showAllInteractions = false;
	const DOMAIN_DISPLAY_LIMIT = 10;
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
							{humanizeTimeFromNow(analytics.dateRange.latest)}
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
