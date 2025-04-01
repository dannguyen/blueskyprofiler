<script lang="ts">
	import {
		type BlueskyProfile,
		type BlueskyFeedItem,
		type BlueskyPost,
		postURL
	} from '$lib/bskyfoo';
	import { formatDate, prettifyInteger } from '$lib/utils';

	export let posts: BlueskyFeedItem[] = [];

	/**
	 * Returns the top 5 posts with highest engagement metrics
	 * @param posts Array of BlueskyFeedItems to analyze
	 * @returns Array of up to 5 posts with highest engagement, sorted in descending order
	 */
	export function getTopEngagementPosts(posts: BlueskyFeedItem[]): BlueskyPost[] {
		if (!posts || posts.length === 0) return [];

		// Filter out reposts for posting activity summary since they don't have repost timestamps
		const originalPosts = posts.filter((item) => item.post.thingType !== 'repost');

		// Handle edge case where there are no original posts (only reposts)
		if (originalPosts.length === 0) {
			return [];
		}

		// Sort by total engagement in descending order
		originalPosts.sort((a, b) => b.post.interactions - a.post.interactions);

		// Return top n posts (or fewer if there aren't n posts)
		return originalPosts.slice(0, 5).map((item) => item.post);
	}

	/**
	 * Determine if a post is featured (highest engagement)
	 */
	function isFeaturePost(post: BlueskyPost, bestPosts: BlueskyPost[]): boolean {
		if (bestPosts.length === 0) return false;
		return post.uri === bestPosts[0].uri;
	}
</script>

{#if posts.length > 0}
	{@const bestPosts = getTopEngagementPosts(posts)}
	{#if bestPosts.length > 0}
		<section class="best-posts section">
			<h2 class="section-title">Most Engaging Posts</h2>
			<div class="deck">
				The {bestPosts.length} most engaged posts among the most recent {posts.length} posts.
			</div>

			<!-- Newspaper-style grid layout for posts -->
			<div class="newspaper-grid">
				{#each bestPosts as post, index}
					<div class="post-card">
						<!-- Post header with date and metrics -->
						<!-- Compact header with date and all metrics in one row -->
						<div class="post-header">
							<div class="post-header-left">
								<a href={postURL(post)} target="_blank" class="post-date">
									{formatDate(post.record.createdAt)}
								</a>

								<div class="post-metrics">
									<div class="metric" title="Likes">
										<span class="metric-icon">
											<i class="fa-regular fa-thumbs-up"></i>
										</span>
										<span class="metric-value">{prettifyInteger(post.likeCount || 0)}</span>
									</div>
									<div class="metric" title="Reposts">
										<i class="fa-regular fa-copy"></i>
										<span class="metric-value">{prettifyInteger(post.repostCount || 0)}</span>
									</div>
									<div class="metric" title="Replies">
										<i class="fa-regular fa-comment"></i>
										<span class="metric-value">{prettifyInteger(post.replyCount || 0)}</span>
									</div>
									<div class="metric" title="Quotes">
										<i class="fa-regular fa-comments"></i>
										<span class="metric-value">{prettifyInteger(post.quoteCount || 0)}</span>
									</div>
								</div>
							</div>

							<div class="post-header-right">
								<div class="total-engagement" title="Total Interactions">
									<span class="total-label">Interactions</span>
									<span class="total-value">{post.interactions}</span>
								</div>
							</div>
						</div>

						<!-- Post content -->
						<div class="post-content">
							{post.record.text}
						</div>

						<!-- Post media -->
						{#if post.embed?.images && post.embed.images.length > 0}
							<div class="post-images">
								{#each post.embed.images as image, i}
									<img
										src={image.fullsize}
										alt={image.alt || `Image ${i + 1}`}
										class="post-image"
									/>
								{/each}
							</div>
						{/if}

						{#if post.embed?.media?.images && post.embed.media.images.length > 0}
							<div class="post-images">
								{#each post.embed.media.images as image, i}
									<img
										src={image.fullsize}
										alt={image.alt || `Image ${i + 1}`}
										class="post-image"
									/>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}
{/if}

<style>
	@reference "../../app.css";
	.best-posts {
		@apply mb-10;
	}

	.deck {
		@apply text-gray-300 text-sm mb-6;
	}

	.newspaper-grid {
		/*
		@apply grid gap-4 mt-4;
		grid-template-columns: repeat(12, 1fr);
		grid-auto-rows: minmax(min-content, max-content);

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}
		*/
	}

	.post-card {
		/* @apply bg-blue-900/30; */

		/* grid-column: span 7;

		@media (max-width: 900px) {
			grid-column: span 1;
		}

		@media (max-width: 768px) {
			grid-column: span 1;
		} */
	}

	.post-card {
		@apply bg-gray-700/50 rounded-lg p-4 border border-gray-600
               flex flex-col transition-all duration-300 mb-8 p-4;
		height: fit-content;
	}

	.post-card:hover {
		@apply border-blue-400 shadow-lg shadow-blue-900/20 transform -translate-y-1;
	}

	.post-header {
		@apply flex mb-3 border-b border-gray-600 pb-2;
	}

	.post-header-left {
		@apply flex flex-col grow;
	}

	.post-header-right {
		@apply flex items-center justify-center ml-2 pl-2 border-l border-gray-600;
	}

	.post-date {
		@apply text-gray-300 text-sm hover:text-blue-300 transition-colors mb-2;
	}

	.post-metrics {
		@apply flex flex-wrap gap-2;
	}

	.metric {
		@apply flex items-center whitespace-nowrap text-xs;
	}

	.metric-value {
		@apply text-white text-xs ml-1;
	}

	.metric-icon {
		@apply text-gray-300 text-xs;
	}

	.total-engagement {
		@apply flex flex-col items-center justify-center bg-gray-800/70 rounded px-3 py-2;
	}

	.total-label {
		@apply text-gray-400 text-xs mb-1;
	}

	.total-value {
		@apply text-amber-400 font-bold text-lg;
	}

	.post-content {
		@apply text-white mb-4 break-words;
		max-height: 300px;
		overflow-y: auto;
	}

	.post-images {
		@apply grid gap-2 mt-2;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
	}

	/* Single image should be bigger */
	.post-images:has(.post-image:only-child) .post-image {
		@apply w-full;
	}

	.post-image {
		@apply rounded border border-gray-500 object-cover;
		max-height: 300px;
		width: 100%;
	}

	/* Feature post styling adjustments */
	.post-card:nth-child(1) .post-content {
		@apply text-lg mb-6;
	}

	.post-card:nth-child(1) .post-image {
		max-height: 400px;
	}

	.post-card:nth-child(1) .total-value {
		@apply text-base;
	}
</style>
