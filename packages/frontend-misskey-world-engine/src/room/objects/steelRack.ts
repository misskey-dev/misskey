/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { steelRack_schema } from './steelRack.schema.js';
import { cm, remap } from '@/world/utility.js';

export const steelRack = defineObject(steelRack_schema, {
	path: (options) => {
		switch (options.widthAndDepthVariation) {
			case '60-35': return 'steel-rack/60-35';
			case '90-35': return 'steel-rack/90-35';
		}
	},
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
