<script lang="ts">
	import { type BlueskyProfile, type BlueskyFeedItem, type BlueskyPost } from '$lib/apifoo';
	import { formatDate, formatIsoDate, prettifyInteger } from '$lib/utils';
	import { getPostType, postURL } from '$lib/utils';
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

		<div class="table-container">
			<table class="posts-list">
				<thead class="posts-list-header">
					<tr>
						<th>Date</th>
						<th>Content</th>
						<th><i class="icon fa-regular fa-thumbs-up"></i> Likes</th>
						<th><i class="icon fa-regular fa-copy"></i> Reposts</th>
						<th><i class="icon fa-regular fa-comment"></i> Replies</th>
						<th><i class="icon fa-regular fa-comments"></i> Quotes</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredPosts as item}
						<tr class="post-item {getPostType(item.post, profile?.handle)}">
							<td>
								<div class="post-createdAt">
									<a href={postURL(item.post)} target="_blank" class="link">
										{formatIsoDate(item.post.record.createdAt)}
									</a>
								</div>

								<div class="post-type">
									{getPostType(item.post, profile?.handle)}
								</div>
							</td>
							<td class="post-text post-metric">
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
							</td>
							<td class="post-metric">{item.post.likeCount}</td>
							<td class="post-metric">{item.post.repostCount}</td>
							<td class="post-metric">{item.post.replyCount}</td>
							<td class="post-metric">{item.post.quoteCount}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

<style>
	@reference "../../app.css";

	.posts-section {
		@apply mt-8;
	}

	.table-container {
		@apply overflow-x-auto rounded-lg border border-gray-700;
	}

	.posts-list {
		@apply w-full border-collapse;
	}

	.posts-list th {
		@apply text-xs bg-gray-800 text-left p-3 text-gray-300 font-medium text-sm border-b border-gray-700;
	}
	th > .icon {
		display: block;
	}

	.posts-list td {
		@apply p-3 border-b border-gray-700 text-sm;
	}

	.post-text {
		@apply max-w-md;
	}

	.text-content {
		@apply line-clamp-2 text-xs;
	}

	.image-indicator {
		@apply mt-1 text-xs text-blue-400 font-medium;
	}

	.post-item.repost td.post-metric {
		@apply text-gray-400;
	}
</style>
