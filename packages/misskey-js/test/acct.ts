import { describe, it, expect } from 'vitest';
import * as acct from '../src/acct.js';

describe('acct.parse', () => {
	it('parses plain username', () => {
		const res = acct.parse('alice');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses at-mark style without host', () => {
		const res = acct.parse('@alice');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses at-mark style with host', () => {
		const res = acct.parse('@alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('parses acct: style', () => {
		const res = acct.parse('acct:alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});
});

describe('acct.toString', () => {
	it('returns username when host is null', () => {
		expect(acct.toString({ username: 'alice', host: null })).toBe('alice');
	});

	it('returns username@host when host exists', () => {
		expect(acct.toString({ username: 'alice', host: 'example.com' })).toBe('alice@example.com');
	});
});

