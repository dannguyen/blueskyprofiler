<script>
	import { page } from '$app/stores';
</script>

<style lang="postcss">
	.error-container {
		@apply flex flex-col items-center justify-center min-h-[80vh] p-6;
	}
	
	.error-code {
		@apply text-9xl font-bold text-red-500 mb-2;
	}
	
	.error-title {
		@apply text-3xl font-semibold text-gray-200 mb-6;
	}
	
	.error-message {
		@apply text-xl text-gray-300 mb-8 text-center max-w-md;
	}
	
	.home-button {
		@apply px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium;
	}
</style>

<div class="error-container">
	<h1 class="error-code">{$page.status}</h1>
	<h2 class="error-title">
		{$page.status === 404 ? 'Page not found' : $page.error?.message || 'Something went wrong'}
	</h2>
	<p class="error-message">
		{#if $page.status === 404}
			The page you're looking for doesn't exist or has been moved.
		{:else}
			We encountered an unexpected error. Please try again later.
		{/if}
	</p>
	<a href="/" class="home-button">Back to Home</a>
</div>