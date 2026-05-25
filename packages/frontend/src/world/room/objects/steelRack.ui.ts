/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObjectUi } from '../defineObjectUi.js';
import type { steelRack_schema } from './steelRack.schema.js';
import { i18n } from '@/i18n.js';

export const steelRack_ui = defineObjectUi<typeof steelRack_schema>({
	name: i18n.ts._miRoom._objects.steelRack,
	options: {
		shelfMat: {
			label: i18n.ts._miRoom._objects._steelRack.shelfMat,
		},
		poleMat: {
			label: i18n.ts._miRoom._objects._steelRack.poleMat,
		},
		widthAndDepthVariation: {
			label: i18n.ts._miRoom._objects._steelRack.widthAndDepthVariation,
			enum: {
				'60-35': {
					label: '60cm x 35cm',
				},
				'90-35': {
					label: '90cm x 35cm',
				},
			},
		},
		height: {
			label: i18n.ts._miRoom._objects._steelRack.height,
		},
		numberOfShelfs: {
			label: i18n.ts._miRoom._objects._steelRack.numberOfShelfs,
		},
		shelf1Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #1',
		},
		shelf2Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #2',
		},
		shelf3Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #3',
		},
		shelf4Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #4',
		},
		shelf5Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #5',
		},
		shelf6Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #6',
		},
		shelf7Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #7',
		},
		shelf8Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #8',
		},
		shelf9Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #9',
		},
		shelf10Position: {
			label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #10',
		},
	},
});
