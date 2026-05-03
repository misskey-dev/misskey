/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll } from 'vitest';
import { initTestDb, sendEnvResetRequest } from './utils.js';

beforeAll(async () => {
	await initTestDb(false);
	await sendEnvResetRequest();
});
