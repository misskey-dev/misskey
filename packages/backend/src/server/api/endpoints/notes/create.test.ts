process.env.NODE_ENV = 'test';

import { getValidator } from '@/../test/prelude/get-api-validator.js';
import { describe, test, expect } from '@jest/globals';
import { readFile } from 'node:fs/promises';

import { paramDef } from './create.js';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

describe('api:notes/create', () => {
	describe('validation', () => {
		const v = getValidator(paramDef);
		const tooLong = readFile(_dirname + '/../../../../../test/resources/misskey.svg', 'utf-8');

		test('reject empty', () => {
			const valid = v({ });
			expect(valid).toBe(false);
		});

		describe('text', () => {
			test('simple post', () => {
				expect(v({ text: 'Hello, world!' }))
				.toBe(true);
			});
			test('null post', () => {
				expect(v({ text: null }))
				.toBe(false);
			});
			test('0 characters post', () => {
				expect(v({ text: '' }))
				.toBe(false);
			});
			test('over 3000 characters post', async () => {
				expect(v({ text: await tooLong }))
				.toBe(false);
			});
		});

		describe('cw', () => {
			test('simple cw', () => {
				expect(v({ text: 'Hello, world!', cw: 'Hello, world!' }))
				.toBe(true);
			});
			test('null cw', () => {
				expect(v({ text: 'Body', cw: null }))
				.toBe(true);
			});
			test('0 characters cw', () => {
				expect(v({ text: 'Body', cw: '' }))
				.toBe(true);
			});
			test('reject only cw', () => {
				expect(v({ cw: 'Hello, world!' }))
				.toBe(false);
			});
			test('over 100 characters cw', async () => {
				expect(v({ text: 'Body', cw: await tooLong }))
				.toBe(false);
			});
		});

		describe('visibility', () => {
			test('public', () => {
				expect(v({ text: 'Hello, world!', visibility: 'public' }))
				.toBe(true);
			});
			test('home', () => {
				expect(v({ text: 'Hello, world!', visibility: 'home' }))
				.toBe(true);
			});
			test('followers', () => {
				expect(v({ text: 'Hello, world!', visibility: 'followers' })
				).toBe(true);
			});
			test('reject only visibility', () => {
				expect(v({ visibility: 'public' }))
				.toBe(false);
			});
			test('reject invalid visibility', () => {
				expect(v({ text: 'Hello, world!', visibility: 'invalid' }))
				.toBe(false);
			});
			test('reject null visibility', () => {
				expect(v({ text: 'Hello, world!', visibility: null }))
				.toBe(false);
			});
			describe('visibility:specified', () => {
				test('specified without visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified' }))
					.toBe(true);
				});
				test('specified with empty visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified', visibleUserIds: [] }))
					.toBe(true);
				});
				test('reject specified with non unique visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified', visibleUserIds: ['1', '1', '2'] }))
					.toBe(false);
				});
				test('reject specified with null visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified', visibleUserIds: null }))
					.toBe(false);
				});
			});
		});

		describe('fileIds', () => {
			test('only fileIds', () => {
				expect(v({ fileIds: ['1', '2', '3'] }))
				.toBe(true);
			});
			test('text and fileIds', () => {
				expect(v({ text: 'Hello, world!', fileIds: ['1', '2', '3'] }))
				.toBe(true);
			});
			test('reject null fileIds', () => {
				expect(v({ fileIds: null }))
				.toBe(false);
			});
			test('reject text and null fileIds （複合的なanyOfのバリデーションが正しく動作する）', () => {
				expect(v({ text: 'Hello, world!', fileIds: null }))
				.toBe(false);
			});
			test('reject 0 files', () => {
				expect(v({ fileIds: [] }))
				.toBe(false);
			});
			test('reject non unique', () => {
				expect(v({ fileIds: ['1', '1', '2'] }))
				.toBe(false);
			});
			test('reject invalid id', () => {
				expect(v({ fileIds: ['あ'] }))
				.toBe(false);
			});
			test('reject over 17 files', () => {
				const valid = v({ text: 'Hello, world!', fileIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'] });
				expect(valid).toBe(false);
			});
		});

		describe('poll', () => {
			test('note with poll', () => {
				expect(v({ text: 'Hello, world!', poll: { choices: ['a', 'b', 'c'] } }))
				.toBe(true);
			});
			test('null poll', () => {
				expect(v({ text: 'Hello, world!', poll: null }))
				.toBe(true);
			});
			test('allow only poll', () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'] } }))
				.toBe(true);
			});
			test('poll with expiresAt', async () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'], expiresAt: 1 } }))
				.toBe(true);
			});
			test('poll with expiredAfter', async () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'], expiredAfter: 1 } }))
				.toBe(true);
			});
			test('reject poll without choices', () => {
				expect(v({ poll: { } }))
				.toBe(false);
			});
			test('reject poll with empty choices', () => {
				expect(v({ poll: { choices: [] } }))
				.toBe(false);
			});
			test('reject poll with null choices', () => {
				expect(v({ poll: { choices: null } }))
				.toBe(false);
			});
			test('reject poll with 1 choice', () => {
				expect(v({ poll: { choices: ['a'] } }))
				.toBe(false);
			});
			test('reject poll with too long choice', async () => {
				expect(v({ poll: { choices: [await tooLong, '2'] } }))
				.toBe(false);
			});
			test('reject poll with too many choices', () => {
				expect(v({ poll: { choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'] } }))
				.toBe(false);
			});
			test('reject poll with non unique choices', () => {
				expect(v({ poll: { choices: ['a', 'a', 'b', 'c'] } }))
				.toBe(false);
			});
			test('reject poll with expiredAfter 0', async () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'], expiredAfter: 0 } }))
				.toBe(false);
			});
		});

		test('text, fileIds and poll', () => {
			expect(v({ text: 'Hello, world!', fileIds: ['1', '2', '3'], poll: { choices: ['a', 'b', 'c'] } }))
			.toBe(true);
		});
		test('text, invalid fileIds and invalid poll', () => {
			expect(v({ text: 'Hello, world!', fileIds: ['あ'], poll: { choices: ['a'] } }))
			.toBe(false);
		});
	});
});
