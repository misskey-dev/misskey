/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { pictureFrame } from './pictureFrame.js';
import { i18n } from '@/i18n.js';

export const pictureFrame_ui = defineObjectUi<typeof pictureFrame>({
	name: i18n.ts._miRoom._objects.pictureFrame,
	options: {
		frameMat: {
			label: i18n.ts._miRoom._objects._pictureFrame.frameMat,
		},
		width: {
			label: i18n.ts._miRoom._objects._pictureFrame.width,
		},
		height: {
			label: i18n.ts._miRoom._objects._pictureFrame.height,
		},
		frameThickness: {
			label: i18n.ts._miRoom._objects._pictureFrame.frameThickness,
		},
		depth: {
			label: i18n.ts._miRoom._objects._pictureFrame.depth,
		},
		matHThickness: {
			label: i18n.ts._miRoom._objects._pictureFrame.matHThickness,
		},
		matVThickness: {
			label: i18n.ts._miRoom._objects._pictureFrame.matVThickness,
		},
		withCover: {
			label: i18n.ts._miRoom._objects._pictureFrame.withCover,
		},
		image: {
			label: i18n.ts._miRoom._objects._pictureFrame.image,
		},
	},
});
