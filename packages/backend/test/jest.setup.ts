/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { initTestDb, sendEnvResetRequest } from './utils.js';
import launch from '../built-test/entry.js';

beforeAll(async () => {
	await Promise.all([
		initTestDb(false),
		launch(),
		sendEnvResetRequest(),
	]);
});
