<script lang="ts">
	import { type BlueskyProfile, type BlueskyFeedItem, type BlueskyPost } from '$lib/apifoo';
	import { formatDate, getWordCount } from '$lib/utils';
	import { getPostType, postURL } from '$lib/utils';
	export let posts: BlueskyFeedItem[] = [];
	export let profile: BlueskyProfile | null = null;
</script>

{#if posts.length > 0}
	<section class="posts-list section">
		<h2 class="section-title">Recent Posts</h2>

		<div class="table-container">
			<table class="posts-list">
				<thead>
					<tr>
						<th>Date</th>
						<th>Type</th>
						<th>Content</th>
						<th>Words</th>
						<th>Likes</th>
						<th>Reposts</th>
						<th>Replies</th>
						<th>Quotes</th>
					</tr>
				</thead>
				<tbody>
					{#each posts as item}
						<tr class="post-item {getPostType(item.post, profile?.handle)}">
							<td>
								<a href={postURL(item.post)} target="_blank" class="link">
									{formatDate(item.post.record.createdAt)}
								</a>
							</td>
							<td>{getPostType(item.post, profile?.handle)}</td>
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
							<td class="post-metric">{getWordCount(item.post.record.text)}</td>
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

<style lang="postcss">
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
		@apply bg-gray-800 text-left p-3 text-gray-300 font-medium text-sm border-b border-gray-700;
	}

	.posts-list td {
		@apply p-3 border-b border-gray-700 text-sm;
	}

	.post-text {
		@apply max-w-md;
	}

	.text-content {
		@apply line-clamp-2;
	}

	.image-indicator {
		@apply mt-1 text-xs text-blue-400 font-medium;
	}

	.post-item.repost td.post-metric {
		@apply text-gray-400;
	}
</style>
