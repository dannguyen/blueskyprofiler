<script lang="ts">
	import type { BlueskyFeedItem } from '$lib/bskyfoo';

	export let posts: BlueskyFeedItem[] = [];

	// Reactive calculation of data
	$: weekdayData = calculateWeekdayCounts(posts);
	$: weekdayCounts = weekdayData.dayCounts;
	$: maxCount = weekdayData.maxCount;
	$: totalCount = weekdayData.totalCount;

	const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	// Use same colors as hourly chart
	const weekdayColor = '#3b82f6'; // Blue for Mon-Fri
	const weekendColor = '#8b5cf6'; // Purple for Sat-Sun

	interface WeekdayData {
		dayCounts: number[]; // Counts for each day of the week (0-6)
		maxCount: number; // Maximum count across days
		totalCount: number; // Total number of posts
	}

	function calculateWeekdayCounts(posts: BlueskyFeedItem[]): WeekdayData {
		const dayCounts = Array(7).fill(0);
		let totalCount = 0;

		posts.forEach((post) => {
			const date = new Date(post.post.indexedAt);
			const normaldayOfWeek = date.getDay(); // 0-6, where 0 is Sunday
			const dayOfWeek = (normaldayOfWeek + 6) % 7; // now 0 is monday, 6 is sunday
			dayCounts[dayOfWeek]++;
			totalCount++;
		});

		// Find the maximum count for scaling
		const maxCount = Math.max(...dayCounts);

		return {
			dayCounts,
			maxCount,
			totalCount
		};
	}

	function isWeekend(dayIndex: number): boolean {
		return dayIndex === 5 || dayIndex === 6;
	}
</script>

<div class="card">
	<!-- Check if we have data with more than 0 posts -->
	{#if maxCount > 0}
		<div class="svg-chart-container">
			<svg class="weekday-chart" viewBox="0 0 300 260" preserveAspectRatio="xMidYMid meet">
				<!-- Y-axis line -->
				<line x1="20" y1="10" x2="20" y2="240" stroke="#666" stroke-width="1" />

				<!-- X-axis line -->
				<line x1="20" y1="240" x2="250" y2="240" stroke="#666" stroke-width="1" />

				<!-- Bars -->
				{#each weekdayCounts as count, day}
					{@const barHeight = count > 0 ? Math.max(4, (count / maxCount) * 140) : 0}
					{@const barX = 35 + day * 30}
					{@const barY = 240 - barHeight}
					{@const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0}
					{@const fillColor = isWeekend(day) ? weekendColor : weekdayColor}

					<!-- Day of week label below x-axis -->
					<text
						x={barX + 9}
						y="260"
						text-anchor="middle"
						font-size="12"
						fill="#9ca3af"
						font-family="system-ui">{shortDayNames[day]}</text
					>

					<!-- Bar -->
					{#if count > 0}
						<rect x={barX} y={barY} width="18" height={barHeight} fill={fillColor} rx="3" />

						<!-- Count and percentage label above bar -->

						<text
							x={barX + 9}
							y={barY - 8}
							text-anchor="middle"
							font-size="11"
							fill="#93c5fd"
							font-family="system-ui"
						>
							{percentage}%</text
						>
						<text
							x={barX + 9}
							y={barY - 20}
							text-anchor="middle"
							font-size="11"
							fill="#93c5fd"
							font-family="system-ui"
						>
							{count}</text
						>
					{:else}
						<!-- Count label when no posts -->
						<text x={barX + 9} y="230" text-anchor="middle" font-size="11" fill="#6b7280">0</text>
					{/if}
				{/each}
			</svg>
		</div>
	{:else}
		<p class="no-data">No posting day data available</p>
	{/if}
</div>

<style>
	@reference "../../../app.css";

	.card {
		@apply bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700;
	}

	.svg-chart-container {
		@apply mx-auto overflow-x-auto;
	}

	.weekday-chart {
		@apply mx-auto block;
		width: 100%;
		height: auto;
	}

	.no-data {
		@apply text-gray-400 text-center py-8;
	}
</style>
