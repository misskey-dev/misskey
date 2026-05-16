/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Readable } from 'node:stream';
import type { Context } from 'hono';

export type ApiContext = Context<{ Variables: { ip: string; ips: string[] } }>;

export interface ApiMultipartData {
	filename: string;
	file: Readable;
	truncated: boolean;
	fields: Record<string, unknown>;
}

export function headersToObject(headers: Headers): Record<string, string> {
	return Object.fromEntries(headers.entries());
}
