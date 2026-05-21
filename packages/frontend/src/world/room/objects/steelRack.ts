/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObjectClass } from '../object.js';
import { cm, remap } from '@/world/utility.js';

const base = defineObjectClass({
	options: {
		schema: {
			height: {
				type: 'range',
				label: 'Height',
				min: 1,
				max: 7,
				step: 1,
			},
			numberOfShelfs: {
				type: 'range',
				label: '# of shelfs',
				min: 2,
				max: 10,
				step: 1,
			},
			shelf1Position: {
				type: 'range',
				label: 'Shelf1 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf2Position: {
				type: 'range',
				label: 'Shelf2 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf3Position: {
				type: 'range',
				label: 'Shelf3 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf4Position: {
				type: 'range',
				label: 'Shelf4 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf5Position: {
				type: 'range',
				label: 'Shelf5 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf6Position: {
				type: 'range',
				label: 'Shelf6 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf7Position: {
				type: 'range',
				label: 'Shelf7 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf8Position: {
				type: 'range',
				label: 'Shelf8 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf9Position: {
				type: 'range',
				label: 'Shelf9 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf10Position: {
				type: 'range',
				label: 'Shelf10 position',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			height: 5,
			numberOfShelfs: 5,
			shelf1Position: 0.0,
			shelf2Position: 0.3,
			shelf3Position: 0.5,
			shelf4Position: 0.7,
			shelf5Position: 0.95,
			shelf6Position: 1,
			shelf7Position: 1,
			shelf8Position: 1,
			shelf9Position: 1,
			shelf10Position: 1,
		},
	},
	placement: 'floor',
	hasCollisions: true,
	hasTexture: true,
	createInstance: ({ options, model }) => {
		const matrix = model.root.getWorldMatrix(true);
		const scale = new BABYLON.Vector3();
		matrix.decompose(scale);

		const pole = model.findMesh('__X_POLE__');
		const shelf = model.findTransformNode('__X_SHELF__');

		const clonedPoleMeshes = [] as BABYLON.Mesh[];
		const clonedShelfMeshes = [] as BABYLON.TransformNode[];

		const applyShelfPositions = () => {
			for (let i = 0; i < clonedShelfMeshes.length + 1; i++) {
				const shelfMesh = i === 0 ? shelf : clonedShelfMeshes[i - 1];
				const pos =
					i === 0 ? options.shelf1Position :
					i === 1 ? options.shelf2Position :
					i === 2 ? options.shelf3Position :
					i === 3 ? options.shelf4Position :
					i === 4 ? options.shelf5Position :
					i === 5 ? options.shelf6Position :
					i === 6 ? options.shelf7Position :
					i === 7 ? options.shelf8Position :
					i === 8 ? options.shelf9Position :
					options.shelf10Position;
				shelfMesh.position.y = remap(pos, 0, 1, cm(5), cm(30) * options.height) / Math.abs(scale.y);
			}
		};

		const applyNumberOfShelfs = () => {
			for (const mesh of clonedShelfMeshes) {
				mesh.dispose();
			}
			clonedShelfMeshes.length = 0;

			for (let i = 0; i < options.numberOfShelfs - 1; i++) {
				const clonedShelf = shelf.clone(`__X_SHELF_CLONE_${i}__`, shelf.parent);
				clonedShelf.isVisible = true;
				clonedShelfMeshes.push(clonedShelf);
			}

			applyShelfPositions();
		};

		applyNumberOfShelfs();

		const applyHeight = () => {
			for (const mesh of clonedPoleMeshes) {
				mesh.dispose();
			}
			clonedPoleMeshes.length = 0;

			for (let i = 1; i < options.height; i++) {
				const clonedPole = pole.clone(`__X_POLE_CLONE_${i}__`);
				clonedPole.position.y = (i * cm(30)) / Math.abs(scale.y);
				clonedPoleMeshes.push(clonedPole);
			}

			applyShelfPositions();
		};

		applyHeight();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'height': applyHeight(); break;
					case 'numberOfShelfs': applyNumberOfShelfs(); break;
					case 'shelf1Position':
					case 'shelf2Position':
					case 'shelf3Position':
					case 'shelf4Position':
					case 'shelf5Position':
					case 'shelf6Position':
					case 'shelf7Position':
					case 'shelf8Position':
					case 'shelf9Position':
					case 'shelf10Position': applyShelfPositions(); break;
				}
			},
			interactions: {},
		};
	},
});

export const steelRack60x35 = base.extend({
	id: 'steelRack60x35',
	name: 'steelRack60x35',
	path: 'steel-rack/60-35',
});
