<script lang="ts">
	import {
		getProfile,
		getUserPosts,
		type BlueskyProfile,
		type BlueskyFeedItem,
		type BlueskyPost
	} from '$lib/apifoo';

	let handle = '';
	let searchMessage = '';
	let profile: BlueskyProfile | null = null;
	let posts: BlueskyFeedItem[] = [];
	let isLoading = false;
	let error: string | null = null;

	// Get word count from post text
	function getWordCount(text: string): number {
		return text.trim().split(/\s+/).length;
	}

	// Format date to truncated time format
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');

		return `${year}-${month}-${day} ${hours}:${minutes}`;
	}

	// Determine post type based on its structure and content
	function getPostType(post: BlueskyPost, profileHandle?: string): string {
		// Check if it's a repost (author handle is different from profile handle)
		if (profileHandle && post.author.handle !== profileHandle) {
			return "repost";
		}
		// Check if it's a reply
		else if (post.record.reply) {
			return "reply";
		}
		// Check if it has images
		else if (post.embed?.$type?.includes("app.bsky.embed.images")) {
			return "images";
		}
		// Check if it has video
		else if (post.embed?.$type?.includes("app.bsky.embed.record")) {
			return "quote";
		}
		// Check if it's a quote post
		else if (post.embed?.$type?.includes("app.bsky.embed.video")) {
			return "video";
		}
		// Default type is a text post
		else {
			return "post";
		}
	}

	// Generate a direct URL to the post on Bluesky's web interface
	function postURL(post: BlueskyPost): string {
		// Extract the final element from the URI (the post ID)
		const uriParts = post.uri.split('/');
		const postId = uriParts[uriParts.length - 1];

		// Construct the URL using the author's handle and post ID
		return `https://bsky.app/profile/${post.author.handle}/post/${postId}`;
	}

	// Calculate post analytics
	function calculatePostAnalytics(posts: BlueskyFeedItem[]) {
		// Default values
		if (!posts.length) return null;

		// Filter out reposts for posting activity summary since they don't have repost timestamps
		const originalPosts = posts.filter(item => getPostType(item.post, profile?.handle) !== 'repost');

		// Handle edge case where there are no original posts (only reposts)
		if (originalPosts.length === 0) {
			return {
				totalPosts: posts.length,
				originalPostCount: 0,
				postsPerDay: 0,
				postTypes: { reply: 0, images: 0, video: 0, quote: 0, post: 0, repost: posts.length },
				engagement: { replies: { total: 0, average: 0 }, likes: { total: 0, average: 0 }, reposts: { total: 0, average: 0 }, quotes: { total: 0, average: 0 } },
				dateRange: { earliest: new Date(), latest: new Date(), days: 0 },
				media: { totalImages: 0, imagesWithAlt: 0, altTextPercentage: 0 }
			};
		}

		// Get earliest and latest post dates from original content only
		const postDates = originalPosts.map(item => new Date(item.post.record.createdAt).getTime());
		const earliestDate = new Date(Math.min(...postDates));
		const latestDate = new Date(Math.max(...postDates));

		// Calculate date range in days
		const dateRangeMs = latestDate.getTime() - earliestDate.getTime();
		const dateRangeDays = Math.max(1, dateRangeMs / (1000 * 60 * 60 * 24));

		// Count post types
		const postTypes = {
			reply: 0,
			images: 0,
			video: 0,
			quote: 0,
			post: 0,
			repost: 0
		};

		// Count engagement
		let totalReplies = 0;
		let totalLikes = 0;
		let totalReposts = 0;
		let totalQuotes = 0;

		// Media metrics
		let totalImages = 0;
		let imagesWithAlt = 0;

		// Analyze each post
		posts.forEach(item => {
			// Increment post type counter
			const type = getPostType(item.post, profile?.handle);
			postTypes[type as keyof typeof postTypes]++;

			// Add engagement metrics (exclude reposts as they don't represent engagement for the user)
			if (type !== 'repost') {
				totalReplies += item.post.replyCount || 0;
				totalLikes += item.post.likeCount || 0;
				totalReposts += item.post.repostCount || 0;
				totalQuotes += item.post.quoteCount || 0;
			}

			// Count images and check for alt text
			if (type !== 'repost' && item.post.embed?.images) {
				const imageArray = item.post.embed.images;
				totalImages += imageArray.length;

				// Check for meaningful alt text (>5 chars)
				imageArray.forEach(img => {
					if (img.alt && img.alt.trim().length > 5) {
						imagesWithAlt++;
					}
				});
			}
		});

		// Calculate alt text percentage
		const altTextPercentage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;

		return {
			totalPosts: posts.length,
			originalPostCount: originalPosts.length,
			postsPerDay: +(originalPosts.length / dateRangeDays).toFixed(1),
			postTypes,
			engagement: {
				replies: {
					total: totalReplies,
					average: +(totalReplies / originalPosts.length).toFixed(1)
				},
				likes: {
					total: totalLikes,
					average: +(totalLikes / originalPosts.length).toFixed(1)
				},
				reposts: {
					total: totalReposts,
					average: +(totalReposts / originalPosts.length).toFixed(1)
				},
				quotes: {
					total: totalQuotes,
					average: +(totalQuotes / originalPosts.length).toFixed(1)
				}
			},
			dateRange: {
				earliest: earliestDate,
				latest: latestDate,
				days: Math.round(dateRangeDays)
			},
			media: {
				totalImages,
				imagesWithAlt,
				altTextPercentage
			}
		};
	}

	// Process handle input to handle common formats
	function processHandle(rawHandle: string): string {
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
		const processedHandle = processHandle(handle);

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

<style lang="postcss">
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

	.paragraph {
		@apply text-lg mb-4;
	}

	.link {
		@apply text-blue-400 hover:text-blue-300 underline transition-colors;
	}

	.search-form {
		@apply mt-8 mb-4;
	}

	.input-group {
		@apply flex gap-2;
	}

	.input-field {
		@apply flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
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
		@apply flex justify-between mt-2;
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

	.profile-did, .profile-indexed {
		@apply mb-1;
	}

	.posts-section {
		@apply mt-8;
	}

	.posts-title {
		@apply text-2xl font-bold text-blue-400 mb-4;
	}

	.analytics-card {
		@apply bg-gray-700/50 rounded-lg p-4 border border-gray-600 mb-6;
	}

	.analytics-title {
		@apply text-lg font-medium text-blue-300 mb-3;
	}

	.analytics-grid {
		@apply grid grid-cols-1 md:grid-cols-2 gap-4;
	}

	.analytics-section {
		@apply bg-gray-800/50 rounded p-3;
	}

	.analytics-section-title {
		@apply text-sm text-gray-300 font-medium mb-2 border-b border-gray-700 pb-1;
	}

	.analytics-stat {
		@apply flex justify-between py-1 text-sm;
	}

	.analytics-label {
		@apply text-gray-400;
	}

	.analytics-value {
		@apply text-white font-medium;
	}

	.table-container {
		@apply overflow-x-auto rounded-lg border border-gray-700;
	}

	.posts-table {
		@apply w-full border-collapse;
	}

	.posts-table th {
		@apply bg-gray-800 text-left p-3 text-gray-300 font-medium text-sm border-b border-gray-700;
	}

	.posts-table td {
		@apply p-3 border-b border-gray-700 text-sm;
	}
/*
	.posts-table tr:hover {
		@apply bg-gray-800/40;
	} */

	.post-text {
		@apply max-w-md;
	}

	.text-content {
		@apply line-clamp-2;
	}

	.image-indicator {
		@apply mt-1 text-xs text-blue-400 font-medium;
	}

	.post-link {
		@apply text-blue-400 hover:text-blue-300 hover:underline transition-colors;
	}

	.post-item.repost td.post-metric{
		@apply text-gray-400;
	}
</style>

<div class="container">
	<div class="content">
		<h1 class="title">Bluesky Profile Explorer</h1>

		<p class="paragraph">
			Enter a Bluesky handle to view profile information
		</p>

		<form class="search-form" on:submit|preventDefault={handleSearch}>
			<div class="input-group">
				<input
					type="text"
					bind:value={handle}
					placeholder="Enter handle (e.g., dril.bsky.social)"
					class="input-field"
					disabled={isLoading}
				>
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
			<div class="profile-card">
				<div class="profile-header">
					{#if profile.avatar}
						<img src={profile.avatar} alt={profile.displayName || profile.handle} class="profile-avatar" />
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
				</div>

				<div class="profile-meta">
					<p class="profile-did">DID: {profile.did}</p>
					{#if profile.createdAt}
						<p class="profile-indexed">Created at: {formatDate(profile.createdAt)}</p>
					{/if}
				</div>
			</div>

			{#if posts.length > 0}
				{@const analytics = calculatePostAnalytics(posts)}
				{#if analytics}
					<div class="analytics-card">
						<h3 class="analytics-title">
							Based on the most recent {analytics.totalPosts} posts ({analytics.originalPostCount} original, {analytics.totalPosts - analytics.originalPostCount} reposts) from {profile.displayName || profile.handle}:
						</h3>

						<div class="analytics-grid">
							<div class="analytics-section">
								<h4 class="analytics-section-title">Posting Activity</h4>
								<div class="analytics-stat">
									<span class="analytics-label">Posts per day:</span>
									<span class="analytics-value">{analytics.postsPerDay}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Date range:</span>
									<span class="analytics-value">{analytics.dateRange.days} days</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">First post in sample:</span>
									<span class="analytics-value">{formatDate(analytics.dateRange.earliest.toISOString())}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Latest post in sample:</span>
									<span class="analytics-value">{formatDate(analytics.dateRange.latest.toISOString())}</span>
								</div>
							</div>

							<div class="analytics-section">
								<h4 class="analytics-section-title">Post Types</h4>
								<div class="analytics-stat">
									<span class="analytics-label">Text only:</span>
									<span class="analytics-value">{analytics.postTypes.post} ({Math.round(analytics.postTypes.post / analytics.totalPosts * 100)}%)</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">With images:</span>
									<span class="analytics-value">{analytics.postTypes.images} ({Math.round(analytics.postTypes.images / analytics.totalPosts * 100)}%)</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Videos:</span>
									<span class="analytics-value">{analytics.postTypes.video} ({Math.round(analytics.postTypes.video / analytics.totalPosts * 100)}%)</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Quotes:</span>
									<span class="analytics-value">{analytics.postTypes.quote} ({Math.round(analytics.postTypes.quote / analytics.totalPosts * 100)}%)</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Replies:</span>
									<span class="analytics-value">{analytics.postTypes.reply} ({Math.round(analytics.postTypes.reply / analytics.totalPosts * 100)}%)</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Reposts:</span>
									<span class="analytics-value">{analytics.postTypes.repost} ({Math.round(analytics.postTypes.repost / analytics.totalPosts * 100)}%)</span>
								</div>
							</div>

							<div class="analytics-section">
								<h4 class="analytics-section-title">Engagement (Total)</h4>
								<div class="analytics-stat">
									<span class="analytics-label">Likes:</span>
									<span class="analytics-value">{analytics.engagement.likes.total.toLocaleString()}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Reposts:</span>
									<span class="analytics-value">{analytics.engagement.reposts.total.toLocaleString()}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Replies:</span>
									<span class="analytics-value">{analytics.engagement.replies.total.toLocaleString()}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Quotes:</span>
									<span class="analytics-value">{analytics.engagement.quotes.total.toLocaleString()}</span>
								</div>
							</div>

							<div class="analytics-section">
								<h4 class="analytics-section-title">Engagement (Per Post)</h4>
								<div class="analytics-stat">
									<span class="analytics-label">Likes per post:</span>
									<span class="analytics-value">{analytics.engagement.likes.average}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Reposts per post:</span>
									<span class="analytics-value">{analytics.engagement.reposts.average}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Replies per post:</span>
									<span class="analytics-value">{analytics.engagement.replies.average}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Quotes per post:</span>
									<span class="analytics-value">{analytics.engagement.quotes.average}</span>
								</div>
							</div>
							<div class="analytics-section">
								<h4 class="analytics-section-title">Media</h4>
								<div class="analytics-stat">
									<span class="analytics-label">Total videos:</span>
									<span class="analytics-value">{analytics.postTypes.video}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Total images:</span>
									<span class="analytics-value">{analytics.media.totalImages}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Images with alt text:</span>
									<span class="analytics-value">{analytics.media.imagesWithAlt} of {analytics.media.totalImages}</span>
								</div>
								<div class="analytics-stat">
									<span class="analytics-label">Alt text percentage:</span>
									<span class="analytics-value">{analytics.media.altTextPercentage}%</span>
								</div>
							</div>

						</div>
					</div>
				{/if}

				<div class="posts-section">
					<h2 class="posts-title">Recent Posts</h2>

					<div class="table-container">
						<table class="posts-table">
							<thead>
								<tr>
									<th>Date</th>
									<th>Type</th>
									<th>Content</th>
									<th>Words</th>
									<th>Replies</th>
									<th>Likes</th>
									<th>Reposts</th>
									<th>Quotes</th>
								</tr>
							</thead>
							<tbody>
								{#each posts as item}
									<tr class="post-item {getPostType(item.post, profile?.handle)}">
										<td>
												<a href={postURL(item.post)} target="_blank" class="post-link">
													{formatDate(item.post.record.createdAt)}
												</a>
											</td>
										<td>{getPostType(item.post, profile?.handle)}</td>
										<td class="post-text post-metric">
											<div class="text-content">
												{item.post.record.text}
											</div>
											{#if item.post.embed?.images}
												<div class="image-indicator">
													<span>+{item.post.embed.images.length} image{item.post.embed.images.length > 1 ? 's' : ''}</span>
												</div>
											{/if}
										</td>
										<td class="post-metric">{getWordCount(item.post.record.text)}</td>
										<td class="post-metric">{item.post.replyCount}</td>
										<td class="post-metric">{item.post.likeCount}</td>
										<td class="post-metric">{item.post.repostCount}</td>
										<td class="post-metric">{item.post.quoteCount}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
