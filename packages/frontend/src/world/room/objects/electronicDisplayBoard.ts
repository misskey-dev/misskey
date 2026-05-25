/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../object.js';
import { RecyvlingTextGrid } from '../../utility.js';
import { electronicDisplayBoard_schema } from './electronicDisplayBoard.schema.js';

export const electronicDisplayBoard = defineObject(electronicDisplayBoard_schema, {
	createInstance: async ({ scene, options, model, timer }) => {
		const frameMaterial = model.findMaterial('__X_BODY__');

		const textMaterial = new BABYLON.PBRMaterial('textMaterial', scene);
		textMaterial.albedoColor = new BABYLON.Color3(0, 0, 0);
		textMaterial.roughness = 1;

		const texLoading = Promise.withResolvers<void>();

		const tex = new BABYLON.Texture('/client-assets/room/textures/dot-matrix-chars.png', scene, false, false, undefined, () => {
			tex.level = 1;
			textMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
			textMaterial.emissiveTexture = tex;
			textMaterial.albedoTexture = tex;
			textMaterial.disableLighting = true;
			textMaterial.emissiveTexture.hasAlpha = true;
			textMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
			textMaterial.useAlphaFromAlbedoTexture = true;
			textMaterial.freeze();
			texLoading.resolve();
		}, (message, exception) => {
			console.warn('Failed to load texture:', message, exception);
			textMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
			textMaterial.emissiveTexture = null;
			texLoading.resolve();
		});

		await texLoading.promise;

		const maxChars = 6;

		const displayMesh = model.findMesh('__X_DISPLAY__');
		displayMesh.material = textMaterial;
		const textManager = new RecyvlingTextGrid(displayMesh, maxChars, {
			meshFlipped: true,
			material: textMaterial,
			charUScale: 1.15,
		});

		model.bakeExcludeMeshes = [displayMesh];

		const applyFrameMat = () => {
			frameMaterial.albedoColor = new BABYLON.Color3(options.frameMat.color[0], options.frameMat.color[1], options.frameMat.color[2]);
			frameMaterial.roughness = options.frameMat.roughness;
			frameMaterial.metallic = options.frameMat.metallic;
		};

		applyFrameMat();

		const applyLedColor = () => {
			const [r, g, b] = options.ledColor;
			textMaterial.emissiveColor = new BABYLON.Color3(r, g, b);
		};

		applyLedColor();

		const applyLedBrightness = () => {
			textMaterial.emissiveIntensity = options.ledBrightness * 2;
		};

		applyLedBrightness();

		let text = '';

		const applyText = () => {
			text = options.text + '   ';
		};

		applyText();

		let textIndex = 0;
		timer.setInterval(() => {
			let displayText = '';
			for (let i = 0; i < maxChars; i++) {
				displayText += text[(textIndex + i) % text.length];
			}
			textManager.write(displayText);

			textIndex = (textIndex + 1) % text.length;
		}, 500);

		return {
			onInited: () => {

			},
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'text': applyText(); break;
					case 'frameMat': applyFrameMat(); break;
					case 'ledColor': applyLedColor(); break;
					case 'ledBrightness': applyLedBrightness(); break;
				}
			},
			interactions: {},
			dispose: () => {
				textManager.dispose();
			},
		};
	},
});
