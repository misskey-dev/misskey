/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { initTestDb, sendEnvResetRequest } from './utils.js';

beforeAll(async () => {
		await initTestDb(false);
		console.log('Test database initialized.');
		await sendEnvResetRequest();
		console.log('Environment reset completed.');
});
