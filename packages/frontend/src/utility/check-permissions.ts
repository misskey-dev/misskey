/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { $i } from '@/i.js';
import { instance } from '@/instance.js';

export const notesSearchAvailable = (
	// FIXME: instance.policies would be null in Vitest
	($i == null && instance.policies != null && instance.policies.canSearchNotes) ||
	($i?.policies.canSearchNotes) ||
	false
) as boolean;

export const canSearchNonLocalNotes = (
	instance.noteSearchableScope === 'global'
);

export const usersSearchAvailable = (
	// FIXME: instance.policies would be null in Vitest
	($i == null && instance.policies != null && instance.policies.canSearchUsers) ||
	($i?.policies.canSearchUsers) ||
	false
);
