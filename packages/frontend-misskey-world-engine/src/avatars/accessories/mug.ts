/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core/pure';
import { cm } from 'misskey-world/src/utility.js';
import { mug_schema } from 'misskey-world/src/avatars/accessories/mug.schema.js';
import { defineAccessory } from '../accessory.js';

export const mug = defineAccessory(mug_schema, {
	createInstance: ({ options, scene, root, sr, model }) => {
		const emitter = new BABYLON.TransformNode('emitter', scene);
		emitter.parent = root;
		emitter.position = new BABYLON.Vector3(0, cm(5), 0);
		const ps = new BABYLON.ParticleSystem('steamParticleSystem', 8, scene);
		ps.particleTexture = new BABYLON.Texture('/client-assets/world/objects/mug/steam.png');
		ps.emitter = emitter;
		ps.minEmitBox = new BABYLON.Vector3(cm(-1), 0, cm(-1));
		ps.maxEmitBox = new BABYLON.Vector3(cm(1), 0, cm(1));
		ps.minEmitPower = cm(10);
		ps.maxEmitPower = cm(12);
		ps.minLifeTime = 2;
		ps.maxLifeTime = 3;
		ps.addSizeGradient(0, cm(10), cm(12));
		ps.addSizeGradient(1, cm(18), cm(20));
		ps.direction1 = new BABYLON.Vector3(-0.3, 1, 0.3);
		ps.direction2 = new BABYLON.Vector3(0.3, 1, -0.3);
		ps.emitRate = 0.5;
		ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
		ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
		ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
		ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
		ps.preWarmCycles = Math.random() * 1000;
		ps.start();
		sr.fixParticleSystem(ps);

		const bodyMaterial = model.findMaterial('__X_MUG__');

		const applyBodyMat = () => {
			bodyMaterial.albedoColor = new BABYLON.Color3(options.bodyMat.color[0], options.bodyMat.color[1], options.bodyMat.color[2]);
			bodyMaterial.roughness = options.bodyMat.roughness;
			bodyMaterial.metallic = options.bodyMat.metallic;
		};

		applyBodyMat();

		const liquidMaterial = model.findMaterial('__X_LIQUID__');

		const applyLiquidMat = () => {
			liquidMaterial.albedoColor = new BABYLON.Color3(options.liquidMat.color[0], options.liquidMat.color[1], options.liquidMat.color[2]);
			liquidMaterial.roughness = options.liquidMat.roughness;
			liquidMaterial.metallic = options.liquidMat.metallic;
		};

		applyLiquidMat();

		return {
			onOptionsUpdated: ([k, v]) => {
				switch (k) {
					case 'bodyMat': applyBodyMat(); break;
					case 'liquidMat': applyLiquidMat(); break;
				}
			},
			dispose: () => {
				ps.stop();
				emitter.dispose();
			},
		};
	},
});
