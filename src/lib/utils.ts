import numeral from 'numeral';
import { DateTime, Duration } from 'luxon';

// Process handle input to handle common formats
export function cleanHandleInput(rawHandle: string): string {
	if (!rawHandle) return '';

	// Trim whitespace
	let cleanHandle = rawHandle.trim().toLocaleLowerCase();

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

export function prettifyInteger(num: number): string {
	const numi = Math.round(num);
	let fmt = '0';
	if (num >= 1000) {
		fmt = '0.0 a';
	}
	return numeral(numi).format(fmt);
}

// Get word count from post text
export function getWordCount(text: string): number {
	return text.trim().split(/\s+/).length;
}

export function roughlyHumanizeDuration(start: Date, end: Date): string {
	const units = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];

	const startDt = DateTime.fromJSDate(start);
	const endDt = DateTime.fromJSDate(end);
	const duration = endDt.diff(startDt, units).toObject();

	if ('seconds' in duration) {
		duration.seconds = Math.round(duration.seconds!);
	}

	const durationList = Object.entries(duration);
	const cleanedDurationList = [];
	const ix = durationList.findIndex((v) => v[1] > 0);
	const jx = ix + 1;

	if (ix >= 0) {
		cleanedDurationList.push(durationList[ix]);
		if (jx < units.length) {
			if (durationList[jx][1] > 0) {
				cleanedDurationList.push(durationList[jx]);
			}
		}
	} else {
		cleanedDurationList.push(['seconds', 0]);
	}

	const cleanedDuration = Object.fromEntries(cleanedDurationList);

	return Duration.fromObject(cleanedDuration).toHuman();
}

export function humanizeTimeFromNow(dt: Date): string {
	return DateTime.fromJSDate(dt).toRelative();
}

const ICON_TYPES = {
	repost: 'copy',
	reply: 'comment',
	quote: 'comments',
	like: 'thumbs-up',
	interaction: 'bell',
	original: 'pen-to-square',
	createdAt: 'clock'
};
export function makeIcon(icontype: string): string {
	let iconname = ICON_TYPES[icontype];
	if (iconname === undefined) {
		iconname = 'circle-exclamation';
	}
	return `<i class="fa-regular fa-${iconname}"></i>`;
}
