/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationTypes } from '@/types.js';

export const enumNotificationTypeSchema = {
	type: 'string',
	enum: [...notificationTypes, 'reaction:grouped', 'renote:grouped'],
} as const;
