<script lang="ts">
	import { type BlueskyFeedItem } from '$lib/bskyfoo';
	import { formatIsoDate, makeIcon } from '$lib/utils';
	export let posts: BlueskyFeedItem[] = [];

	import FilterSelect from './select-filters.svelte';

	function tallyPostTypesForFilterLabel(posts) {
		const POST_TYPES = [
			{ value: 'original', label: 'Originals', count: 0, icon: 'original' },
			{ value: 'repost', label: 'Reposts', count: 0, icon: 'repost' },
			{ value: 'quote', label: 'Quotes', count: 0, icon: 'quote' },
			{ value: 'reply', label: 'Replies', count: 0, icon: 'reply' }
		];

		// yikes this is ugly!
		posts.forEach((item) => {
			const pType = item.post.thingType;
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
	let selectedSortOption: string = 'createdAt';

	// Function to handle post type selection changes from the RadioDropdown
	function handlePostTypeChange(event: CustomEvent<string>) {
		selectedPostType = event.detail;
	}

	function handleSortOptionChange(event: CustomEvent<string>) {
		selectedSortOption = event.detail;
	}

	// Update the filtering logic to handle multi-select
	$: filteredPosts = posts.filter((item) => {
		const postType = item.post.thingType;
		if (Array.isArray(selectedPostType)) {
			return selectedPostType.includes('all') || selectedPostType.includes(postType);
		}
		return selectedPostType === 'all' || postType === selectedPostType;
	});

	$: sortedPosts = [...filteredPosts].sort((a, b) => {
		switch (selectedSortOption) {
			case 'interactions':
				return b.post.interactions - a.post.interactions;
			case 'likes':
				return (b.post.likeCount || 0) - (a.post.likeCount || 0);
			case 'reposts':
				return (b.post.repostCount || 0) - (a.post.repostCount || 0);
			case 'replies':
				return (b.post.replyCount || 0) - (a.post.replyCount || 0);
			case 'quotes':
				return (b.post.quoteCount || 0) - (a.post.quoteCount || 0);
			case 'createdAt':
			default:
				return (
					new Date(b.post.thingCreatedAt).getTime() - new Date(a.post.thingCreatedAt).getTime()
				);
		}
	});
</script>

{#if posts.length > 0}
	{@const tallied_post_types = tallyPostTypesForFilterLabel(posts)}
	<section class="posts-list section">
		<h2 class="section-title">Most Recent {posts.length} Posts</h2>

		<div class="filters">
			<FilterSelect
				options={[
					{ value: 'createdAt', label: 'Created At', icon: 'createdAt' },
					{ value: 'interactions', label: 'Interactions', icon: 'interaction' },
					{ value: 'replies', label: 'Replies', icon: 'reply' },
					{ value: 'likes', label: 'Likes', icon: 'like' },
					{ value: 'reposts', label: 'Reposts', icon: 'repost' },
					{ value: 'quotes', label: 'Quotes', icon: 'quote' }
				]}
				bind:selected={selectedSortOption}
				on:change={handleSortOptionChange}
				buttonText="Sort By: {selectedSortOption}"
			/>

			<FilterSelect
				options={tallied_post_types}
				bind:selected={selectedPostType}
				on:change={handlePostTypeChange}
				isMultiSelect={true}
				buttonText="Filter Post Types: {selectedPostType}"
			/>
		</div>

		<div class="posts-container">
			<div class="posts-header">
				<div class="header-item header-date">Date</div>
				<div class="header-item header-content">Content</div>
				<div class="header-item header-metrics">
					<div class="metric-item">{@html makeIcon('interaction')}Interactions</div>

					<div class="metric-item">{@html makeIcon('like')} Likes</div>
					<div class="metric-item">{@html makeIcon('repost')} Reposts</div>
					<div class="metric-item">{@html makeIcon('reply')} Replies</div>
					<div class="metric-item">{@html makeIcon('quote')} Quotes</div>
				</div>
			</div>

			{#each sortedPosts as item}
				<div class="post-row {item.post.thingType}">
					<div class="post-date-column">
						<div class="post-date">
							<a href={item.post.url} target="_blank" class="link">
								{formatIsoDate(item.post.thingCreatedAt)}
							</a>
						</div>
					</div>

					<div class="post-content-column">
						<div class="post-type">
							{item.post.thingType}
							{#if ['reply', 'repost', 'quote'].includes(item.post.thingType) && item.post.interactedUser}
								<a
									class="interacted-user"
									href="https://bsky.app/profile/{item.post.interactedUser.handle}"
									>@{item.post.interactedUser.handle}</a
								>
							{/if}
						</div>

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
							<div class="metric-label"><i class="icon fa-regular fa-bell"></i></div>
							<div class="metric-value">{item.post.interactions}</div>
						</div>

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
		@apply w-1/9;
	}

	.header-content {
		@apply w-4/9;
	}

	.header-metrics {
		@apply w-4/9 flex flex-wrap justify-between;
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
		@apply w-1/9;
	}

	.post-content-column {
		@apply w-4/9;
	}

	.post-metrics-column {
		@apply w-4/9 flex flex-wrap justify-between pl-2;
	}

	.post-type {
		@apply text-xs text-gray-400 mb-0;
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

	.interacted-user {
		@apply text-blue-400;
	}
</style>
