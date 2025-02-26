import { type BlueskyPost, type BlueskyFeedItem } from '$lib/apifoo';

// Format date to human-friendly format
export function formatDate(dateString: string): string {
	const date = new Date(dateString);

	// Get month name (short format)
	const months = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];
	const month = months[date.getMonth()];

	// Get day and year
	const day = date.getDate();
	const year = date.getFullYear();

	// Get hour in 12-hour format
	let hours = date.getHours();
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12;
	hours = hours ? hours : 12; // Convert 0 to 12

	// Get minutes with leading zero
	const minutes = String(date.getMinutes()).padStart(2, '0');

	return `${month} ${day}, ${year} ${hours}:${minutes}${ampm}`;
}

// Format date to truncated time format
export function formatIsoDate(dateString: string): string {
	const date = new Date(dateString);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// Get word count from post text
export function getWordCount(text: string): number {
	return text.trim().split(/\s+/).length;
}

// Calculate the age in days between the current date and the provided date
export function currentAgeInDays(dateString: string): number {
	const pastDate = new Date(dateString);
	const currentDate = new Date();

	// Calculate difference in milliseconds
	const diffMs = currentDate.getTime() - pastDate.getTime();

	// Convert milliseconds to days (1000ms * 60s * 60min * 24hr)
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	return diffDays;
}

/**
 * Converts a number of days into a human-friendly time format like "14d", "3m14d", or "2y3m14d"
 * @param days Number of days to convert
 * @returns A formatted string representation of the time period
 */
export function currentAgePrettified(days: number): string {
	if (days < 0) {
		return '0d'; // Handle negative days (future dates)
	}

	// Calculate years, months, and remaining days
	const years = Math.floor(days / 365);
	let remainingDays = days % 365;

	// Calculate months (approximate - using 30 days per month)
	const months = Math.floor(remainingDays / 30);
	remainingDays = remainingDays % 30;

	// Build the string based on what units we have
	let result = '';

	if (years > 0) {
		result += `${years}y`;
	}

	if (months > 0 || (years > 0 && remainingDays > 0)) {
		result += ` ${months}m`;
	}

	if (remainingDays > 0 || (years === 0 && months === 0)) {
		result += ` ${remainingDays}d`;
	}

	return result.trim();
}

// Determine post type based on its structure and content
export function getPostType(post: BlueskyPost, profileHandle?: string): string {
	// Check if it's a repost (author handle is different from profile handle)
	if (profileHandle && post.author.handle !== profileHandle) {
		return 'repost';
	}
	// Check if it's a reply
	else if (post.record.reply) {
		return 'reply';
	}
	// Check if it has images
	else if (post.embed?.$type?.includes('app.bsky.embed.images')) {
		return 'images';
	}
	// Check if it has video
	else if (post.embed?.$type?.includes('app.bsky.embed.record')) {
		return 'quote';
	}
	// Check if it's a quote post
	else if (post.embed?.$type?.includes('app.bsky.embed.video')) {
		return 'video';
	}
	// Default type is a text post
	else {
		return 'post';
	}
}

// Generate a direct URL to the post on Bluesky's web interface
export function postURL(post: BlueskyPost): string {
	// Extract the final element from the URI (the post ID)
	const uriParts = post.uri.split('/');
	const postId = uriParts[uriParts.length - 1];

	// Construct the URL using the author's handle and post ID
	return `https://bsky.app/profile/${post.author.handle}/post/${postId}`;
}
