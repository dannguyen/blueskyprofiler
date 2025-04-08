import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfile, API_HOST, BlueskyProfile } from '../../src/lib/bskyfoo';
import profileFixture from '../fixtures/profile.json';

// Create a copy of the fixture to use in tests
const mockProfile: BlueskyProfile = { ...profileFixture };

// Mock the global fetch function
global.fetch = vi.fn();

describe('bskyfoo Functions', () => {
	describe('getProfile', () => {
		beforeEach(() => {
			vi.resetAllMocks();
		});

		it('should return null if handle is empty', async () => {
			expect(await getProfile('')).toBe(null);
			expect(await getProfile(null)).toBe(null);
			expect(await getProfile(undefined)).toBe(null);
		});

		it('should fetch profile data from the API', async () => {
			// Setup mock response
			const mockResponse = {
				ok: true,
				json: () => Promise.resolve(mockProfile)
			};
			(fetch as any).mockResolvedValue(mockResponse);

			const handle = 'dril.bsky.social';
			const result = await getProfile(handle);

			// Verify fetch was called correctly
			expect(fetch).toHaveBeenCalledTimes(1);
			expect(fetch).toHaveBeenCalledWith(
				`${API_HOST}/xrpc/app.bsky.actor.getProfile?actor=${handle}`
			);

			// Verify returned data
			expect(result).toEqual(mockProfile);
			expect(result?.handle).toBe('dril.bsky.social');
			expect(result?.displayName).toBe('wint');
		});

		it('should throw an error when the API request fails', async () => {
			// Setup mock response for failure
			const mockResponse = {
				ok: false,
				status: 404
			};
			(fetch as any).mockResolvedValue(mockResponse);

			// Verify error is thrown
			await expect(getProfile('non-existent-user')).rejects.toThrow(
				'API request failed with status 404'
			);
		});
	});
});
