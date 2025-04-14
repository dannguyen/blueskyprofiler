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

	let chartCanvas: HTMLCanvasElement;
	let chartInstance: Chart;
	let { posts } = $props();
	let weekdayData = $derived.by(() => {
		return calculateWeekdayCounts(posts);
	});
	let chartOptions = $derived.by(() => {
		return {
			type: 'bar',
			data: {
				labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
				datasets: [
					{
						label: 'Posts',
						data: weekdayData.dayCounts,
						backgroundColor: [
							'#3b82f6',
							'#3b82f6',
							'#3b82f6',
							'#3b82f6',
							'#3b82f6',
							'#8b5cf6',
							'#8b5cf6'
						]
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						display: false
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Day of the Week'
						}
					},
					y: {
						title: {
							display: true,
							text: 'Number of Posts'
						},
						beginAtZero: true
					}
				}
			}
		};
	});

	$effect(() => {
		chartInstance = new Chart(chartCanvas, chartOptions);

		return () => {
			chartInstance.destroy();
		};
	});

	interface WeekdayData {
		dayCounts: number[]; // Counts for each day of the week (0-6)
	}

	function calculateWeekdayCounts(posts: BlueskyFeedItem[]): WeekdayData {
		const dayCounts = Array(7).fill(0);

		posts.forEach((post) => {
			const date = new Date(post.post.indexedAt);
			const normaldayOfWeek = date.getDay(); // 0-6, where 0 is Sunday
			const dayOfWeek = (normaldayOfWeek + 6) % 7; // now 0 is Monday, 6 is Sunday
			dayCounts[dayOfWeek]++;
		});

		return {
			dayCounts
		};
	}
</script>

<div class="canvas-container" style="position: relative; height:350px;">
	<canvas bind:this={chartCanvas}></canvas>
</div>

<style>
	@reference "../../../app.css";

	canvas {
		width: 100%;
	}
</style>
