<script lang="ts">
	import type { BlueskyFeedItem } from '$lib/bskyfoo';

	export let posts: BlueskyFeedItem[] = [];

	// Calculate counts per hour
	$: hourCounts = calculateHourlyCounts(posts);
	$: maxCount = Math.max(...hourCounts);

	function calculateHourlyCounts(posts: BlueskyFeedItem[]): number[] {
		const counts = Array(24).fill(0);

		posts.forEach(post => {
			const hour = new Date(post.post.indexedAt).getHours();
			counts[hour]++;
		});

		return counts;
	}
</script>

<div class="card">
	<h2 class="card-title">Posts per Hour of Day</h2>

	<!-- Check if we have data with more than 0 posts per any hour -->
	{#if maxCount > 0}
		<div class="svg-chart-container">
			<svg width="100%" height="230" class="hour-chart">
				<!-- Y-axis line -->
				<line x1="40" y1="10" x2="40" y2="180" stroke="#666" stroke-width="1" />

				<!-- X-axis line -->
				<line x1="40" y1="180" x2="670" y2="180" stroke="#666" stroke-width="1" />

				<!-- Bars -->
				{#each hourCounts as count, hour}
					{@const barHeight = count > 0 ? Math.max(4, (count / maxCount) * 160) : 1}
					{@const barX = 50 + hour * 25}
					{@const barY = 180 - barHeight}
					{@const timeLabel = hour === 0 ? '12a' :
								   hour < 12 ? `${hour}a` :
								   hour === 12 ? '12p' :
								   `${hour-12}p`}

					<!-- Bar -->
					<rect
						x={barX}
						y={barY}
						width="18"
						height={barHeight}
						fill="#3b82f6"
						rx="2"
					/>

					<!-- Count label (only if > 0) -->
					{#if count > 0}
						<text
							x={barX + 9}
							y={barY - 5}
							text-anchor="middle"
							font-size="10"
							fill="#93c5fd"
						>{count}</text>
					{/if}

					<!-- Hour label -->
					<text
						x={barX + 9}
						y="195"
						text-anchor="middle"
						font-size="10"
						fill="#9ca3af"
						font-family="monospace"
					>{timeLabel}</text>
				{/each}
			</svg>
		</div>
		<div class="chart-caption">Distribution of posts by hour of day (timezone: local browser time)</div>
	{:else}
		<p class="no-data">No posting time data available</p>
	{/if}
</div>

<style>
	@reference "../../app.css";

	.card {
		@apply bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700;
	}

	.card-title {
		@apply text-xl font-bold text-blue-400 mb-4;
	}

	.svg-chart-container {
		@apply mx-auto overflow-x-auto;
	}

	.hour-chart {
		@apply mx-auto block;
	}

	.chart-caption {
		@apply text-xs text-gray-400 text-center mt-2;
	}

	.no-data {
		@apply text-gray-400 text-center py-8;
	}
</style>
