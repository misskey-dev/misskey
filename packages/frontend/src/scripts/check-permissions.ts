/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { instance } from '@/instance.js';
import { $i } from '@/account.js';

export const notesSearchAvailable = (($i == null && instance.policies.canSearchNotes) || ($i != null && $i.policies.canSearchNotes)) as boolean;
