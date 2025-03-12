<script lang="ts">
	import {
		type BlueskyProfile,
		type BlueskyFeedItem,
		type BlueskyPost,
		getPostType,
		postURL
	} from '$lib/bskyfoo';
	import { formatDate, formatIsoDate, prettifyInteger } from '$lib/utils';
	export let posts: BlueskyFeedItem[] = [];
	export let profile: BlueskyProfile | null = null;

	import FilterSelect from './select-filters.svelte';

	let POST_TYPES = [
		{ value: 'post', label: 'Posts', count: 0 },
		{ value: 'repost', label: 'Reposts', count: 0 },
		{ value: 'quote', label: 'Quotes', count: 0 },
		{ value: 'reply', label: 'Replies', count: 0 }
	];

	function tallyPostTypesForFilterLabel(posts, POST_TYPES) {
		// yikes this is ugly!
		posts.forEach((item) => {
			const pType = getPostType(item.post, profile?.handle);
			// Increment post type counter
			let metaobj = POST_TYPES.find((o) => o.value === pType);
			if (metaobj) {
				metaobj.count += 1;
			}
		});
		return POST_TYPES;
	}

	// Now the selected post type is a string that can also be "all"
	let selectedPostType: string = 'all';

	// Function to handle post type selection changes from the RadioDropdown
	function handlePostTypeChange(event: CustomEvent<string>) {
		selectedPostType = event.detail;
	}
	// Filter posts based on the selected type
	$: filteredPosts = posts.filter((item) => {
		const postType = getPostType(item.post, profile?.handle);
		return selectedPostType === 'all' || postType === selectedPostType;
	});
</script>

{#if posts.length > 0}
	{@const tallied_post_types = tallyPostTypesForFilterLabel(posts, POST_TYPES)}
	<section class="posts-list section">
		<h2 class="section-title">Recent Posting Activity</h2>

		<div class="filters">
			<FilterSelect
				options={tallied_post_types}
				bind:selected={selectedPostType}
				on:change={handlePostTypeChange}
			/>
		</div>

		<div class="posts-container">
			<div class="posts-header">
				<div class="header-item header-date">Date</div>
				<div class="header-item header-content">Content</div>
				<div class="header-item header-metrics">
					<div class="metric-item"><i class="icon fa-regular fa-thumbs-up"></i> Likes</div>
					<div class="metric-item"><i class="icon fa-regular fa-copy"></i> Reposts</div>
					<div class="metric-item"><i class="icon fa-regular fa-comment"></i> Replies</div>
					<div class="metric-item"><i class="icon fa-regular fa-comments"></i> Quotes</div>
				</div>
			</div>

			{#each filteredPosts as item}
				<div class="post-row {getPostType(item.post, profile?.handle)}">
					<div class="post-date-column">
						<div class="post-date">
							<a href={postURL(item.post)} target="_blank" class="link">
								{formatIsoDate(item.post.record.createdAt)}
							</a>
						</div>
						<div class="post-type">
							{getPostType(item.post, profile?.handle)}
						</div>
					</div>

					<div class="post-content-column">
						<div class="text-content">
							{item.post.record.text}
						</div>
						{#if item.post.embed?.images}
							<div class="image-indicator">
								<span
									>+{item.post.embed.images.length} image{item.post.embed.images.length > 1
										? 's'
										: ''}</span
								>
							</div>
						{/if}
					</div>

					<div class="post-metrics-column">
						<div class="metric-group">
							<div class="metric-label"><i class="icon fa-regular fa-thumbs-up"></i></div>
							<div class="metric-value">{item.post.likeCount}</div>
						</div>
						<div class="metric-group">
							<div class="metric-label"><i class="icon fa-regular fa-copy"></i></div>
							<div class="metric-value">{item.post.repostCount}</div>
						</div>
						<div class="metric-group">
							<div class="metric-label"><i class="icon fa-regular fa-comment"></i></div>
							<div class="metric-value">{item.post.replyCount}</div>
						</div>
						<div class="metric-group">
							<div class="metric-label"><i class="icon fa-regular fa-comments"></i></div>
							<div class="metric-value">{item.post.quoteCount}</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	@reference "../../app.css";

	.posts-section {
		@apply mt-8;
	}

	/* Container styles */
	.posts-container {
		@apply overflow-x-auto rounded-lg border border-gray-700;
	}

	/* Header styles */
	.posts-header {
		@apply flex bg-gray-800 text-gray-300 border-b border-gray-700 p-3 font-medium text-sm;
	}

	.header-item {
		@apply text-left;
	}

	.header-date {
		@apply w-1/6;
	}

	.header-content {
		@apply w-3/6;
	}

	.header-metrics {
		@apply w-2/6 flex flex-wrap justify-between;
	}

	.metric-item {
		@apply text-xs flex items-center mr-2;
	}

	.metric-item .icon {
		@apply mr-1;
	}

	/* Post row styles */
	.post-row {
		@apply flex p-3 border-b border-gray-700 text-sm hover:bg-gray-800/30 transition-colors;
	}

	.post-row.repost {
		@apply text-gray-400 bg-gray-600;
	}

	.post-date-column {
		@apply w-1/6;
	}

	.post-content-column {
		@apply w-3/6;
	}

	.post-metrics-column {
		@apply w-2/6 flex flex-wrap justify-between pl-2;
	}

	.post-type {
		@apply text-xs text-gray-400 mt-1;
	}

	.post-date {
		@apply text-xs;
	}

	.text-content {
		@apply line-clamp-2 text-xs;
	}

	.image-indicator {
		@apply mt-1 text-xs text-blue-400 font-medium;
	}

	.metric-group {
		@apply flex flex-col items-center mb-1 mr-2;
	}

	.metric-label {
		@apply text-xs text-gray-400;
	}

	.metric-value {
		@apply text-xs font-medium;
	}

	/* Mobile responsiveness */
	@media (max-width: 640px) {
		.posts-header {
			@apply hidden;
		}

		.post-row {
			@apply flex-col p-4 mb-3;
		}

		.post-date-column,
		.post-content-column,
		.post-metrics-column {
			@apply w-full mb-3;
		}

		.post-metrics-column {
			@apply grid grid-cols-4 gap-2;
		}

		.metric-group {
			@apply flex-row items-center;
		}

		.metric-label {
			@apply mr-2;
		}
	}
</style>
