/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeAll } from 'vitest';
import { initTestDb, sendEnvResetRequest } from './utils.js';

beforeAll(async () => {
	// 前ファイルのNestJSアプリをdispose(env-reset)した後にスキーマをdrop & 再作成する。
	// 逆順だと、前ファイルの最後のテストが投げっぱなしにした非同期処理(cacheServiceのrefresh等)が
	// dispose前のdrop中に発火し、Unhandled Rejection (relation does not exist) でクラッシュしうる。
	await sendEnvResetRequest();
	await initTestDb(false);
});
