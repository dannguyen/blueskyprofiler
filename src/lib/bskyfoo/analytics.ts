import { type BlueskyFeedItem, getPostMediaType, extractPostLink } from '$lib/bskyfoo';
import { roughlyHumanizeDuration } from '$lib/utils';

/**
 * Process the posts array and count the frequency of domains from external links
 * @param posts - Array of BlueskyFeedItems to analyze
 * @returns Array of objects with domain and count, sorted by count in descending order
 */
export function getDomainFrequency(
	posts: BlueskyFeedItem[]
): Array<{ domain: string; count: number }> {
	// Create a map to store domain counts
	const domainMap = new Map<string, number>();

	// Process each post
	posts.forEach((item) => {
		// Extract link information from the post
		const linkInfo = extractPostLink(item.post);

		// If a domain was found and isn't empty
		if (linkInfo && linkInfo.domain) {
			// Increment the count for this domain
			const currentCount = domainMap.get(linkInfo.domain) || 0;
			domainMap.set(linkInfo.domain, currentCount + 1);
		}
	});

	// Convert the map to an array of objects
	const result = Array.from(domainMap.entries()).map(([domain, count]) => ({
		domain,
		count
	}));

	// Sort by count in descending order
	result.sort((a, b) => b.count - a.count);

	return result;
}

/**
 * tktktktk: refactor this with getDomainFrequency  ***************
 * Process the posts array and count the frequency of domains from external links
 * @param posts - Array of BlueskyFeedItems to analyze
 * @returns Array of objects with domain and count, sorted by count in descending order
 */
export function getInteractedUsers(
	posts: BlueskyFeedItem[]
): Array<{ domain: string; count: number }> {
	// Create a map to store domain counts
	const handleMap = new Map<string, number>();

	// Process each post
	posts.forEach((item) => {
		// Extract link information from the post
		const userInfo = item.post.interactedUser;

		// If a domain was found and isn't empty
		if (userInfo && userInfo.handle) {
			// Increment the count for this domain
			const currentCount = handleMap.get(userInfo.handle) || 0;
			handleMap.set(userInfo.handle, currentCount + 1);
		}
	});

	// Convert the map to an array of objects
	const result = Array.from(handleMap.entries()).map(([handle, count]) => ({
		handle,
		count
	}));

	// Sort by count in descending order
	result.sort((a, b) => b.count - a.count);

	return result;
}

export function calculatePostAnalytics(posts: BlueskyFeedItem[]) {
	// Default values
	if (!posts.length) return null;

	// Filter out reposts for posting activity summary since they don't have repost timestamps
	const originalPosts = posts.filter((item) => item.post.isOriginal);
	const reposts = posts.filter((item) => item.post.thingType == 'repost');

	const regularPosts = originalPosts.filter(
		(item) => !['quote', 'reply'].includes(item.post.thingType)
	);

	const replies = originalPosts.filter((item) => item.post.thingType === 'reply');
	const linkedDomains = getDomainFrequency(posts);
	const interactedUsers = getInteractedUsers(posts);

	// Handle edge case where there are no original posts (only reposts)
	if (originalPosts.length === 0) {
		return {
			totalPosts: posts.length,
			originalPostCount: 0,
			postsPerDay: 0,
			repostsPerDay: 0,
			repliesPerDay: 0,
			postsInLast12Hours: 0,
			postsInLast24Hours: 0,
			postsInLast4Hours: 0,
			postTypes: { reply: 0, images: 0, video: 0, quote: 0, post: 0, repost: posts.length },
			postMediaTypes: {},
			engagement: {
				replies: { total: 0, average: 0 },
				likes: { total: 0, average: 0 },
				reposts: { total: 0, average: 0 },
				quotes: { total: 0, average: 0 }
			},
			dateRange: { earliest: new Date(), latest: new Date(), timespan: '0 seconds' },
			media: { totalImages: 0, imagesWithAlt: 0, altTextPercentage: 0 },
			linkedDomains: {},
			interactedUsers: {},
			timezone: ''
		};
	}

	// Get earliest and latest post dates from original content only
	const postDates = posts.map((item) => new Date(item.post.thingCreatedAt).getTime());
	const earliestDate = new Date(Math.min(...postDates));
	const latestDate = new Date(Math.max(...postDates));

	// Calculate date range in days
	const dateRangeMs = latestDate.getTime() - earliestDate.getTime();
	const msPerHour = 60 * 60 * 1000;
	const dateRangeDays = dateRangeMs / (msPerHour * 24);

	// Calculate posts in last 12 hours and last hour
	const _24HoursAgo = new Date(Date.now() - 24 * msPerHour);
	const twelveHoursAgo = new Date(Date.now() - 12 * msPerHour);
	const fourHoursAgo = new Date(Date.now() - 4 * msPerHour);

	const postsInLast24Hours = originalPosts.filter(
		(item) => new Date(item.post.record.createdAt) >= _24HoursAgo
	).length;
	const postsInLast12Hours = originalPosts.filter(
		(item) => new Date(item.post.record.createdAt) >= twelveHoursAgo
	).length;
	const postsInLast4Hours = originalPosts.filter(
		(item) => new Date(item.post.record.createdAt) >= fourHoursAgo
	).length;

	// Count post types
	const postTypes = {
		reply: 0,
		quote: 0,
		post: 0,
		repost: 0
	};

	const postMediaTypes = {
		image: 0,
		video: 0,
		text: 0
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
	posts.forEach((item) => {
		// Increment post type counter
		postTypes[item.post.thingType as keyof typeof postTypes]++;

		const mType = getPostMediaType(item.post);
		if (item.post.isOriginal) {
			// i.e. an original post
			postMediaTypes[mType as keyof typeof postMediaTypes]++;
		}

		// Add engagement metrics (exclude reposts as they don't represent engagement for the user)
		if (item.post.isOriginal) {
			totalReplies += item.post.replyCount || 0;
			totalLikes += item.post.likeCount || 0;
			totalReposts += item.post.repostCount || 0;
			totalQuotes += item.post.quoteCount || 0;
		}

		// Count images and check for alt text
		if (item.post.isOriginal && item.post.embed?.images) {
			const imageArray = item.post.embed.images;
			totalImages += imageArray.length;

			// Check for meaningful alt text (>5 chars)
			imageArray.forEach((img) => {
				if (img.alt && img.alt.trim().length > 5) {
					imagesWithAlt++;
				}
			});
		}
	});

	const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
	// Calculate alt text percentage
	const altTextPercentage = totalImages > 0 ? Math.round((imagesWithAlt / totalImages) * 100) : 0;

	return {
		totalPosts: posts.length,
		originalPostCount: originalPosts.length,
		regularPostCount: regularPosts.length,
		postsPerDay: +(originalPosts.length / dateRangeDays).toFixed(1),
		repostsPerDay: +(reposts.length / dateRangeDays).toFixed(1),
		repliesPerDay: +(replies.length / dateRangeDays).toFixed(1),
		postsInLast12Hours,
		postsInLast24Hours,
		postsInLast4Hours,
		postTypes,
		postMediaTypes,
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
			timespan: roughlyHumanizeDuration(earliestDate, latestDate)
		},
		media: {
			totalImages,
			imagesWithAlt,
			altTextPercentage
		},
		linkedDomains,
		interactedUsers,
		timezone
	};
}
