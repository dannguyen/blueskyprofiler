<script lang="ts">
	import { SITE_TITLE } from '$lib';
	import { cleanHandleInput } from '$lib/utils';
	let handle = '';
	let isLoading = false;

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	function handleSearch() {
		if (!handle) return;

		// Process handle to handle common input patterns
		const processedHandle = cleanHandleInput(handle);

		// Navigate to the search page with the processed handle
		goto(resolve(`/profile/${processedHandle}`));
	}
</script>

<div class="container">
	<div class="content">
		<h1 class="title">
			<a href={resolve('/')}>{SITE_TITLE}</a>
		</h1>
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
				<button type="submit" class="search-button" disabled={isLoading}> Get Profile </button>
			</div>
		</form>

		<div class="examples">
			<p class="example-title">Examples:</p>
			<ul class="example-list">
				<li>
					<a href={resolve('/profile/bsky.app')} class="example-link"
						>bsky.app</a
					>
				</li>
				<li>
					<a href={resolve('/profile/jamesgunn.bsky.social')} class="example-link"
						>jamesgunn.bsky.social</a
					>
				</li>
				<li>
					<a href={resolve('/profile/theonion.com')} class="example-link">theonion.com</a>
				</li>
				<li>
					<a href={resolve('/profile/jay.bsky.team')} class="example-link">jay.bsky.team</a>
				</li>
			</ul>
		</div>
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


	.examples {
		@apply mt-8 p-4 bg-gray-700/30 border border-gray-700 rounded-lg;
	}

	.example-title {
		@apply mb-2 font-medium text-gray-300;
	}

	.example-list {
		@apply ml-4 list-disc;
	}

	.example-list li {
		@apply mb-1;
	}

	.example-link {
		@apply text-blue-400 hover:text-blue-300 transition-colors;
	}
</style>
