/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { desktopPc } from './desktopPc.js';
import { i18n } from '@/i18n.js';

export const desktopPc_ui = defineObjectUi<typeof desktopPc>({
	name: i18n.ts._miRoom._objects.desktopPc,
	options: {
		bodyMat: {
			label: i18n.ts._miRoom._objects._desktopPc.bodyMat,
		},
		coverMat: {
			label: i18n.ts._miRoom._objects._desktopPc.coverMat,
		},
		inner1Mat: {
			label: i18n.ts._miRoom._objects._desktopPc.inner1Mat,
		},
		inner2Mat: {
			label: i18n.ts._miRoom._objects._desktopPc.inner2Mat,
		},
		inner3Mat: {
			label: i18n.ts._miRoom._objects._desktopPc.inner3Mat,
		},
		ledColor: {
			label: i18n.ts._miRoom._objects._desktopPc.ledColor,
		},
	},
});
