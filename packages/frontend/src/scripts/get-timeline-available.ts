/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { $i } from '@/account.js';
import { instance } from '@/instance.js';
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const isLocalTimelineAvailable = ($i == null && instance?.policies?.ltlAvailable) || ($i != null && $i?.policies?.ltlAvailable);
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
export const isGlobalTimelineAvailable = ($i == null && instance?.policies?.gtlAvailable) || ($i != null && $i?.policies?.gtlAvailable);
