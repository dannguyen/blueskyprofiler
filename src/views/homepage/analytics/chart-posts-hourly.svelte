<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend
	} from 'chart.js';
	import type { BlueskyFeedItem } from '$lib/bskyfoo';

	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

	export let posts: BlueskyFeedItem[] = [];

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;

	onMount(() => {
		const hourlyData = calculateHourlyCounts(posts);

		chartInstance = new Chart(chartCanvas, {
			type: 'bar',
			data: {
				labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
				datasets: [
					{
						label: 'Weekdays',
						data: hourlyData.weekdayCounts,
						backgroundColor: '#3b82f6'
					},
					{
						label: 'Weekends',
						data: hourlyData.weekendCounts,
						backgroundColor: '#8b5cf6'
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						display: true
					}
				},
				scales: {
					x: {
						stacked: true,
						title: {
							display: true,
							text: 'Hour of the Day'
						}
					},
					y: {
						stacked: true,
						title: {
							display: true,
							text: 'Number of Posts'
						},
						beginAtZero: true
					}
				}
			}
		});

		return () => {
			chartInstance.destroy();
		};
	});

	$: {
		if (chartInstance) {
			chartInstance.destroy();
		}

		const hourlyData = calculateHourlyCounts(posts);

		chartInstance = new Chart(chartCanvas, {
			type: 'bar',
			data: {
				labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
				datasets: [
					{
						label: 'Weekdays',
						data: hourlyData.weekdayCounts,
						backgroundColor: '#3b82f6'
					},
					{
						label: 'Weekends',
						data: hourlyData.weekendCounts,
						backgroundColor: '#8b5cf6'
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						display: true
					}
				},
				scales: {
					x: {
						stacked: true,
						title: {
							display: true,
							text: 'Hour of the Day'
						}
					},
					y: {
						stacked: true,
						title: {
							display: true,
							text: 'Number of Posts'
						},
						beginAtZero: true
					}
				}
			}
		});
	}

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
		}
	});

	interface HourlyData {
		hourCounts: number[]; // Total counts for each hour
		weekdayCounts: number[]; // Weekday counts for each hour
		weekendCounts: number[]; // Weekend counts for each hour
	}

	function calculateHourlyCounts(posts: BlueskyFeedItem[]): HourlyData {
		const totalCounts = Array(24).fill(0);
		const weekdayCounts = Array(24).fill(0);
		const weekendCounts = Array(24).fill(0);

		posts.forEach((post) => {
			const date = new Date(post.post.indexedAt);
			const hour = date.getHours();
			const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

			totalCounts[hour]++;

			if (dayOfWeek === 0 || dayOfWeek === 6) {
				weekendCounts[hour]++;
			} else {
				weekdayCounts[hour]++;
			}
		});

		return {
			hourCounts: totalCounts,
			weekdayCounts,
			weekendCounts
		};
	}
</script>

<div class="canvas-container" style="position: relative; height: 350px;">
	<canvas bind:this={chartCanvas}></canvas>
</div>

<style>
	@reference "../../../app.css";

	canvas {
		width: 100%;
	}
</style>
