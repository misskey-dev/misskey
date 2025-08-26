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

	it('nulls host for at-mark style when localHostname matches', () => {
		const res = acct.parse('@alice@example.com', 'example.com');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses acct: style', () => {
		const res = acct.parse('acct:alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('nulls host for acct: style when localHostname matches', () => {
		const res = acct.parse('acct:alice@example.com', 'example.com');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses url style https with same host -> host kept when localHostname not provided', () => {
		const res = acct.parse('https://example.com/@alice');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('parses url style http with same host and nulls host when localHostname matches', () => {
		const res = acct.parse('http://example.com/@alice', 'example.com');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses url style with remote host contained in path', () => {
		const res = acct.parse('https://self.example.com/@alice@other.example.com');
		expect(res).toEqual({ username: 'alice', host: 'other.example.com' });
	});

	it('nulls host when localHostname matches the remote host in path', () => {
		const res = acct.parse('https://self.example.com/@alice@other.example.com', 'other.example.com');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('throws on non-acct-like url path', () => {
		expect(() => acct.parse('https://example.com/users/alice')).toThrowError();
	});

	it('parses correctly Mr.http', () => {
		const res = acct.parse('http');
		expect(res).toEqual({ username: 'http', host: null });
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


