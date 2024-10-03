/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { validateContentTypeSetAsActivityPub, validateContentTypeSetAsJsonLD } from '@/core/activitypub/misc/validator.js';
import { signup, uploadFile, relativeFetch } from '../utils.js';
import type * as misskey from 'misskey-js';

describe('validateContentTypeSetAsActivityPub/JsonLD (deny case)', () => {
	let alice: misskey.entities.SignupResponse;
	let aliceUploadedFile: any;

	beforeAll(async () => {
		alice = await signup({ username: 'alice' });
		aliceUploadedFile = await uploadFile(alice);
	}, 1000 * 60 * 2);

	test('ActivityStreams: ファイルはエラーになる', async () => {
		const res = await relativeFetch(aliceUploadedFile.webpublicUrl);

		function doValidate() {
			validateContentTypeSetAsActivityPub(res);
		}

		expect(doValidate).toThrow('Content type is not');
	});

	test('JSON-LD: ファイルはエラーになる', async () => {
		const res = await relativeFetch(aliceUploadedFile.webpublicUrl);

		function doValidate() {
			validateContentTypeSetAsJsonLD(res);
		}

		expect(doValidate).toThrow('Content type is not');
	});
});
