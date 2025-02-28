<script lang="ts">
	import { type BlueskyProfile } from '$lib/bskyfoo';
	import { formatDate, currentAgeInDays, currentAgePrettified } from '$lib/utils';
	export let profile: BlueskyProfile | null = null;

	let accountAge: number | null = profile?.createdAt ? currentAgeInDays(profile.createdAt) : null;
</script>

<section class="profile-card section">
	<div class="profile-header">
		{#if profile.avatar}
			<img
				src={profile.avatar}
				alt={profile.displayName || profile.handle}
				class="profile-avatar"
			/>
		{/if}
		<div class="profile-info">
			<h2 class="profile-name">{profile.displayName || profile.handle}</h2>
			<p class="profile-handle">
				<a href="https://bsky.app/profile/{profile.handle}">@{profile.handle}</a>
			</p>
		</div>
	</div>

	{#if profile.description}
		<p class="profile-bio">{profile.description}</p>
	{/if}

	<div class="profile-stats">
		<div class="stat">
			<span class="stat-value">{currentAgePrettified(accountAge)}</span>
			<span class="stat-label">Account Age</span>
		</div>

		{#if profile.followersCount !== undefined}
			<div class="stat">
				<span class="stat-value">{profile.followersCount.toLocaleString()}</span>
				<span class="stat-label">Followers</span>
			</div>
		{/if}

		{#if profile.followsCount !== undefined}
			<div class="stat">
				<span class="stat-value">{profile.followsCount.toLocaleString()}</span>
				<span class="stat-label">Following</span>
			</div>
		{/if}

		{#if profile.postsCount !== undefined}
			<div class="stat">
				<span class="stat-value">{profile.postsCount.toLocaleString()}</span>
				<span class="stat-label">Posts</span>
			</div>
		{/if}

		{#if profile.postsCount !== undefined}
			<div class="stat">
				<span class="stat-value"
					>{Math.round(profile.postsCount / accountAge, 1).toLocaleString()}</span
				>
				<span class="stat-label">Posts/Day</span>
			</div>
		{/if}
	</div>

	<div class="profile-meta">
		<p class="profile-did">DID: {profile.did}</p>
		{#if profile.createdAt}
			<p class="profile-indexed">Created at: {formatDate(profile.createdAt)}</p>
		{/if}
	</div>
</section>

<style>
	@reference "../../app.css";
	.profile-card {
		@apply mt-6 bg-gray-700/50 rounded-lg p-4 border border-gray-600 flex flex-col gap-4;
	}

	.profile-header {
		@apply flex items-center gap-4;
	}

	.profile-avatar {
		@apply w-16 h-16 rounded-full object-cover border-2 border-blue-400;
	}

	.profile-info {
		@apply flex-1;
	}

	.profile-name {
		@apply text-xl font-bold text-white;
	}

	.profile-handle {
		@apply text-gray-300 text-sm;
	}

	.profile-bio {
		@apply text-gray-200 text-sm whitespace-pre-line;
	}

	.profile-stats {
		@apply grid grid-cols-3 md:grid-cols-5 gap-1 mt-2;
	}

	.stat {
		/* @apply flex flex-col items-center p-2 bg-gray-800/70 rounded-md min-w-20; */
		@apply flex flex-col items-center p-2 bg-gray-800/70 rounded-md flex-1 mx-2;
	}

	.stat-value {
		@apply font-bold text-white;
	}

	.stat-label {
		@apply text-xs text-gray-400;
	}

	.profile-meta {
		@apply text-xs text-gray-400 border-t border-gray-600 pt-3 mt-2;
	}

	.profile-did,
	.profile-indexed {
		@apply mb-1;
	}
</style>
