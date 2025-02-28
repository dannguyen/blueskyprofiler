import { type BlueskyPost, type BlueskyFeedItem } from '$lib/bskyfoo';
import numeral from 'numeral';

export function prettifyInteger(num: number): string {
	const numi = Math.round(num);
	let fmt = '0';
	if (num >= 1000) {
		fmt = '0.0 a';
	}
	return numeral(numi).format(fmt);
}

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

export function extractUrlDomain(url: string): string {
	try {
		// Create a URL object to parse the URL
		const urlObj = new URL(url);
		// Get the hostname and normalize it
		let hostname = urlObj.hostname.toLowerCase();

		// Remove trailing slash
		hostname = hostname.endsWith('/') ? hostname.slice(0, -1) : hostname;

		// Remove "www." prefix if it exists
		hostname = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

		return hostname;
	} catch (error) {
		// Return empty string if URL is invalid
		return '';
	}
}
