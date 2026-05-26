/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm } from '../../../../../frontend-misskey-world-engine/src/utility.js';
import { books_schema } from 'misskey-world/src/room/objects/books.schema.js';

export const books = defineObject(books_schema, {
	createInstance: ({ scene, options, model }) => {
		const coverMaterial = model.findMaterial('__X_COVER__');

		const applyVariation = () => {
			const coverTexture =
				options.variation === 'A' ? new BABYLON.Texture('/client-assets/room/objects/books/textures/a.png', scene, false, false) :
				options.variation === 'B' ? new BABYLON.Texture('/client-assets/room/objects/books/textures/b.png', scene, false, false) :
				options.variation === 'C' ? new BABYLON.Texture('/client-assets/room/objects/books/textures/c.png', scene, false, false) :
				options.variation === 'D' ? new BABYLON.Texture('/client-assets/room/objects/books/textures/d.png', scene, false, false) :
				new BABYLON.Texture('/client-assets/room/objects/books/textures/e.png', scene, false, false);
			coverMaterial.albedoTexture = coverTexture;
		};

		applyVariation();

		const bookMeshes = [
			model.findMeshes('__X_BOOK_1__'),
			model.findMeshes('__X_BOOK_2__'),
			model.findMeshes('__X_BOOK_3__'),
			model.findMeshes('__X_BOOK_4__'),
			model.findMeshes('__X_BOOK_5__'),
			model.findMeshes('__X_BOOK_6__'),
			model.findMeshes('__X_BOOK_7__'),
			model.findMeshes('__X_BOOK_8__'),
			model.findMeshes('__X_BOOK_9__'),
			model.findMeshes('__X_BOOK_10__'),
		];

		for (const meshes of bookMeshes) {
			const z = Math.random() * 0.005;
			const y = Math.random() * 0.0025;
			for (const mesh of meshes) {
				mesh.position.z -= z;
				mesh.position.y += y;
			}
		}

		model.updated();

		return {
			onOptionsUpdated: ([k, v]) => {
				applyVariation();
			},
			interactions: {},
			dispose: () => {},
		};
	},
});
