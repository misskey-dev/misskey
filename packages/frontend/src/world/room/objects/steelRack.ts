/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { cm, remap } from '@/world/utility.js';
import { i18n } from '@/i18n.js';

export const steelRack = defineObject({
	id: 'steelRack',
	name: i18n.ts._miRoom._objects.steelRack,
	options: {
		schema: {
			shelfMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._steelRack.shelfMat,
			},
			poleMat: {
				type: 'material',
				label: i18n.ts._miRoom._objects._steelRack.poleMat,
			},
			widthAndDepthVariation: {
				type: 'enum',
				label: i18n.ts._miRoom._objects._steelRack.widthAndDepthVariation,
				enum: [{
					label: '60cm x 35cm',
					value: '60-35',
				}, {
					label: '90cm x 35cm',
					value: '90-35',
				}],
			},
			height: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.height,
				min: 1,
				max: 7,
				step: 1,
			},
			numberOfShelfs: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.numberOfShelfs,
				min: 2,
				max: 10,
				step: 1,
			},
			shelf1Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #1',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf2Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #2',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf3Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #3',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf4Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #4',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf5Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #5',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf6Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #6',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf7Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #7',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf8Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #8',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf9Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #9',
				min: 0,
				max: 1,
				step: 0.01,
			},
			shelf10Position: {
				type: 'range',
				label: i18n.ts._miRoom._objects._steelRack.shelfPositionOf + ' #10',
				min: 0,
				max: 1,
				step: 0.01,
			},
		},
		default: {
			shelfMat: { color: [0.8, 0.8, 0.8], roughness: 0.25, metallic: 0.9 },
			poleMat: { color: [0.8, 0.8, 0.8], roughness: 0.25, metallic: 0.9 },
			widthAndDepthVariation: '60-35',
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
	path: (options) => `steel-rack/${options.widthAndDepthVariation}`,
	createInstance: ({ options, model, reloadModel }) => {
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
				const clonedShelf = shelf.clone('', shelf.parent);
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
				const clonedPole = pole.clone('');
				clonedPole.position.y = (i * cm(30)) / Math.abs(scale.y);
				clonedPoleMeshes.push(clonedPole);
			}

			applyShelfPositions();
		};

		applyHeight();

		const shelfMaterial = model.findMaterial('__X_SHELF__');
		const poleMaterial = model.findMaterial('__X_POLE__');

		const applyShelfMat = () => {
			shelfMaterial.albedoColor = new BABYLON.Color3(options.shelfMat.color[0], options.shelfMat.color[1], options.shelfMat.color[2]);
			shelfMaterial.roughness = options.shelfMat.roughness;
			shelfMaterial.metallic = options.shelfMat.metallic;
		};

		const applyPoleMat = () => {
			poleMaterial.albedoColor = new BABYLON.Color3(options.poleMat.color[0], options.poleMat.color[1], options.poleMat.color[2]);
			poleMaterial.roughness = options.poleMat.roughness;
			poleMaterial.metallic = options.poleMat.metallic;
		};

		applyShelfMat();
		applyPoleMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'shelfMat': applyShelfMat(); break;
					case 'poleMat': applyPoleMat(); break;
					case 'widthAndDepthVariation': reloadModel(); break;
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
			dispose: () => {},
		};
	},
});
