/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as BABYLON from '@babylonjs/core';
import { defineObject } from '../engine.js';

export const aquarium = defineObject({
	id: 'aquarium',
	name: 'Aquarium',
	options: {
		schema: {},
		default: {},
	},
	placement: 'top',
	createInstance: ({ scene, root }) => {
		return {
			onInited: () => {
				const noiseTexture = new BABYLON.NoiseProceduralTexture('perlin', 256, scene);
				noiseTexture.animationSpeedFactor = 70;
				noiseTexture.persistence = 10;
				noiseTexture.brightness = 0.5;
				noiseTexture.octaves = 5;

				const emitter = new BABYLON.TransformNode('emitter', scene);
				emitter.parent = root;
				emitter.position = new BABYLON.Vector3(17/*cm*/, 7/*cm*/, -9/*cm*/);
				const ps = new BABYLON.ParticleSystem('', 128, scene);
				ps.particleTexture = new BABYLON.Texture('/client-assets/room/objects/lava-lamp/bubble.png');
				ps.emitter = emitter;
				ps.isLocal = true;
				ps.minEmitBox = new BABYLON.Vector3(-2/*cm*/, 0, -2/*cm*/);
				ps.maxEmitBox = new BABYLON.Vector3(2/*cm*/, 0, 2/*cm*/);
				ps.minEmitPower = 40;
				ps.maxEmitPower = 60;
				ps.minLifeTime = 0.5;
				ps.maxLifeTime = 0.5;
				ps.minSize = 0.1/*cm*/;
				ps.maxSize = 1/*cm*/;
				ps.direction1 = new BABYLON.Vector3(0, 1, 0);
				ps.direction2 = new BABYLON.Vector3(0, 1, 0);
				ps.noiseTexture = noiseTexture;
				ps.noiseStrength = new BABYLON.Vector3(500, 0, 500);
				ps.emitRate = 32;
				ps.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
				//ps.color1 = new BABYLON.Color4(1, 1, 1, 0.3);
				//ps.color2 = new BABYLON.Color4(1, 1, 1, 0.2);
				//ps.colorDead = new BABYLON.Color4(1, 1, 1, 0);
				ps.preWarmCycles = Math.random() * 1000;
				ps.start();
			},
			interactions: {},
		};
	},
});
