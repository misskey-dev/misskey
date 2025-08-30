import { describe, it, expect } from 'vitest';
import * as acct from '../src/acct.js';

function testParseAcct(fn: (acct: string) => acct.Acct) {
	it('parses plain username', () => {
		const res = fn('alice');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses at-mark style without host', () => {
		const res = fn('@alice');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parses at-mark style with host', () => {
		const res = fn('@alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('parses acct: style', () => {
		const res = fn('acct:alice@example.com');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('parse Mr.http', () => {
		const res = fn('http');
		expect(res).toEqual({ username: 'http', host: null });
	});
}

function testParseUrl(fn: (acct: string) => acct.Acct) {
	it('parses url style https with same host -> host kept when localHostname not provided', () => {
		const res = fn('https://example.com/@alice');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('parses url style with remote host contained in path', () => {
		const res = fn('https://self.example.com/@alice@other.example.com');
		expect(res).toEqual({ username: 'alice', host: 'other.example.com' });
	});

	it('throws on non-acct-like url path (root)', () => {
		expect(() => fn('https://example.com')).toThrowError();
	});

	it('throws on non-acct-like url path (users/alice)', () => {
		expect(() => fn('https://example.com/users/alice')).toThrowError();
	});

	it('throws ended with @', () => {
		expect(() => fn('https://example.com/@')).toThrowError();
	});

	it('parses url ended with /', () => {
		const res = fn('https://example.com/@alice/');
		expect(res).toEqual({ username: 'alice', host: 'example.com' });
	});

	it('throws url have @username path but ended with sub directory', () => {
		expect(() => fn('https://example.com/@alice/subdir')).toThrowError();
	});

	it('throws url with search params', () => {
		expect(() => fn('https://example.com/@alice?foo=bar')).toThrowError();
	});

	it('throws url with hash', () => {
		expect(() => fn('https://example.com/@alice#fragment')).toThrowError();
	});

	it('throws not root path', () => {
		expect(() => fn('https://example.com/users/@alice')).toThrowError();
	});
}

describe('acct.parse', () => {
	testParseAcct(acct.parse);
});

describe('acct.parseUrl', () => {
	testParseUrl(acct.parseUrl);
});

describe('acct.parseAcctOrUrl', () => {
	testParseAcct(acct.parseAcctOrUrl);
	testParseUrl(acct.parseAcctOrUrl);

	it('parse url with localHostname', () => {
		const res = acct.parseAcctOrUrl('https://example.com/@alice', 'example.com');
		expect(res).toEqual({ username: 'alice', host: null });
	});

	it('parse @username with localHostname', () => {
		const res = acct.parseAcctOrUrl('@alice', 'example.com');
		expect(res).toEqual({ username: 'alice', host: null });
	});
});

describe('acct.correctAcct', () => {
	it('returns host=null when acct.host is null', () => {
		const input: acct.Acct = { username: 'alice', host: null };
		const out = acct.correctAcct(input);
		expect(out).toEqual({ username: 'alice', host: null });
		expect(out).not.toBe(input); // immutability
	});

	it('keeps host when localHostname not provided', () => {
		const input: acct.Acct = { username: 'bob', host: 'example.com' };
		const out = acct.correctAcct(input);
		expect(out).toEqual({ username: 'bob', host: 'example.com' });
	});

	it('nulls host when it matches localHostname', () => {
		const input: acct.Acct = { username: 'carol', host: 'example.com' };
		const out = acct.correctAcct(input, 'example.com');
		expect(out).toEqual({ username: 'carol', host: null });
	});

	it('keeps host when it differs from localHostname', () => {
		const input: acct.Acct = { username: 'dave', host: 'other.example.com' };
		const out = acct.correctAcct(input, 'example.com');
		expect(out).toEqual({ username: 'dave', host: 'other.example.com' });
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
