/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const books = defineObject({
	id: 'books',
	name: 'Books',
	options: {
		schema: {
			variation: {
				type: 'enum',
				label: 'Variation',
				enum: ['A', 'B', 'C', 'D', 'E'],
			},
		},
		default: {
			variation: 'A',
		},
	},
	placement: 'top',
	mergeMeshes: ['__X_BOOK_1__', '__X_BOOK_2__', '__X_BOOK_3__', '__X_BOOK_4__', '__X_BOOK_5__', '__X_BOOK_6__', '__X_BOOK_7__', '__X_BOOK_8__', '__X_BOOK_9__', '__X_BOOK_10__'],
	createInstance: ({ scene, options, findMesh, findMaterial }) => {
		const coverMaterial = findMaterial('__X_COVER__');

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
			findMesh('__X_BOOK_1__'),
			findMesh('__X_BOOK_2__'),
			findMesh('__X_BOOK_3__'),
			findMesh('__X_BOOK_4__'),
			findMesh('__X_BOOK_5__'),
			findMesh('__X_BOOK_6__'),
			findMesh('__X_BOOK_7__'),
			findMesh('__X_BOOK_8__'),
			findMesh('__X_BOOK_9__'),
			findMesh('__X_BOOK_10__'),
		];

		for (const mesh of bookMeshes) {
			mesh.position.z -= Math.random() * 0.005/*cm*/;
			mesh.position.y += Math.random() * 0.0025/*cm*/;
		}

		return {
			onOptionsUpdated: ([k, v]) => {
				applyVariation();
			},
			interactions: {},
		};
	},
});
