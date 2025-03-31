<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import {
		getProfile,
		getBatchUserPosts,
		type BlueskyProfile,
		type BlueskyFeedItem
	} from '$lib/bskyfoo';
	import { SITE_TITLE } from '$lib';
	import ProfileCard from '../../../views/homepage/profile-card.svelte';
	import AnalyticsCard from '../../../views/homepage/analytics-card.svelte';
	import PostsSpotlight from '../../../views/homepage/posts-spotlight.svelte';
	import PostsList from '../../../views/homepage/posts-list.svelte';
	import HourlyPostsChart from '../../../views/homepage/hourly-posts-chart.svelte';

	export let data;

	let handle = data.handle;
	let searchMessage = '';
	let profile: BlueskyProfile | null = null;
	let posts: BlueskyFeedItem[] = [];
	let isLoading = true;
	let error: string | null = null;
	let batchIterations: number = 2;

	// Progress tracking
	let fetchProgress = { current: 0, total: batchIterations, posts: 0 };

	async function fetchData() {
		if (!handle) return;

		isLoading = true;
		searchMessage = `Searching for ${handle}...`;
		error = null;
		profile = null;
		posts = [];

		try {
			// Step 1: Fetch the user profile
			profile = await getProfile(handle);

			if (profile) {
				// Step 2: Fetch the user's posts in batches
				searchMessage = `Fetching posts for ${handle}... (Batch 0 of ${batchIterations})`;

				// Reset progress tracking
				fetchProgress = { current: 0, total: batchIterations, posts: 0 };

				// Progress callback to update the loading message
				const updateProgress = (current: number, total: number, postsCount: number) => {
					fetchProgress = { current, total, posts: postsCount };
					searchMessage = `Fetching posts for ${handle}... (Batch ${current} of ${total}, ${postsCount} posts so far)`;
				};

				const postsResponse = await getBatchUserPosts(handle, batchIterations, updateProgress);
				posts = postsResponse.feed;
			}

			searchMessage = '';
		} catch (err) {
			// Extract status code from error message if possible
			const statusMatch = err instanceof Error && err.message.match(/status (\d+)/);
			const status = statusMatch ? parseInt(statusMatch[1]) : null;

			if (status === 400) {
				error = `The handle "${handle}" could not be found on Bluesky`;
			} else {
				error = err instanceof Error ? err.message : 'An error occurred fetching data';
			}
			searchMessage = '';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		fetchData();
	});
</script>

<div class="container">
	<div class="content">
		<button on:click={() => goto(resolveRoute('/'))} class="back-link">← Back to search</button>
		<h1 class="title"><a href={resolveRoute('/')}>{SITE_TITLE}</a></h1>

		{#if searchMessage}
			<p class="search-message">{searchMessage}</p>

			{#if fetchProgress.current > 0}
				<div class="progress-container">
					<div class="progress-bar" style="width: {(fetchProgress.current / fetchProgress.total) * 100}%"></div>
				</div>
			{/if}
		{/if}

		{#if error}
			<div class="error-message">
				<p>Error: {error}</p>
			</div>
		{/if}

		{#if profile}
			<ProfileCard {profile} />
			<AnalyticsCard {posts} {profile} />

			<!-- Posts per hour bar chart -->
			{#if posts.length > 0}
				<HourlyPostsChart {posts} />
			{/if}

			<PostsSpotlight {posts} {profile} />
			<PostsList {posts} {profile} />
		{/if}
	</div>
</div>

<style>
	@reference "../../../app.css";
	:global(html) {
		@apply bg-gray-900 text-gray-100;
	}

	.container {
		@apply max-w-5xl mx-auto p-6;
	}

	.title {
		@apply text-4xl font-bold text-blue-400 mb-4;
	}

	.content {
		@apply bg-gray-800 rounded-lg p-6 shadow-lg;
	}

	.back-link {
		@apply text-blue-400 hover:text-blue-300 block mb-4 transition-colors bg-transparent border-none p-0 cursor-pointer text-left;
	}

	.search-message {
		@apply mt-4 text-lg text-yellow-300 font-medium;
	}

	.error-message {
		@apply mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200;
	}

	.progress-container {
		@apply w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden;
	}

	.progress-bar {
		@apply h-full bg-blue-500 transition-all duration-300 ease-out;
	}
</style>
