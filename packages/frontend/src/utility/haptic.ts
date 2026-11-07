/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { haptic as _haptic } from 'ios-haptics';
import { prefer } from '@/preferences.js';

export function haptic() {
	if (prefer.s['experimental.enableHapticFeedback']) {
		_haptic();
	}
}
