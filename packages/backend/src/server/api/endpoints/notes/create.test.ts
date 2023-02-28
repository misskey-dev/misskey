process.env.NODE_ENV = 'test';

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, test, expect } from '@jest/globals';
import { getValidator } from '../../../../../test/prelude/get-api-validator.js';
import { paramDef } from './create.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const VALID = true;
const INVALID = false;

describe('api:notes/create', () => {
	describe('validation', () => {
		const v = getValidator(paramDef);
		const tooLong = readFile(_dirname + '/../../../../../test/resources/misskey.svg', 'utf-8');

		test('reject empty', () => {
			const valid = v({ });
			expect(valid).toBe(INVALID);
		});

		describe('text', () => {
			test('simple post', () => {
				expect(v({ text: 'Hello, world!' }))
					.toBe(VALID);
			});

			test('null post', () => {
				expect(v({ text: null }))
					.toBe(INVALID);
			});

			test('0 characters post', () => {
				expect(v({ text: '' }))
					.toBe(INVALID);
			});

			test('over 3000 characters post', async () => {
				expect(v({ text: await tooLong }))
					.toBe(INVALID);
			});
		});

		describe('cw', () => {
			test('simple cw', () => {
				expect(v({ text: 'Hello, world!', cw: 'Hello, world!' }))
					.toBe(VALID);
			});

			test('null cw', () => {
				expect(v({ text: 'Body', cw: null }))
					.toBe(VALID);
			});

			test('0 characters cw', () => {
				expect(v({ text: 'Body', cw: '' }))
					.toBe(VALID);
			});

			test('reject only cw', () => {
				expect(v({ cw: 'Hello, world!' }))
					.toBe(INVALID);
			});

			test('over 100 characters cw', async () => {
				expect(v({ text: 'Body', cw: await tooLong }))
					.toBe(INVALID);
			});
		});

		describe('visibility', () => {
			test('public', () => {
				expect(v({ text: 'Hello, world!', visibility: 'public' }))
					.toBe(VALID);
			});

			test('home', () => {
				expect(v({ text: 'Hello, world!', visibility: 'home' }))
					.toBe(VALID);
			});

			test('followers', () => {
				expect(v({ text: 'Hello, world!', visibility: 'followers' }))
					.toBe(VALID);
			});

			test('reject only visibility', () => {
				expect(v({ visibility: 'public' }))
					.toBe(INVALID);
			});

			test('reject invalid visibility', () => {
				expect(v({ text: 'Hello, world!', visibility: 'invalid' }))
					.toBe(INVALID);
			});

			test('reject null visibility', () => {
				expect(v({ text: 'Hello, world!', visibility: null }))
					.toBe(INVALID);
			});

			describe('visibility:specified', () => {
				test('specified without visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified' }))
						.toBe(VALID);
				});

				test('specified with empty visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified', visibleUserIds: [] }))
						.toBe(VALID);
				});

				test('reject specified with non unique visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified', visibleUserIds: ['1', '1', '2'] }))
						.toBe(INVALID);
				});

				test('reject specified with null visibleUserIds', () => {
					expect(v({ text: 'Hello, world!', visibility: 'specified', visibleUserIds: null }))
						.toBe(INVALID);
				});
			});
		});

		describe('fileIds', () => {
			test('only fileIds', () => {
				expect(v({ fileIds: ['1', '2', '3'] }))
					.toBe(VALID);
			});

			test('text and fileIds', () => {
				expect(v({ text: 'Hello, world!', fileIds: ['1', '2', '3'] }))
					.toBe(VALID);
			});

			test('reject null fileIds', () => {
				expect(v({ fileIds: null }))
					.toBe(INVALID);
			});

			test('reject text and null fileIds （複合的なanyOfのバリデーションが正しく動作する）', () => {
				expect(v({ text: 'Hello, world!', fileIds: null }))
					.toBe(INVALID);
			});

			test('reject 0 files', () => {
				expect(v({ fileIds: [] }))
					.toBe(INVALID);
			});

			test('reject non unique', () => {
				expect(v({ fileIds: ['1', '1', '2'] }))
					.toBe(INVALID);
			});

			test('reject invalid id', () => {
				expect(v({ fileIds: ['あ'] }))
					.toBe(INVALID);
			});

			test('reject over 17 files', () => {
				const valid = v({ text: 'Hello, world!', fileIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'] });
				expect(valid).toBe(INVALID);
			});
		});

		describe('poll', () => {
			test('note with poll', () => {
				expect(v({ text: 'Hello, world!', poll: { choices: ['a', 'b', 'c'] } }))
					.toBe(VALID);
			});

			test('null poll', () => {
				expect(v({ text: 'Hello, world!', poll: null }))
					.toBe(VALID);
			});

			test('allow only poll', () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'] } }))
					.toBe(VALID);
			});

			test('poll with expiresAt', async () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'], expiresAt: 1 } }))
					.toBe(VALID);
			});

			test('poll with expiredAfter', async () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'], expiredAfter: 1 } }))
					.toBe(VALID);
			});

			test('reject poll without choices', () => {
				expect(v({ poll: { } }))
					.toBe(INVALID);
			});

			test('reject poll with empty choices', () => {
				expect(v({ poll: { choices: [] } }))
					.toBe(INVALID);
			});

			test('reject poll with null choices', () => {
				expect(v({ poll: { choices: null } }))
					.toBe(INVALID);
			});

			test('reject poll with 1 choice', () => {
				expect(v({ poll: { choices: ['a'] } }))
					.toBe(INVALID);
			});

			test('reject poll with too long choice', async () => {
				expect(v({ poll: { choices: [await tooLong, '2'] } }))
					.toBe(INVALID);
			});

			test('reject poll with too many choices', () => {
				expect(v({ poll: { choices: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'] } }))
					.toBe(INVALID);
			});

			test('reject poll with non unique choices', () => {
				expect(v({ poll: { choices: ['a', 'a', 'b', 'c'] } }))
					.toBe(INVALID);
			});

			test('reject poll with expiredAfter 0', async () => {
				expect(v({ poll: { choices: ['a', 'b', 'c'], expiredAfter: 0 } }))
					.toBe(INVALID);
			});
		});

		describe('renote', () => {
			test('just a renote', () => {
				expect(v({ renoteId: '1' }))
					.toBe(VALID);
			});
			test('just a quote', () => {
				expect(v({ text: 'Hello, world!', renoteId: '1' }))
					.toBe(VALID);
			});
			test('reject invalid renoteId', () => {
				expect(v({ renoteId: 'あ' }))
					.toBe(INVALID);
			});
		});

		test('text, fileIds and poll', () => {
			expect(v({ text: 'Hello, world!', fileIds: ['1', '2', '3'], poll: { choices: ['a', 'b', 'c'] } }))
				.toBe(VALID);
		});

		test('text, invalid fileIds and invalid poll', () => {
			expect(v({ text: 'Hello, world!', fileIds: ['あ'], poll: { choices: ['a'] } }))
				.toBe(INVALID);
		});
	});
});
