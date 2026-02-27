/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineObject } from '../engine.js';

export const books = defineObject({
	id: 'books',
	name: 'Books',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	mergeMeshes: ['__X_BOOK_1__', '__X_BOOK_2__', '__X_BOOK_3__', '__X_BOOK_4__', '__X_BOOK_5__', '__X_BOOK_6__', '__X_BOOK_7__', '__X_BOOK_8__', '__X_BOOK_9__', '__X_BOOK_10__'],
	createInstance: ({ findMesh, root }) => {
		console.log(root.getChildMeshes().map((m) => m.name));

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
			interactions: {},
		};
	},
});
