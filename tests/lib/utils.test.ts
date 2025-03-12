import { describe, it, expect } from 'vitest';
import { cleanHandleInput } from '$lib/utils';

describe('utils', () => {
	describe('cleanHandleInput', () => {
		it('should assume a dotless input refers to the bsky.social domain', () => {
			expect(cleanHandleInput('dan')).toBe('dan.bsky.social');
		});

		it('should strip a leading @ sign', () => {
			expect(cleanHandleInput('@dan.com')).toBe('dan.com');
		});

		it('should trim whitespace', () => {
			expect(cleanHandleInput('  dan.com ')).toBe('dan.com');
		});

		it('should normalize to lower case', () => {
			expect(cleanHandleInput('Dan.COM')).toBe('dan.com');
		});
	});
});
