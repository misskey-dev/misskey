/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Readable } from 'node:stream';
import type { Context } from 'hono';

export type ApiEnv = { Variables: { ip: string; ips: string[] } };

export type ApiContext = Context<ApiEnv>;

export interface ApiMultipartData {
	filename: string;
	file: Readable;
	truncated: boolean;
	fields: Record<string, unknown>;
}
