/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll } from 'vitest';

beforeAll(() => {
	// DBはUTC（っぽい）ので、テスト側も合わせておく
	process.env.TZ = 'UTC';
	process.env.NODE_ENV = 'test';
});
