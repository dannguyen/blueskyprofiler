/**
 * Represents a Bluesky user profile
 */
export interface BlueskyUser {
	did: string;
	handle: string;
	displayName?: string;
	description?: string;
	avatar?: string;
	indexedAt?: string;
	followersCount?: number;
	followsCount?: number;
	postsCount?: number;
	[key: string]: any; // For other properties that may be in the response
}

export class BlueskyProfile implements BlueskyUser {
	constructor(user: BlueskyUser) {
		Object.assign(this, user);
	}

	get url(): string {
		return `https://bsky.app/profile/${this.handle}`;
	}
}
