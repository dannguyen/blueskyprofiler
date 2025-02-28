<script lang="ts">
	import {
		getProfile,
		getUserPosts,
		type BlueskyProfile,
		type BlueskyFeedItem
	} from '$lib/bskyfoo';
	import { SITE_TITLE } from '$lib';
	import ProfileCard from '../views/homepage/profile-card.svelte';
	import AnalyticsCard from '../views/homepage/analytics-card.svelte';
	import PostsSpotlight from '../views/homepage/posts-spotlight.svelte';

	import PostsList from '../views/homepage/posts-list.svelte';
	let handle = '';
	let searchMessage = '';
	let profile: BlueskyProfile | null = null;
	let posts: BlueskyFeedItem[] = [];
	let isLoading = false;
	let error: string | null = null;

	import { formatDate } from '$lib/utils';

	// Process handle input to handle common formats
	function processHandleInput(rawHandle: string): string {
		if (!rawHandle) return '';

		// Trim whitespace
		let cleanHandle = rawHandle.trim();

		// Remove @ prefix if present
		if (cleanHandle.startsWith('@')) {
			cleanHandle = cleanHandle.substring(1);
		}

		// Add default domain if no dot is present
		if (!cleanHandle.includes('.')) {
			cleanHandle = `${cleanHandle}.bsky.social`;
		}

		return cleanHandle;
	}

	async function handleSearch() {
		if (!handle) return;

		// Process handle to handle common input patterns
		const processedHandle = processHandleInput(handle);

		isLoading = true;
		searchMessage = `Searching for ${processedHandle}...`;
		error = null;
		profile = null;
		posts = [];

		try {
			// Step 1: Fetch the user profile
			profile = await getProfile(processedHandle);

			if (profile) {
				// Step 2: Fetch the user's posts (100 instead of 25)
				searchMessage = `Fetching posts for ${processedHandle}...`;
				const postsResponse = await getUserPosts(processedHandle, 100);
				posts = postsResponse.feed;
			}

			searchMessage = '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred fetching data';
			searchMessage = '';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container">
	<div class="content">
		<h1 class="title">{SITE_TITLE}</h1>
		<div class="footnote">
			Github repo at <a class="link" href="http://github.com/dannguyen/blueskyprofiler/"
				>dannguyen/blueskyprofiler
			</a>
		</div>

		<div class="paragraph">Enter a Bluesky handle to view and analyze profile</div>

		<form class="search-form" on:submit|preventDefault={handleSearch}>
			<div class="input-group">
				<input
					type="text"
					bind:value={handle}
					placeholder="Enter handle (e.g., dril.bsky.social)"
					class="input-field"
					disabled={isLoading}
				/>
				<button type="submit" class="search-button" disabled={isLoading}>
					{isLoading ? 'Searching...' : 'Search'}
				</button>
			</div>
		</form>

		{#if searchMessage}
			<p class="search-message">{searchMessage}</p>
		{/if}

		{#if error}
			<div class="error-message">
				<p>Error: {error}</p>
			</div>
		{/if}

		{#if profile}
			<ProfileCard {profile} />
			<AnalyticsCard {posts} {profile} />
			<PostsSpotlight {posts} {profile} />
			<PostsList {posts} {profile} />
		{/if}
	</div>
</div>

<style>
	@reference "../app.css";
	:global(html) {
		@apply bg-gray-900 text-gray-100;
	}

	.container {
		@apply max-w-5xl mx-auto p-6;
	}

	.title {
		@apply text-4xl font-bold text-blue-400 mb-1;
	}

	.content {
		@apply bg-gray-800 rounded-lg p-6 shadow-lg;
	}

	.paragraph {
		@apply text-lg mb-1;
	}

	.footnote {
		@apply text-sm mt-0 mb-6;
	}
	.link {
		@apply text-blue-400 hover:text-blue-300 underline transition-colors;
	}

	.search-form {
		@apply mt-4 mb-4;
	}

	.input-group {
		@apply flex gap-2;
	}

	.input-field {
		@apply flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500;
	}

	.search-button {
		@apply px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium;
	}

	.search-message {
		@apply mt-4 text-lg text-yellow-300 font-medium;
	}

	.error-message {
		@apply mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200;
	}
</style>
