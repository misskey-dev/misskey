/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as mfm from 'mfm-js';
import * as Misskey from 'misskey-js';
import { extractUrlFromMfm } from './extract-url-from-mfm.js';
import { existsCollapsedFunction } from './exists-collapsed-function.js';

export function shouldCollapsed(note: Misskey.entities.Note): boolean {
	const nodes = mfm.parse(note.text);
	const urls = note.text ? extractUrlFromMfm(nodes) : null;
	const collapsed = note.cw == null && note.text != null && (
		(existsCollapsedFunction(nodes)) ||
		(note.text.split('\n').length > 9) ||
		(note.text.length > 500) ||
		(note.files.length >= 5) ||
		(!!urls && urls.length >= 4)
	);

	return collapsed;
}
