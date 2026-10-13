/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { parse } from 'node-html-parser';

/** Converts HTML descriptions into text while preserving word boundaries. */
export function htmlToPlainText(html: string): string {
	const document = parse(html);
	document.querySelectorAll('script, style, template').forEach(node => node.remove());
	return document.structuredText.replace(/\s+/gu, ' ').trim();
}
