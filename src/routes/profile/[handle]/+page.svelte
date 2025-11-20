<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import {
		getProfile,
		getBatchUserPosts,
		getUserPosts,
		API_HOST,
		BlueskyProfile,
		type BlueskyFeedItem
	} from '$lib/bskyfoo';
	import { SITE_TITLE } from '$lib';
	import ProfileCard from '../../../views/homepage/profile-card.svelte';
	import AnalyticsCard from '../../../views/homepage/analytics-card.svelte';
	import PostsSpotlight from '../../../views/homepage/posts-spotlight.svelte';
	import PostsList from '../../../views/homepage/posts-list.svelte';

	export let data;

	let handle = data.handle;
	let searchMessage = '';
	let profile: BlueskyProfile | null = null;
	let posts: BlueskyFeedItem[] = [];
	let isLoading = true;
	let error: string | null = null;
	let batchIterations: number = 3;
	let lastCursor: string | null = null;
	const MAX_POSTS = 10000; // Maximum number of posts to load
	let loadMoreAmount = 100;

	// Progress tracking
	let fetchProgress = { current: 0, total: batchIterations, posts: 0 };

	async function fetchData() {
		if (!handle) return;

		isLoading = true;
		searchMessage = `Searching for ${handle}...`;
		error = null;
		profile = null;
		posts = [];
		lastCursor = null;

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
				lastCursor = postsResponse.cursor || null;
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

	async function loadMorePosts() {
		if (!handle || !lastCursor || isLoading || posts.length >= MAX_POSTS) return;

		isLoading = true;
		searchMessage = `Fetching more posts for ${handle}...`;
		error = null;

		try {
			let postsLoadedInThisRun = 0;
			const postsToLoad = loadMoreAmount;
			let currentPosts = [...posts];

			while (lastCursor && postsLoadedInThisRun < postsToLoad && currentPosts.length < MAX_POSTS) {
				searchMessage = `Fetching more posts... (${currentPosts.length} posts so far)`;

				// Fetch the next batch
				const response = await getUserPosts(handle, lastCursor);

				if (response.feed && response.feed.length > 0) {
					const remainingCapacityGlobal = MAX_POSTS - currentPosts.length;
					const remainingCapacityForThisRun = postsToLoad - postsLoadedInThisRun;

					const postsToAddCount = Math.min(
						response.feed.length,
						remainingCapacityGlobal,
						remainingCapacityForThisRun
					);
					const postsToAdd = response.feed.slice(0, postsToAddCount);

					currentPosts.push(...postsToAdd);
					postsLoadedInThisRun += postsToAdd.length;

					// Update posts reactively
					posts = currentPosts;

					if (response.cursor && currentPosts.length < MAX_POSTS) {
						lastCursor = response.cursor;
					} else {
						lastCursor = null; // No more posts or reached limit
					}
				} else {
					lastCursor = null; // No more posts available
				}

				// Apply delay for the *next* API call, if any, based on the *current* total posts
				if (lastCursor && currentPosts.length < MAX_POSTS) {
					let delayMs = 200; // Base delay for every fetch

					// Add extra delay if we just crossed a 1000-post boundary
					if (currentPosts.length > 0 && currentPosts.length % 1000 === 0) {
						delayMs += 500; // Add extra 500ms delay
					}
					await new Promise((resolve) => setTimeout(resolve, delayMs));
				}
			}

			searchMessage = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred fetching additional posts';
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
		<button on:click={() => goto(resolveRoute('/'))} class="back-link">← Back to homepage</button>
		<h1 class="title"><a href={resolveRoute('/')}>{SITE_TITLE}</a></h1>

		{#if error}
			<div class="error-message">
				<p>Error: {error}</p>
			</div>
		{/if}

		{#if profile}
			<!-- Load more posts interface -->
			{#if searchMessage}
				<p class="search-message">{searchMessage}</p>

				{#if fetchProgress.current > 0}
					<div class="progress-container">
						<div
							class="progress-bar"
							style="width: {(fetchProgress.current / fetchProgress.total) * 100}%"
						></div>
					</div>
				{/if}
			{/if}

			{#if !isLoading && posts.length > 0}
				<div class="load-more-container">
					<div class="load-more-controls">
						<button
							on:click={loadMorePosts}
							class="load-more-btn"
							disabled={isLoading || !lastCursor || posts.length >= MAX_POSTS}
						>
							{#if isLoading}
								Loading...
							{:else if posts.length >= MAX_POSTS}
								Maximum Posts ({MAX_POSTS}) Loaded
							{:else if !lastCursor}
								No More Posts
							{:else}
								Load
							{/if}
						</button>
						<input
							type="number"
							bind:value={loadMoreAmount}
							min="100"
							max={MAX_POSTS - posts.length > 1000 ? 1000 : MAX_POSTS - posts.length}
							step="100"
							class="load-more-input"
							disabled={isLoading || !lastCursor || posts.length >= MAX_POSTS}
						/>
						<span class="input-label">more posts</span>
					</div>
					<p class="posts-loaded-text">
						<span class="stats-count">{posts.length} / {MAX_POSTS}</span> posts loaded
					</p>
				</div>
			{/if}

			<ProfileCard {profile} />

			<AnalyticsCard {posts} {profile} />

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

	/* Load more container */
	.load-more-container {
		@apply bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700;
	}

	.load-more-controls {
		@apply flex items-center gap-2;
	}

	.load-more-input {
		@apply bg-gray-300 border border-gray-600 rounded px-3 py-2 text-blue-400 w-28 text-center disabled:bg-gray-700/50 disabled:cursor-not-allowed;
		-moz-appearance: textfield; /* Firefox */
	}
	.load-more-input::-webkit-outer-spin-button,
	.load-more-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.posts-loaded-text {
		@apply text-sm text-gray-400 mt-2 text-center;
	}

	.input-label {
		@apply text-gray-300;
	}

	.stats-count {
		@apply text-blue-300 font-bold;
	}

	.load-more-btn {
		@apply bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors flex-grow;
	}
</style>
