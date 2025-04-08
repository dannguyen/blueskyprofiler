<script lang="ts">
	import { formatDate, prettifyInteger, makeIcon } from '$lib/utils';
	import type { BlueskyThing } from '$lib/bskyfoo';

	export let post: BlueskyThing;
</script>

<div class="post-card">
	<div class="post-content-wrapper">
		<!-- Post metadata and content -->
		<div class="post-metadata">
			<div class="post-header">
				<div class="post-header-left">
					<a href={post.url} target="_blank" class="post-date">
						{formatDate(post.record.createdAt)}
					</a>

					<div class="post-metrics">
						<div class="metric-group">
							<div class="metric" title="Likes">
								{@html makeIcon('like')}
								<span class="metric-value">{prettifyInteger(post.likeCount || 0)}</span>
							</div>
							<div class="metric" title="Reposts">
								{@html makeIcon('repost')}
								<span class="metric-value">{prettifyInteger(post.repostCount || 0)}</span>
							</div>
							<div class="metric" title="Replies">
								{@html makeIcon('reply')}
								<span class="metric-value">{prettifyInteger(post.replyCount || 0)}</span>
							</div>
							<div class="metric" title="Quotes">
								{@html makeIcon('quote')}
								<span class="metric-value">{prettifyInteger(post.quoteCount || 0)}</span>
							</div>
						</div>
						<div class="total-engagement" title="Total Interactions">
							<span class="total-value">
								{@html makeIcon('interaction')}
								{post.interactions}
							</span>
							<span class="total-label">interactions</span>
						</div>
					</div>
				</div>
			</div>

			<div class="post-content">
				{post.record.text}
			</div>
		</div>

		<!-- Post images -->
		{#if post.embed?.images && post.embed.images.length > 0}
			<div class="post-images">
				{#each post.embed.images as image, i}
					<img src={image.fullsize} alt={image.alt || `Image ${i + 1}`} class="post-image" />
				{/each}
			</div>
		{/if}

		{#if post.embed?.media?.images && post.embed.media.images.length > 0}
			<div class="post-images">
				{#each post.embed.media.images as image, i}
					<img src={image.fullsize} alt={image.alt || `Image ${i + 1}`} class="post-image" />
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.post-card {
		display: flex;
		flex-direction: row;
		background-color: rgba(55, 65, 81, 0.5);
		border-radius: 0.5rem;
		padding: 1rem;
		border: 1px solid rgba(75, 85, 99, 1);
		transition: all 0.3s;
		margin-bottom: 2rem;
	}

	.post-card:hover {
		border-color: rgba(59, 130, 246, 1);
		box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
		transform: translateY(-0.25rem);
	}

	.post-content-wrapper {
		display: flex;
		flex-direction: row;
		width: 100%;
	}

	.post-metadata {
		flex: 2;
		margin-right: 1rem;
	}

	.post-images {
		flex: 1;
		display: grid;
		gap: 0.5rem;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		align-items: center;
		justify-content: center;
	}

	.post-image {
		border-radius: 0.25rem;
		border: 1px solid rgba(107, 114, 128, 1);
		object-fit: cover;
		max-height: 300px;
		width: 100%;
	}

	.post-header {
		display: flex;
		margin-bottom: 0.75rem;
		border-bottom: 1px solid rgba(75, 85, 99, 1);
		padding-bottom: 0.5rem;
	}

	.post-header-left {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.post-metrics {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.metric-group {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.metric {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: rgba(156, 163, 175, 1);
	}

	.metric-value {
		font-weight: bold;
	}

	.total-engagement {
		font-size: 0.95rem; /* Slightly bigger text */
	}

	.total-value {
		color: rgb(255, 225, 0);
		font-weight: bold;
	}
	.post-content {
		color: rgba(255, 255, 255, 1);
		word-break: break-word;
		max-height: 300px;
		overflow-y: auto;
	}
</style>
