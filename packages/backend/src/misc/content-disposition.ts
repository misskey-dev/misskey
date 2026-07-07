/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { create } from 'content-disposition';

export function contentDisposition(type: 'inline' | 'attachment', filename: string): string {
	const fallback = filename.replace(/[^\w.-]/g, '_');
	return create(filename, { type, fallback });
}
