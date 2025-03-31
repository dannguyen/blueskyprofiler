<script lang="ts">
	import type { BlueskyFeedItem } from '$lib/bskyfoo';

	export let posts: BlueskyFeedItem[] = [];

	// Calculate weekday and weekend counts per hour
	$: hourlyData = calculateHourlyCounts(posts);
	$: hourCounts = hourlyData.hourCounts;
	$: weekdayCounts = hourlyData.weekdayCounts;
	$: weekendCounts = hourlyData.weekendCounts;
	$: maxCount = hourlyData.maxCount;

	// Colors for the bars
	const weekdayColor = '#3b82f6'; // Blue
	const weekendColor = '#8b5cf6'; // Purple

	interface HourlyData {
		hourCounts: number[]; // Total counts for each hour
		weekdayCounts: number[]; // Weekday counts for each hour
		weekendCounts: number[]; // Weekend counts for each hour
		maxCount: number; // Maximum count across all hours
	}

	function calculateHourlyCounts(posts: BlueskyFeedItem[]): HourlyData {
		const totalCounts = Array(24).fill(0);
		const weekdayCounts = Array(24).fill(0);
		const weekendCounts = Array(24).fill(0);

		posts.forEach((post) => {
			const date = new Date(post.post.indexedAt);
			const actualHour = date.getHours();
			const hour = actualHour - (actualHour % 2);
			const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

			totalCounts[hour]++;

			// Increment either weekday or weekend counter
			if (dayOfWeek === 0 || dayOfWeek === 6) {
				// Weekend (Saturday or Sunday)
				weekendCounts[hour]++;
			} else {
				// Weekday (Monday-Friday)
				weekdayCounts[hour]++;
			}
		});

		// Find the maximum count for scaling
		const maxCount = Math.max(...totalCounts);

		return {
			hourCounts: totalCounts,
			weekdayCounts,
			weekendCounts,
			maxCount
		};
	}
</script>

<div class="card">
	<!-- Check if we have data with more than 0 posts per any hour -->
	{#if maxCount > 0}
		<div class="svg-chart-container">
			<svg class="hour-chart" viewBox="0 0 900 500" preserveAspectRatio="xMidYMid meet">
				<!-- Y-axis line -->
				<line x1="40" y1="10" x2="40" y2="450" stroke="#666" stroke-width="1" />

				<!-- X-axis line -->
				<line x1="40" y1="450" x2="870" y2="450" stroke="#666" stroke-width="1" />

				<!-- Bars (stacked: weekday at bottom, weekend on top) -->
				{#each hourCounts as totalCount, hour}
					{#if hour % 2 == 0}
						<!-- we are doing 2 hour intervals -->
						{@const barWidth = 40}
						{@const maxBarHeight = 450}
						{@const maxBarHeightBuffered = maxBarHeight - 50}
						{@const weekdayCount = weekdayCounts[hour]}
						{@const weekendCount = weekendCounts[hour]}

						{@const weekdayHeight =
							weekdayCount > 0 ? Math.max(4, (weekdayCount / maxCount) * maxBarHeightBuffered) : 0}
						{@const weekendHeight =
							weekendCount > 0 ? Math.max(4, (weekendCount / maxCount) * maxBarHeightBuffered) : 0}

						{@const barX = 50 + hour * 34}
						{@const weekdayBarY = maxBarHeight - weekdayHeight}
						{@const weekendBarY = weekdayBarY - weekendHeight}

						{@const startHourLabel =
							hour === 0 ? '12' : hour < 12 ? `${hour}` : hour === 12 ? '12' : `${hour - 12}`}

						{@const endHour = hour + 1}
						{@const endHourLabel =
							endHour === 0
								? '12am'
								: endHour < 12
									? `${endHour}am`
									: endHour === 12
										? '12pm'
										: `${endHour - 12}pm`}
						{@const timeLabel = `${startHourLabel}-${endHourLabel}`}

						<!-- Weekday bar (bottom part) -->
						{#if weekdayCount > 0}
							<rect
								x={barX}
								y={weekdayBarY}
								width={barWidth}
								height={weekdayHeight}
								fill={weekdayColor}
								rx="2"
							/>
						{/if}

						<!-- Weekend bar (top part) -->
						{#if weekendCount > 0}
							<rect
								x={barX}
								y={weekendBarY}
								width={barWidth}
								height={weekendHeight}
								fill={weekendColor}
								rx="2"
							/>
						{/if}

						<!-- Count label (only if > 0) -->
						{#if totalCount > 0}
							<text
								x={barX + barWidth / 2}
								y={Math.min(weekdayBarY, weekendBarY) - 5}
								text-anchor="middle"
								font-size="20"
								fill="#93c5fd">{totalCount}</text
							>
						{/if}

						<!-- Hour label -->
						<text
							x={barX + barWidth / 2}
							y={maxBarHeight + 20}
							text-anchor="middle"
							font-size="16"
							fill="#9ca3af"
							font-family="monospace">{timeLabel}</text
						>
					{/if}
				{/each}

				<!-- Legend -->
				<!-- <rect x="700" y="210" width="14" height="14" fill={weekdayColor} rx="2" />
				<text x="720" y="222" font-size="12" fill="#9ca3af">Weekdays</text>
				<rect x="790" y="210" width="14" height="14" fill={weekendColor} rx="2" />
				<text x="810" y="222" font-size="12" fill="#9ca3af">Weekends</text>
	 -->
			</svg>
		</div>
	{:else}
		<p class="no-data">No posting time data available</p>
	{/if}
</div>

<style>
	@reference "../../app.css";

	.card {
		@apply bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700;
	}

	.svg-chart-container {
		@apply mx-auto overflow-x-auto;
	}

	.hour-chart {
		@apply mx-auto block;
		width: 100%;
		height: auto;
	}

	.no-data {
		@apply text-gray-400 text-center py-8;
	}
</style>
