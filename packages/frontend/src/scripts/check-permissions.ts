/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { $i } from '@/account.js';

export function isNotesSearchAvailable(serverMetadata: Misskey.entities.MetaDetailed): boolean {
	// FIXME: serverMetadata.policies would be null in Vitest
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return ($i == null && serverMetadata.policies != null && serverMetadata.policies.canSearchNotes) ||
	($i != null && $i.policies.canSearchNotes) ||
	false;
}

export function canSearchNonLocalNotes(serverMetadata: Misskey.entities.MetaDetailed): boolean {
	return serverMetadata.noteSearchableScope === 'global';
}
