/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as BABYLON from '@babylonjs/core';
import { defineFuniture } from '../object.js';
import { book_schema } from 'misskey-world/src/room/objects/book.schema.js';

export const book = defineFuniture(book_schema, {
	createInstance: ({ options, model }) => {
		const bodyMesh = model.findMesh('__X_BODY__');

		const applySize = () => {
			bodyMesh.morphTargetManager!.getTargetByName('Width')!.influence = options.width;
			bodyMesh.morphTargetManager!.getTargetByName('Height')!.influence = options.height;
			bodyMesh.morphTargetManager!.getTargetByName('Thickness')!.influence = options.thickness;
			model.updated();
		};

		applySize();

		return {
			onInited: () => {
			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'width':
					case 'height':
					case 'thickness':
						applySize();
						break;
				}
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
