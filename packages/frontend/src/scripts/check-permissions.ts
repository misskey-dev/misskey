/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instance } from '@/instance.js';
import { $i } from '@/account.js';

export const notesSearchAvailable = (
	// FIXME: instance.policies would be null in Vitest
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	($i == null && instance.policies != null && instance.policies.canSearchNotes) ||
	($i != null && $i.policies.canSearchNotes) ||
	false
) as boolean;

export const canSearchNonLocalNotes = (
	instance.noteSearchableScope === 'global'
);
