/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { EventEmitter } from 'node:events';

export default function setup() {
	// DBはUTC（っぽい）ので、テスト側も合わせておく
	process.env.TZ = 'UTC';
	process.env.NODE_ENV = 'test';
	EventEmitter.defaultMaxListeners = 20;
}
