/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { initTestDb, sendEnvResetRequest } from './utils.js';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
Symbol.dispose ??= Symbol('Symbol.dispose');
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
Symbol.asyncDispose ??= Symbol('Symbol.asyncDispose');

beforeAll(async () => {
	await Promise.all([
		initTestDb(false),
		sendEnvResetRequest(),
	]);
});
