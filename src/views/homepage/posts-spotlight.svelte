<script lang="ts">
	import { BlueskyThing, type BlueskyFeedItem } from '$lib/bskyfoo';
	import PostCard from './PostCard.svelte';

	export let posts: BlueskyFeedItem[] = [];

	/**
	 * Returns the top 5 posts with highest engagement metrics
	 * @param posts Array of BlueskyFeedItems to analyze
	 * @returns Array of up to 5 posts with highest engagement, sorted in descending order
	 */
	export function getTopEngagementPosts(posts: BlueskyFeedItem[]): BlueskyThing[] {
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
	function isFeaturePost(post: BlueskyThing, bestPosts: BlueskyThing[]): boolean {
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
					<PostCard {post} />
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
</style>
